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
    profile_picture_url: str | None = None

class UserUpdate(BaseModel):
    username: str | None = None
    password: str | None = None
    profile_picture_url: str | None = None

    model_config = {"from_attributes": True}

@router.get("/me", response_model=UserProfile)
def me(user: Users = Depends(get_current_user)):
    return user

@router.put("/me", response_model=UserProfile)
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    user: Users = Depends(get_current_user)
):
    from core.security import hash_password
    
    if body.username is not None:
        # Check if username is taken by someone else
        from crud.user import get_user_by_username
        existing = get_user_by_username(db, body.username)
        if existing and existing.id != user.id:
            raise HTTPException(status_code=409, detail="Username already taken.")
        user.username = body.username
        
    if body.password is not None:
        user.hashed_password = hash_password(body.password)
        
    if body.profile_picture_url is not None:
        user.profile_picture_url = body.profile_picture_url
        
    db.commit()
    db.refresh(user)
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