from datetime import datetime, date
from typing import List, Optional
from sqlmodel import Session, select

from app.models.application import Application
from app.models.followup_suggestion import FollowUpSuggestion
from app.models.status_suggestion import StatusSuggestion


class FollowUpRepository:
    def get_active_applications_for_followup(self, session: Session) -> List[Application]:
        # सिर्फ active applications निकाल रहे हैं ताकि terminal stages को skip कर सकें
        stmt = select(Application)
        return list(session.exec(stmt).all())

    def pending_overdue_suggestion_exists(self, session: Session, application_id: int) -> bool:
        # duplicate reminders से बचने के लिए check
        stmt = (
            select(FollowUpSuggestion)
            .where(FollowUpSuggestion.application_id == application_id)
            .where(FollowUpSuggestion.kind == "OVERDUE")
            .where(FollowUpSuggestion.status == "PENDING")
        )
        return session.exec(stmt).first() is not None

    def get_pending_overdue_suggestions(self, session: Session, application_id: int) -> list[FollowUpSuggestion]:
        stmt = (
            select(FollowUpSuggestion)
            .where(FollowUpSuggestion.application_id == application_id)
            .where(FollowUpSuggestion.kind == "OVERDUE")
            .where(FollowUpSuggestion.status == "PENDING")
        )
        return list(session.exec(stmt).all())

    def pending_overdue_status_suggestion_exists(
        self,
        session: Session,
        application_id: int,
        source_type: str = "OVERDUE",
    ) -> bool:
        stmt = (
            select(StatusSuggestion)
            .where(StatusSuggestion.application_id == application_id)
            .where(StatusSuggestion.source_type == source_type)
            .where(StatusSuggestion.status == "PENDING")
        )
        return session.exec(stmt).first() is not None

    def create_overdue_status_suggestion(
        self,
        session: Session,
        user_id: int,
        application_id: int,
        suggested_stage: str,
        explanation: str,
        confidence: int = 70,
        source_type: str = "OVERDUE",
    ) -> StatusSuggestion:
        suggestion = StatusSuggestion(
            user_id=user_id,
            application_id=application_id,
            suggested_stage=suggested_stage,
            confidence=confidence,
            explanation=explanation,
            source_type=source_type,
            status="PENDING",
        )
        session.add(suggestion)
        return suggestion

    def resolve_pending_overdue_status_suggestions(
        self,
        session: Session,
        application_id: int,
        resolved_status: str = "DISMISSED",
        resolved_at: Optional[datetime] = None,
    ) -> int:
        if resolved_at is None:
            resolved_at = datetime.utcnow()

        stmt = (
            select(StatusSuggestion)
            .where(StatusSuggestion.application_id == application_id)
            .where(StatusSuggestion.source_type == "OVERDUE")
            .where(StatusSuggestion.status == "PENDING")
        )
        rows = session.exec(stmt).all()
        for row in rows:
            row.status = resolved_status
            row.reviewed_at = resolved_at
            session.add(row)
        return len(rows)

    def mark_application_overdue(
        self,
        session: Session,
        application: Application,
        baseline_days: int,
        now: datetime,
    ) -> None:
        # app को overdue mark कर रहे हैं, ताकि UI में flag दिखे
        application.is_overdue = True
        application.overdue_at = now
        application.overdue_baseline_days = baseline_days
        session.add(application)

    def clear_application_overdue(self, session: Session, application: Application) -> None:
        # अगर app अब eligible नहीं है (stage बदल गया), तो overdue हटाओ
        application.is_overdue = False
        application.overdue_at = None
        application.overdue_baseline_days = None
        session.add(application)

    def create_overdue_suggestion(
        self,
        session: Session,
        user_id: int,
        application_id: int,
        baseline_days: int,
        days_since_applied: int,
        title: str,
        explanation: str,
        due_on: Optional[date],
        rule_version: str = "v1",
    ) -> FollowUpSuggestion:
        # UI के inbox के लिए PENDING suggestion बना रहे हैं
        s = FollowUpSuggestion(
            user_id=user_id,
            application_id=application_id,
            kind="OVERDUE",
            status="PENDING",
            due_on=due_on,
            baseline_days=baseline_days,
            days_since_applied=days_since_applied,
            rule_version=rule_version,
            title=title,
            explanation=explanation,
        )
        session.add(s)
        return s

    def resolve_pending_overdue_suggestions(
        self,
        session: Session,
        application_id: int,
        resolved_status: str = "DONE",
        resolved_at: Optional[datetime] = None,
    ) -> int:
        # Resolve any pending OVERDUE suggestions for an application
        if resolved_at is None:
            resolved_at = datetime.utcnow()

        stmt = (
            select(FollowUpSuggestion)
            .where(FollowUpSuggestion.application_id == application_id)
            .where(FollowUpSuggestion.kind == "OVERDUE")
            .where(FollowUpSuggestion.status == "PENDING")
        )
        rows = session.exec(stmt).all()

        for r in rows:
            r.status = resolved_status
            r.resolved_at = resolved_at
            session.add(r)

        return len(rows)
