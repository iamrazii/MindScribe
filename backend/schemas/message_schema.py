"""
schemas/message_schema.py
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MessageCreate(BaseModel):
    receiver_username: str          # look up by username, never expose IDs
    content: str
    note_id: Optional[uuid.UUID] = None


class MessageOut(BaseModel):
    id: uuid.UUID
    content: str
    created_at: datetime
    is_read: bool
    sender_username: Optional[str] = None
    receiver_username: Optional[str] = None
    note_id: Optional[uuid.UUID] = None

    model_config = {"from_attributes": True}
