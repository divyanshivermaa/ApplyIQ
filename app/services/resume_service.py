from sqlmodel import Session

from app.repositories.resume_repository import ResumeRepository


class ResumeService:
    def __init__(self, session: Session):
        self.repo = ResumeRepository(session)

    def list_resumes(self, user_id: int):
        return self.repo.list_for_user(user_id)

    def seed_default(self, user_id: int):
        created = []
        for slot in [1, 2, 3]:
            existing = self.repo.get_by_slot(user_id, slot)
            if not existing:
                created.append(self.repo.create(user_id, slot, f"Resume {slot}"))
        return created
