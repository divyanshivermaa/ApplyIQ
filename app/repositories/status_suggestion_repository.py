from typing import List, Optional
from sqlmodel import Session, select

from app.models.status_suggestion import StatusSuggestion


class StatusSuggestionRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_pending_for_user(self, user_id: int, limit: int = 50) -> List[StatusSuggestion]:
        stmt = (
            select(StatusSuggestion)
            .where(StatusSuggestion.user_id == user_id)
            .where(StatusSuggestion.status == "PENDING")
            .order_by(StatusSuggestion.id.desc())
            .limit(limit)
        )
        return list(self.session.exec(stmt).all())

    def get_by_id_for_user(self, suggestion_id: int, user_id: int) -> Optional[StatusSuggestion]:
        stmt = select(StatusSuggestion).where(
            StatusSuggestion.id == suggestion_id,
            StatusSuggestion.user_id == user_id,
        )
        return self.session.exec(stmt).first()
