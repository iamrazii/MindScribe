"""
routers/messages.py

Messaging: sender looks up receiver by username (not ID).
Message IDs are kept in query params, never in path segments.
"""
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
from crud.user import get_user_by_username
from db.session import get_db
from models.entity import Users
from schemas.message_schema import MessageCreate, MessageOut

router = APIRouter()


def _to_out(msg) -> MessageOut:
    return MessageOut(
        id=msg.id,
        content=msg.content,
        created_at=msg.created_at,
        is_read=msg.is_read,
        sender_username=msg.sender.username if msg.sender else None,
        receiver_username=msg.receiver.username if msg.receiver else None,
        note_id=msg.note_id,
    )


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    body: MessageCreate,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    receiver = get_user_by_username(db, body.receiver_username)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user found with username '{body.receiver_username}'.",
        )
    if receiver.id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot send a message to yourself.",
        )
    msg = create_message(db, user.id, receiver.id, body.content, body.note_id)
    # reload with joins
    msg = get_message_detail(db, msg.id, user.id)
    return _to_out(msg)


@router.get("/inbox", response_model=List[MessageOut])
def inbox(
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    return [_to_out(m) for m in get_received_messages(db, user.id)]


@router.get("/sent", response_model=List[MessageOut])
def sent_box(
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    return [_to_out(m) for m in get_sent_messages(db, user.id)]


@router.get("/detail", response_model=MessageOut)
def message_detail(
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user),
):
    """
    GET /api/messages/detail?message_id=<uuid>
    Auto-marks as read if current user is the receiver.
    """
    msg = get_message_detail(db, message_id, user.id)
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found.")
    # Only sender or receiver may access
    if msg.sender_id != user.id and msg.receiver_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return _to_out(msg)
