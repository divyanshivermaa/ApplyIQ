from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.deps import get_current_user
from app.db.session import get_session
from app.repositories.analytics_repo import AnalyticsRepository
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])
service = AnalyticsService(AnalyticsRepository())


@router.get("/overdue")
def overdue_analytics(
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    return service.overdue_summary(session, user.id)
