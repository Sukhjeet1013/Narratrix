from datetime import datetime
from email.utils import parsedate_to_datetime
from typing import Any
from urllib.parse import urlsplit, urlunsplit

from bs4 import BeautifulSoup

from app.services.ingestion.schemas import NormalizedArticle
from app.services.text_cleaner import clean_text


def canonicalize_url(url: str) -> str:
    parsed = urlsplit(url.strip())
    # Drop query/fragment so duplicate prevention is not broken by tracking params (?utm_*).
    return urlunsplit((parsed.scheme, parsed.netloc.lower(), parsed.path, "", ""))


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return parsedate_to_datetime(value)
    except (TypeError, ValueError):
        pass

    try:
        cleaned = value.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned)
    except ValueError:
        return None


def normalize_rss_item(source_name: str, item: Any, topic: str | None = "politics") -> NormalizedArticle | None:
    raw_title = item.title.get_text(strip=True) if item.title else None
    cleaned_title = clean_text(raw_title)
    link = item.link.get_text(strip=True) if item.link else None

    if not raw_title or not link:
        return None

    raw_content = item.description.decode_contents() if item.description else None
    cleaned_content = clean_text(raw_content)
    published = item.pubDate.get_text(strip=True) if item.pubDate else None

    return NormalizedArticle(
        source_name=source_name,
        title=raw_title,
        cleaned_title=cleaned_title,
        url=canonicalize_url(link),
        content=raw_content,
        cleaned_content=cleaned_content,
        published_at=parse_datetime(published),
        topic=topic,
        raw_payload={
            "ingestion_type": "rss",
            "format": "rss",
            "title": raw_title,
            "link": link,
            "description": raw_content,
            "published": published,
        },
    )


def _atom_text_content(entry: Any) -> str | None:
    """Extract description-like text from Atom summary/content elements."""
    summary = entry.summary
    if summary:
        ctype = (summary.get("type") or "text").lower()
        if ctype in ("html", "xhtml"):
            return summary.decode_contents() if hasattr(summary, "decode_contents") else summary.get_text()
        return summary.get_text(strip=True)
    content = entry.content
    if content:
        ctype = (content.get("type") or "text").lower()
        if ctype in ("html", "xhtml"):
            return content.decode_contents() if hasattr(content, "decode_contents") else content.get_text()
        return content.get_text(strip=True)
    return None


def _atom_link_href(entry: Any) -> str | None:
    for link in entry.find_all("link"):
        rel = (link.get("rel") or "alternate").lower()
        if rel in {"alternate", "self"} and link.get("href"):
            return link["href"].strip()
    ident = entry.find("id")
    if ident and ident.get_text(strip=True) and ident.get_text(strip=True).startswith("http"):
        return ident.get_text(strip=True)
    return None


def normalize_atom_entry(source_name: str, entry: Any, topic: str | None = "politics") -> NormalizedArticle | None:
    raw_title = entry.title.get_text(strip=True) if entry.title else None
    cleaned_title = clean_text(raw_title)
    link = _atom_link_href(entry)
    if not raw_title or not link:
        return None

    raw_content = _atom_text_content(entry)
    cleaned_content = clean_text(raw_content)
    published = None
    if entry.published:
        published = entry.published.get_text(strip=True)
    elif entry.updated:
        published = entry.updated.get_text(strip=True)

    return NormalizedArticle(
        source_name=source_name,
        title=raw_title,
        cleaned_title=cleaned_title,
        url=canonicalize_url(link),
        content=raw_content,
        cleaned_content=cleaned_content,
        published_at=parse_datetime(published),
        topic=topic,
        raw_payload={
            "ingestion_type": "rss",
            "format": "atom",
            "title": raw_title,
            "link": link,
            "description": raw_content,
            "published": published,
        },
    )


def normalize_newsapi_item(item: dict[str, Any], topic: str | None = "politics") -> NormalizedArticle | None:
    raw_title = item.get("title")
    cleaned_title = clean_text(raw_title)
    url = item.get("url")
    source_name = (item.get("source") or {}).get("name")

    if not raw_title or not cleaned_title or not url or not source_name:
        return None

    raw_description = item.get("description")
    raw_content_piece = item.get("content")
    raw_content = " ".join(part for part in [raw_description, raw_content_piece] if part) or None
    cleaned_description = clean_text(raw_description)
    cleaned_content_piece = clean_text(raw_content_piece)
    cleaned_content = " ".join(part for part in [cleaned_description, cleaned_content_piece] if part) or None

    return NormalizedArticle(
        source_name=source_name,
        title=raw_title,
        cleaned_title=cleaned_title,
        url=canonicalize_url(url),
        content=raw_content,
        cleaned_content=cleaned_content,
        published_at=parse_datetime(item.get("publishedAt")),
        topic=topic,
        raw_payload={
            "ingestion_type": "newsapi",
            "source": item.get("source"),
            "author": item.get("author"),
            "title": raw_title,
            "description": raw_description,
            "content": raw_content_piece,
            "url": item.get("url"),
            "publishedAt": item.get("publishedAt"),
        },
    )
