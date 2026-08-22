import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from typing import List, Optional
from models.entity import Notes, NoteChunks, Clusters
from crud.clusters import create_cluster
from services.clustering import ClusterService
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.embedding import embedding_service

def create_note(db: Session, user_id, title: str, note_content: str) -> Notes:
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunk_texts = text_splitter.split_text(note_content)

    vectors = embedding_service.encode_documents(chunk_texts)
    document_vector = np.mean(vectors, axis=0).tolist()

    cluster_service = ClusterService(db, user_id)
    clusterToUse = cluster_service.AssignCluster(title, note_content, document_vector)

    new_note = Notes(user_id=user_id, content=note_content, title=title, cluster_id=clusterToUse)
    db.add(new_note)
    db.flush()

    for text, vector in zip(chunk_texts, vectors):
        db.add(NoteChunks(note_id=new_note.id, content=text, embedding=vector))

    db.commit()
    db.refresh(new_note)
    return new_note

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

    new_vectors = embedding_service.encode_documents(new_texts)
    document_vector = np.mean(new_vectors, axis=0).tolist()

    cluster_service = ClusterService(db, user_id)
    clusterToUse = cluster_service.AssignCluster(title, content, document_vector)

    updated_note = update_note_meta(db, note_id, user_id, title, content, clusterToUse)
    if not updated_note:
        return None

    for text, vector in zip(new_texts, new_vectors):
        db.add(NoteChunks(note_id=updated_note.id, content=text, embedding=vector))

    db.commit()
    db.refresh(updated_note)
    return updated_note

def get_note_by_id(db: Session, note_id, user_id) -> Optional[Notes]:
    stmt = select(Notes).where(Notes.id == note_id, Notes.user_id == user_id)
    return db.execute(stmt).scalar_one_or_none()

def getalluserNotes(db: Session, user_id) -> List[Notes]:
    stmt = select(Notes).where(Notes.user_id == user_id).order_by(Notes.created_at.desc())
    return list(db.execute(stmt).scalars().all())

def delete_note_and_cleanup(db: Session, note_id, user_id) -> bool:
    stmt = select(Notes).where(Notes.id == note_id, Notes.user_id == user_id)
    db_note = db.execute(stmt).scalar_one_or_none()
    if not db_note:
        return False
    
    db.delete(db_note)
    db.commit()
    return True

def retrieve_relevant_chunks(db: Session, query: str, user_id, limit: int = 5) -> List[dict]:
    query_vector = embedding_service.embed_query(query)
    distance_col = NoteChunks.embedding.cosine_distance(query_vector).label("distance")
    
    stmt = (
        select(NoteChunks.content, Notes.title, distance_col)
        .join(Notes, NoteChunks.note_id == Notes.id)
        .where(Notes.user_id == user_id)
        .order_by(distance_col)
        .limit(limit)
    )
    
    results = db.execute(stmt).all()
    return [{"content": row[0], "source": row[1], "distance": row[2]} for row in results]

def retrieve_chunks_for_summary(db: Session, topic: str, user_id, limit: int = 10) -> List[dict]:
    query_vector = embedding_service.embed_query(topic)
    distance_col = NoteChunks.embedding.cosine_distance(query_vector).label("distance")
    
    stmt = (
        select(NoteChunks.content, Notes.title, distance_col)
        .join(Notes, NoteChunks.note_id == Notes.id)
        .where(Notes.user_id == user_id)
        .order_by(distance_col)
        .limit(limit)
    )
    
    results = db.execute(stmt).all()
    return [{"content": row[0], "source": row[1], "distance": row[2]} for row in results]

def get_context_radar_suggestions(db: Session, note_id, user_id, limit: int = 5, distance_threshold: float = 0.45) -> List[dict]:
    stmt = select(Notes).where(Notes.id == note_id, Notes.user_id == user_id)
    source_note = db.execute(stmt).scalar_one_or_none()
    if not source_note:
        return []
        
    chunks_stmt = select(NoteChunks.embedding).where(NoteChunks.note_id == note_id)
    chunk_embeddings = db.execute(chunks_stmt).scalars().all()
    if not chunk_embeddings:
        return []
        
    source_vector = np.mean([emb for emb in chunk_embeddings], axis=0).tolist()
    
    distance_expr = NoteChunks.embedding.cosine_distance(source_vector)
    
    radar_stmt = (
        select(Notes.id, Notes.title, NoteChunks.content, distance_expr.label("distance"))
        .join(Notes, NoteChunks.note_id == Notes.id)
        .where(Notes.user_id == user_id)
        .where(Notes.id != note_id)
        .where(distance_expr < distance_threshold) 
        .order_by(distance_expr)
        .limit(limit)
    )
    
    results = db.execute(radar_stmt).all()
    
    suggestions = {}
    for row in results:
        nid = row[0]
       
        if nid not in suggestions:
            suggestions[nid] = {
                "note_id": nid,
                "title": row[1],
                "excerpt": row[2][:150] + "...",
                "distance": float(row[3])
            }
            
    return list(suggestions.values())[:limit]