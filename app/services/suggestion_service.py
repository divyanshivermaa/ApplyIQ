from sqlmodel import Session
from app.repositories.suggestion_repo import SuggestionRepository
from app.repositories.application_repo import ApplicationRepository
from app.models.application_stage import ApplicationStage
from datetime import datetime

ALLOWED_STAGES = {"CAPTURED", "APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED", "GHOSTED"}

class SuggestionService:
    def __init__(self):
        self.s_repo = SuggestionRepository()
        self.a_repo = ApplicationRepository()

    def list_pending(self, session: Session, user_id: int):
        return self.s_repo.list_pending(session, user_id)

    def confirm(self, session: Session, user_id: int, suggestion_id: int):
        # Suggestion exist kare + user ka hi ho
        s = self.s_repo.get_by_id(session, suggestion_id)
        if not s or s.user_id != user_id:
            raise ValueError("Suggestion not found")

        if s.status != "PENDING":
            raise ValueError("Suggestion already reviewed")

        # Stage validate
        if s.suggested_stage not in ALLOWED_STAGES:
            raise ValueError("Invalid stage in suggestion")

        # Application verify
        app_obj = self.a_repo.get_by_id(session, s.application_id)
        if not app_obj or app_obj.user_id != user_id:
            raise ValueError("Application not found")

        # 1) Stage history me append-only row add
        stage_row = ApplicationStage(
            application_id=app_obj.id,
            stage=s.suggested_stage,
            timestamp=datetime.utcnow(),
        )
        self.a_repo.add_stage(session, stage_row)

        # 2) Snapshot current_stage update
        self.a_repo.update_current_stage(session, app_obj, s.suggested_stage)

        # 3) Suggestion mark confirmed
        self.s_repo.mark_confirmed(session, s)

        return {"ok": True, "application_id": app_obj.id, "new_stage": s.suggested_stage}

    def dismiss(self, session: Session, user_id: int, suggestion_id: int):
        s = self.s_repo.get_by_id(session, suggestion_id)
        if not s or s.user_id != user_id:
            raise ValueError("Suggestion not found")

        if s.status != "PENDING":
            raise ValueError("Suggestion already reviewed")

        self.s_repo.mark_dismissed(session, s)
        return {"ok": True}
