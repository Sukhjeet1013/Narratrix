from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class NormalizedArticle:
    source_name: str
    title: str
    cleaned_title: str | None
    url: str
    content: str | None = None
    cleaned_content: str | None = None
    published_at: datetime | None = None
    topic: str | None = None
    raw_payload: dict[str, Any] = field(default_factory=dict)

