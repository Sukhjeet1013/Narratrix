"""
Static RSS source definitions used by the realtime ingestion service.

Each entry maps to a NewsSource row in the DB. The `leaning` and `confidence`
fields are used to seed the source record if it doesn't yet exist.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RSSSourceDef:
    name: str
    rss_url: str
    country: str
    leaning: str
    confidence: float          # 0-100
    source_type: str
    topic: str = "politics"    # default topic tag for articles from this source


RSS_SOURCES: list[RSSSourceDef] = [
    # ── Indian national outlets ────────────────────────────────────────────
    RSSSourceDef(
        name="NDTV",
        rss_url="https://feeds.feedburner.com/ndtvnews-india-news",
        country="India",
        leaning="center-left",
        confidence=70.0,
        source_type="Digital",
    ),
    RSSSourceDef(
        name="The Hindu",
        rss_url="https://www.thehindu.com/news/national/feeder/default.rss",
        country="India",
        leaning="left",
        confidence=75.0,
        source_type="Newspaper",
    ),
    RSSSourceDef(
        name="Indian Express",
        rss_url="https://indianexpress.com/section/india/feed/",
        country="India",
        leaning="center",
        confidence=65.0,
        source_type="Newspaper",
    ),
    RSSSourceDef(
        name="Times of India",
        rss_url="https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        country="India",
        leaning="center",
        confidence=60.0,
        source_type="Newspaper",
    ),
    RSSSourceDef(
        name="Republic World",
        rss_url="https://www.republicworld.com/feeds/rss/india.xml",
        country="India",
        leaning="right",
        confidence=80.0,
        source_type="Broadcast",
    ),
    RSSSourceDef(
        name="India Today",
        rss_url="https://www.indiatoday.in/rss/1206514",
        country="India",
        leaning="center",
        confidence=65.0,
        source_type="Broadcast",
    ),
    RSSSourceDef(
        name="The Wire",
        rss_url="https://thewire.in/feed",
        country="India",
        leaning="left",
        confidence=80.0,
        source_type="Digital",
    ),
    RSSSourceDef(
        name="Hindustan Times",
        rss_url="https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
        country="India",
        leaning="center",
        confidence=60.0,
        source_type="Newspaper",
    ),
    # ── International wire services ────────────────────────────────────────
    RSSSourceDef(
        name="Reuters",
        rss_url="https://feeds.reuters.com/reuters/topNews",
        country="Global",
        leaning="center",
        confidence=85.0,
        source_type="Wire Service",
        topic="world",
    ),
    RSSSourceDef(
        name="AP News",
        rss_url="https://feeds.apnews.com/rss/apf-topnews",
        country="Global",
        leaning="center",
        confidence=85.0,
        source_type="Wire Service",
        topic="world",
    ),
    RSSSourceDef(
        name="BBC News",
        rss_url="http://feeds.bbci.co.uk/news/world/rss.xml",
        country="UK",
        leaning="center-left",
        confidence=70.0,
        source_type="Broadcast",
        topic="world",
    ),
    RSSSourceDef(
        name="Al Jazeera",
        rss_url="https://www.aljazeera.com/xml/rss/all.xml",
        country="Qatar",
        leaning="center",
        confidence=65.0,
        source_type="Broadcast",
        topic="world",
    ),
]
