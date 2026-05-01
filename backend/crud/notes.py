import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from typing import List, Optional

from models.entity import Notes, NoteChunks, Clusters
from crud.clusters import create_cluster
from services.clustering import ClusterService
from langchain.text_splitter import RecursiveCharacterTextSplitter
from services.embedding import embedding_service


# ── Note Creation ───────────────────────────────────────────────────────────

def create_note(db: Session, user_id, title: str, note_content: str) -> Notes:
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunk_texts = text_splitter.split_text(note_content)

    # NOTE: embedding_service.encode_documents() must be reconciled with
    # EmbeddingService.encode() — see context.md limitations section.
    vectors = embedding_service.encode_documents(chunk_texts)
    document_vector = np.mean(vectors, axis=0).tolist()

    cluster_service = ClusterService(db)
    cluster_id = cluster_service.process_and_assign_cluster(
        title, note_content, document_vector
    )

    new_note = Notes(
        user_id=user_id,
        content=note_content,
        title=title,
        cluster_id=cluster_id,
    )
    db.add(new_note)
    db.flush()

    for text, vector in zip(chunk_texts, vectors):
        db.add(NoteChunks(note_id=new_note.id, content=text, embedding=vector))

    db.commit()
    return new_note


# ── Note Deletion ───────────────────────────────────────────────────────────

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


# ── Retrieval: Q&A (existing) ───────────────────────────────────────────────

def retrieve_relevant_chunks(
    db: Session, query_text: str, user_id, top_k: int = 5
) -> List[dict]:
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


# ── Retrieval: Summarization ────────────────────────────────────────────────────────────────    

def retrieve_chunks_for_summary(
    db: Session,
    topic: str,
    user_id,
    top_k: int = 20,
    max_notes: int = 8,
) -> List[dict]:
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

    # ── Cap distinct source notes ───────────────────────────────────────────
    # Walk through ranked results, accept chunks until we hit max_notes
    # distinct sources. This respects retrieval ranking (best-match notes
    # come first) while bounding the LLM's context payload.
    seen_sources: dict[str, int] = {}   # title -> order of first appearance
    filtered: list[dict] = []

    for row in results:
        title = row.title
        if title not in seen_sources:
            if len(seen_sources) >= max_notes:
                # We already have enough distinct notes — skip this chunk
                continue
            seen_sources[title] = len(seen_sources)
        filtered.append({"content": row.NoteChunks.content, "source": title})

    # ── Sort by source note (preserving first-appearance rank) ─────────────
    # Groups chunks from the same note together so _build_context_for_summary
    # receives coherent note blocks rather than interleaved chunk soup.
    filtered.sort(key=lambda c: seen_sources[c["source"]])

    return filtered


# ── Note Read Helpers ───────────────────────────────────────────────────────

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


# ── Note Update ─────────────────────────────────────────────────────────────

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