from __future__ import annotations

from collections import Counter, defaultdict
from collections.abc import Sequence
from math import isfinite
from typing import Any

from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

import re
from app.models import Article, ArticleCluster, ArticleClusterMember, ArticleEmbedding

STOP_WORDS = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "as", "is", "are", "was", "were", "be", "been", "it", "this", "that", "he", "she", "they", "from", "has", "have", "had", "not", "no", "yes", "how", "what", "where", "when", "why", "who", "which", "its"}

def _generate_cluster_name(db: Session, member_ids: list[int]) -> str:
    titles = [
        title
        for (title,) in db.query(Article.title).filter(Article.id.in_(member_ids)).all()
        if title
    ]
    if not titles:
        return "Unknown Event"
    
    words = []
    for t in titles:
        cleaned = re.sub(r'[^a-zA-Z\s]', '', t).lower()
        words.extend([w for w in cleaned.split() if w not in STOP_WORDS and len(w) > 2])
    
    if not words:
        return "News Story"
        
    top_words = [w for w, _ in Counter(words).most_common(3)]
    
    best_title = titles[0]
    best_score = -1
    for t in titles:
        t_lower = t.lower()
        score = sum(1 for w in top_words if w in t_lower)
        if score > best_score:
            best_score = score
            best_title = t
            
    cleaned = re.sub(r'\s+', ' ', best_title).strip()
    cleaned = re.split(r'\s[-|:]\s', cleaned)[0]
    words_in_title = cleaned.split()
    if len(words_in_title) > 8:
        return " ".join(words_in_title[:8]) + "..."
    return cleaned

def _normalize_sources(db: Session, member_ids: list[int], max_per_source: int = 3) -> list[int]:
    rows = db.query(Article.id, Article.source_id).filter(Article.id.in_(member_ids)).all()
    source_counts = Counter()
    kept = []
    for r in rows:
        source_counts[r.source_id] += 1
        if source_counts[r.source_id] <= max_per_source:
            kept.append(r.id)
    return kept


def _safe_vector(vector: Any) -> list[float] | None:
    if not isinstance(vector, Sequence) or isinstance(vector, (str, bytes)):
        return None
    try:
        parsed = [float(value) for value in vector]
    except (TypeError, ValueError):
        return None
    if not parsed or any(not isfinite(value) for value in parsed):
        return None
    return parsed


def load_embedding_rows(db: Session) -> list[tuple[int, list[float]]]:
    rows: list[tuple[int, list[float]]] = []
    for embedding in db.query(ArticleEmbedding).all():
        vector = _safe_vector(embedding.embedding_vector)
        if vector is None:
            continue
        rows.append((embedding.article_id, vector))
    return rows


def _vector_mean(indices: list[int], vectors: list[list[float]]) -> list[float]:
    dim = len(vectors[0])
    count = len(indices)
    return [sum(vectors[i][d] for i in indices) / count for d in range(dim)]


def _subtract(a: list[float], b: list[float]) -> list[float]:
    return [a[i] - b[i] for i in range(len(a))]


def source_residual_embeddings(
    db: Session,
    article_ids: list[int],
    vectors: list[list[float]],
) -> list[list[float]]:
    """
    Subtract per-outlet mean embedding when enough articles exist for that source.
    Reduces same-outlet "house style" bias so clusters emphasize topic/event similarity.
    Single-source singletons fall back to global mean centering.
    """
    if not article_ids or not vectors or len(article_ids) != len(vectors):
        return vectors

    dim = len(vectors[0])
    rows = (
        db.query(Article.id, Article.source_id).filter(Article.id.in_(article_ids)).all()
    )
    id_to_source = {row.id: row.source_id for row in rows}

    by_source: dict[int | None, list[int]] = defaultdict(list)
    for idx, aid in enumerate(article_ids):
        by_source[id_to_source.get(aid)].append(idx)

    global_mean = _vector_mean(list(range(len(vectors))), vectors)

    source_means: dict[int, list[float]] = {}
    for source_id, idxs in by_source.items():
        if source_id is None or len(idxs) < 2:
            continue
        source_means[source_id] = _vector_mean(idxs, vectors)

    centered: list[list[float]] = []
    for idx, aid in enumerate(article_ids):
        v = vectors[idx]
        sid = id_to_source.get(aid)
        if sid is not None and sid in source_means:
            centered.append(_subtract(v, source_means[sid]))
        else:
            centered.append(_subtract(v, global_mean))
    return centered


def _distinct_sources_in_cluster(db: Session, member_ids: list[int]) -> int:
    rows = (
        db.query(Article.source_id)
        .filter(Article.id.in_(member_ids))
        .distinct()
        .all()
    )
    return len([r for r in rows if r.source_id is not None])


def _fit_agglomerative(vectors: list[list[float]], distance_threshold: float) -> list[int]:
    try:
        model = AgglomerativeClustering(
            n_clusters=None,
            metric="cosine",
            linkage="average",
            distance_threshold=distance_threshold,
        )
    except TypeError:
        model = AgglomerativeClustering(
            n_clusters=None,
            affinity="cosine",
            linkage="average",
            distance_threshold=distance_threshold,
        )

    return [int(label) for label in model.fit_predict(vectors)]


