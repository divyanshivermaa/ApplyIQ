from typing import Optional


def _contains_any(text: str, words: list[str]) -> bool:
    return any(word in text for word in words)


def analyze_signal_text(raw_text: str) -> Optional[dict]:
    text = (raw_text or "").strip().lower()

    if not text:
        return None

    rejection_words = [
        "unfortunately",
        "not moving forward",
        "not selected",
        "rejected",
        "regret to inform",
        "we will not proceed",
        "we won't be moving forward",
        "application was not selected",
    ]

    offer_words = [
        "congratulations",
        "pleased to offer",
        "offer letter",
        "selected for the role",
        "welcome aboard",
        "job offer",
        "we are delighted to offer",
    ]

    interview_words = [
        "interview",
        "schedule interview",
        "next round",
        "shortlisted",
        "technical round",
        "discussion with team",
        "interview round",
        "hr round",
    ]

    oa_words = [
        "assessment",
        "online assessment",
        "coding round",
        "hackerrank",
        "oa link",
        "test link",
        "complete the assessment",
        "online test",
    ]

    if _contains_any(text, rejection_words):
        return {
            "suggested_stage": "REJECTED",
            "confidence": 90,
            "explanation": "Detected strong rejection-related keywords in the submitted signal.",
        }

    if _contains_any(text, offer_words):
        return {
            "suggested_stage": "OFFERED",
            "confidence": 90,
            "explanation": "Detected strong offer-related keywords in the submitted signal.",
        }

    if _contains_any(text, interview_words):
        return {
            "suggested_stage": "INTERVIEW",
            "confidence": 80,
            "explanation": "Detected interview-related keywords in the submitted signal.",
        }

    if _contains_any(text, oa_words):
        return {
            "suggested_stage": "OA",
            "confidence": 80,
            "explanation": "Detected assessment-related keywords in the submitted signal.",
        }

    return None
