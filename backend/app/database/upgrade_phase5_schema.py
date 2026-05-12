from sqlalchemy import inspect, text

from app.database.session import Base, engine
from app.models import Article, ArticleEmbedding


ARTICLE_COLUMNS = {
    "cleaned_title": "TEXT",
    "cleaned_content": "TEXT",
}


def upgrade_schema() -> None:
    Base.metadata.create_all(bind=engine)

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


if __name__ == "__main__":
    upgrade_schema()
    print("Phase 5 database schema upgraded successfully.")
