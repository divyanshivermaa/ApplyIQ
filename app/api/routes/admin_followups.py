from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.config import settings
from app.db.session import get_session
from app.repositories.followup_repository import FollowUpRepository
from app.services.followup_service import FollowUpService

router = APIRouter(prefix="/admin/followups", tags=["admin-followups"])


@router.post("/run-now")
def run_followups_now(session: Session = Depends(get_session)):
    # DEV-only endpoint to run the follow-up sweep instantly
    if not settings.ADMIN_DEV_ENDPOINTS_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")

    repo = FollowUpRepository()
    service = FollowUpService(repo)

    result = service.run_daily_overdue_sweep(session=session, now=datetime.utcnow())
    return result
