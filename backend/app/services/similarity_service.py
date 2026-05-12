from __future__ import annotations

from collections.abc import Sequence
from math import isfinite
from typing import Any

from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.models import Article, ArticleEmbedding

# Keep in sync with `embedding_service` / Phase 5 reprocessing default model.
DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def _to_float_vector(vector: Any) -> list[float] | None:
    if not isinstance(vector, Sequence) or isinstance(vector, (str, bytes)):
        return None

    try:
        parsed = [float(value) for value in vector]
    except (TypeError, ValueError):
        return None

    if not parsed or any(not isfinite(value) for value in parsed):
        return None
    return parsed


def _mean_vector(vectors: list[list[float]]) -> list[float] | None:
    if not vectors:
        return None
    dim = len(vectors[0])
    count = len(vectors)
    return [sum(v[d] for v in vectors) / count for d in range(dim)]


def calculate_similarity(vector_a: Sequence[float] | None, vector_b: Sequence[float] | None) -> float | None:
    safe_vector_a = _to_float_vector(vector_a)
    safe_vector_b = _to_float_vector(vector_b)
    if safe_vector_a is None or safe_vector_b is None:
        return None
    if len(safe_vector_a) != len(safe_vector_b):
        return None

    try:
        score = cosine_similarity([safe_vector_a], [safe_vector_b])[0][0]
        return float(score)
    except Exception:
        return None


def similarity_to_cluster_centroid(
    db: Session,
    article_ids: list[int],
    embedding_model: str = DEFAULT_EMBEDDING_MODEL,
) -> dict[int, float | None]:
    """Cosine similarity of each article embedding to the cluster centroid (mean of member vectors)."""
    if len(article_ids) < 2:
        out: dict[int, float | None] = {}
        for aid in article_ids:
            out[aid] = 1.0 if len(article_ids) == 1 else None
        return out

    rows = (
        db.query(ArticleEmbedding)
        .filter(ArticleEmbedding.article_id.in_(article_ids))
        .filter(ArticleEmbedding.embedding_model == embedding_model)
        .all()
    )
    parsed: dict[int, list[float]] = {}
    for row in rows:
        vec = _to_float_vector(row.embedding_vector)
        if vec is not None:
            parsed[row.article_id] = vec

    centroid = _mean_vector(list(parsed.values()))
    if centroid is None:
        return {aid: None for aid in article_ids}

    scores: dict[int, float | None] = {}
    for aid in article_ids:
        vec = parsed.get(aid)
        if vec is None:
            scores[aid] = None
            continue
        s = calculate_similarity(vec, centroid)
        scores[aid] = round(s, 4) if s is not None else None
    return scores


def find_similar_articles(
    db: Session,
    article_id: int,
    top_k: int = 5,
    min_similarity: float = 0.2,
) -> list[dict[str, Any]]:
    target_embedding = (
        db.query(ArticleEmbedding)
        .filter(ArticleEmbedding.article_id == article_id)
        .filter(ArticleEmbedding.embedding_model == DEFAULT_EMBEDDING_MODEL)
        .first()
    )
    if target_embedding is None:
        return []

    target_vector = _to_float_vector(target_embedding.embedding_vector)
    if target_vector is None:
        return []

    all_embeddings = (
        db.query(ArticleEmbedding)
        .filter(ArticleEmbedding.article_id != article_id)
        .filter(ArticleEmbedding.embedding_model == DEFAULT_EMBEDDING_MODEL)
        .all()
    )

    scored_matches: list[dict[str, Any]] = []
    for candidate in all_embeddings:
        score = calculate_similarity(target_vector, candidate.embedding_vector)
        if score is None or score < min_similarity:
            continue

        article = db.query(Article).filter(Article.id == candidate.article_id).first()
        if article is None:
            continue

        scored_matches.append(
            {
                "article_id": article.id,
                "title": article.title,
                "source": article.source,
                "similarity_score": round(score, 4),
            }
        )

    scored_matches.sort(key=lambda row: row["similarity_score"], reverse=True)
    return scored_matches[: max(0, top_k)]
