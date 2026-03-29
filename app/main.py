from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.scheduler import get_scheduler, build_daily_trigger
from app.services.followup_job import run_followup_daily_job

from app.api.auth import router as auth_router
from app.api.applications import router as applications_router
from app.api.platforms import router as platforms_router
from app.api.analytics import router as analytics_router
from app.api.suggestions import router as suggestions_router
from app.api.scoring import router as scoring_router
from app.api.followups import router as followups_router
from app.api.routes.status_scan import router as status_scan_router
from app.api.routes.status_suggestions import router as status_suggestions_router
from app.api.routes.email_signal import router as email_signal_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # app start à¤¹à¥‹à¤¤à¥‡ à¤¹à¥€ scheduler start
    scheduler = get_scheduler()

    if settings.FOLLOWUP_JOB_ENABLED:
        trigger = build_daily_trigger()

        # replace_existing=True à¤¤à¤¾à¤•à¤¿ restart à¤ªà¤° duplicate job à¤¨à¤¾ à¤¬à¤¨à¥‡
        scheduler.add_job(
            run_followup_daily_job,
            trigger=trigger,
            id="followup_daily_job",
            replace_existing=True,
        )
        scheduler.start()

    yield

    # app à¤¬à¤‚à¤¦ à¤¹à¥‹à¤¤à¥‡ time scheduler shutdown
    if scheduler.running:
        scheduler.shutdown(wait=False)

app = FastAPI(
    title="Internship Application Intelligence System",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",  # docs/dashboard
        "http://localhost:8000",  # docs/dashboard
    ],
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes
app.include_router(auth_router)

# Application routes
app.include_router(applications_router)

# Platform routes
app.include_router(platforms_router)

# Analytics routes
app.include_router(analytics_router)

# Suggestions routes
app.include_router(suggestions_router)

# Status Scan routes
app.include_router(status_scan_router)
app.include_router(status_suggestions_router)
app.include_router(email_signal_router)

# Scoring routes
app.include_router(scoring_router)

# Followup routes
app.include_router(followups_router)

from app.api.routes import admin_followups, analytics_overdue, analytics, resumes
app.include_router(admin_followups.router)
app.include_router(analytics_overdue.router)
app.include_router(analytics.router)
app.include_router(resumes.router)

@app.get("/health")
def health():
    return {"status": "ok"}

