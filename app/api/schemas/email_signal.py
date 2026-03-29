from typing import List, Literal, Optional
from pydantic import BaseModel, Field

ConfidenceLabel = Literal["HIGH", "MEDIUM", "LOW"]


class EmailSignalItem(BaseModel):
    from_email: Optional[str] = None
    subject: str = Field(..., min_length=1)
    snippet: Optional[str] = None
    received_at: Optional[str] = None

    platform_hint: Optional[str] = None
    company_hint: Optional[str] = None
    role_hint: Optional[str] = None
    job_url_hint: Optional[str] = None

    confidence: ConfidenceLabel = "MEDIUM"


class EmailSignalSubmitRequest(BaseModel):
    signals: List[EmailSignalItem] = Field(default_factory=list)


class EmailSignalSubmitResult(BaseModel):
    total_received: int
    matched: int
    inserted: int
    unmapped: int
    unmatched: int
