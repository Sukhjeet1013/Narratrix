import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.articles import router as articles_router
from app.routes.clusters import router as clusters_router
from app.routes.sources import router as sources_router
from app.routes.admin import router as admin_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Narratrix API",
    description="AI-powered political narrative intelligence — FastAPI backend for Narratrix.",
    version="0.1.0",
)

_extra_origins = [
    x.strip()
    for x in (settings.cors_origins or "").split(",")
    if x.strip()
]
_default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

if settings.cors_origins == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_default_origins + _extra_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(sources_router)
app.include_router(articles_router)
app.include_router(clusters_router)
app.include_router(admin_router)


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "message": "Narratrix API is running",
        "docs_url": "/docs",
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}


# ── APScheduler startup / shutdown ───────────────────────────────────────────

@app.on_event("startup")
def start_scheduler() -> None:
    """Start the background ingestion scheduler on app boot."""
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from app.services.realtime_ingestion_service import (
            run_ingestion_cycle,
            _update_state,
        )

        scheduler = BackgroundScheduler(
            job_defaults={"misfire_grace_time": 60, "coalesce": True}
        )
        scheduler.add_job(
            run_ingestion_cycle,
            trigger="interval",
            minutes=5,
            id="rss_ingestion",
            replace_existing=True,
        )
        scheduler.start()
        _update_state(scheduler_started=True)

        # Store scheduler on app state so shutdown can stop it
        app.state.scheduler = scheduler
        logger.info("APScheduler started — ingestion every 5 minutes.")

        # Run the first cycle immediately in a background thread (non-blocking)
        import threading
        t = threading.Thread(target=run_ingestion_cycle, daemon=True, name="initial-ingestion")
        t.start()

    except Exception as exc:
        logger.error("Failed to start ingestion scheduler: %s", exc)


@app.on_event("shutdown")
def stop_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    scheduler = getattr(app.state, "scheduler", None)
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
