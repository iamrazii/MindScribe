import uuid
from sqlalchemy.orm import Session
from models.entity import UserHistory

def create_history(db: Session, user_id: uuid.UUID, action: str, details: str = None) -> UserHistory:
    """
    Saves a new interaction to the user's history.
    """
    history = UserHistory(user_id=user_id, action=action, details=details)
    db.add(history)
    db.commit()
    db.refresh(history)
    return history

def get_recent_history(db: Session, user_id: uuid.UUID, limit: int = 5) -> list[UserHistory]:
    """
    Retrieves the last N interactions for a specific user.
    """
    return db.query(UserHistory).filter(UserHistory.user_id == user_id).order_by(UserHistory.created_at.desc()).limit(limit).all()

def format_history_for_llm(history_list: list[UserHistory]) -> str:
    """
    Formats the user's history list into a string for LLM context.
    """
    if not history_list:
        return "No recent history."
    
    formatted = []
    # Reverse to show oldest to newest among the recent ones, or keep newest first
    for h in history_list:
        detail_str = f" - {h.details}" if h.details else ""
        formatted.append(f"[{h.created_at.strftime('%Y-%m-%d %H:%M:%S')}] {h.action}{detail_str}")
    
    return "\n".join(formatted)
