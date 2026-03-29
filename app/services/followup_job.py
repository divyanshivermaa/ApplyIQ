from datetime import datetime
from sqlmodel import Session

from app.db.session import engine
from app.repositories.followup_repository import FollowUpRepository
from app.services.followup_service import FollowUpService


def run_followup_daily_job() -> None:
    # APScheduler इस function को call करेगा
    repo = FollowUpRepository()
    service = FollowUpService(repo)

    with Session(engine) as session:
        result = service.run_daily_overdue_sweep(session=session, now=datetime.utcnow())
        print("[FOLLOWUP_JOB]", result)
