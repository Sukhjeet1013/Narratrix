from sqlalchemy.orm import Session

from app.models import Article, NewsSource
from app.services.ingestion.schemas import NormalizedArticle


def get_or_create_source(db: Session, source_name: str) -> NewsSource:
    source = db.query(NewsSource).filter(NewsSource.source_name == source_name).one_or_none()
    if source:
        return source

    source = NewsSource(
        source_name=source_name,
        country="Unknown",
        language="Unknown",
        source_type="Unknown",
        political_leaning="unknown",
        ideology_confidence=0.0,
        active_status=True,
    )
    db.add(source)
    db.flush()
    return source


def store_article(db: Session, article: NormalizedArticle) -> bool:
    existing = db.query(Article).filter(Article.url == article.url).one_or_none()
    if existing:
        return False

    source = get_or_create_source(db, article.source_name)

    db.add(
        Article(
            source_id=source.id,
            source=source.source_name,
            title=article.title,
            cleaned_title=article.cleaned_title,
            url=article.url,
            content=article.content,
            cleaned_content=article.cleaned_content,
            published_at=article.published_at,
            topic=article.topic,
            credibility_score=source.reliability_score,
            raw_payload=article.raw_payload,
        )
    )
    return True


def store_articles(db: Session, articles: list[NormalizedArticle]) -> tuple[int, int]:
    inserted = 0
    skipped = 0
    seen_urls: set[str] = set()

    for article in articles:
        if article.url in seen_urls:
            skipped += 1
            continue
        seen_urls.add(article.url)
        if store_article(db, article):
            inserted += 1
        else:
            skipped += 1

    db.commit()
    return inserted, skipped

