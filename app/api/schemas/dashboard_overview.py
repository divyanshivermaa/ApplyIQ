from typing import Any, List, Optional
from pydantic import BaseModel

from app.api.schemas.analytics_insights import InsightItem
from app.api.schemas.analytics_overdue_by_stage import OverdueByStageRow


class OverdueSummaryOut(BaseModel):
    total_overdue: int
    overdue_by_platform: List[dict]


class DashboardOverviewOut(BaseModel):
    insights: List[InsightItem]
    overdue_by_stage: List[OverdueByStageRow]
    overdue_summary: OverdueSummaryOut
    platform_performance: List[dict]
    resume_performance: List[dict]
    applications: List[dict]
