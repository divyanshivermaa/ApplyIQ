from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.schemas.email_signal import EmailSignalSubmitRequest, EmailSignalSubmitResult
from app.db.session import get_session
from app.services.email_signal_service import EmailSignalService

router = APIRouter(prefix="/email-signal", tags=["Email Signal"])


@router.post("/submit", response_model=EmailSignalSubmitResult)
def submit_email_signal(
    payload: EmailSignalSubmitRequest,
    session: Session = Depends(get_session),
) -> EmailSignalSubmitResult:
    return EmailSignalService(session).submit(payload)
