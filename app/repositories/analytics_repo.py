from sqlmodel import Session
from sqlalchemy import text

class AnalyticsRepository:
    def funnel_counts(self, session: Session, user_id: int) -> dict:
        # Yaha har stage ka count nikal rahe hain (funnel view ke liye)
        q = text("""
            SELECT
              COUNT(*) FILTER (WHERE a.current_stage = 'CAPTURED')  AS captured,
              COUNT(*) FILTER (WHERE a.current_stage = 'APPLIED')   AS applied,
              COUNT(*) FILTER (WHERE a.current_stage = 'OA')        AS oa,
              COUNT(*) FILTER (WHERE a.current_stage = 'INTERVIEW') AS interview,
              COUNT(*) FILTER (WHERE a.current_stage = 'OFFER')     AS offer,
              COUNT(*) FILTER (WHERE a.current_stage = 'REJECTED')  AS rejected,
              COUNT(*) FILTER (WHERE a.current_stage = 'GHOSTED')   AS ghosted
            FROM application a
            WHERE a.user_id = :user_id
        """)
        row = session.execute(q, {"user_id": user_id}).one()
        return dict(row._mapping)

    def resume_performance(self, session: Session, user_id: int) -> list[dict]:
        # Resume slot wise performance (stable: per-user slot 1/2/3)
        q = text("""
            SELECT
              r.slot AS resume_slot,
              r.version_label AS resume_version,
              COUNT(*) AS total_apps,
              SUM(CASE WHEN a.current_stage IN ('SHORTLISTED','ASSESSMENT','INTERVIEW','OFFER','REJECTED') THEN 1 ELSE 0 END) AS progressed,
              SUM(CASE WHEN a.current_stage = 'INTERVIEW' THEN 1 ELSE 0 END) AS interviews,
              SUM(CASE WHEN a.current_stage = 'OFFER' THEN 1 ELSE 0 END) AS offers,
              ROUND(
                100.0 * SUM(CASE WHEN a.current_stage = 'INTERVIEW' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
                2
              ) AS interview_rate_pct,
              ROUND(
                100.0 * SUM(CASE WHEN a.current_stage = 'OFFER' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
                2
              ) AS offer_rate_pct
            FROM application a
            JOIN resume r ON r.id = a.resume_id
            WHERE a.user_id = :user_id
            GROUP BY r.slot, r.version_label
            ORDER BY r.slot
        """)
        rows = session.execute(q, {"user_id": user_id}).all()
        return [dict(r._mapping) for r in rows]

    def platform_performance(self, session: Session, user_id: int) -> list[dict]:
        # Platform wise conversion compare karne ke liye
        q = text("""
            SELECT
              COALESCE(a.platform, 'UNKNOWN') AS platform,
              COUNT(*) AS total_apps,
              COUNT(*) FILTER (WHERE a.current_stage IN ('OA','INTERVIEW','OFFER')) AS progressed,
              COUNT(*) FILTER (WHERE a.current_stage IN ('INTERVIEW','OFFER')) AS interviews,
              COUNT(*) FILTER (WHERE a.current_stage = 'OFFER') AS offers
            FROM application a
            WHERE a.user_id = :user_id
            GROUP BY COALESCE(a.platform, 'UNKNOWN')
            ORDER BY total_apps DESC
        """)
        rows = session.execute(q, {"user_id": user_id}).all()
        return [dict(r._mapping) for r in rows]

    def weekly_trend(self, session: Session, user_id: int) -> list[dict]:
        # Week-wise applications count (graph/trend ke liye)
        q = text("""
            SELECT
              DATE_TRUNC('week', a.created_at)::date AS week_start,
              COUNT(*) AS applications
            FROM application a
            WHERE a.user_id = :user_id
            GROUP BY DATE_TRUNC('week', a.created_at)::date
            ORDER BY week_start ASC
        """)
        rows = session.execute(q, {"user_id": user_id}).all()
        return [dict(r._mapping) for r in rows]

    def response_time_stats(self, session: Session, user_id: int) -> dict:
        # Applied -> first response (OA/Interview/Offer/Rejected) ka days stats
        q = text("""
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
                a.application_id,
                EXTRACT(EPOCH FROM (fr.resp_ts - ap.applied_ts)) / 86400.0 AS days_to_response
              FROM applied ap
              JOIN first_response fr ON fr.application_id = ap.application_id
              JOIN application a ON a.id = ap.application_id
              WHERE a.user_id = :user_id
                AND fr.resp_ts >= ap.applied_ts
            )
            SELECT
              COUNT(*) AS samples,
              ROUND(AVG(days_to_response)::numeric, 2) AS avg_days,
              ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_response)::numeric, 2) AS median_days,
              ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY days_to_response)::numeric, 2) AS p90_days
            FROM diffs
        """)
        row = session.execute(q, {"user_id": user_id}).one()
        return dict(row._mapping)
