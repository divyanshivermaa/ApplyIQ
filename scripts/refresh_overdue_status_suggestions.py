from sqlmodel import Session, select

from app.db.session import engine
from app.models.application import Application
from app.models.status_suggestion import StatusSuggestion


def format_explanation(stage: str, days_since_applied: int, baseline_days: int) -> str:
    return (
        f"This application has been waiting in {stage} for {days_since_applied} days, "
        f"which is longer than the expected {baseline_days} days. Consider following up with the employer."
    )


def main() -> None:
    with Session(engine) as session:
        stmt = (
            select(StatusSuggestion)
            .where(StatusSuggestion.source_type == "OVERDUE")
            .where(StatusSuggestion.status == "PENDING")
        )
        suggestions = session.exec(stmt).all()
        updated = 0
        for suggestion in suggestions:
            application = session.get(Application, suggestion.application_id)
            if application is None:
                continue

            stage = application.current_stage or "Unknown"

            # try to use baseline_days/days_since_applied if available on the suggestion
            # fallback to conservative defaults
            baseline_days = getattr(suggestion, "baseline_days", None) or 14
            days_since_applied = getattr(suggestion, "days_since_applied", None) or 0

            suggestion.explanation = format_explanation(stage, days_since_applied, baseline_days)
            session.add(suggestion)
            updated += 1

        session.commit()
        print(f"Updated {updated} pending overdue status suggestions.")


if __name__ == "__main__":
    main()
