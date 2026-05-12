from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ClusterMemberResponse(BaseModel):
    article_id: int
    title: str
    source: str | None
    topic: str | None


class ClusterMemberDetailResponse(BaseModel):
    article_id: int
    title: str
    source: str | None
    source_name: str | None = Field(default=None, description="Normalized from news_sources when linked")
    topic: str | None
    summary: str | None
    political_leaning: str | None
    sentiment: str | None
    framing: str | None
    similarity_to_centroid: float | None = None


class NarrativeSourceBlock(BaseModel):
    source_name: str
    political_leaning: str
    reliability_score: float | None
    article_count: int
    dominant_sentiment: str | None
    sample_framing: str | None
    summary_excerpt: str | None
    narrative_angle: str


class NarrativeAnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    cluster_id: int | None
    cluster_name: str
    topic: str | None
    summary: str | None = None
    distinct_source_count: int | None = None
    leaning_distribution: dict[str, int] = Field(default_factory=dict)
    sources: list[NarrativeSourceBlock] = Field(default_factory=list)
    narrative_bullets: list[str] = Field(default_factory=list)
    cross_cut_observations: list[str] = Field(default_factory=list)
    error: str | None = None


class ClusterResponse(BaseModel):
    id: int
    cluster_name: str
    topic: str | None
    created_at: datetime
    member_count: int


class ClusterDetailResponse(ClusterResponse):
    members: list[ClusterMemberDetailResponse]
    narrative_analysis: NarrativeAnalysisResponse | dict[str, Any]
