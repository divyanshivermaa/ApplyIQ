from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.get("")
def list_resumes(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    return ResumeService(session).list_resumes(current_user.id)


@router.post("/seed")
def seed_resumes(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    created = ResumeService(session).seed_default(current_user.id)
    return {"created": [r.id for r in created]}
