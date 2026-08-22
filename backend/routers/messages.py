import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.deps import get_current_user
from crud.message import (
    create_message,
    get_received_messages,
    get_sent_messages,
    get_message_detail,
)
from crud.user import get_user_by_email
from db.session import get_db
from models.entity import Users, Notes
from schemas.message_schema import MessageCreate, MessageOut

router = APIRouter()

def _to_out(db: Session, msg) -> MessageOut:
    note_deleted = False
    # Cross-check if the note still exists in the database
    if msg.note_id:
        note = db.get(Notes, msg.note_id)
        if not note:
            note_deleted = True

    return MessageOut(
        id=msg.id,
        content=msg.content,
        created_at=msg.created_at,
        is_read=msg.is_read,
        sender_username=msg.sender.username if msg.sender else None,
        receiver_username=msg.receiver.username if msg.receiver else None,
        sender_email=msg.sender.email if msg.sender else None,
        receiver_email=msg.receiver.email if msg.receiver else None,
        note_id=msg.note_id,
        note_deleted=note_deleted
    )

@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    body: MessageCreate,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    receiver = get_user_by_email(db, body.receiver_email)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user found with email '{body.receiver_email}'.",
        )
    if receiver.id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot send a message to yourself.",
        )
    msg = create_message(db, user.id, receiver.id, body.content, body.note_id)
    msg = get_message_detail(db, msg.id, user.id)
    return _to_out(db, msg)

@router.get("/inbox", response_model=List[MessageOut])
def inbox(
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    return [_to_out(db, m) for m in get_received_messages(db, user.id)]

@router.get("/sent", response_model=List[MessageOut])
def sent_box(
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    return [_to_out(db, m) for m in get_sent_messages(db, user.id)]

@router.get("/detail", response_model=MessageOut)
def message_detail(
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    msg = get_message_detail(db, message_id, user.id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if msg.receiver_id == user.id and not msg.is_read:
        msg.is_read = True
        db.commit()
        db.refresh(msg)
        
    return _to_out(db, msg)