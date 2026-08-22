import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from core.deps import get_current_user
from crud.notes import (
    create_note,
    delete_note_and_cleanup,
    get_note_by_id,
    getalluserNotes,
    retrieve_relevant_chunks,
    retrieve_chunks_for_summary,
    get_context_radar_suggestions,
    handle_note_update,
)
from crud.history import create_history
from db.session import get_db
from models.entity import Users, Messages, Notes
from schemas.note_schema import (
    NoteCreate,
    NoteOut,
    NoteUpdate,
    QARequest,
    SummarizeRequest,
    EvaluateRequest,
    ChunkSuggestion,
    GenerateRequest,
    SuggestRequest,
    RadarRequest
)
from services.llm import ChatService

router = APIRouter()
chat_service = ChatService()

def _get_accessible_note(note_id: uuid.UUID, user: Users, db: Session):
    note = get_note_by_id(db, note_id, user.id)
    if note:
        return note
        
    stmt = select(Messages).where(
        Messages.receiver_id == user.id,
        Messages.note_id == note_id
    ).limit(1)
    shared_msg = db.execute(stmt).scalar_one_or_none()
    
    if shared_msg:
        shared_note = db.get(Notes, note_id)
        if shared_note:
            return shared_note
            
    raise HTTPException(status_code=404, detail="Note not found or access denied")

@router.post("", response_model=NoteOut)
def create(
    body: NoteCreate,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    note = create_note(db, user.id, body.title, body.content)
    create_history(db, user.id, "Created Note", f"Title: {note.title}")
    return note

@router.get("", response_model=List[NoteOut])
def list_notes(
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    return getalluserNotes(db, user.id)

@router.get("/detail", response_model=NoteOut)
def get_note(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    return _get_accessible_note(note_id, user, db)

@router.put("/update", response_model=NoteOut)
def update_note(
    note_id: uuid.UUID,
    body: NoteUpdate,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    note = handle_note_update(db, note_id, user.id, body.title, body.content)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or access denied")
    create_history(db, user.id, "Updated Note", f"Title: {note.title}")
    return note

@router.delete("/delete", status_code=204)
def delete_note(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    success = delete_note_and_cleanup(db, note_id, user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found or access denied")
    create_history(db, user.id, "Deleted Note")
    return None

@router.post("/ask")
def ask_question(
    body: QARequest,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    chunks = retrieve_relevant_chunks(db, body.query, user.id)
    answer = chat_service.get_answer(db, user.id, body.query, chunks)
    create_history(db, user.id, "Asked AI", f"Query: {body.query}")
    return {"answer": answer}

@router.post("/summarize")
def summarize(
    body: SummarizeRequest,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    chunks = retrieve_chunks_for_summary(db, body.topic, user.id)
    if not chunks:
        return {"summary": "No notes found on that topic."}
    
    summary = chat_service.summarize_notes(db, user.id, body.topic, chunks)
    create_history(db, user.id, "Summarized Topic", f"Topic: {body.topic}")
    return {"summary": summary}

@router.post("/evaluate")
def evaluate(
    body: EvaluateRequest,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    note = _get_accessible_note(body.note_id, user, db)
    feedback = chat_service.critique_note(db, user.id, note.title, note.content)
    create_history(db, user.id, "Evaluated Note", f"Title: {note.title}")
    return {"evaluation": feedback, "title": note.title}

@router.post("/radar", response_model=List[ChunkSuggestion])
def post_radar(
    body: RadarRequest,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    note = _get_accessible_note(body.note_id, user, db)
    return get_context_radar_suggestions(db, note.id, user.id, content=body.content)

@router.get("/radar", response_model=List[ChunkSuggestion])
def get_radar(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    note = _get_accessible_note(note_id, user, db)
    return get_context_radar_suggestions(db, note.id, user.id)

@router.post("/generate")
def generate_draft(
    body: GenerateRequest,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    result = chat_service.generate_note_draft(db, user.id, body.prompt)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    create_history(db, user.id, "Auto-Generated Note", f"Prompt: {body.prompt}")
    return result

@router.post("/suggest")
def suggest_content(
    body: SuggestRequest,
    user: Users = Depends(get_current_user),
):
    prompt = (
        "Give me 3 brief bullet points of suggestions to improve or continue this text. "
        "Return ONLY the plain text sentences, one per line. No Markdown, no symbols:\n\n"
        f"{body.content}"
    )
    response = chat_service.llm.invoke(prompt)
    return {"suggestion": response.content}