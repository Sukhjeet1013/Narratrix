"""
Realtime ingestion service — orchestrates RSS fetching, normalisation,
deduplication, DB persistence, and cluster refresh.

Designed to be called from APScheduler on a background thread (not async)
so it can use synchronous SQLAlchemy sessions without blocking FastAPI's
event loop.

Key design decisions:
- Each run opens its own DB session (never shares with requests).
- Exceptions are caught per-source so one bad feed never aborts others.
- Cluster rebuild runs only when new articles were actually inserted.
- Uses the existing rss_ingestor / article_store / clustering_service.
"""
from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone
from typing import Any

from app.database.session import SessionLocal
from app.data.rss_sources import RSS_SOURCES, RSSSourceDef
from app.models import NewsSource
from app.services.ingestion.article_store import store_articles
from app.services.ingestion.rss_ingestor import fetch_rss_articles
from app.services.clustering_service import build_clusters, store_clusters

logger = logging.getLogger(__name__)

# ── Shared ingestion state (in-process only) ─────────────────────────────────
_state_lock = threading.Lock()

_ingestion_state: dict[str, Any] = {
    "running": False,
    "scheduler_started": False,
    "last_run_at": None,          # datetime UTC
    "last_run_inserted": 0,
    "last_run_skipped": 0,
    "last_run_sources": 0,
    "last_run_failed_sources": 0,
    "last_cluster_rebuild_at": None,
    "total_runs": 0,
    "total_inserted": 0,
}


def get_ingestion_state() -> dict[str, Any]:
    with _state_lock:
        return dict(_ingestion_state)


def _update_state(**kwargs: Any) -> None:
    with _state_lock:
        _ingestion_state.update(kwargs)


# ── Source seeding ────────────────────────────────────────────────────────────

def _ensure_source_exists(db: Any, defn: RSSSourceDef) -> NewsSource:
    """
    Return the DB row for this source, creating / updating it if needed.
    Only sets the RSS URL and leaning if it wasn't already set.
    """
    source = db.query(NewsSource).filter(
        NewsSource.source_name == defn.name
    ).one_or_none()

    if source is None:
        source = NewsSource(
            source_name=defn.name,
            country=defn.country,
            language="English",
            source_type=defn.source_type,
            political_leaning=defn.leaning,
            leaning_confidence=defn.confidence / 100.0,   # store as 0-1
            ideology_confidence=defn.confidence / 100.0,  # store as 0-1
            rss_url=defn.rss_url,
            active=True,
            active_status=True,
        )
        db.add(source)
        db.flush()
        logger.info("Created source record: %s", defn.name)
    else:
        # Back-fill RSS url if missing
        if not source.rss_url:
            source.rss_url = defn.rss_url
        # Back-fill leaning if still unknown
        if source.political_leaning in (None, "unknown", ""):
            source.political_leaning = defn.leaning
            source.leaning_confidence = defn.confidence

    return source


# ── Main ingestion cycle ──────────────────────────────────────────────────────

def run_ingestion_cycle() -> dict[str, Any]:
    """
    Synchronous ingestion cycle — safe to call from APScheduler threads.

    Returns a summary dict with counts.
    """
    with _state_lock:
        if _ingestion_state["running"]:
            logger.info("Ingestion already running — skipping this cycle.")
            return {"skipped": True, "reason": "already_running"}
        _ingestion_state["running"] = True

    total_inserted = 0
    total_skipped = 0
    failed_sources = 0
    ok_sources = 0

    try:
        db = SessionLocal()
        try:
            for defn in RSS_SOURCES:
                try:
                    source = _ensure_source_exists(db, defn)
                    db.commit()

                    articles = fetch_rss_articles(source, topic=defn.topic)
                    if not articles:
                        logger.debug("No articles from %s", defn.name)
                        ok_sources += 1
                        continue

                    inserted, skipped = store_articles(db, articles)
                    total_inserted += inserted
                    total_skipped += skipped
                    ok_sources += 1
                    logger.info(
                        "%s: +%d inserted, %d skipped", defn.name, inserted, skipped
                    )

                except Exception as exc:
                    failed_sources += 1
                    logger.warning("Ingestion failed for %s: %s", defn.name, exc)
                    try:
                        db.rollback()
                    except Exception:
                        pass

            # Cluster rebuild — only if new articles were added
            cluster_rebuilt = False
            if total_inserted > 0:
                try:
                    logger.info(
                        "Rebuilding clusters after %d new articles…", total_inserted
                    )
                    clusters = build_clusters(db)
                    store_clusters(db, clusters)
                    db.commit()
                    cluster_rebuilt = True
                    _update_state(last_cluster_rebuild_at=datetime.now(timezone.utc))
                    logger.info("Cluster rebuild complete — %d clusters.", len(clusters))
                except Exception as exc:
                    logger.error("Cluster rebuild failed: %s", exc)
                    try:
                        db.rollback()
                    except Exception:
                        pass

        finally:
            db.close()

    finally:
        with _state_lock:
            _ingestion_state["running"] = False
            _ingestion_state["last_run_at"] = datetime.now(timezone.utc)
            _ingestion_state["last_run_inserted"] = total_inserted
            _ingestion_state["last_run_skipped"] = total_skipped
            _ingestion_state["last_run_sources"] = ok_sources
            _ingestion_state["last_run_failed_sources"] = failed_sources
            _ingestion_state["total_runs"] += 1
            _ingestion_state["total_inserted"] += total_inserted

    summary = {
        "inserted": total_inserted,
        "skipped": total_skipped,
        "sources_ok": ok_sources,
        "sources_failed": failed_sources,
    }
    logger.info("Ingestion cycle complete: %s", summary)
    return summary
