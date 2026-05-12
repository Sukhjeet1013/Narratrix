from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.schemas.source import SourceResponse
from app.services.source_intelligence import list_sources


router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("", response_model=list[SourceResponse])
def get_sources(db: Session = Depends(get_db)) -> list[SourceResponse]:
    return list_sources(db)

