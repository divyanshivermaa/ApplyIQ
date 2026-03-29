from dataclasses import dataclass
from typing import Optional
from app.services.utils.text_normalize import normalize_text


@dataclass(frozen=True)
class StageMapResult:
    suggested_stage: str
    explanation: str


def map_status_text_to_stage(status_text: str) -> Optional[StageMapResult]:
    """
    Deterministic mapping.
    """
    t = normalize_text(status_text)

    rules: list[tuple[str, str, str]] = [
        ("we regret", "REJECTED", "Matched phrase 'we regret' in status_text"),
        ("unfortunately", "REJECTED", "Matched keyword 'unfortunately' in status_text"),
        ("not selected", "REJECTED", "Matched phrase 'not selected' in status_text"),
        ("rejected", "REJECTED", "Matched keyword 'rejected' in status_text"),
        ("offer", "OFFER", "Matched keyword 'offer' in status_text"),
        ("selected", "OFFER", "Matched keyword 'selected' in status_text"),
        ("interview scheduled", "INTERVIEW", "Matched phrase 'interview scheduled' in status_text"),
        ("interview invitation", "INTERVIEW", "Matched phrase 'interview invitation' in status_text"),
        ("interview", "INTERVIEW", "Matched keyword 'interview' in status_text"),
        ("assessment link", "OA", "Matched phrase 'assessment link' in status_text"),
        ("online test", "OA", "Matched phrase 'online test' in status_text"),
        ("assessment", "OA", "Matched keyword 'assessment' in status_text"),
        ("test", "OA", "Matched keyword 'test' in status_text"),
        ("shortlisted", "INTERVIEW", "Matched keyword 'shortlisted' in status_text"),
        ("under review", "APPLIED", "Matched phrase 'under review' in status_text"),
        ("in review", "APPLIED", "Matched phrase 'in review' in status_text"),
        ("application received", "APPLIED", "Matched phrase 'application received' in status_text"),
        ("submitted", "APPLIED", "Matched keyword 'submitted' in status_text"),
    ]

    for needle, stage, why in rules:
        if needle in t:
            return StageMapResult(suggested_stage=stage, explanation=why)

    return None
