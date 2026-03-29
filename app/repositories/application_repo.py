from datetime import datetime
from sqlmodel import Session, select, delete
from app.models.application import Application
from app.models.application_stage import ApplicationStage
from app.models.resume import Resume

class ApplicationRepository:
    def create_application(self, session: Session, app_obj: Application) -> Application:
        # Application ko DB me save kar rahe hain
        session.add(app_obj)
        session.commit()
        session.refresh(app_obj)
        return app_obj

    def add_stage(self, session: Session, stage_obj: ApplicationStage) -> ApplicationStage:
        # Stage history me ek naya row add kar rahe hain (purana delete/update nahi)
        session.add(stage_obj)
        session.commit()
        session.refresh(stage_obj)
        return stage_obj

    def get_by_id(self, session: Session, app_id: int) -> Application | None:
        # Application id se record nikaal rahe hain
        stmt = select(Application).where(Application.id == app_id)
        return session.exec(stmt).first()

    def list_for_user(self, session: Session, user_id: int) -> list[Application]:
        # User ke saare applications list kar rahe hain
        stmt = select(Application).where(Application.user_id == user_id).order_by(Application.created_at.desc())
        return list(session.exec(stmt).all())

    def get_by_user_and_url(self, session: Session, user_id: int, job_url: str) -> Application | None:
        # Duplicate application avoid karne ke liye user_id + job_url check
        stmt = select(Application).where(Application.user_id == user_id, Application.job_url == job_url)
        return session.exec(stmt).first()

    def update_current_stage(self, session: Session, app_obj: Application, new_stage: str) -> Application:
        # Current stage field ko latest stage pe set kar rahe hain
        app_obj.current_stage = new_stage
        session.add(app_obj)
        session.commit()
        session.refresh(app_obj)
        return app_obj

    def update_application(self, session: Session, app_obj: Application) -> Application:
        session.add(app_obj)
        session.commit()
        session.refresh(app_obj)
        return app_obj

    def get_resume_by_id_and_user(self, session: Session, resume_id: int, user_id: int) -> Resume | None:
        # Check if resume exists and belongs to the user
        stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        return session.exec(stmt).first()

    def delete_application(self, session: Session, app_id: int) -> None:
        # Delete stages first to avoid FK constraint issues
        session.exec(delete(ApplicationStage).where(ApplicationStage.application_id == app_id))
        session.exec(delete(Application).where(Application.id == app_id))
        session.commit()
