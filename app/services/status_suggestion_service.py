from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Session, select

from app.repositories.status_suggestion_repository import StatusSuggestionRepository
from app.models.application import Application
from app.models.application_stage import ApplicationStage
from app.models.status_suggestion import StatusSuggestion
from app.api.schemas.status_suggestions_expand import StatusSuggestionExpanded


class StatusSuggestionService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = StatusSuggestionRepository(session)

    def list_pending(self, user_id: int, limit: int = 50):
        return self.repo.list_pending_for_user(user_id=user_id, limit=limit)

    def list_pending_expanded(self, user_id: int, limit: int = 50):
        """
        Returns pending suggestions with application context (company/role/platform/url).
        """
        stmt = (
            select(StatusSuggestion, Application)
            .join(Application, Application.id == StatusSuggestion.application_id)
            .where(StatusSuggestion.user_id == user_id)
            .where(StatusSuggestion.status == "PENDING")
            .order_by(StatusSuggestion.id.desc())
            .limit(limit)
        )

        rows = self.session.exec(stmt).all()

        out = []
        for s, a in rows:
            out.append(
                StatusSuggestionExpanded(
                    id=s.id,
                    application_id=s.application_id,
                    suggested_stage=s.suggested_stage,
                    confidence=s.confidence,
                    source_type=s.source_type,
                    explanation=s.explanation,
                    status=s.status,
                    company_name=a.company_name,
                    role_title=a.role_title,
                    platform=getattr(a, "platform", None),
                    job_url=getattr(a, "job_url", None),
                )
            )
        return out

    def confirm(self, user_id: int, suggestion_id: int) -> tuple[str, str, Optional[str]]:
        s = self.repo.get_by_id_for_user(suggestion_id=suggestion_id, user_id=user_id)
        if s is None:
            raise ValueError("Suggestion not found")

        prev = s.status
        if s.status != "PENDING":
            return (prev, s.status, None)

        app = self.session.get(Application, s.application_id)
        if app is None or app.user_id != user_id:
            raise ValueError("Application not found for suggestion")

        applied_stage = s.suggested_stage
        if hasattr(app, "current_stage"):
            app.current_stage = applied_stage
        elif hasattr(app, "stage"):
            app.stage = applied_stage
        else:
            raise ValueError("Application has no stage field (current_stage/stage)")

        stage_row = ApplicationStage(
            application_id=app.id,
            stage=applied_stage,
        )
        self.session.add(stage_row)

        s.status = "CONFIRMED"
        s.reviewed_at = datetime.now(timezone.utc)

        self.session.add(app)
        self.session.add(s)
        self.session.commit()

        return (prev, "CONFIRMED", applied_stage)

    def dismiss(self, user_id: int, suggestion_id: int) -> tuple[str, str, None]:
        s = self.repo.get_by_id_for_user(suggestion_id=suggestion_id, user_id=user_id)
        if s is None:
            raise ValueError("Suggestion not found")

        prev = s.status
        if s.status != "PENDING":
            return (prev, s.status, None)

        s.status = "DISMISSED"
        s.reviewed_at = datetime.now(timezone.utc)

        self.session.add(s)
        self.session.commit()

        return (prev, "DISMISSED", None)
