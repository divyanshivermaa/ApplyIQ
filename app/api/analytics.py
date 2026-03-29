from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user
from app.repositories.analytics_repo import AnalyticsRepository
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])

repo = AnalyticsRepository()
service = AnalyticsService(repo)

@router.get("/funnel")
def funnel(session: Session = Depends(get_session), user=Depends(get_current_user)):
    return service.funnel(session, user.id)

@router.get("/resume-performance")
def resume_performance(session: Session = Depends(get_session), user=Depends(get_current_user)):
    return service.resume_performance(session, user.id)

@router.get("/platform-performance")
def platform_performance(session: Session = Depends(get_session), user=Depends(get_current_user)):
    return service.platform_performance(session, user.id)

@router.get("/weekly-trend")
def weekly_trend(session: Session = Depends(get_session), user=Depends(get_current_user)):
    return service.weekly_trend(session, user.id)

@router.get("/response-time")
def response_time(session: Session = Depends(get_session), user=Depends(get_current_user)):
    return service.response_time(session, user.id)
