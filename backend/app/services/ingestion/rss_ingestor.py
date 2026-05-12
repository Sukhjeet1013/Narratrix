import logging
from typing import Any

import requests
from bs4 import BeautifulSoup

from app.models import NewsSource
from app.services.ingestion.normalizer import normalize_atom_entry, normalize_rss_item
from app.services.ingestion.schemas import NormalizedArticle


logger = logging.getLogger(__name__)
REQUEST_TIMEOUT_SECONDS = 25
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def fetch_rss_articles(source: NewsSource, topic: str | None = "politics") -> list[NormalizedArticle]:
    if not source.rss_url:
        return []

    try:
        response = requests.get(
            source.rss_url,
            headers={
                "User-Agent": DEFAULT_USER_AGENT,
                "Accept": "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.warning("RSS fetch failed for %s (%s): %s", source.source_name, source.rss_url, exc)
        return []

    if not response.content:
        logger.warning("RSS empty body for %s", source.source_name)
        return []

    try:
        soup = BeautifulSoup(response.content, "xml")
    except Exception as exc:
        logger.warning("RSS parse error for %s: %s", source.source_name, exc)
        return []

    root = soup.find()
    if root is None:
        return []

    articles: list[NormalizedArticle] = []
    root_name = root.name.lower() if root.name else ""

    if root_name == "rss":
        for item in soup.find_all("item"):
            try:
                article = normalize_rss_item(source.source_name, item, topic=topic)
            except Exception as exc:
                logger.debug("Skipping malformed RSS item for %s: %s", source.source_name, exc)
                continue
            if article:
                articles.append(article)
        return articles

    if root_name == "feed":
        for entry in soup.find_all("entry"):
            try:
                article = normalize_atom_entry(source.source_name, entry, topic=topic)
            except Exception as exc:
                logger.debug("Skipping malformed Atom entry for %s: %s", source.source_name, exc)
                continue
            if article:
                articles.append(article)
        return articles

    for item in soup.find_all("item"):
        try:
            article = normalize_rss_item(source.source_name, item, topic=topic)
        except Exception:
            continue
        if article:
            articles.append(article)
    for entry in soup.find_all("entry"):
        try:
            article = normalize_atom_entry(source.source_name, entry, topic=topic)
        except Exception:
            continue
        if article:
            articles.append(article)

    return articles

