from typing import List
from sqlalchemy import text
from app.api.schemas.analytics_overdue_by_stage import OverdueByStageRow
from app.api.schemas.analytics_insights import InsightItem


class AnalyticsService:
    def __init__(self, repo):
        self.repo = repo

    def funnel(self, session, user_id: int) -> dict:
        # Funnel counts + rates return kar rahe hain
        data = self.repo.funnel_counts(session, user_id)

        def rate(num: int, den: int) -> float:
            # Zero division se bachne ke liye
            return round((num / den) * 100, 2) if den else 0.0

        captured = data.get("captured", 0) or 0
        applied = data.get("applied", 0) or 0
        oa = data.get("oa", 0) or 0
        interview = data.get("interview", 0) or 0
        offer = data.get("offer", 0) or 0

        return {
            "counts": data,
            "rates": {
                "applied_from_captured_pct": rate(applied, captured),
                "oa_from_applied_pct": rate(oa, applied),
                "interview_from_oa_pct": rate(interview, oa),
                "offer_from_interview_pct": rate(offer, interview),
                "offer_from_applied_pct": rate(offer, applied),
            },
        }

    def resume_performance(self, session, user_id: int) -> list[dict]:
        rows = self.repo.resume_performance(session, user_id)
        for r in rows:
            total = r["total_apps"] or 0
            r["interview_rate_pct"] = round((r["interviews"] / total) * 100, 2) if total else 0.0
            r["offer_rate_pct"] = round((r["offers"] / total) * 100, 2) if total else 0.0
        return rows

    def platform_performance(self, session, user_id: int) -> list[dict]:
        rows = self.repo.platform_performance(session, user_id)
        for r in rows:
            total = r["total_apps"] or 0
            r["interview_rate_pct"] = round((r["interviews"] / total) * 100, 2) if total else 0.0
            r["offer_rate_pct"] = round((r["offers"] / total) * 100, 2) if total else 0.0
        return rows

    def weekly_trend(self, session, user_id: int) -> list[dict]:
        return self.repo.weekly_trend(session, user_id)

    def response_time(self, session, user_id: int) -> dict:
        return self.repo.response_time_stats(session, user_id)

    def overdue_by_stage(self, session, user_id: int) -> List[OverdueByStageRow]:
        """
        Returns overdue count grouped by application stage.
        Uses the same overdue marker as /analytics/overdue: application.is_overdue = TRUE.
        """
        sql = text("""
            SELECT
                a.current_stage AS stage,
                COUNT(*)::int AS count
            FROM application a
            WHERE a.user_id = :user_id
              AND a.is_overdue = TRUE
            GROUP BY a.current_stage
            ORDER BY count DESC;
        """)

        rows = session.execute(sql, {"user_id": user_id}).all()
        return [OverdueByStageRow(stage=r[0], count=r[1]) for r in rows]

    def insights(self, session, user_id: int) -> List[InsightItem]:
        """
        Deterministic insights. No ML.
        Each insight includes metric_source so it is traceable.
        """
        insights: List[InsightItem] = []

        sql_overdue_stage = text("""
            SELECT
              a.current_stage AS stage,
              COUNT(*)::int AS count
            FROM application a
            WHERE a.user_id = :user_id
              AND a.is_overdue = TRUE
            GROUP BY a.current_stage
            ORDER BY count DESC
            LIMIT 1;
        """)
        row = session.execute(sql_overdue_stage, {"user_id": user_id}).first()
        if row:
            insights.append(
                InsightItem(
                    key="highest_overdue_stage",
                    title="Stage with highest overdue concentration",
                    insight=f"Most overdue applications are in stage '{row[0]}' ({row[1]} items).",
                    metric_source="/analytics/overdue-by-stage",
                    details={"stage": row[0], "count": row[1]},
                )
            )

        sql_platform = text("""
            SELECT
              COALESCE(a.platform, 'UNKNOWN') AS platform,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE a.current_stage IN ('OA','INTERVIEW','OFFER'))::int AS responded
            FROM application a
            WHERE a.user_id = :user_id
            GROUP BY COALESCE(a.platform, 'UNKNOWN')
            HAVING COUNT(*) > 0
            ORDER BY (
              COUNT(*) FILTER (WHERE a.current_stage IN ('OA','INTERVIEW','OFFER'))::float
              / COUNT(*)
            ) DESC, COUNT(*) DESC
            LIMIT 1;
        """)
        row = session.execute(sql_platform, {"user_id": user_id}).first()
        if row:
            platform, total, responded = row[0], row[1], row[2]
            rate = (responded / total) if total else 0
            insights.append(
                InsightItem(
                    key="best_platform_response_rate",
                    title="Platform with highest response rate",
                    insight=f"'{platform}' has the highest response rate: {responded}/{total} ({rate:.0%}).",
                    metric_source="/analytics/platform-performance",
                    details={
                        "platform": platform,
                        "responded": responded,
                        "total": total,
                        "rate": rate,
                    },
                )
            )

        return insights
