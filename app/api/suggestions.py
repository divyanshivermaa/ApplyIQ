from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user
from app.api.schemas.status_suggestions import SuggestionActionResponse
from app.services.status_suggestion_service import StatusSuggestionService

router = APIRouter(prefix="/suggestions", tags=["suggestions"], include_in_schema=False)


@router.get("")
def list_pending(
    limit: int = 50,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    return StatusSuggestionService(session).list_pending(user_id=current_user.id, limit=limit)


@router.post("/{suggestion_id}/confirm", response_model=SuggestionActionResponse)
def confirm(
    suggestion_id: int,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
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
def dismiss(
    suggestion_id: int,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
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
