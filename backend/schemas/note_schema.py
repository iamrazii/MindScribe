import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class NoteCreate(BaseModel):
    title: str
    content: str

class NoteUpdate(BaseModel):
    title: str
    content: str

class NoteOut(BaseModel):
    id: uuid.UUID
    title: Optional[str]
    content: str
    created_at: datetime
    cluster_id: uuid.UUID

    model_config = {"from_attributes": True}

class ChunkSuggestion(BaseModel):
    note_id: uuid.UUID
    title: str
    excerpt: str
    distance: float

class QARequest(BaseModel):
    query: str

class SummarizeRequest(BaseModel):
    topic: str

class EvaluateRequest(BaseModel):
    note_id: uuid.UUID

class GenerateRequest(BaseModel):
    prompt: str

class SuggestRequest(BaseModel):
    content: str

class RadarRequest(BaseModel):
    note_id: uuid.UUID
    content: str