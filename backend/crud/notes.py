import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from typing import List, Optional
from models.entity import Notes,NoteChunks,Clusters
from crud.clusters import create_cluster
from services.clustering import ClusterService
from langchain.text_splitter import RecursiveCharacterTextSplitter
from services.embedding import embedding_service


# ── Note Creation ────────────────────────────────────────────────────────────

def create_note(db: Session, user_id, title: str, note_content: str) -> Notes:
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunk_texts = text_splitter.split_text(note_content)

    # NOTE: encode_documents() naming inconsistency — see context.md limitations
    vectors = embedding_service.encode_documents(chunk_texts)
    document_vector = np.mean(vectors, axis=0).tolist()

    cluster_service = ClusterService(db)
    clusterToUse = cluster_service.AssignCluster(title, note_content, document_vector)

    #  Save the main Note
    new_note = Notes(user_id=user_id, content=note_content, title=title , cluster_id = clusterToUse)
    db.add(new_note)
    db.flush()

    for text, vector in zip(chunk_texts, vectors):
        db.add(NoteChunks(note_id=new_note.id, content=text, embedding=vector))

    db.commit()
    return new_note


# ── Note Deletion ────────────────────────────────────────────────────────────

def delete_note_and_cleanup(db: Session, note_id, user_id) -> bool:
    stmt = select(Notes).where(Notes.id == note_id, Notes.user_id == user_id)
    note = db.execute(stmt).scalar_one_or_none()
    if not note:
        return False

    cluster_id_to_check = note.cluster_id
    db.delete(note)
    db.flush()

    if cluster_id_to_check:
        ClusterService(db).garbage_collect(cluster_id_to_check)

    db.commit()
    return True


# ── Retrieval: RAG Q&A ───────────────────────────────────────────────────────

def retrieve_relevant_chunks(
    db: Session, query_text: str, user_id, top_k: int = 5
) -> List[dict]:
    """
    Top-k vector similarity retrieval for RAG Q&A.
    Returns: [{"content": str, "source": str}, ...]
    """
    query_vector = embedding_service.get_query_embedding(query_text)

    stmt = (
        select(NoteChunks, Notes.title)
        .join(Notes)
        .where(Notes.user_id == user_id)
        .order_by(NoteChunks.embedding.cosine_distance(query_vector))
        .limit(top_k)
    )
    results = db.execute(stmt).all()

    return [
        {"content": row.NoteChunks.content, "source": row.title}
        for row in results
    ]


# ── Retrieval: Topic Summarization ──────────────────────────────────────────

def retrieve_chunks_for_summary(
    db: Session,
    topic: str,
    user_id,
    top_k: int = 20,
    max_notes: int = 8,
) -> List[dict]:
    """
    Retrieval optimized for topic summarization.
    Caps distinct source notes at max_notes to prevent LLM context overflow.
    Returns chunks sorted by source-note first-appearance rank.
    """
    query_vector = embedding_service.get_query_embedding(topic)

    stmt = (
        select(NoteChunks, Notes.title)
        .join(Notes)
        .where(Notes.user_id == user_id)
        .order_by(NoteChunks.embedding.cosine_distance(query_vector))
        .limit(top_k)
    )
    results = db.execute(stmt).all()

    if not results:
        return []

    seen_sources: dict[str, int] = {}
    filtered: list[dict] = []

    for row in results:
        title = row.title
        if title not in seen_sources:
            if len(seen_sources) >= max_notes:
                continue
            seen_sources[title] = len(seen_sources)
        filtered.append({"content": row.NoteChunks.content, "source": title})

    filtered.sort(key=lambda c: seen_sources[c["source"]])
    return filtered


# ── Retrieval: Context Radar ─────────────────────────────────────────────────

