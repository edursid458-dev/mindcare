from fastapi import APIRouter, HTTPException

from ..models import TrendsResponse
from ..services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/trends", response_model=TrendsResponse)
def get_trends(days: int = 7):
    if days not in (7, 30, 90):
        raise HTTPException(status_code=422, detail="days must be 7, 30, or 90")
    return analytics_service.trends(days)
