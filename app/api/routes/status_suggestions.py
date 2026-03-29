from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import Session, select

from app.core.deps import get_session, get_current_user
from app.api.schemas.status_suggestions import SuggestionActionResponse, SignalSuggestionRequest
from app.api.schemas.status_suggestions_expand import StatusSuggestionExpanded
from app.services.status_suggestion_service import StatusSuggestionService
from app.models.application import Application
from app.models.status_suggestion import StatusSuggestion
from app.services.suggestion_engine import analyze_signal_text

router = APIRouter(prefix="/status-suggestions", tags=["Status Suggestions"])


@router.get("/pending")
def list_pending_suggestions(
    limit: int = 50,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    return StatusSuggestionService(session).list_pending(user_id=current_user.id, limit=limit)


@router.get("/pending-expanded", response_model=List[StatusSuggestionExpanded])
def list_pending_suggestions_expanded(
    limit: int = 50,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    return StatusSuggestionService(session).list_pending_expanded(user_id=current_user.id, limit=limit)


@router.post("/{suggestion_id}/confirm", response_model=SuggestionActionResponse)
def confirm_suggestion(
    suggestion_id: int,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
) -> SuggestionActionResponse:
    try:
        prev, new, applied_stage = StatusSuggestionService(session).confirm(
            user_id=current_user.id,
            suggestion_id=suggestion_id,
        )
        return SuggestionActionResponse(
            suggestion_id=suggestion_id,
            previous_status=prev,
            new_status=new,
            applied_stage=applied_stage,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{suggestion_id}/dismiss", response_model=SuggestionActionResponse)
def dismiss_suggestion(
    suggestion_id: int,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
) -> SuggestionActionResponse:
    try:
        prev, new, _ = StatusSuggestionService(session).dismiss(
            user_id=current_user.id,
            suggestion_id=suggestion_id,
        )
        return SuggestionActionResponse(
            suggestion_id=suggestion_id,
            previous_status=prev,
            new_status=new,
            applied_stage=None,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/from-signal")
def create_suggestion_from_signal(
    payload: SignalSuggestionRequest,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    app = session.exec(
        select(Application).where(
            Application.id == payload.application_id,
            Application.user_id == current_user.id,
        )
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    result = analyze_signal_text(payload.raw_text)
    if not result:
        return {
            "created": False,
            "message": "No actionable suggestion detected from the submitted signal.",
        }

    existing = session.exec(
        select(StatusSuggestion).where(
            StatusSuggestion.application_id == app.id,
            StatusSuggestion.suggested_stage == result["suggested_stage"],
            StatusSuggestion.status == "PENDING",
        )
    ).first()

    if existing:
        return {
            "created": False,
            "message": "A similar pending suggestion already exists.",
        }

    suggestion = StatusSuggestion(
        user_id=current_user.id,
        application_id=app.id,
        suggested_stage=result["suggested_stage"],
        confidence=result["confidence"],
        explanation=result["explanation"],
        source_type=payload.source_type.upper(),
        status="PENDING",
        created_at=datetime.now(timezone.utc),
    )

    session.add(suggestion)
    session.commit()
    session.refresh(suggestion)

    return {
        "created": True,
        "suggestion_id": suggestion.id,
        "suggested_stage": suggestion.suggested_stage,
        "confidence": suggestion.confidence,
        "message": "Suggestion created successfully.",
    }
