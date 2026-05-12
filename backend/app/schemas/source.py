from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SourceResponse(BaseModel):
    id: int
    source_name: str
    source_type: str
    country: str
    language: str
    political_leaning: str = Field(
        description="Manually assigned editorial tendency, not an objective factual label."
    )
    leaning_confidence: float | None = Field(
        default=None,
        ge=0,
        le=1,
        description="Confidence in the manually assigned editorial tendency.",
    )
    editorial_notes: str | None
    ownership_group: str | None
    last_reviewed_at: datetime | None
    active: bool
    website_url: str | None
    rss_url: str | None
    newsapi_domain: str | None

    model_config = ConfigDict(from_attributes=True)

