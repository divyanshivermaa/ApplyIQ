from datetime import date
from sqlmodel import Session
from sqlalchemy import text

class ScoringService:
    def chance_score(self, session: Session, user_id: int, application_id: int) -> dict:
        # DB se basic fields nikal rahe hain
        q = text("""
            SELECT id, user_id, current_stage, date_applied, platform, company_type, role_category
            FROM application
            WHERE id = :app_id
        """)
        # Using execute instead of exec to avoid TypeError with parameters
        row = session.execute(q, {"app_id": application_id}).first()
        if not row:
            raise ValueError("Application not found")

        app = dict(row._mapping)
        if app["user_id"] != user_id:
            raise ValueError("Application not found")

        current_stage = (app["current_stage"] or "CAPTURED").upper()

        # Days since applied
        days_since_applied = None
        if app["date_applied"]:
            days_since_applied = (date.today() - app["date_applied"]).days

        # Historical avg response days for same platform/company_type/role_category
        avg_q = text("""
            WITH applied AS (
              SELECT application_id, MIN(timestamp) AS applied_ts
              FROM applicationstage
              WHERE stage = 'APPLIED'
              GROUP BY application_id
            ),
            first_response AS (
              SELECT application_id, MIN(timestamp) AS resp_ts
              FROM applicationstage
              WHERE stage IN ('OA','INTERVIEW','OFFER','REJECTED')
              GROUP BY application_id
            ),
            diffs AS (
              SELECT
                a.platform, a.company_type, a.role_category,
                EXTRACT(EPOCH FROM (fr.resp_ts - ap.applied_ts)) / 86400.0 AS days_to_response
              FROM applied ap
              JOIN first_response fr ON fr.application_id = ap.application_id
              JOIN application a ON a.id = ap.application_id
              WHERE a.user_id = :user_id
                AND fr.resp_ts >= ap.applied_ts
            )
            SELECT ROUND(AVG(days_to_response)::numeric, 2) AS avg_days
            FROM diffs
            WHERE COALESCE(platform,'') = COALESCE(:platform,'')
              AND COALESCE(company_type,'') = COALESCE(:company_type,'')
              AND COALESCE(role_category,'') = COALESCE(:role_category,'')
        """)
        # Using execute instead of exec to avoid TypeError with parameters
        avg_row = session.execute(avg_q, {
            "user_id": user_id,
            "platform": app["platform"],
            "company_type": app["company_type"],
            "role_category": app["role_category"],
        }).first()

        avg_days = None
        if avg_row:
            avg_days = dict(avg_row._mapping).get("avg_days")

        # Overdue rule (deterministic)
        overdue = False
        if days_since_applied is not None:
            # Agar avg_days nahi mila to default baseline 10 days le rahe hain
            baseline = float(avg_days) if avg_days is not None else 10.0
            overdue = days_since_applied > baseline

        # Scoring rules (simple v1)
        # High: already progressed (OA/Interview/Offer)
        if current_stage in {"OA", "INTERVIEW", "OFFER"}:
            level = "HIGH"
            explanation = f"Current stage is {current_stage}, so your application has already progressed."
        # Low: rejected/ghosted
        elif current_stage in {"REJECTED", "GHOSTED"}:
            level = "LOW"
            explanation = f"Current stage is {current_stage}, so chances of further progress are low."
        else:
            # Applied/Captured
            if overdue and days_since_applied is not None:
                level = "LOW"
                explanation = (
                    f"It has been {days_since_applied} days since you applied, "
                    f"which is higher than your typical response baseline ({avg_days or 10} days)."
                )
            else:
                level = "MEDIUM"
                if days_since_applied is None:
                    explanation = "Application is not rejected, but date_applied is missing so timeline signals are limited."
                else:
                    explanation = f"It has been {days_since_applied} days since you applied; no rejection signal yet."

        return {
            "application_id": application_id,
            "level": level,
            "explanation": explanation,
            "signals": {
                "current_stage": current_stage,
                "days_since_applied": days_since_applied,
                "avg_response_days_baseline": float(avg_days) if avg_days is not None else None,
                "overdue": overdue,
            },
        }
