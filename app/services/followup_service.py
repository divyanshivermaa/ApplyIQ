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
        suggestions_created = 0
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
                continue

            # terminal stages -> clear overdue and skip
            if stage in TERMINAL_STAGES:
                # If the app reached a terminal stage, it should not stay overdue
                if getattr(app, "is_overdue", False):
                    self.repo.clear_application_overdue(session, app)
                    cleared += 1

                # Also resolve any pending overdue follow-up reminders
                self.repo.resolve_pending_overdue_suggestions(
                    session=session,
                    application_id=app.id,
                    resolved_status="DONE",
                    resolved_at=now,
                )
                continue

            # only eligible stages considered for overdue
            if stage not in OVERDUE_ELIGIBLE_STAGES:
                if getattr(app, "is_overdue", False):
                    self.repo.clear_application_overdue(session, app)
                    cleared += 1
                continue

            baseline_days = self._compute_baseline_days(app)
            days_since_applied = self._days_since(start_value, now)

            if days_since_applied > baseline_days:
                if not getattr(app, "is_overdue", False):
                    self.repo.mark_application_overdue(session, app, baseline_days, now)
                    newly_overdue += 1

                # create suggestion if no pending exists
                if not self.repo.pending_overdue_suggestion_exists(session, app.id):
                    title = "Follow up recommended"
                    explanation = (
                        f"Stage={stage}. Days since applied={days_since_applied} "
                        f"> baseline={baseline_days}. Marked overdue by rule v1."
                    )

                    # due_on = today (or today+1) — deterministic
                    due_on = now.date()

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
                    suggestions_created += 1

        # एक ही commit में सब save करें
        session.commit()

        return {
            "checked": checked,
            "newly_overdue": newly_overdue,
            "suggestions_created": suggestions_created,
            "cleared_overdue": cleared,
            "ran_at_utc": now.isoformat(),
        }
