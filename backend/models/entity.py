import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase
from sqlalchemy import ForeignKey, Text, Index, Boolean
from pgvector.sqlalchemy import VECTOR
from typing import List, Optional
from datetime import datetime, timezone

class Base(DeclarativeBase):
    pass

class Users(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str]
    profile_picture_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 1:m (user -> notes)
    notes: Mapped[List["Notes"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

   # 1:m (user -> message)
    sent_messages: Mapped[List["Messages"]] = relationship(
        foreign_keys="[Messages.sender_id]",
        back_populates="sender"
    )
    
    received_messages: Mapped[List["Messages"]] = relationship(
        foreign_keys="[Messages.receiver_id]",
        back_populates="receiver"
    )

    # 1:m (user -> history)
    history: Mapped[List["UserHistory"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

class Notes(Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)   
    title: Mapped[Optional[str]] = mapped_column(index=True)
    content: Mapped[str]

    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    cluster_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clusters.id", ondelete="CASCADE")
    )

    # m:1 (Note -> User)
    user: Mapped["Users"] = relationship(back_populates="notes")
    
    # 1:m (Note -> Messages)
    messages: Mapped[List["Messages"]] = relationship(
        back_populates="note"
    )
    # (m:1) Note -> Cluster 
    cluster: Mapped["Clusters"] = relationship(back_populates="notes")

    # 1:m (Note -> Chunks)
    chunks: Mapped[List["NoteChunks"]] = relationship(
        back_populates="note",
        cascade="all, delete-orphan"
    )

class NoteChunks(Base):
    __tablename__ = "notechunks"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content: Mapped[str] = mapped_column(Text)
    
    __table_args__ = (
        Index(
            "hnsw_idx_note_chunks_embedding",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )
    
    embedding: Mapped[VECTOR] = mapped_column(VECTOR(384)) 

    note_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("notes.id", ondelete="CASCADE")
    )

    # m:1 (Chunk -> Note)
    note: Mapped["Notes"] = relationship(back_populates="chunks")

class Messages(Base):
    __tablename__ = "messages"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    sender_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    receiver_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    note_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("notes.id", ondelete="SET NULL"), nullable=True)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    sender: Mapped["Users"] = relationship(foreign_keys=[sender_id], back_populates="sent_messages")
    receiver: Mapped["Users"] = relationship(foreign_keys=[receiver_id], back_populates="received_messages")
    
    note: Mapped["Notes"] = relationship(back_populates="messages")

class Clusters(Base):
    __tablename__ = "clusters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str]
    cluster_vector: Mapped[VECTOR] = mapped_column(VECTOR(384))

    
    
    # (1:m) Cluster -> Notes 
    notes: Mapped[List["Notes"]] = relationship(
        back_populates="cluster",
        cascade="all, delete-orphan"
    )

class UserHistory(Base):
    __tablename__ = "user_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    action: Mapped[str] = mapped_column(Text)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    user: Mapped["Users"] = relationship(back_populates="history")