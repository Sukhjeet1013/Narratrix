from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SimilarArticleResponse(BaseModel):
    article_id: int
    title: str
    source: str | None
    similarity_score: float


class ArticleResponse(BaseModel):
    id: int
    title: str
    source: str | None
    url: str
    cleaned_title: str | None
    cleaned_content: str | None
    summary: str | None
    topic: str | None
    published_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ArticleDetailResponse(ArticleResponse):
    similar_articles: list[SimilarArticleResponse]
