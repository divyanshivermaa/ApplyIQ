from jose import jwt, JWTError
from sqlmodel import Session
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.core.security import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    def register(self, session: Session, email: str, password: str) -> User:
        # Duplicate user avoid karne ke liye pehle check
        existing = self.user_repo.get_by_email(session, email)
        if existing:
            raise ValueError("Email already registered")

        user = User(email=email, hashed_password=hash_password(password))
        return self.user_repo.create(session, user)

    def login(self, session: Session, email: str, password: str) -> str:
        # Email se user nikaal rahe hain
        user = self.user_repo.get_by_email(session, email)
        if not user:
            raise ValueError("Invalid credentials")

        # Password match
        if not verify_password(password, user.hashed_password):
            raise ValueError("Invalid credentials")

        # Token me subject as email (later user_id bhi use kar sakte)
        return create_access_token(subject=user.email)

    def get_user_from_token(self, session: Session, token: str):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            if not email:
                return None
            return self.user_repo.get_by_email(session, email)
        except JWTError:
            return None
