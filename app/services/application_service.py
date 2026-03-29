from datetime import datetime, date
from sqlmodel import Session
from app.models.application import Application
from app.models.application_stage import ApplicationStage
from app.repositories.application_repo import ApplicationRepository
from app.repositories.resume_repository import ResumeRepository

ALLOWED_STAGES = {"CAPTURED", "APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED", "GHOSTED"}

class ApplicationService:
    def __init__(self):
        self.repo = ApplicationRepository()

    def create_application(
        self,
        session: Session,
        user_id: int,
        payload: dict,
    ) -> Application:
        # Job URL duplicate na ho isliye check kar rahe hain
        existing = self.repo.get_by_user_and_url(session, user_id, payload["job_url"])
        if existing:
            raise ValueError("Application already exists for this job URL")

        # Default stage CAPTURED rakhenge (extension capture ke time)
        stage = payload.get("current_stage") or "CAPTURED"
        if stage not in ALLOWED_STAGES:
            raise ValueError("Invalid stage")

        # Resume validation (if provided)
        resume_id = payload.get("resume_id")
        if resume_id:
            resume = self.repo.get_resume_by_id_and_user(session, resume_id, user_id)
            if not resume:
                raise ValueError(f"Invalid resume_id: {resume_id}")

        resume_slot = payload.get("resume_slot")
        if resume_slot is not None:
            if resume_slot not in (1, 2, 3):
                raise ValueError("resume_slot must be 1, 2, or 3")

        # Application object create
        app_obj = Application(
            user_id=user_id,
            company_name=payload["company_name"],
            role_title=payload["role_title"],
            job_url=payload["job_url"],
            platform=payload.get("platform"),
            location=payload.get("location"),
            job_type=payload.get("job_type"),
            company_type=payload.get("company_type"),
            role_category=payload.get("role_category"),
            resume_id=resume_id,
            date_applied=payload.get("date_applied"),
            current_stage=stage,
        )

        created = self.repo.create_application(session, app_obj)

        # History ke liye first stage bhi add kar rahe hain (analytics ke liye best)
        stage_obj = ApplicationStage(
            application_id=created.id,
            stage=stage,
            timestamp=datetime.utcnow(),
        )
        self.repo.add_stage(session, stage_obj)

        return created

    def add_stage(
        self,
        session: Session,
        user_id: int,
        app_id: int,
        new_stage: str,
    ) -> ApplicationStage:
        # App exist kare + user ka hi ho (security)
        app_obj = self.repo.get_by_id(session, app_id)
        if not app_obj or app_obj.user_id != user_id:
            raise ValueError("Application not found")

        if new_stage not in ALLOWED_STAGES:
            raise ValueError("Invalid stage")

        # Stage history me append-only row add
        stage_obj = ApplicationStage(
            application_id=app_id,
            stage=new_stage,
            timestamp=datetime.utcnow(),
        )
        created_stage = self.repo.add_stage(session, stage_obj)

        # Application ka current_stage update (latest snapshot)
        self.repo.update_current_stage(session, app_obj, new_stage)

        return created_stage

    def list_applications(self, session: Session, user_id: int) -> list[Application]:
        return self.repo.list_for_user(session, user_id)

    def delete_application(self, session: Session, user_id: int, app_id: int) -> None:
        app_obj = self.repo.get_by_id(session, app_id)
        if not app_obj or app_obj.user_id != user_id:
            raise ValueError("Application not found")
        self.repo.delete_application(session, app_id)

    def update_application(self, session: Session, user_id: int, app_id: int, payload: dict) -> Application:
        app_obj = self.repo.get_by_id(session, app_id)
        if not app_obj or app_obj.user_id != user_id:
            raise ValueError("Application not found")

        # If job_url is being changed, ensure no duplicate for this user
        if "job_url" in payload and payload["job_url"]:
            existing = self.repo.get_by_user_and_url(session, user_id, payload["job_url"])
            if existing and existing.id != app_id:
                raise ValueError("Application already exists for this job URL")

        # Resume slot handling (optional)
        if "resume_slot" in payload:
            resume_slot = payload.get("resume_slot")
            if resume_slot in ("", None):
                app_obj.resume_id = None
            else:
                if resume_slot not in (1, 2, 3):
                    raise ValueError("resume_slot must be 1, 2, or 3")
                resume_repo = ResumeRepository(session)
                resume_row = resume_repo.get_by_slot(user_id, resume_slot)
                if not resume_row:
                    raise ValueError(f"No resume found for slot {resume_slot}. Run POST /resumes/seed first.")
                app_obj.resume_id = resume_row.id

        # Stage update (optional)
        if "current_stage" in payload and payload["current_stage"]:
            new_stage = payload["current_stage"]
            if new_stage not in ALLOWED_STAGES:
                raise ValueError("Invalid stage")
            if app_obj.current_stage != new_stage:
                stage_obj = ApplicationStage(
                    application_id=app_obj.id,
                    stage=new_stage,
                    timestamp=datetime.utcnow(),
                )
                self.repo.add_stage(session, stage_obj)
                app_obj.current_stage = new_stage

        # Simple field updates
        for field in [
            "company_name",
            "role_title",
            "platform",
            "job_url",
            "location",
            "job_type",
            "company_type",
            "role_category",
            "date_applied",
        ]:
            if field in payload:
                setattr(app_obj, field, payload[field])

        return self.repo.update_application(session, app_obj)
