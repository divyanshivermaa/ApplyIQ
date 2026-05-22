from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.applications import _attach_resume_slot
from app.api.deps import get_current_user
from app.api.schemas.dashboard_overview import DashboardOverviewOut
from app.db.session import get_session
from app.repositories.analytics_repo import AnalyticsRepository
from app.services.analytics_service import AnalyticsService
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

analytics_service = AnalyticsService(AnalyticsRepository())
application_service = ApplicationService()


@router.get("/overview", response_model=DashboardOverviewOut)
def dashboard_overview(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    user_id = current_user.id
    apps = application_service.list_applications(session, user_id, sort="recent")
    return {
        "insights": analytics_service.insights(session, user_id),
        "overdue_by_stage": analytics_service.overdue_by_stage(session, user_id),
        "overdue_summary": analytics_service.overdue_summary(session, user_id),
        "platform_performance": analytics_service.platform_performance(session, user_id),
        "resume_performance": analytics_service.resume_performance(session, user_id),
        "applications": [_attach_resume_slot(a, session, user_id) for a in apps],
    }
