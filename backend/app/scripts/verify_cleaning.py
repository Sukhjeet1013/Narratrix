from app.database.session import SessionLocal
from app.models import Article


def main() -> None:
    session = SessionLocal()
    try:
        candidates = (
            session.query(Article)
            .filter(
                (Article.title.ilike('%Æ%'))
                | (Article.title.ilike('%æ%'))
                | (Article.title.ilike('%â%'))
            )
            .limit(20)
            .all()
        )

        print(f"Found {len(candidates)} candidate rows with encoding artifacts in raw title")
        for article in candidates:
            print("RAW:", article.title)
            print("CLEANED:", article.cleaned_title)
            print("---")
    finally:
        session.close()


if __name__ == '__main__':
    main()
