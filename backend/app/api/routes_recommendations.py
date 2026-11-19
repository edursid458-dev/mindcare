from fastapi import APIRouter

from ..models import PrimaryRecommendation, RecommendationsResponse, CompletionRecord
from ..services import activity_service, recommendation_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/primary", response_model=PrimaryRecommendation)
def get_primary():
    return recommendation_service.primary_recommendation()


@router.get("", response_model=RecommendationsResponse)
def get_recommendations():
    return recommendation_service.get_recommendations()


@router.get("/completions", response_model=list[CompletionRecord])
def get_completions():
    return activity_service.completions_history()
