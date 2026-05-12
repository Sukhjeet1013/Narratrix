from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.session import Base


class ArticleCluster(Base):
    __tablename__ = "article_clusters"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cluster_name: Mapped[str] = mapped_column(String(200), nullable=False)
    topic: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    members = relationship(
        "ArticleClusterMember",
        back_populates="cluster",
        cascade="all, delete-orphan",
    )


class ArticleClusterMember(Base):
    __tablename__ = "article_cluster_members"
    __table_args__ = (
        UniqueConstraint("cluster_id", "article_id", name="uq_article_cluster_member"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("article_clusters.id"), nullable=False, index=True)
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id"), nullable=False, index=True)

    cluster = relationship("ArticleCluster", back_populates="members")
    article = relationship("Article")
