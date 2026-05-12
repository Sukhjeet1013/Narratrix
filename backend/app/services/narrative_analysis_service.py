from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any

from sqlalchemy.orm import Session

from app.models import ArticleCluster, NewsSource


def _snippet(text: str | None, max_len: int = 200) -> str | None:
    if not text:
        return None
    cleaned = " ".join(text.split()).strip()
    if not cleaned:
        return None
    return cleaned if len(cleaned) <= max_len else f"{cleaned[: max_len - 1]}…"


def analyze_cluster_narratives(db: Session, cluster: ArticleCluster) -> dict[str, Any]:
    """
    Cross-outlet narrative comparison for a cluster: leanings, framing, sentiment, summary contrast.
    Heuristic and explainable — not a replacement for human editorial review.
    """
    try:
        members = [m for m in cluster.members if m.article is not None]
        if not members:
            return {
                "cluster_id": cluster.id,
                "cluster_name": cluster.cluster_name,
                "topic": cluster.topic,
                "summary": "No articles in this cluster.",
                "sources": [],
                "leaning_distribution": {},
                "narrative_bullets": [],
            }

        by_outlet: dict[str, list] = defaultdict(list)
        leaning_counts: Counter[str] = Counter()

        for m in members:
            art = m.article
            name = (art.source_record.source_name if art.source_record else art.source) or "Unknown"
            by_outlet[name].append(art)
            if art.source_record and art.source_record.political_leaning:
                leaning_counts[art.source_record.political_leaning] += 1

        sources_payload: list[dict[str, Any]] = []
        narrative_bullets: list[str] = []

        for outlet_name, articles in sorted(by_outlet.items(), key=lambda x: x[0].lower()):
            source_row: NewsSource | None = (
                db.query(NewsSource).filter(NewsSource.source_name == outlet_name).first()
            )
            lean = source_row.political_leaning if source_row else "unknown"
            rel = source_row.reliability_score if source_row else None

            sentiments = [a.sentiment for a in articles if a.sentiment]
            frame = [a.framing for a in articles if a.framing]
            summaries = [a.summary for a in articles if a.summary]

            dominant_sent = Counter(sentiments).most_common(1)[0][0] if sentiments else None
            dominant_frame = frame[0] if frame else None
            combined_summary = _snippet(summaries[0]) if summaries else _snippet(articles[0].cleaned_title or articles[0].title)

            angle_parts: list[str] = []
            if lean and lean != "unknown":
                angle_parts.append(f"metadata leaning: {lean}")
            if dominant_sent:
                angle_parts.append(f"sentiment field: {dominant_sent}")
            if dominant_frame:
                angle_parts.append(f"framing field: {dominant_frame}")
            angle = "; ".join(angle_parts) if angle_parts else "limited structured signals for this outlet in-cluster"

            line = f"{outlet_name}: {angle}"
            if combined_summary:
                line += f" — summary excerpt: {combined_summary}"
            narrative_bullets.append(line)

            sources_payload.append(
                {
                    "source_name": outlet_name,
                    "political_leaning": lean,
                    "reliability_score": rel,
                    "article_count": len(articles),
                    "dominant_sentiment": dominant_sent,
                    "sample_framing": dominant_frame,
                    "summary_excerpt": combined_summary,
                    "narrative_angle": angle,
                }
            )

        cross_cut = []
        if len(by_outlet) >= 2:
            lean_set = {s["political_leaning"] for s in sources_payload}
            cross_cut.append(
                f"{len(by_outlet)} outlets represented; leaning labels present: {', '.join(sorted(lean_set))}."
            )
            cross_cut.append(
                "Compare summary excerpts and framing fields to see emphasis differences on the same story cluster."
            )

        return {
            "cluster_id": cluster.id,
            "cluster_name": cluster.cluster_name,
            "topic": cluster.topic,
            "summary": "Heuristic comparison of outlet metadata, sentiment/framing fields, and summary excerpts.",
            "distinct_source_count": len(by_outlet),
            "leaning_distribution": dict(leaning_counts),
            "sources": sources_payload,
            "narrative_bullets": narrative_bullets,
            "cross_cut_observations": cross_cut,
        }
    except Exception as exc:
        return {
            "cluster_id": getattr(cluster, "id", None),
            "cluster_name": getattr(cluster, "cluster_name", "unknown"),
            "topic": getattr(cluster, "topic", None),
            "summary": None,
            "error": f"Narrative analysis failed: {exc}",
            "sources": [],
            "narrative_bullets": [],
        }

