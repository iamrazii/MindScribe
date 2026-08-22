
import dns.resolver
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.security import hash_password, verify_password, create_access_token
from crud.user import get_user_by_email, get_user_by_username, create_user
from db.session import get_db
from models.entity import Users
from schemas.auth_schema import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter()


# ── Email domain MX validation ───────────────────────────────────────────────

def _domain_has_mx(email: str) -> bool:
    """
    Returns True if the email's domain has at least one MX record.
    This confirms the domain is configured to receive mail (real email domain).
    """
    domain = email.split("@")[-1]
    try:
        answers = dns.resolver.resolve(domain, "MX", lifetime=5)
        return len(answers) > 0
    except Exception:
        return False


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):

    # 1. Check email domain really exists in the world
    if not _domain_has_mx(body.email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email domain does not appear to be valid. Please use a real email address.",
        )

    # 2. Uniqueness checks
    if get_user_by_email(db, body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    if get_user_by_username(db, body.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken.",
        )
    class _UserCreate:
        username = body.username
        email = body.email
        hashed_password = hash_password(body.password)

    user: Users = create_user(db, _UserCreate())

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        username=user.username,
        email=user.email,
        profile_picture_url=user.profile_picture_url,
    )




@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        username=user.username,
        email=user.email,
        profile_picture_url=user.profile_picture_url,
    )
