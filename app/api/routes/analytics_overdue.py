from fastapi import APIRouter, Depends
from sqlmodel import Session
from sqlalchemy import text

from app.db.session import get_session
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overdue")
def overdue_analytics(
    session: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    # Total overdue
    q_total = text("""
        SELECT COUNT(*) AS total_overdue
        FROM application
        WHERE user_id = :user_id
          AND is_overdue = TRUE
    """)

    total_row = session.execute(q_total, {"user_id": user.id}).mappings().first()
    total_overdue = int(total_row["total_overdue"]) if total_row else 0

    # Overdue by platform
    q_platform = text("""
        SELECT platform, COUNT(*) AS cnt
        FROM application
        WHERE user_id = :user_id
          AND is_overdue = TRUE
        GROUP BY platform
        ORDER BY cnt DESC
    """)

    platform_rows = session.execute(q_platform, {"user_id": user.id}).mappings().all()
    overdue_by_platform = [
        {"platform": r["platform"], "count": int(r["cnt"])}
        for r in platform_rows
    ]

    return {
        "total_overdue": total_overdue,
        "overdue_by_platform": overdue_by_platform,
    }
