from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Index

class StatusSuggestion(SQLModel, table=True):
    # Ye table "detected update" ko store karega jo user confirm/dismiss karega
    __table_args__ = (
        Index("ix_suggestion_user_status", "user_id", "status"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    application_id: int = Field(foreign_key="application.id", index=True, nullable=False)

    # Suggested stage e.g. "REJECTED", "OA", "INTERVIEW"
    suggested_stage: str = Field(index=True, nullable=False)

    # "PORTAL" or "EMAIL"
    source_type: str = Field(index=True, nullable=False)

    # 0-100 confidence (deterministic rules)
    confidence: int = Field(default=70, nullable=False)

    # Explainable reason string (why suggested)
    explanation: str = Field(nullable=False)

    # PENDING / CONFIRMED / DISMISSED
    status: str = Field(default="PENDING", index=True, nullable=False)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    reviewed_at: Optional[datetime] = Field(default=None)
