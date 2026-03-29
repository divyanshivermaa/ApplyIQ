from datetime import datetime, date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import UniqueConstraint

class Application(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("user_id", "job_url", name="uq_application_user_joburl"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)

    company_name: str = Field(index=True, nullable=False)
    role_title: str = Field(nullable=False)

    job_url: str = Field(index=True, nullable=False)
    platform: Optional[str] = Field(index=True, default=None)
    location: Optional[str] = Field(default=None)

    job_type: Optional[str] = Field(default=None)           # intern, full-time, etc.
    company_type: Optional[str] = Field(index=True, default=None)  # startup, MNC, etc.
    role_category: Optional[str] = Field(index=True, default=None) # frontend, backend...

    resume_id: Optional[int] = Field(default=None, foreign_key="resume.id", index=True)

    date_applied: Optional[date] = Field(index=True, default=None)
    current_stage: str = Field(default="CAPTURED", index=True)  # CAPTURED/APPLIED/OA/...

    is_overdue: bool = Field(default=False, nullable=False)
    overdue_at: Optional[datetime] = Field(default=None, nullable=True)
    overdue_baseline_days: Optional[int] = Field(default=None, nullable=True)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    user: "User" = Relationship(back_populates="applications")
    resume: Optional["Resume"] = Relationship(back_populates="applications")
    stages: List["ApplicationStage"] = Relationship(back_populates="application")
