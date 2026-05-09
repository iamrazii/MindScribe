"""
routers/notes.py

All routes are scoped to the authenticated user; note UUIDs are accepted
only in the JSON body or query params — never raw in the URL path — so
they're never visible in browser address bars.
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

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
from db.session import get_db
from models.entity import Users
from schemas.note_schema import (
    NoteCreate,
    NoteOut,
    NoteUpdate,
    QARequest,
    SummarizeRequest,
    EvaluateRequest,
    ChunkSuggestion,
)
from services.llm import ChatService

router = APIRouter()
chat_service = ChatService()


# ── Helper ────────────────────────────────────────────────────────────────────

def _get_owned_note(note_id: uuid.UUID, user: Users, db: Session):
    note = get_note_by_id(db, note_id, user.id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return note


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create(
    body: NoteCreate,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    return create_note(db, user.id, body.title, body.content)


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
    """
    GET /api/notes/detail?note_id=<uuid>
    ID stays in the query string, not the URL path.
    """
    return _get_owned_note(note_id, user, db)


@router.put("/update", response_model=NoteOut)
def update_note(
    note_id: uuid.UUID,
    body: NoteUpdate,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    """
    PUT /api/notes/update?note_id=<uuid>
    """
    _get_owned_note(note_id, user, db)          # ownership check
    updated = handle_note_update(db, note_id, user.id, body.title, body.content)
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed.")
    return updated


@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    """
    DELETE /api/notes/delete?note_id=<uuid>
    """
    ok = delete_note_and_cleanup(db, note_id, user.id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")


# ── AI features ───────────────────────────────────────────────────────────────

@router.post("/ask")
def ask_question(
    body: QARequest,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    """RAG Q&A against the user's notes."""
    chunks = retrieve_relevant_chunks(db, body.query, user.id)
    if not chunks:
        return {"answer": "I couldn't find relevant notes to answer that question."}
    context = "\n\n".join(f"[{c['source']}]\n{c['content']}" for c in chunks)
    answer = chat_service.qa_chain.invoke({"context": context, "query": body.query})
    return {"answer": answer}


@router.post("/summarize")
def summarize(
    body: SummarizeRequest,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    """Summarize the user's notes on a topic."""
    chunks = retrieve_chunks_for_summary(db, body.topic, user.id)
    if not chunks:
        return {"summary": "No notes found on that topic."}
    context = "\n\n".join(f"[{c['source']}]\n{c['content']}" for c in chunks)
    summary = chat_service.summarization_chain.invoke({"context": context, "topic": body.topic})
    return {"summary": summary}


@router.post("/evaluate")
def evaluate(
    body: EvaluateRequest,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    """Evaluate a specific note using the critic LLM."""
    note = _get_owned_note(body.note_id, user, db)
    feedback = chat_service.critic_chain.invoke({"note_title": note.title, "note_content": note.content})
    return {"evaluation": feedback, "title": note.title}


@router.get("/radar", response_model=List[ChunkSuggestion])
def radar(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    """
    GET /api/notes/radar?note_id=<uuid>
    Returns semantically similar notes (context radar).
    """
    note = _get_owned_note(note_id, user, db)
    return get_context_radar_suggestions(db, note.id, note.content, user.id)
