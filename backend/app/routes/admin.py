import logging
import threading
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.services.clustering_service import build_clusters, store_clusters

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_ingestion_state() -> dict[str, Any]:
    try:
        from app.services.realtime_ingestion_service import get_ingestion_state
        return get_ingestion_state()
    except Exception:
        return {}


def _run_ingestion_background() -> dict[str, Any]:
    """Run a full ingestion cycle and return the summary."""
    from app.services.realtime_ingestion_service import run_ingestion_cycle
    return run_ingestion_cycle()


# ── /admin/refresh-articles  (called by Settings → "Fetch Latest Articles") ──

@router.post("/refresh-articles")
def refresh_articles(background_tasks: BackgroundTasks) -> dict[str, Any]:
    """
    Trigger the RSS ingestion pipeline immediately.
    Runs in a background thread so the HTTP response is fast.
    """
    state = _get_ingestion_state()
    if state.get("running"):
        return {
            "success": False,
            "message": "Ingestion already running — please wait.",
            "articles_added": 0,
            "clusters_updated": 0,
        }

    # Fire ingestion in background thread so request returns immediately
    t = threading.Thread(
        target=_run_ingestion_background,
        daemon=True,
        name="settings-ingestion",
    )
    t.start()

    return {
        "success": True,
        "message": "Ingestion pipeline started — new articles will appear within 1–2 minutes.",
        "articles_added": 0,
        "clusters_updated": 0,
    }


# ── /admin/rebuild-clusters  (called by Settings → "Regenerate Stories") ──────

@router.post("/rebuild-clusters")
def rebuild_clusters_endpoint(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Synchronously rebuild all clusters from existing embeddings."""
    clusters = build_clusters(db)
    created, _ = store_clusters(db, clusters)
    db.commit()
    return {
        "success": True,
        "message": f"Successfully rebuilt {created} stories from the article corpus.",
        "articles_added": 0,
        "clusters_updated": created,
    }


# ── /admin/refresh-analytics  (called by Settings → "Rebuild Analytics") ──────

@router.post("/refresh-analytics")
def refresh_analytics() -> dict[str, Any]:
    """Analytics are dynamically computed — no cache to flush."""
    return {
        "success": True,
        "message": "Analytics are computed in real-time. Charts will reflect latest data on next page load.",
        "articles_added": 0,
        "clusters_updated": 0,
    }


# ── /admin/ingestion/status ───────────────────────────────────────────────────

@router.get("/ingestion/status")
def ingestion_status() -> dict[str, Any]:
    """Return the current state of the background ingestion service."""
    state = _get_ingestion_state()
    if not state:
        return {"error": "Ingestion service unavailable", "scheduler_started": False}

    last_run_at: datetime | None = state.get("last_run_at")
    seconds_ago: int | None = None
    if last_run_at:
        seconds_ago = int((datetime.now(timezone.utc) - last_run_at).total_seconds())

    return {
        "scheduler_started": state.get("scheduler_started", False),
        "currently_running": state.get("running", False),
        "last_run_at": last_run_at.isoformat() if last_run_at else None,
        "last_run_seconds_ago": seconds_ago,
        "last_run_inserted": state.get("last_run_inserted", 0),
        "last_run_skipped": state.get("last_run_skipped", 0),
        "last_run_sources_ok": state.get("last_run_sources", 0),
        "last_run_sources_failed": state.get("last_run_failed_sources", 0),
        "last_cluster_rebuild_at": (
            state["last_cluster_rebuild_at"].isoformat()
            if state.get("last_cluster_rebuild_at")
            else None
        ),
        "total_runs": state.get("total_runs", 0),
        "total_inserted": state.get("total_inserted", 0),
    }


# ── /admin/ingestion/run  (manual trigger from dashboard widget) ──────────────

@router.post("/ingestion/run")
def trigger_ingestion_now() -> dict[str, Any]:
    """Manually trigger an ingestion cycle immediately."""
    state = _get_ingestion_state()
    if state.get("running"):
        return {"status": "skipped", "message": "Ingestion already running."}

    t = threading.Thread(
        target=_run_ingestion_background,
        daemon=True,
        name="manual-ingestion",
    )
    t.start()
    return {"status": "started", "message": "Ingestion cycle started in background."}
