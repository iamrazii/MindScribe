import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class MessageCreate(BaseModel):
    receiver_email: EmailStr
    content: str
    note_id: Optional[uuid.UUID] = None

class MessageOut(BaseModel):
    id: uuid.UUID
    content: str
    created_at: datetime
    is_read: bool
    sender_username: Optional[str] = None
    receiver_username: Optional[str] = None
    sender_email: Optional[str] = None
    receiver_email: Optional[str] = None
    note_id: Optional[uuid.UUID] = None
    note_deleted: Optional[bool] = False

    model_config = {"from_attributes": True}