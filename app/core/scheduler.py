from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings

_scheduler = None

def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        # scheduler को singleton रख रहे हैं ताकि multiple instance ना बने
        _scheduler = AsyncIOScheduler(timezone=settings.SCHEDULER_TIMEZONE)
    return _scheduler

def build_daily_trigger() -> CronTrigger:
    # रोज़ एक fixed time पर job चलाने के लिए cron trigger
    return CronTrigger(hour=settings.FOLLOWUP_DAILY_HOUR, minute=settings.FOLLOWUP_DAILY_MINUTE)
