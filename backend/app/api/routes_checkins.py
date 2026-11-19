from fastapi import APIRouter, HTTPException, Query

from ..models import CheckinCreate, CheckinOut, CheckinStatus
from ..services import checkin_service

router = APIRouter(prefix="/checkins", tags=["checkins"])


@router.get("/status", response_model=CheckinStatus)
def get_status():
    return checkin_service.checkin_status()


@router.get("", response_model=list[CheckinOut])
def list_checkins(type: str | None = Query(default=None, pattern="^(midday|evening)$"),
                  limit: int = Query(default=50, ge=1, le=200)):
    return checkin_service.list_checkins(checkin_type=type, limit=limit)


@router.get("/latest", response_model=CheckinOut | None)
def get_latest():
    return checkin_service.latest_checkin()


@router.post("", response_model=CheckinOut, status_code=201)
def submit_checkin(body: CheckinCreate):
    return checkin_service.submit_checkin(body.model_dump())


@router.get("/range", response_model=list[CheckinOut])
def get_range(days: int = 7):
    if days not in (7, 30, 90):
        raise HTTPException(status_code=422, detail="days must be 7, 30, or 90")
    return checkin_service.range_checkins(days)