def get_context_radar_suggestions(
    db: Session,
    current_note_id,
    current_note_content: str,
    user_id,
    top_k: int = 5,
) -> List[dict]:
    """
    Suggests top_k related notes based on vector similarity to the current note's content.
    
    Args:
        db: SQLAlchemy session.
        current_note_id: Open note ID (to prevent self-suggestion).
        current_note_content: Open note text (query vector).
        user_id: Authenticated user ID.
        top_k: Max suggestions to return.

    Returns:
        List[dict]: [{"note_id", "title", "excerpt", "distance"}, ...]
    """

    # ── Guard: empty or whitespace-only content ───────────────────────────────
    # An empty note produces a meaningless zero-vector query.
    # Return empty rather than surfacing irrelevant results.
    if not current_note_content or not current_note_content.strip():
        return []

    # ── Guard: note too short for meaningful similarity ───────────────────────
    # Fewer than 10 words produces a query vector with almost no semantic
    # signal — any result would be noise. Threshold is lower than the Critic's
    # 20-word floor because we only need enough signal for vector similarity,
    # not structured analysis.
    if len(current_note_content.split()) < 10:
        return []

    # ── Step 1: Embed the open note's content as a query vector ──────────────
    # We use get_query_embedding() (single-text path) rather than
    # encode_documents() (batch path) because we always have exactly one query.
    query_vector = embedding_service.get_query_embedding(current_note_content)

    # ── Step 2: Cosine similarity search, excluding the open note ─────────────
    # The WHERE clause filters out chunks belonging to current_note_id so the
    # open note can never appear in its own suggestions, regardless of how
    # similar its chunks are to each other.
    distance_col = NoteChunks.embedding.cosine_distance(query_vector).label("distance")

    stmt = (
        select(NoteChunks, Notes.id.label("note_id"), Notes.title, distance_col)
        .join(Notes, NoteChunks.note_id == Notes.id)
        .where(
            Notes.user_id == user_id,
            Notes.id != current_note_id,        # ← core exclusion filter
        )
        .order_by(distance_col)                 # closest first
        .limit(top_k * 5)                       # over-fetch to allow deduplication
                                                # (multiple chunks per note)
    )
    results = db.execute(stmt).all()

    if not results:
        return []

    # ── Step 3: Deduplicate — one entry per source note ───────────────────────
    # Since multiple chunks from the same note can all score highly, we walk
    # the ranked results and keep only the FIRST (= closest) chunk per note.
    # This gives us one representative excerpt per suggestion.
    seen_note_ids: set = set()
    suggestions: List[dict] = []

    for row in results:
        note_id = row.note_id
        if note_id in seen_note_ids:
            continue                            # already have a better chunk for this note
        seen_note_ids.add(note_id)

        suggestions.append({
            "note_id" : note_id,
            "title"   : row.title,
            "excerpt" : row.NoteChunks.content,   # closest-matching chunk as preview
            "distance": round(float(row.distance), 4),
        })

        if len(suggestions) >= top_k:
            break                               # we have enough distinct notes

    return suggestions


# ── Note Read Helpers ────────────────────────────────────────────────────────

def get_note_by_id(db: Session, note_id, user_id) -> Optional[Notes]:
    stmt = select(Notes).where(Notes.id == note_id, Notes.user_id == user_id)
    return db.execute(stmt).scalar_one_or_none()


def getalluserNotes(db: Session, user_id) -> List[Notes]:
    stmt = select(Notes).where(Notes.user_id == user_id)
    return db.execute(stmt).scalars().all()


def get_note_content(db: Session, note_id, user_id) -> Optional[str]:
    stmt = select(Notes.content).where(
        Notes.id == note_id, Notes.user_id == user_id
    )
    return db.execute(stmt).scalar()


# ── Note Update ──────────────────────────────────────────────────────────────

def update_note_meta(
    db: Session, note_id, user_id, title: str, content: str, cluster_id
) -> Optional[Notes]:
    stmt = select(Notes).where(Notes.id == note_id, Notes.user_id == user_id)
    db_note = db.execute(stmt).scalar_one_or_none()
    if not db_note:
        return None

    db_note.title = title
    db_note.content = content
    db_note.cluster_id = cluster_id
    db.execute(delete(NoteChunks).where(NoteChunks.note_id == note_id))
    db.flush()
    return db_note


def handle_note_update(
    db: Session, note_id, user_id, title: str, content: str
) -> Optional[Notes]:
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    new_texts = text_splitter.split_text(content)

    # NOTE: embed_documents() naming inconsistency — see context.md
    new_vectors = embedding_service.embed_documents(new_texts)
    document_vector = np.mean(new_vectors, axis=0).tolist()

    cluster_service = ClusterService(db)
    cluster_id = cluster_service.process_and_assign_cluster(
        title, content, document_vector
    )

    db_note = update_note_meta(db, note_id, user_id, title, content, cluster_id)

    for text, vector in zip(new_texts, new_vectors):
        db.add(NoteChunks(note_id=db_note.id, content=text, embedding=vector))

    db.commit()
    return db_note