from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship, Index

class ApplicationStage(SQLModel, table=True):
    __table_args__ = (
        Index("ix_stage_app_timestamp", "application_id", "timestamp"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(foreign_key="application.id", nullable=False)

    stage: str = Field(index=True, nullable=False)  # APPLIED, OA, INTERVIEW, OFFER...
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True, nullable=False)

    application: "Application" = Relationship(back_populates="stages")
