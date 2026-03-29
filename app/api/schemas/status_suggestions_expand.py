from typing import Optional
from pydantic import BaseModel


class StatusSuggestionExpanded(BaseModel):
    id: int
    application_id: int
    suggested_stage: str
    confidence: int
    source_type: str
    explanation: str
    status: str

    company_name: str
    role_title: str
    platform: Optional[str] = None
    job_url: Optional[str] = None
