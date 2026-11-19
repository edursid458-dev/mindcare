from fastapi import APIRouter

from ..models import DashboardResponse
from ..services import analytics_service, checkin_service, recommendation_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard():
    status = checkin_service.checkin_status()
    recs = recommendation_service.get_recommendations()
    recent_count = len(checkin_service.range_checkins(7))
    observations = analytics_service.trends(7)["observations"]
    return {
        "checkin_status": {"midday": status["midday"], "evening": status["evening"]},
        "primary_recommendation": recs["primary"],
        "recent_checkins_count": recent_count,
        "wellness_observations": observations,
    }
