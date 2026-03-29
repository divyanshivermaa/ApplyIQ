from sqlmodel import Session, select
from app.models.user import User
from app.db.session import get_session

class UserRepository:
    def get_by_email(self, session: Session, email: str) -> User | None:
        # Email unique hota hai, isliye ek hi user milega
        statement = select(User).where(User.email == email)
        return session.exec(statement).first()

    def get_by_id(self, user_id: str):
        with get_session() as session:
            statement = select(User).where(User.id == user_id)
            return session.exec(statement).first()

    def create(self, session: Session, user: User) -> User:
        # User DB me save kar rahe hain
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
