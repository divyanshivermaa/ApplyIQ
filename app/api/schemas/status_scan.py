from typing import List, Literal, Optional
from pydantic import BaseModel, Field

ConfidenceLabel = Literal["HIGH", "MEDIUM", "LOW"]


class StatusScanItem(BaseModel):
    company_name: str = Field(..., min_length=1)
    role_title: str = Field(..., min_length=1)
    status_text: str = Field(..., min_length=1)
    job_url: Optional[str] = None
    confidence: ConfidenceLabel = "MEDIUM"


class StatusScanSubmitRequest(BaseModel):
    platform: str = Field(..., min_length=1)
    scanned_items: List[StatusScanItem] = Field(default_factory=list)


class StatusScanSubmitResult(BaseModel):
    total_received: int
    matched: int
    inserted: int
    unmapped: int
    unmatched: int
    unmatched_items: List[StatusScanItem] = Field(default_factory=list)
    unmapped_items: List[StatusScanItem] = Field(default_factory=list)
