
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.deps import get_current_user
from crud.user import get_user_by_username
from db.session import get_db
from models.entity import Users

router = APIRouter()


class UserProfile(BaseModel):
    username: str
    email: str

    model_config = {"from_attributes": True}


@router.get("/me", response_model=UserProfile)
def me(user: Users = Depends(get_current_user)):
    return user


@router.get("/search", response_model=UserProfile)
def search_user(
    username: str,
    db: Session = Depends(get_db),
    _: Users = Depends(get_current_user),   # must be logged in to search
):
    """
    GET /api/users/search?username=alice
    Used by the Share / Message flow to resolve a username to a profile
    without exposing internal IDs.
    """
    found = get_user_by_username(db, username)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return found
