from app.database.session import Base, engine
from app.models import (
    Article,
    ArticleCluster,
    ArticleClusterMember,
    ArticleEmbedding,
    ArticleEntity,
    Entity,
    NewsSource,
)


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_tables()
    print("Database tables created successfully.")
