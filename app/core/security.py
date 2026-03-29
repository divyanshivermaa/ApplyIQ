from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import jwt
from argon2 import PasswordHasher

# Argon2 use kar rahe hain directly kyunki passlib 3.13 me instability deta hai
ph = PasswordHasher()

# Ye JWT sign karne ke liye secret key (real project me env se lena)
SECRET_KEY = "CHANGE_ME_TO_ENV_SECRET"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def hash_password(password: str) -> str:
    # Password ko secure hash me convert kar rahe hain
    return ph.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    # Argon2 hash ko direct verify karte hain
    try:
        return ph.verify(hashed_password, password)
    except Exception:
        # Invalid hash ya password mismatch par false
        return False

def create_access_token(subject: str, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    # JWT me expiry + subject (email/user_id) dal ke token bana rahe hain
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
