import json
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models import NewsSource


SEED_FILE = Path(__file__).resolve().parents[2] / "seed_data" / "news_sources_seed.json"


SOURCE_FIELDS = {
    "source_name",
    "parent_company",
    "country",
    "language",
    "source_type",
    "political_leaning",
    "leaning_confidence",
    "editorial_notes",
    "ownership_group",
    "last_reviewed_at",
    "active",
    "ideology_confidence",
    "reliability_score",
    "sensationalism_score",
    "factual_reporting_score",
    "ownership_type",
    "website_url",
    "rss_url",
    "newsapi_domain",
    "active_status",
}

ALLOWED_POLITICAL_LEANINGS = {
    "left",
    "center-left",
    "center",
    "center-right",
    "right",
    "mixed",
    "unknown",
}


def normalize_source_payload(source_data: dict[str, Any]) -> dict[str, Any]:
    clean_data = {key: value for key, value in source_data.items() if key in SOURCE_FIELDS}

    political_leaning = clean_data.get("political_leaning", "unknown")
    political_leaning = political_leaning.replace("_", "-")
    if political_leaning not in ALLOWED_POLITICAL_LEANINGS:
        political_leaning = "unknown"
    clean_data["political_leaning"] = political_leaning

    leaning_confidence = clean_data.get("leaning_confidence")
    if leaning_confidence is not None:
        clean_data["leaning_confidence"] = max(0.0, min(1.0, float(leaning_confidence)))

    if "leaning_confidence" in clean_data and "ideology_confidence" not in clean_data:
        clean_data["ideology_confidence"] = clean_data["leaning_confidence"]

    if "active" in clean_data and "active_status" not in clean_data:
        clean_data["active_status"] = clean_data["active"]
    if "active_status" in clean_data and "active" not in clean_data:
        clean_data["active"] = clean_data["active_status"]

    if "ownership_group" in clean_data and "parent_company" not in clean_data:
        clean_data["parent_company"] = clean_data["ownership_group"]

    return clean_data


def load_source_seed_data(seed_file: Path = SEED_FILE) -> list[dict[str, Any]]:
    with seed_file.open("r", encoding="utf-8") as file:
        return json.load(file)


def upsert_sources(db: Session, sources: list[dict[str, Any]]) -> tuple[int, int]:
    created = 0
    updated = 0

    for source_data in sources:
        clean_data = normalize_source_payload(source_data)
        source_name = clean_data["source_name"]
        source = db.query(NewsSource).filter(NewsSource.source_name == source_name).one_or_none()

        if source is None:
            db.add(NewsSource(**clean_data))
            created += 1
            continue

        for key, value in clean_data.items():
            setattr(source, key, value)
        updated += 1

    db.commit()
    return created, updated


def list_active_sources(db: Session) -> list[NewsSource]:
    return db.query(NewsSource).filter(NewsSource.active.is_(True)).order_by(NewsSource.source_name).all()


def list_sources(db: Session) -> list[NewsSource]:
    return db.query(NewsSource).order_by(NewsSource.source_name).all()