def build_clusters(
    db: Session,
    min_cluster_size: int = 2,
    distance_threshold: float = 0.38,
    prefer_cross_source: bool = True,
) -> list[dict[str, Any]]:
    embedding_rows = load_embedding_rows(db)
    if len(embedding_rows) < 2:
        return []

    article_ids = [article_id for article_id, _ in embedding_rows]
    vectors = [vector for _, vector in embedding_rows]
    clustered_vectors = source_residual_embeddings(db, article_ids, vectors)

    try:
        labels = _fit_agglomerative(clustered_vectors, distance_threshold=distance_threshold)
    except Exception:
        return []

    grouped: dict[int, list[int]] = {}
    for article_id, label in zip(article_ids, labels, strict=True):
        grouped.setdefault(label, []).append(article_id)

    clusters: list[dict[str, Any]] = []
    for cluster_index, members in enumerate(grouped.values(), start=1):
        members = _normalize_sources(db, members)
        if len(members) < min_cluster_size:
            continue

        topics = [
            topic
            for (topic,) in db.query(Article.topic).filter(Article.id.in_(members)).all()
            if topic
        ]
        top_topic = Counter(topics).most_common(1)[0][0] if topics else None

        cluster_name = _generate_cluster_name(db, members)
        clusters.append(
            {
                "cluster_name": cluster_name,
                "topic": top_topic,
                "article_ids": members,
            }
        )

    if not clusters:
        fallback_labels: list[int] = []
        try:
            target_clusters = max(1, len(article_ids) // 2)
            try:
                fallback_model = AgglomerativeClustering(
                    n_clusters=target_clusters,
                    metric="cosine",
                    linkage="average",
                )
            except TypeError:
                fallback_model = AgglomerativeClustering(
                    n_clusters=target_clusters,
                    affinity="cosine",
                    linkage="average",
                )
            fallback_labels = [int(label) for label in fallback_model.fit_predict(clustered_vectors)]
        except Exception:
            similarity_matrix = cosine_similarity(clustered_vectors)
            visited: set[int] = set()
            fallback_groups: list[list[int]] = []

            for idx in range(len(article_ids)):
                if idx in visited:
                    continue

                stack = [idx]
                group_indices: set[int] = set()
                while stack:
                    current = stack.pop()
                    if current in group_indices:
                        continue
                    group_indices.add(current)
                    visited.add(current)
                    for candidate in range(len(article_ids)):
                        if candidate == current:
                            continue
                        if similarity_matrix[current][candidate] >= 0.5:
                            stack.append(candidate)

                if len(group_indices) >= min_cluster_size:
                    fallback_groups.append(sorted(group_indices))

            fallback_labels = []
            for label, group in enumerate(fallback_groups):
                for member in group:
                    while len(fallback_labels) <= member:
                        fallback_labels.append(-1)
                    fallback_labels[member] = label

        regrouped: dict[int, list[int]] = {}
        for idx, label in enumerate(fallback_labels):
            if label < 0:
                continue
            regrouped.setdefault(label, []).append(article_ids[idx])

        for cluster_index, members in enumerate(regrouped.values(), start=1):
            members = _normalize_sources(db, members)
            if len(members) < min_cluster_size:
                continue
            topics = [
                topic
                for (topic,) in db.query(Article.topic).filter(Article.id.in_(members)).all()
                if topic
            ]
            top_topic = Counter(topics).most_common(1)[0][0] if topics else None
            cluster_name = _generate_cluster_name(db, members)
            clusters.append(
                {
                    "cluster_name": cluster_name,
                    "topic": top_topic,
                    "article_ids": members,
                }
            )

    if prefer_cross_source and clusters:
        multi = [
            c
            for c in clusters
            if _distinct_sources_in_cluster(db, c["article_ids"]) >= 2
        ]
        if multi:
            clusters = multi

    return clusters


def store_clusters(db: Session, clusters: list[dict[str, Any]]) -> tuple[int, int]:
    db.query(ArticleClusterMember).delete()
    db.query(ArticleCluster).delete()
    db.flush()

    created_clusters = 0
    created_members = 0

    for cluster_data in clusters:
        cluster = ArticleCluster(
            cluster_name=cluster_data["cluster_name"],
            topic=cluster_data.get("topic"),
        )
        db.add(cluster)
        db.flush()
        created_clusters += 1

        for article_id in cluster_data["article_ids"]:
            db.add(ArticleClusterMember(cluster_id=cluster.id, article_id=article_id))
            created_members += 1

    return created_clusters, created_members


def list_clusters(db: Session) -> list[ArticleCluster]:
    return db.query(ArticleCluster).order_by(ArticleCluster.created_at.desc(), ArticleCluster.id.desc()).all()


def get_cluster(db: Session, cluster_id: int) -> ArticleCluster | None:
    return db.query(ArticleCluster).filter(ArticleCluster.id == cluster_id).first()
