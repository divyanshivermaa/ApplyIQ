from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user
from app.services.application_service import ApplicationService
from app.repositories.resume_repository import ResumeRepository
from app.models.application import Application

router = APIRouter(prefix="/applications", tags=["applications"])
service = ApplicationService()

class ApplicationCreateRequest(BaseModel):
    company_name: str
    role_title: str
    job_url: str  # HttpUrl strict bhi kar sakte, abhi string rakhenge extension safety ke liye
    platform: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    company_type: Optional[str] = None
    role_category: Optional[str] = None
    resume_id: Optional[int] = None
    resume_slot: Optional[int] = None
    date_applied: Optional[date] = None
    current_stage: Optional[str] = None  # default CAPTURED in service

class StageAddRequest(BaseModel):
    stage: str

class ApplicationOut(BaseModel):
    id: int
    user_id: int
    company_name: str
    role_title: str
    job_url: str
    platform: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    company_type: Optional[str] = None
    role_category: Optional[str] = None
    resume_id: Optional[int] = None
    resume_slot: Optional[int] = None
    date_applied: Optional[date] = None
    current_stage: str
    is_overdue: bool
    overdue_at: Optional[datetime] = None
    overdue_baseline_days: Optional[int] = None
    created_at: datetime

class ApplicationUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    role_title: Optional[str] = None
    job_url: Optional[str] = None
    platform: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    company_type: Optional[str] = None
    role_category: Optional[str] = None
    resume_slot: Optional[int] = None
    date_applied: Optional[date] = None
    current_stage: Optional[str] = None

def _attach_resume_slot(app: Application, session: Session, user_id: int) -> dict:
    data = app.model_dump()
    if app.resume_id:
        repo = ResumeRepository(session)
        resume = repo.get_by_id(user_id, app.resume_id)
        data["resume_slot"] = resume.slot if resume else None
    else:
        data["resume_slot"] = None
    return data

@router.post("", response_model=ApplicationOut)
def create_application(
    payload: ApplicationCreateRequest,
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    try:
        data = payload.model_dump()
        resolved_resume_id = payload.resume_id

        if resolved_resume_id is None and payload.resume_slot is not None:
            if payload.resume_slot not in (1, 2, 3):
                raise HTTPException(status_code=400, detail="resume_slot must be 1, 2, or 3")

            resume_repo = ResumeRepository(session)
            resume_row = resume_repo.get_by_slot(user.id, payload.resume_slot)
            if not resume_row:
                raise HTTPException(
                    status_code=400,
                    detail=f"No resume found for slot {payload.resume_slot}. Run POST /resumes/seed first.",
                )
            resolved_resume_id = resume_row.id

        data["resume_id"] = resolved_resume_id
        created = service.create_application(session, user.id, data)
        return _attach_resume_slot(created, session, user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[ApplicationOut])
def list_applications(
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    apps = service.list_applications(session, user.id)
    return [_attach_resume_slot(a, session, user.id) for a in apps]

@router.post("/{app_id}/stages")
def add_stage(
    app_id: int,
    payload: StageAddRequest,
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    try:
        stage_obj = service.add_stage(session, user.id, app_id, payload.stage)
        return stage_obj
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{app_id}")
def delete_application(
    app_id: int,
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    try:
        service.delete_application(session, user.id, app_id)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{app_id}", response_model=ApplicationOut)
def update_application(
    app_id: int,
    payload: ApplicationUpdateRequest,
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    try:
        data = payload.model_dump(exclude_unset=True)
        updated = service.update_application(session, user.id, app_id, data)
        return _attach_resume_slot(updated, session, user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
