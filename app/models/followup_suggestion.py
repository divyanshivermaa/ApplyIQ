from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field

class FollowUpSuggestion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(index=True, nullable=False)
    application_id: int = Field(index=True, nullable=False)

    kind: str = Field(index=True, nullable=False)  # "OVERDUE"
    status: str = Field(index=True, nullable=False, default="PENDING")  # PENDING/DISMISSED/DONE

    due_on: Optional[date] = Field(default=None, nullable=True)

    baseline_days: int = Field(nullable=False)
    days_since_applied: int = Field(nullable=False)

    rule_version: str = Field(nullable=False, default="v1")

    title: str = Field(nullable=False)
    explanation: str = Field(nullable=False)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    resolved_at: Optional[datetime] = Field(default=None, nullable=True)
