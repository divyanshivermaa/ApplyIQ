from typing import Literal

ConfidenceLabel = Literal["HIGH", "MEDIUM", "LOW"]


def confidence_label_to_score(label: ConfidenceLabel) -> int:
    """
    Convert extension label to DB score (0-100).
    Deterministic mapping.
    """
    if label == "HIGH":
        return 90
    if label == "MEDIUM":
        return 60
    return 30
