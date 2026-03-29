from sqlmodel import Session, select

from app.models.resume import Resume


class ResumeRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_for_user(self, user_id: int):
        stmt = select(Resume).where(Resume.user_id == user_id).order_by(Resume.slot.asc())
        return self.session.exec(stmt).all()

    def get_by_slot(self, user_id: int, slot: int):
        stmt = select(Resume).where(Resume.user_id == user_id, Resume.slot == slot)
        return self.session.exec(stmt).first()

    def get_by_id(self, user_id: int, resume_id: int):
        stmt = select(Resume).where(Resume.user_id == user_id, Resume.id == resume_id)
        return self.session.exec(stmt).first()

    def create(self, user_id: int, slot: int, name: str):
        r = Resume(user_id=user_id, slot=slot, name=name)
        self.session.add(r)
        self.session.commit()
        self.session.refresh(r)
        return r
