from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.session import Base


class NewsSource(Base):
    __tablename__ = "news_sources"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    source_name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    parent_company: Mapped[str | None] = mapped_column(String(300), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="India")
    language: Mapped[str] = mapped_column(String(100), nullable=False, default="English")
    source_type: Mapped[str] = mapped_column(String(100), nullable=False)
    political_leaning: Mapped[str] = mapped_column(String(50), nullable=False, default="unknown")
    leaning_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    editorial_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ownership_group: Mapped[str | None] = mapped_column(String(200), nullable=True)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    ideology_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    reliability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    sensationalism_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    factual_reporting_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ownership_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    rss_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    newsapi_domain: Mapped[str | None] = mapped_column(String(300), nullable=True)
    active_status: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    articles = relationship("Article", back_populates="source_record")
