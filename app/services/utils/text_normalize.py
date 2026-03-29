import re

_whitespace = re.compile(r"\s+")
_non_alnum = re.compile(r"[^a-z0-9\s]+")


def normalize_text(s: str) -> str:
    """
    Deterministic normalizer:
    - lower
    - remove punctuation
    - collapse spaces
    """
    s = (s or "").strip().lower()
    s = _non_alnum.sub(" ", s)
    s = _whitespace.sub(" ", s).strip()
    return s


def normalize_url(url: str) -> str:
    """
    Simple deterministic URL normalization.
    """
    u = (url or "").strip()
    if u.endswith("/"):
        u = u[:-1]
    return u
