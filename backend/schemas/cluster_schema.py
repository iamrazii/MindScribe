"""
schemas/cluster_schema.py
"""
import uuid
from pydantic import BaseModel


class ClusterOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    note_count: int = 0

    model_config = {"from_attributes": True}
