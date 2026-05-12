from sqlalchemy import inspect, text

from app.database.session import Base, engine
from app.models import Article, ArticleEntity, Entity, NewsSource


ARTICLE_COLUMNS = {
    "source_id": "INTEGER REFERENCES news_sources(id)",
    "topic": "VARCHAR(100)",
    "sentiment": "VARCHAR(50)",
    "sentiment_confidence": "DOUBLE PRECISION",
    "political_bias": "VARCHAR(50)",
    "political_bias_confidence": "DOUBLE PRECISION",
    "framing": "VARCHAR(300)",
    "credibility_score": "DOUBLE PRECISION",
    "summary": "TEXT",
    "raw_payload": "JSONB",
}


ARTICLE_INDEXES = {
    "ix_articles_source_id": "CREATE INDEX IF NOT EXISTS ix_articles_source_id ON articles (source_id)",
    "ix_articles_topic": "CREATE INDEX IF NOT EXISTS ix_articles_topic ON articles (topic)",
    "ix_articles_sentiment": "CREATE INDEX IF NOT EXISTS ix_articles_sentiment ON articles (sentiment)",
    "ix_articles_political_bias": "CREATE INDEX IF NOT EXISTS ix_articles_political_bias ON articles (political_bias)",
}


def upgrade_schema() -> None:
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_columns = {column["name"] for column in inspector.get_columns("articles")}

    with engine.begin() as connection:
        for column_name, column_type in ARTICLE_COLUMNS.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE articles ADD COLUMN {column_name} {column_type}"))

        for statement in ARTICLE_INDEXES.values():
            connection.execute(text(statement))


if __name__ == "__main__":
    upgrade_schema()
    print("Phase 4 database schema upgraded successfully.")
