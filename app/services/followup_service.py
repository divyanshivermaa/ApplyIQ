from datetime import datetime, date
from typing import Optional

from sqlmodel import Session

from app.core.followup_config import (
    DEFAULT_BASELINE_DAYS,
    TERMINAL_STAGES,
    OVERDUE_ELIGIBLE_STAGES,
)
from app.models.application import Application
from app.repositories.followup_repository import FollowUpRepository


class FollowUpService:
    def __init__(self, repo: FollowUpRepository):
        self.repo = repo

    def _days_since(self, start_dt: datetime | date, now: datetime) -> int:
        # handles date or datetime for start_dt
        if isinstance(start_dt, datetime):
            start_date = start_dt.date()
        elif isinstance(start_dt, date):
            start_date = start_dt
        else:
            return 0
            
        delta = now.date() - start_date
        return max(0, delta.days)

    def _compute_baseline_days(self, app: Application) -> int:
        # baseline response days तय कर रहे हैं (deterministic)
        # अभी simplest rule: अगर app में कोई custom expected_days है तो use, नहीं तो default
        expected = getattr(app, "expected_response_days", None)
        if isinstance(expected, int) and expected > 0:
            return expected
        return DEFAULT_BASELINE_DAYS

    def run_daily_overdue_sweep(self, session: Session, now: Optional[datetime] = None) -> dict:
        # daily job का main function
        if now is None:
            now = datetime.utcnow()

        apps = self.repo.get_active_applications_for_followup(session)

        checked = 0
        newly_overdue = 0
        followup_suggestions_created = 0
        status_suggestions_created = 0
        cleared = 0

        for app in apps:
            checked += 1

            # start_value = app.date_applied or app.created_at
            start_value = app.date_applied or app.created_at
            if start_value is None:
                continue

            stage = getattr(app, "current_stage", None)
            if stage is None:
                continue

            stage = str(stage).upper()

            # explicit short-circuit for CAPTURED stage
            if stage == "CAPTURED":
                if getattr(app, "is_overdue", False):
                    self.repo.clear_application_overdue(session, app)
                self.repo.resolve_pending_overdue_status_suggestions(
                    session=session,
                    application_id=app.id,
                    resolved_status="DISMISSED",
                    resolved_at=now,
                )
                continue

            # terminal stages -> clear overdue and skip
            if stage in TERMINAL_STAGES:
                # If the app reached a terminal stage, it should not stay overdue
                if getattr(app, "is_overdue", False):
                    self.repo.clear_application_overdue(session, app)
                    cleared += 1

                # Also resolve any pending overdue follow-up reminders and overdue status suggestions
                self.repo.resolve_pending_overdue_suggestions(
                    session=session,
                    application_id=app.id,
                    resolved_status="DONE",
                    resolved_at=now,
                )
                self.repo.resolve_pending_overdue_status_suggestions(
                    session=session,
                    application_id=app.id,
                    resolved_status="DISMISSED",
                    resolved_at=now,
                )
                continue

            # only eligible stages considered for overdue
            if stage not in OVERDUE_ELIGIBLE_STAGES:
                if getattr(app, "is_overdue", False):
                    self.repo.clear_application_overdue(session, app)
                    cleared += 1
                self.repo.resolve_pending_overdue_status_suggestions(
                    session=session,
                    application_id=app.id,
                    resolved_status="DISMISSED",
                    resolved_at=now,
                )
                continue

            baseline_days = self._compute_baseline_days(app)
            days_since_applied = self._days_since(start_value, now)

            if days_since_applied > baseline_days:
                if not getattr(app, "is_overdue", False):
                    self.repo.mark_application_overdue(session, app, baseline_days, now)
                    newly_overdue += 1

                # create suggestion if no pending exists
                title = "Follow up recommended"
                explanation = (
                    f"This application has been waiting in {stage} for {days_since_applied} days, "
                    f"which is longer than the expected {baseline_days} days. Follow up with the employer."
                )

                # due_on = today (or today+1) — deterministic
                due_on = now.date()

                pending_suggestions = self.repo.get_pending_overdue_suggestions(session, app.id)
                if pending_suggestions:
                    for pending in pending_suggestions:
                        pending.title = title
                        pending.explanation = explanation
                        pending.due_on = due_on
                        session.add(pending)
                else:
                    self.repo.create_overdue_suggestion(
                        session=session,
                        user_id=app.user_id,
                        application_id=app.id,
                        baseline_days=baseline_days,
                        days_since_applied=days_since_applied,
                        title=title,
                        explanation=explanation,
                        due_on=due_on,
                        rule_version="v1",
                    )
                    followup_suggestions_created += 1

                if not self.repo.pending_overdue_status_suggestion_exists(session, app.id):
                    status_explanation = (
                        f"This application has been waiting in {stage} for {days_since_applied} days, "
                        f"which is longer than the expected {baseline_days} days. Consider following up with the employer."
                    )
                    self.repo.create_overdue_status_suggestion(
                        session=session,
                        user_id=app.user_id,
                        application_id=app.id,
                        suggested_stage=stage,
                        explanation=status_explanation,
                        confidence=70,
                        source_type="OVERDUE",
                    )
                    status_suggestions_created += 1

        # एक ही commit में सब save करें
        session.commit()

        return {
            "checked": checked,
            "newly_overdue": newly_overdue,
            "followup_suggestions_created": followup_suggestions_created,
            "status_suggestions_created": status_suggestions_created,
            "cleared_overdue": cleared,
            "ran_at_utc": now.isoformat(),
        }
