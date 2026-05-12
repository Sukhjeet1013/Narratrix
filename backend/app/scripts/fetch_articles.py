from app.database.session import SessionLocal
from app.models import NewsSource
from app.services.ingestion.article_store import store_articles
from app.services.ingestion.newsapi_ingestor import fetch_newsapi_articles
from app.services.ingestion.rss_ingestor import fetch_rss_articles


def fetch_rss_sources() -> tuple[int, int]:
    db = SessionLocal()
    try:
        sources = (
            db.query(NewsSource)
            .filter(NewsSource.active.is_(True))
            .filter(NewsSource.rss_url.isnot(None))
            .all()
        )

        all_articles = []
        for source in sources:
            try:
                articles = fetch_rss_articles(source)
            except Exception as exc:
                print(f"RSS error for {source.source_name}: {exc}")
                continue
            print(f"Fetched {len(articles)} RSS articles from {source.source_name}.")
            all_articles.extend(articles)

        inserted, skipped = store_articles(db, all_articles)
        print(f"RSS storage complete. Inserted: {inserted}. Skipped duplicates: {skipped}.")
        return inserted, skipped
    finally:
        db.close()


def fetch_newsapi_sources() -> tuple[int, int]:
    db = SessionLocal()
    try:
        domains = [
            domain
            for (domain,) in db.query(NewsSource.newsapi_domain)
            .filter(NewsSource.active.is_(True))
            .filter(NewsSource.newsapi_domain.isnot(None))
            .all()
        ]

        articles = fetch_newsapi_articles(domains=domains[:20])
        if not articles:
            print("NewsAPI skipped. Set NEWS_API_KEY in backend/.env to enable it.")
            return 0, 0

        inserted, skipped = store_articles(db, articles)
        print(f"NewsAPI storage complete. Inserted: {inserted}. Skipped duplicates: {skipped}.")
        return inserted, skipped
    finally:
        db.close()


def main() -> None:
    fetch_rss_sources()
    fetch_newsapi_sources()


if __name__ == "__main__":
    main()
