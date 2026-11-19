from fastapi import APIRouter, HTTPException

from ..models import ActivityOut, CompleteRequest, SaveResponse, ActivityStatus, CompletionRecord
from ..services import activity_service

router = APIRouter(tags=["activities"])


@router.get("/activities", response_model=list[ActivityOut])
def list_activities():
    return activity_service.list_active()


@router.get("/activities/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: str):
    act = activity_service.get_activity(activity_id)
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")
    return act


@router.post("/activities/{activity_id}/complete", response_model=CompletionRecord, status_code=201)
def complete_activity(activity_id: str, body: CompleteRequest):
    rec = activity_service.complete_activity(activity_id, body.rating, body.feedback)
    if rec is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return rec


@router.post("/activities/{activity_id}/save", response_model=SaveResponse)
def save_activity(activity_id: str):
    res = activity_service.save_activity(activity_id)
    if res is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return res


@router.delete("/activities/{activity_id}/save", response_model=SaveResponse)
def unsave_activity(activity_id: str):
    return activity_service.unsave_activity(activity_id)


@router.get("/activities/{activity_id}/status", response_model=ActivityStatus)
def activity_status(activity_id: str):
    return activity_service.activity_status(activity_id)
