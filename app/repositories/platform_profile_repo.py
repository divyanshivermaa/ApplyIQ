from sqlmodel import Session, select
from app.models.platform_profile import PlatformProfile

class PlatformProfileRepository:
    def list_active_by_user(self, session: Session, user_id: int) -> list[PlatformProfile]:
        # User ke saare active platform profiles nikalna
        stmt = select(PlatformProfile).where(
            PlatformProfile.user_id == user_id,
            PlatformProfile.is_active == True
        )
        return list(session.exec(stmt).all())

    def update_last_checked(self, session: Session, profile: PlatformProfile):
        # Last checked timestamp update karna
        from datetime import datetime
        profile.last_checked_at = datetime.utcnow()
        session.add(profile)
        session.commit()
        session.refresh(profile)
