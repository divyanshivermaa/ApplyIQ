from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db.session import get_session
from app.api.deps import get_current_user
from app.models.platform_profile import PlatformProfile

router = APIRouter(prefix="/platforms", tags=["platforms"])

class PlatformUpsertRequest(BaseModel):
    platform_name: str
    applied_list_url: str
    is_active: bool = True

@router.post("")
def upsert_platform_profile(
    payload: PlatformUpsertRequest,
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    # Same platform ke liye same user ka record update/create karna hai
    stmt = select(PlatformProfile).where(
        PlatformProfile.user_id == user.id,
        PlatformProfile.platform_name == payload.platform_name,
    )
    existing = session.exec(stmt).first()

    if existing:
        existing.applied_list_url = payload.applied_list_url
        existing.is_active = payload.is_active
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    obj = PlatformProfile(
        user_id=user.id,
        platform_name=payload.platform_name,
        applied_list_url=payload.applied_list_url,
        is_active=payload.is_active,
    )
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

@router.get("")
def list_platform_profiles(
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    stmt = select(PlatformProfile).where(PlatformProfile.user_id == user.id)
    return list(session.exec(stmt).all())
