from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user
from app.repositories.analytics_repo import AnalyticsRepository
from app.services.analytics_service import AnalyticsService
from app.api.schemas.analytics_overdue_by_stage import OverdueByStageRow
from app.api.schemas.analytics_insights import InsightItem

router = APIRouter(prefix="/analytics", tags=["analytics"])

repo = AnalyticsRepository()
service = AnalyticsService(repo)


@router.get("/overdue-by-stage", response_model=List[OverdueByStageRow])
def overdue_by_stage(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
) -> List[OverdueByStageRow]:
    return service.overdue_by_stage(session, user_id=current_user.id)


@router.get("/insights", response_model=List[InsightItem])
def analytics_insights(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
) -> List[InsightItem]:
    return service.insights(session, user_id=current_user.id)
