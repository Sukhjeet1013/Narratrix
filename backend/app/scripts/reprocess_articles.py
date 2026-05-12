from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import SessionLocal, engine
from app.models import Article, ArticleEmbedding
from app.services.embedding_service import generate_embedding
from app.services.summarizer import generate_summary
from app.services.text_cleaner import clean_text

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
COMMIT_BATCH_SIZE = 25

ARTICLE_COLUMNS = {
    "summary": "TEXT",
    "cleaned_title": "TEXT",
    "cleaned_content": "TEXT",
}


def ensure_phase5_schema() -> None:
    inspector = inspect(engine)
    existing_columns = {column["name"] for column in inspector.get_columns("articles")}

    with engine.begin() as connection:
        for column_name, column_type in ARTICLE_COLUMNS.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE articles ADD COLUMN {column_name} {column_type}"))

        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS article_embeddings (
                    id SERIAL PRIMARY KEY,
                    article_id INTEGER NOT NULL REFERENCES articles(id),
                    embedding_model VARCHAR(200) NOT NULL,
                    embedding_vector JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
                )
                """
            )
        )

        connection.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS uq_article_embeddings_article_model
                ON article_embeddings (article_id, embedding_model)
                """
            )
        )


def _normalized_text(value: str | None) -> str | None:
    cleaned = clean_text(value)
    if not cleaned:
        return None
    return cleaned


def _fallback_summary(text: str | None) -> str | None:
    if not text:
        return None
    snippet = " ".join(text.split()).strip()
    if not snippet:
        return None
    return snippet[:280]


def _upsert_embedding_for_article(session, article_id: int, source_text: str) -> tuple[bool, bool]:
    existing_embedding = (
        session.query(ArticleEmbedding)
        .filter(ArticleEmbedding.article_id == article_id)
        .filter(ArticleEmbedding.embedding_model == EMBEDDING_MODEL_NAME)
        .first()
    )
    if existing_embedding is not None:
        return False, True

    try:
        embedding_vector = generate_embedding(source_text)
    except Exception:
        embedding_vector = None

    if embedding_vector is None:
        return False, False

    try:
        embedding_vector = list(map(float, embedding_vector))
    except (TypeError, ValueError):
        return False, False

    session.add(
        ArticleEmbedding(
            article_id=article_id,
            embedding_model=EMBEDDING_MODEL_NAME,
            embedding_vector=embedding_vector,
        )
    )
    return True, False


def reprocess_articles() -> None:
    ensure_phase5_schema()

    session = SessionLocal()
    processed = 0
    summary_success = 0
    embedding_success = 0
    duplicate_embeddings = 0

    try:
        articles = session.query(Article).order_by(Article.id.asc()).all()
        total = len(articles)
        print(f"Found {total} existing articles to reprocess.")

        for article in articles:
            article.cleaned_title = _normalized_text(article.title)
            article.cleaned_content = _normalized_text(article.content) or article.cleaned_title

            summary_source_text = article.cleaned_content or article.cleaned_title
            if summary_source_text:
                try:
                    article.summary = generate_summary(summary_source_text)
                except Exception:
                    article.summary = None
                if not article.summary:
                    article.summary = _fallback_summary(summary_source_text)
            else:
                article.summary = None

            if article.summary:
                summary_success += 1

            embedding_source_text = article.cleaned_content or article.summary or article.cleaned_title
            if embedding_source_text:
                created, skipped_duplicate = _upsert_embedding_for_article(
                    session=session,
                    article_id=article.id,
                    source_text=embedding_source_text,
                )
                if created:
                    embedding_success += 1
                if skipped_duplicate:
                    duplicate_embeddings += 1

            processed += 1

            if processed % COMMIT_BATCH_SIZE == 0:
                session.commit()
                print(
                    f"Processed {processed}/{total} | "
                    f"summaries={summary_success} embeddings={embedding_success} "
                    f"duplicate_embeddings={duplicate_embeddings}"
                )

        session.commit()
        print(
            f"Reprocessing complete. processed={processed}, summaries={summary_success}, "
            f"embeddings_created={embedding_success}, duplicate_embeddings={duplicate_embeddings}"
        )
    except SQLAlchemyError as exc:
        session.rollback()
        print(f"Database error while reprocessing articles: {exc}")
    except Exception as exc:
        session.rollback()
        print(f"Unexpected error while reprocessing articles: {exc}")
    finally:
        session.close()


def main() -> None:
    reprocess_articles()


if __name__ == "__main__":
    main()
