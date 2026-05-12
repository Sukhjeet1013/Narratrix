from __future__ import annotations

import sys
from itertools import combinations

from sqlalchemy.exc import SQLAlchemyError

from app.database.session import Base, SessionLocal, engine
from app.models import Article
from app.services.clustering_service import build_clusters, store_clusters
from app.services.similarity_service import calculate_similarity


def ensure_phase6_schema() -> None:
    Base.metadata.create_all(bind=engine)


def _average_similarity(vectors: list[list[float]]) -> float | None:
    pair_scores: list[float] = []
    for vector_a, vector_b in combinations(vectors, 2):
        score = calculate_similarity(vector_a, vector_b)
        if score is not None:
            pair_scores.append(score)
    if not pair_scores:
        return None
    return sum(pair_scores) / len(pair_scores)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    ensure_phase6_schema()

    db = SessionLocal()
    try:
        clusters = build_clusters(db=db)
        if not clusters:
            print("No clusters generated. Ensure there are enough valid embeddings.")
            return

        created_clusters, created_members = store_clusters(db=db, clusters=clusters)
        db.commit()

        print(f"Generated {created_clusters} clusters with {created_members} members.")
        for cluster in clusters:
            print(f"\n{cluster['cluster_name']} (topic={cluster.get('topic') or 'unknown'})")
            article_rows = (
                db.query(Article.id, Article.title, Article.source)
                .filter(Article.id.in_(cluster["article_ids"]))
                .all()
            )
            for _, title, source in article_rows:
                source_name = source or "Unknown Source"
                safe_title = (title or "").encode("utf-8", errors="replace").decode("utf-8")
                print(f"* {source_name}: {safe_title}")
    except SQLAlchemyError as exc:
        db.rollback()
        print(f"Database error while generating clusters: {exc}")
    except Exception as exc:
        db.rollback()
        print(f"Unexpected clustering error: {exc}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
