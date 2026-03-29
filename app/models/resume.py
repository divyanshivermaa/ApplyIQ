from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import UniqueConstraint, Column, String
from sqlalchemy.dialects.postgresql import JSONB

class Resume(SQLModel, table=True):
    __tablename__ = "resume"
    __table_args__ = (
        UniqueConstraint("user_id", "slot", name="uq_resume_user_slot"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    slot: int = Field(index=True, nullable=False)
    # Keep DB column compatibility (version_label) while exposing app-level name.
    name: str = Field(sa_column=Column("version_label", String, nullable=False, index=True))

    # tags: JSON list for analytics (Postgres best)
    tags: Optional[dict] = Field(default=None, sa_type=JSONB)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    user: "User" = Relationship(back_populates="resumes")
    applications: List["Application"] = Relationship(back_populates="resume")
