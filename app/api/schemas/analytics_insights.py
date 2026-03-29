from typing import Any, Dict, Optional
from pydantic import BaseModel


class InsightItem(BaseModel):
    key: str
    title: str
    insight: str
    metric_source: str
    details: Optional[Dict[str, Any]] = None
