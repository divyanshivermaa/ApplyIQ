from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session
from app.api.schemas.status_scan import StatusScanSubmitRequest, StatusScanSubmitResult
from app.services.status_scan_service import StatusScanService

router = APIRouter(prefix="/status-scan", tags=["Status Scan"])


@router.post("/submit", response_model=StatusScanSubmitResult)
def submit_status_scan(
    payload: StatusScanSubmitRequest,
    session: Session = Depends(get_session),
) -> StatusScanSubmitResult:
    return StatusScanService(session).submit_scan(payload)
