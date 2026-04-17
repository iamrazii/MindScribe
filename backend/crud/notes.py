import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select,delete
from typing import List, Optional
from models.entity import Notes,NoteChunks,Clusters
from crud.clusters import create_cluster,find_best_cluster
from services.clustering import ClusterService
from langchain.text_splitter import RecursiveCharacterTextSplitter
from services.embedding import embedding_service
# from schemas import note_schema

def create_note(db, user_id,  title: str, note_content: str):

    # Chunk generation
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    print(f"Note content is : {note_content}")
    chunk_texts = text_splitter.split_text(note_content)
    print(chunk_texts)

    # Batch encoding
    vectors = embedding_service.encode_documents(chunk_texts)

    document_vector = np.mean(vectors, axis=0).tolist() #averaging all chunks into a single vector
    cluster_service = ClusterService(db)
    clusterToUse = cluster_service.process_and_assign_cluster(title, note_content, document_vector)

    #  Save the main Note
    new_note = Notes(user_id=user_id, content=note_content, title=title , cluster_id = clusterToUse)
    db.add(new_note)
    db.flush() # Get the note.id

    # Store Chunks
    for text, vector in zip(chunk_texts, vectors):
        chunk = NoteChunks(
            note_id=new_note.id,
            content=text,
            embedding=vector
        )
        db.add(chunk)
    
    db.commit()
    return new_note


def delete_note_and_cleanup(db: Session, note_id, user_id):
    stmt = select(Notes).where(Notes.id == note_id, Notes.user_id == user_id)
    note = db.execute(stmt).scalar_one_or_none()
    if not note:
        return False  # Note doesn't exist or doesn't belong to this user

    cluster_id_to_check = note.cluster_id
    db.delete(note)
    db.flush() 

    if cluster_id_to_check:
        cluster_service = ClusterService(db)
        cluster_service.garbage_collect(cluster_id_to_check)
    
    db.commit()
    return True


def retrieve_relevant_chunks(db: Session, query_text: str, user_id, top_k: int = 5):  
    query_vector = embedding_service.get_query_embedding(query_text)
    stmt = (
        select(NoteChunks, Notes.title)
        .join(Notes)
        .where(Notes.user_id == user_id)
        .order_by(NoteChunks.embedding.cosine_distance(query_vector))
        .limit(top_k)
    )

    results = db.execute(stmt).all()
    
    # Format the results for the LLM context
    context_chunks = [
        {"content": row.NoteChunk.content, "source": row.title} 
        for row in results
    ]
    
    return context_chunks # sending to llm

def get_note_by_id(db: Session, note_id, user_id):

    stmt = select(Notes).where(Notes.id == note_id, Notes.user_id == user_id)
    note = db.execute(stmt).scalar_one_or_none()

    if not note:
        return None
    return note

def getalluserNotes(db: Session, user_id):
    stmt = select(Notes).where(Notes.user_id == user_id)
    result = db.execute(stmt)
    return result.scalars().all()


def get_note_content(db: Session, note_id, user_id):

    stmt = (
        select(Notes.content)
        .where(Notes.id == note_id, Notes.user_id == user_id)
    )
    return db.execute(stmt).scalar()




def update_note_meta(db: Session, note_id, user_id, title: str, content: str , cluster_id):

     # Find the note
    stmt = select(Notes).where(Notes.id == note_id, Notes.user_id == user_id)
    db_note = db.execute(stmt).scalar_one_or_none()

    if not db_note:
        return None

    # 2. Update the main content
    db_note.title = title
    db_note.content = content
    db_note.cluster_id = cluster_id

    #  Delete old chunks 
    # This prevents the RAG from finding old versions of the note.
    db.execute(delete(NoteChunks).where(NoteChunks.note_id == note_id))
    
    db.flush() # Sync changes without committing yet
    return db_note



def handle_note_update(db: Session, note_id, user_id, title: str, content: str):
    #  Update the database record and wipe old chunks
    
    #  Create NEW chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    new_texts = text_splitter.split_text(content)
    
    #  Generate NEW embeddings in batch
    new_vectors = embedding_service.embed_documents(new_texts)

    document_vector = np.mean(new_vectors, axis=0).tolist() #averaging all chunks into a single vector
    cluster_service = ClusterService(db)
    clusterToUse = cluster_service.process_and_assign_cluster(title, content, document_vector)
    
    db_note = update_note_meta(db, note_id, user_id, title, content,clusterToUse)
 
    for text, vector in zip(new_texts, new_vectors):    # Store the NEW chunks
        new_chunk = NoteChunks(
            note_id=db_note.id,
            content=text,
            embedding=vector
        )
        db.add(new_chunk)
    
    #  Commit everything at once
    db.commit()
    return db_note