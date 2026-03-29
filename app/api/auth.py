from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import Session

from app.db.session import get_session
from app.services.auth_service import AuthService
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginIn(BaseModel):
    email: str
    password: str

class MeOut(BaseModel):
    user_id: str
    email: str

@router.post("/register")
def register(payload: RegisterRequest, session: Session = Depends(get_session)):
    try:
        user = auth_service.register(session, payload.email, payload.password)
        return {"id": user.id, "email": user.email}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ✅ Swagger OAuth2 "Authorize" isi endpoint ko call karega (form-data)
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    try:
        # Swagger me field ka naam "username" hota hai, hum usko email ki tarah treat kar rahe hain
        token = auth_service.login(session, form_data.username, form_data.password)
        return {"access_token": token, "token_type": "bearer"}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

# A) Add POST /auth/login that sets cookie
@router.post("/login-cookie")
def login_cookie(payload: LoginIn, response: Response, session: Session = Depends(get_session)):
    token = auth_service.login(session, payload.email, payload.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # IMPORTANT: HttpOnly cookie so extension/dashboard both can use it safely
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",   # for localhost this is fine
        secure=False,     # localhost HTTP
        path="/",
        max_age=60 * 60 * 24 * 7,
    )
    return {"ok": True}

# B) Add GET /auth/me that validates cookie
@router.get("/me", response_model=MeOut)
def me(current_user=Depends(get_current_user)):
    # Why: simple bearer-only session check for MVP
    return MeOut(user_id=str(current_user.id), email=current_user.email)
