from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.deps import get_current_user
from crud.user import get_user_by_email
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
    email: str,
    db: Session = Depends(get_db),
    _: Users = Depends(get_current_user),
):
    found = get_user_by_email(db, email)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return found