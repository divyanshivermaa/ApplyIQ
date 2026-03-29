from typing import List
from sqlmodel import Session

from app.api.schemas.status_scan import StatusScanSubmitRequest, StatusScanItem, StatusScanSubmitResult
from app.repositories.status_scan_repository import StatusScanRepository
from app.services.status_scan_mapper import map_status_text_to_stage
from app.services.status_confidence import confidence_label_to_score
from app.models.status_suggestion import StatusSuggestion


class StatusScanService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = StatusScanRepository(session)

    def submit_scan(self, payload: StatusScanSubmitRequest) -> StatusScanSubmitResult:
        inserted = 0
        matched = 0

        unmatched_items: List[StatusScanItem] = []
        unmapped_items: List[StatusScanItem] = []

        for item in payload.scanned_items:
            mapped = map_status_text_to_stage(item.status_text)
            if mapped is None:
                unmapped_items.append(item)
                continue

            app = None
            if item.job_url:
                app = self.repo.find_application_by_job_url(item.job_url)

            if app is None:
                app = self.repo.find_application_fallback(
                    platform=payload.platform,
                    company_name=item.company_name,
                    role_title=item.role_title,
                )

            if app is None:
                unmatched_items.append(item)
                continue

            matched += 1
            score = confidence_label_to_score(item.confidence)

            suggestion = StatusSuggestion(
                user_id=app.user_id,
                application_id=app.id,
                suggested_stage=mapped.suggested_stage,
                confidence=score,
                explanation=mapped.explanation,
                source_type="PORTAL",
                status="PENDING",
            )

            self.session.add(suggestion)
            inserted += 1

        self.session.commit()

        return StatusScanSubmitResult(
            total_received=len(payload.scanned_items),
            matched=matched,
            inserted=inserted,
            unmapped=len(unmapped_items),
            unmatched=len(unmatched_items),
            unmatched_items=unmatched_items,
            unmapped_items=unmapped_items,
        )
