# Default baseline response days (deterministic fallback)
DEFAULT_BASELINE_DAYS = 14

# Terminal stages -> never overdue
TERMINAL_STAGES = {
    "REJECTED",
    "OFFER",
    "HIRED",
    "WITHDRAWN",
}

# Stages we consider "waiting for response"
OVERDUE_ELIGIBLE_STAGES = {
    "APPLIED",
    "ASSESSMENT",
    "OA",
    "SCREENING",
}
