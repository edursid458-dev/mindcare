from fastapi import APIRouter

from ..models import ReadingOut, WearableStatus
from ..services import wearable_service

router = APIRouter(prefix="/wearables", tags=["wearables"])


@router.get("/status", response_model=WearableStatus)
def get_status():
    return wearable_service.status()


@router.post("/connect", response_model=WearableStatus)
def connect():
    return wearable_service.connect()


@router.post("/disconnect", response_model=WearableStatus)
def disconnect():
    return wearable_service.disconnect()


@router.post("/sync", response_model=ReadingOut)
def sync():
    return wearable_service.sync()


@router.get("/readings", response_model=list[ReadingOut])
def readings(limit: int = 20):
    return wearable_service.readings(limit=limit)


@router.get("/latest", response_model=ReadingOut | None)
def latest():
    return wearable_service.latest_reading()
