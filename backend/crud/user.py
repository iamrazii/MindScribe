from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional

from models.entity import Users
def create_user(db: Session, user) -> Users:
    db_user = Users(
        username=user.username,
        email=user.email,
        hashed_password=user.hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user(db: Session, user_id) -> Optional[Users]:
    
    return db.get(Users, user_id)

def get_user_by_email(db: Session, email: str) -> Optional[Users]:
    stmt = select(Users).where(Users.email == email)
    return db.scalar(stmt)

def get_user_by_username(db: Session, username: str) -> Optional[Users]:
    
    stmt = select(Users).where(Users.username == username)
    return db.scalar(stmt)

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[Users]:
    stmt = select(Users).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())

def update_user_email(db: Session, user_id, new_email: str) -> Users | None:
    
    db_user = db.get(Users, user_id)
    
    if db_user:
        db_user.email = new_email  
        
        db.commit()
        db.refresh(db_user)
        
    return db_user


def update_user_password(db: Session, user_id, new_password: str) -> Users | None:
    db_user = db.get(Users, user_id)
    
    if db_user:
        
        db_user.hashed_password = new_password 
        
        db.commit()
        db.refresh(db_user)
        
    return db_user

def delete_user(db: Session, user_id) -> bool:
    #Deletes a user. Returns True if deleted, False if not found.
    db_user = db.get(Users, user_id)
    
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
        
    return False