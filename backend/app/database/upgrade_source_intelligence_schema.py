from sqlalchemy import inspect, text

from app.database.session import Base, engine
from app.models import Article, ArticleEntity, Entity, NewsSource


SOURCE_COLUMNS = {
    "leaning_confidence": "DOUBLE PRECISION",
    "editorial_notes": "TEXT",
    "ownership_group": "VARCHAR(200)",
    "last_reviewed_at": "TIMESTAMP WITH TIME ZONE",
    "active": "BOOLEAN NOT NULL DEFAULT TRUE",
}


LEANING_NORMALIZATION = {
    "center_left": "center-left",
    "center_right": "center-right",
    "far_left": "left",
    "far_right": "right",
}


def upgrade_schema() -> None:
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    existing_columns = {column["name"] for column in inspector.get_columns("news_sources")}

    with engine.begin() as connection:
        for column_name, column_type in SOURCE_COLUMNS.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE news_sources ADD COLUMN {column_name} {column_type}"))

        connection.execute(
            text(
                """
                UPDATE news_sources
                SET leaning_confidence = ideology_confidence
                WHERE leaning_confidence IS NULL
                  AND ideology_confidence IS NOT NULL
                """
            )
        )

        connection.execute(
            text(
                """
                UPDATE news_sources
                SET active = active_status
                WHERE active_status IS NOT NULL
                """
            )
        )

        for old_value, new_value in LEANING_NORMALIZATION.items():
            connection.execute(
                text(
                    """
                    UPDATE news_sources
                    SET political_leaning = :new_value
                    WHERE political_leaning = :old_value
                    """
                ),
                {"old_value": old_value, "new_value": new_value},
            )


if __name__ == "__main__":
    upgrade_schema()
    print("Source intelligence schema upgraded successfully.")
