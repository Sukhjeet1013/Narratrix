from app.database.session import SessionLocal
from app.services.source_intelligence import load_source_seed_data, upsert_sources


def main() -> None:
    db = SessionLocal()
    try:
        sources = load_source_seed_data()
        created, updated = upsert_sources(db, sources)
        print(f"Source seed complete. Created: {created}. Updated: {updated}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

