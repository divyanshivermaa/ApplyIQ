from sqlmodel import Session, select

from app.db.session import engine
from app.models.application import Application
from app.models.followup_suggestion import FollowUpSuggestion


def format_explanation(stage: str, days_since_applied: int, baseline_days: int) -> str:
    return (
        f"This application has been waiting in {stage} for {days_since_applied} days, "
        f"which is longer than the expected {baseline_days} days. Follow up with the employer."
    )


def main() -> None:
    with Session(engine) as session:
        stmt = (
            select(FollowUpSuggestion)
            .where(FollowUpSuggestion.kind == "OVERDUE")
            .where(FollowUpSuggestion.status == "PENDING")
        )
        suggestions = session.exec(stmt).all()
        for suggestion in suggestions:
            application = session.get(Application, suggestion.application_id)
            if application is None:
                continue

            stage = application.current_stage or "Unknown"
            suggestion.title = "Follow up recommended"
            suggestion.explanation = format_explanation(
                stage, suggestion.days_since_applied, suggestion.baseline_days
            )
            session.add(suggestion)

        session.commit()
        print(f"Updated {len(suggestions)} pending overdue follow-up suggestions.")


if __name__ == "__main__":
    main()
