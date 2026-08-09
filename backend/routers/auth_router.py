import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from datetime import timedelta

from models.database import get_db
from models.user_model import User
from utils.auth import get_password_hash, verify_password, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from services.auth_security_service import LoginThrottle, validate_password

router = APIRouter(prefix="/auth", tags=["Authentication"])
login_throttle = LoginThrottle(
    max_attempts=int(os.getenv("AUTH_LOGIN_MAX_ATTEMPTS", "5")),
    window_seconds=int(os.getenv("AUTH_LOGIN_WINDOW_SECONDS", "300")),
)

# --- Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    full_name: str | None = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        password = validate_password(user.password)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    hashed_password = get_password_hash(password)
    new_user = User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(
    response: Response,
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # OAuth2PasswordRequestForm expects 'username' and 'password'
    # We use 'email' as the username
    client_host = request.client.host if request.client else "unknown"
    throttle_key = f"{client_host}:{form_data.username.casefold()}"
    if not login_throttle.is_allowed(throttle_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Try again in a few minutes.",
        )

    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        login_throttle.record_failure(throttle_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    login_throttle.reset(throttle_key)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    cookie_secure = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    cookie_same_site = os.getenv("COOKIE_SAMESITE", "lax").lower()
    response.set_cookie(
        key="careerpilot_session",
        value=access_token,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_same_site,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return {"authenticated": True}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("careerpilot_session", path="/")
    return {"authenticated": False}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
