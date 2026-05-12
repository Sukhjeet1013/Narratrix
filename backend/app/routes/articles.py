from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models import Article
from app.schemas.article import ArticleDetailResponse, ArticleResponse
from app.services.similarity_service import find_similar_articles


router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("", response_model=list[ArticleResponse])
def get_articles(
    limit: int = Query(default=20, ge=1, le=10000),
    db: Session = Depends(get_db),
) -> list[ArticleResponse]:
    return db.query(Article).order_by(Article.created_at.desc(), Article.id.desc()).limit(limit).all()


@router.get("/{article_id}", response_model=ArticleDetailResponse)
def get_article(article_id: int, db: Session = Depends(get_db)) -> ArticleDetailResponse:
    article = db.query(Article).filter(Article.id == article_id).first()
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    similar_articles = find_similar_articles(db=db, article_id=article.id)
    payload = ArticleResponse.model_validate(article).model_dump()
    payload["similar_articles"] = similar_articles
    return ArticleDetailResponse(**payload)
