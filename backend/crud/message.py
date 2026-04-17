import uuid
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from models.entity import Messages

def create_message(db: Session, sender_id: uuid.UUID, receiver_id: uuid.UUID, content: str, note_id: uuid.UUID | None = None):

    new_message = Messages(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
        note_id=note_id
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

 # list of sent msgs
def get_sent_messages(db: Session, sender_id: uuid.UUID, skip: int = 0, limit: int = 50):
    stmt = (
        select(Messages)
        .where(Messages.sender_id == sender_id)
        # Eagerly load the receiver's info so the UI can render "Sent to: [Username]"
        .options(joinedload(Messages.receiver)) 
        .order_by(Messages.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()

#list of received msgs
def get_received_messages(db: Session, receiver_id: uuid.UUID, skip: int = 0, limit: int = 50):
    stmt = (
        select(Messages)
        .where(Messages.receiver_id == receiver_id)
        # Eagerly load the sender's info so the UI can render "From: [Username]"
        .options(joinedload(Messages.sender))
        .order_by(Messages.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()


# single detailed msg
def get_message_detail(db: Session, message_id: uuid.UUID, current_user_id: uuid.UUID):

    stmt = (
        select(Messages)
        .where(Messages.id == message_id)
        # Eagerly load all relations for the detail view
        .options(
            joinedload(Messages.sender),
            joinedload(Messages.receiver),
            joinedload(Messages.note)
        )
    )
    message = db.execute(stmt).scalar_one_or_none()
    
    if message:
        # Check if the current user is the receiver AND if it's currently unread
        if message.receiver_id == current_user_id and message.is_read == False:
            message.is_read = True
            db.commit()
            db.refresh(message)
            
    return message