from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.followup_suggestion import FollowUpSuggestion

router = APIRouter(prefix="/followups", tags=["followups"])


@router.get("/pending")
def get_pending_followups(
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    # user के pending followups वापस कर रहे हैं
    stmt = (
        select(FollowUpSuggestion)
        .where(FollowUpSuggestion.user_id == user.id)
        .where(FollowUpSuggestion.status == "PENDING")
        .order_by(FollowUpSuggestion.created_at.desc())
    )
    return list(session.exec(stmt).all())


@router.post("/{followup_id}/dismiss")
def dismiss_followup(
    followup_id: int,
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    # suggestion dismiss कर रहे हैं
    s = session.get(FollowUpSuggestion, followup_id)
    if not s or s.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")

    s.status = "DISMISSED"
    s.resolved_at = datetime.utcnow()
    session.add(s)
    session.commit()
    session.refresh(s)
    return s


@router.post("/{followup_id}/done")
def mark_followup_done(
    followup_id: int,
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    # suggestion done mark कर रहे हैं
    s = session.get(FollowUpSuggestion, followup_id)
    if not s or s.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")

    s.status = "DONE"
    s.resolved_at = datetime.utcnow()
    session.add(s)
    session.commit()
    session.refresh(s)
    return s
