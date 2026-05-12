import requests

from app.config import settings
from app.services.ingestion.normalizer import normalize_newsapi_item
from app.services.ingestion.schemas import NormalizedArticle


NEWSAPI_URL = "https://newsapi.org/v2/everything"
REQUEST_TIMEOUT_SECONDS = 20


def fetch_newsapi_articles(
    query: str = "India politics",
    domains: list[str] | None = None,
    page_size: int = 20,
) -> list[NormalizedArticle]:
    if not settings.news_api_key:
        return []

    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": page_size,
        "apiKey": settings.news_api_key,
    }

    if domains:
        params["domains"] = ",".join(domains)

    response = requests.get(NEWSAPI_URL, params=params, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()

    payload = response.json()
    articles = payload.get("articles", [])

    normalized: list[NormalizedArticle] = []
    for item in articles:
        article = normalize_newsapi_item(item, topic="politics")
        if article:
            normalized.append(article)

    return normalized

