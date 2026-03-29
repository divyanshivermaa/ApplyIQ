from typing import Optional
from sqlmodel import Session, select
from app.services.utils.text_normalize import normalize_text, normalize_url
from app.models.application import Application


class StatusScanRepository:
    def __init__(self, session: Session):
        self.session = session

    def find_application_by_job_url(self, job_url: str) -> Optional[Application]:
        u = normalize_url(job_url)
        if not u:
            return None
        stmt = select(Application).where(Application.job_url == u)
        return self.session.exec(stmt).first()

    def find_application_fallback(
        self,
        platform: str,
        company_name: str,
        role_title: str,
    ) -> Optional[Application]:
        p = normalize_text(platform)
        c = normalize_text(company_name)
        r = normalize_text(role_title)

        stmt = select(Application).where(Application.platform == p)
        candidates = self.session.exec(stmt).all()

        for app in candidates:
            if normalize_text(app.company_name) == c and normalize_text(app.role_title) == r:
                return app

        return None
