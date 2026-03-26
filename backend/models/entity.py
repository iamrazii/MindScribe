import uuid
from sqlalchemy.dialects.postgresql import UUID


from sqlalchemy.orm import Mapped, mapped_column, relationship,DeclarativeBase
from sqlalchemy import ForeignKey,Text
from pgvector.sqlalchemy import VECTOR
from typing import List, Optional
from datetime import datetime, timezone

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(unique = True, index = True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str]

    # 1:m (user -> notes)
    notes: Mapped[List["Note"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # 1:m (user -> messages)
    messages: Mapped[List["Message"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)   
    title: Mapped[Optional[str]] = mapped_column(index=True)
    content: Mapped[str]

    created_at: Mapped[datetime] = mapped_column( default=lambda: datetime.now(timezone.utc) )

    # FK
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    # FK 
    cluster_id: Mapped[int] = mapped_column(
        ForeignKey("clusters.id", ondelete="CASCADE")
    )

    # m:1 (Note -> User)
    user: Mapped["User"] = relationship( back_populates="notes" )
    
    # 1:m (Note -> Messages)
    messages: Mapped[List["Message"]] = relationship(
        back_populates="note",
        cascade="all, delete-orphan"
    )
     # (m:1) Note -> Cluster 
    cluster: Mapped["Cluster"] = relationship( back_populates="notes" )

    # 1:m (Note -> Chunks)
    chunks: Mapped[List["NoteChunk"]] = relationship(
        back_populates="note",
        cascade="all, delete-orphan"
    )

class NoteChunk(Base):
            
        __tablename__ = "note_chunks"
        id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        content: Mapped[str] = mapped_column(Text)
        
        # The dimension (e.g., 384 or 768) must match your HuggingFace model
        embedding: Mapped[VECTOR] = mapped_column(VECTOR(384)) 

        note_id: Mapped[int] = mapped_column(
            ForeignKey("notes.id", ondelete="CASCADE")
        )

        # m:1 (Chunk -> Note)
        note: Mapped["Note"] = relationship(back_populates="chunks")


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content: Mapped[str]

    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )

    # Foreign Keys
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )

    note_id: Mapped[int] = mapped_column(
        ForeignKey("notes.id", ondelete="CASCADE")
    )

    # m:1 (Message -> User)
    user: Mapped["User"] = relationship(
        back_populates="messages"
    )

    # m:1 (Message -> Note)
    note: Mapped["Note"] = relationship(
        back_populates="messages"
    )


class Cluster(Base):
    __tablename__ = "clusters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str]
    cluster_vector: Mapped[VECTOR] = mapped_column(VECTOR(384))
    # (1:m) Cluster -> Notes 
    notes: Mapped[List["Note"]] = relationship(
        back_populates="cluster",
        cascade="all, delete-orphan"
    )
