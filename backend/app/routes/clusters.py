from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.dependencies import get_db
from app.models import Article, ArticleCluster, ArticleClusterMember
from app.schemas.cluster import (
    ClusterDetailResponse,
    ClusterMemberDetailResponse,
    ClusterResponse,
    NarrativeAnalysisResponse,
)
from app.services.clustering_service import list_clusters
from app.services.narrative_analysis_service import analyze_cluster_narratives
from app.services.similarity_service import similarity_to_cluster_centroid


router = APIRouter(prefix="/clusters", tags=["clusters"])


@router.get("", response_model=list[ClusterResponse])
def get_clusters(db: Session = Depends(get_db)) -> list[ClusterResponse]:
    clusters = list_clusters(db)
    return [
        ClusterResponse(
            id=cluster.id,
            cluster_name=cluster.cluster_name,
            topic=cluster.topic,
            created_at=cluster.created_at,
            member_count=len(cluster.members),
        )
        for cluster in clusters
    ]


def _load_cluster_detail(db: Session, cluster_id: int) -> ArticleCluster | None:
    return (
        db.query(ArticleCluster)
        .options(
            joinedload(ArticleCluster.members)
            .joinedload(ArticleClusterMember.article)
            .joinedload(Article.source_record),
        )
        .filter(ArticleCluster.id == cluster_id)
        .first()
    )


@router.get("/{cluster_id}", response_model=ClusterDetailResponse)
def get_cluster_detail(cluster_id: int, db: Session = Depends(get_db)) -> ClusterDetailResponse:
    cluster = _load_cluster_detail(db, cluster_id)
    if cluster is None:
        raise HTTPException(status_code=404, detail="Cluster not found")

    member_article_ids = [m.article_id for m in cluster.members if m.article_id is not None]
    centroid_scores = similarity_to_cluster_centroid(db, member_article_ids) if member_article_ids else {}

    members_out: list[ClusterMemberDetailResponse] = []
    for member in cluster.members:
        art = member.article
        if art is None:
            continue
        src = art.source_record
        members_out.append(
            ClusterMemberDetailResponse(
                article_id=art.id,
                title=art.title,
                source=art.source,
                source_name=src.source_name if src else art.source,
                topic=art.topic,
                summary=art.summary,
                political_leaning=src.political_leaning if src else None,
                sentiment=art.sentiment,
                framing=art.framing,
                similarity_to_centroid=centroid_scores.get(art.id),
            )
        )

    narrative_raw = analyze_cluster_narratives(db, cluster)
    try:
        narrative_out = NarrativeAnalysisResponse.model_validate(narrative_raw)
    except Exception:
        narrative_out = narrative_raw

    return ClusterDetailResponse(
        id=cluster.id,
        cluster_name=cluster.cluster_name,
        topic=cluster.topic,
        created_at=cluster.created_at,
        member_count=len(members_out),
        members=members_out,
        narrative_analysis=narrative_out,
    )
