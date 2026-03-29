from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint

class PlatformProfile(SQLModel, table=True):
    # Ye table user ke platform wise applied-page URL store karega
    __table_args__ = (
        UniqueConstraint("user_id", "platform_name", name="uq_platformprofile_user_platform"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)

    # Example: "LinkedIn", "Internshala", "CompanyATS"
    platform_name: str = Field(index=True, nullable=False)

    # Ye woh URL hai jahan user apne applied jobs/status dekhta hai
    applied_list_url: str = Field(nullable=False)

    is_active: bool = Field(default=True, nullable=False)
    last_checked_at: Optional[datetime] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
