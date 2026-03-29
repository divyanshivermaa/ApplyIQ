from datetime import datetime
from sqlmodel import Session, select
from app.models.status_suggestion import StatusSuggestion

class SuggestionRepository:
    def list_pending(self, session: Session, user_id: int) -> list[StatusSuggestion]:
        # User ke pending suggestions dikhane hain
        stmt = (
            select(StatusSuggestion)
            .where(StatusSuggestion.user_id == user_id, StatusSuggestion.status == "PENDING")
            .order_by(StatusSuggestion.created_at.desc())
        )
        return list(session.exec(stmt).all())

    def get_by_id(self, session: Session, suggestion_id: int) -> StatusSuggestion | None:
        # Suggestion id se record nikalna
        stmt = select(StatusSuggestion).where(StatusSuggestion.id == suggestion_id)
        return session.exec(stmt).first()

    def mark_confirmed(self, session: Session, s: StatusSuggestion) -> StatusSuggestion:
        # Confirm hone par status + reviewed_at update
        s.status = "CONFIRMED"
        s.reviewed_at = datetime.utcnow()
        session.add(s)
        session.commit()
        session.refresh(s)
        return s

    def mark_dismissed(self, session: Session, s: StatusSuggestion) -> StatusSuggestion:
        # Dismiss hone par status + reviewed_at update
        s.status = "DISMISSED"
        s.reviewed_at = datetime.utcnow()
        session.add(s)
        session.commit()
        session.refresh(s)
        return s
