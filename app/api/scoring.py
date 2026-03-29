from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user
from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/scoring", tags=["scoring"])
service = ScoringService()

@router.get("/applications/{application_id}/chance")
def chance(application_id: int, session: Session = Depends(get_session), user=Depends(get_current_user)):
    try:
        return service.chance_score(session, user.id, application_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
