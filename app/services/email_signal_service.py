from sqlmodel import Session

from app.api.schemas.email_signal import EmailSignalSubmitRequest, EmailSignalSubmitResult
from app.models.status_suggestion import StatusSuggestion
from app.repositories.email_signal_repository import EmailSignalRepository
from app.services.status_confidence import confidence_label_to_score
from app.services.status_scan_mapper import map_status_text_to_stage


class EmailSignalService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = EmailSignalRepository(session)

    def submit(self, payload: EmailSignalSubmitRequest) -> EmailSignalSubmitResult:
        inserted = 0
        matched = 0
        unmapped = 0
        unmatched = 0

        for sig in payload.signals:
            combined_text = (sig.subject or "") + " " + (sig.snippet or "")
            mapped = map_status_text_to_stage(combined_text)
            if mapped is None:
                unmapped += 1
                continue

            app = None

            if sig.job_url_hint:
                app = self.repo.find_application_by_job_url(sig.job_url_hint)

            if app is None and sig.platform_hint and sig.company_hint and sig.role_hint:
                app = self.repo.find_application_fallback(
                    platform=sig.platform_hint,
                    company_name=sig.company_hint,
                    role_title=sig.role_hint,
                )

            if app is None:
                unmatched += 1
                continue

            matched += 1
            score = confidence_label_to_score(sig.confidence)

            suggestion = StatusSuggestion(
                user_id=app.user_id,
                application_id=app.id,
                suggested_stage=mapped.suggested_stage,
                confidence=score,
                explanation=mapped.explanation,
                source_type="EMAIL",
                status="PENDING",
            )

            self.session.add(suggestion)
            inserted += 1

        self.session.commit()

        return EmailSignalSubmitResult(
            total_received=len(payload.signals),
            matched=matched,
            inserted=inserted,
            unmapped=unmapped,
            unmatched=unmatched,
        )
