"""Check-in persistence. One check-in per (user_id, checkin_type, local date)."""
from __future__ import annotations

from datetime import datetime, timezone

from .. import config
from ..db import get_db


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> str:
    return datetime.now().date().isoformat()


def _serialize(doc: dict) -> dict:
    out = dict(doc)
    out["checkin_id"] = str(out.pop("_id"))
    for k in ("created_at", "updated_at"):
        if isinstance(out.get(k), datetime):
            out[k] = out[k].isoformat()
    return out


def submit_checkin(data: dict) -> dict:
    """Upsert a check-in for (demo-user, checkin_type, today)."""
    db = get_db()
    today = _today()
    now = _now()
    payload = {
        "user_id": config.DEMO_USER_ID,
        "checkin_type": data["checkin_type"],
        "date": today,
        "mood": data["mood"],
        "stress_level": data["stress_level"],
        "energy_level": data["energy_level"],
        "sleep_duration": data.get("sleep_duration"),
        "sleep_quality": data.get("sleep_quality"),
        "physical_activity": data.get("physical_activity"),
        "emotional_notes": data.get("emotional_notes") or "",
        "daily_challenges": data.get("daily_challenges") or "",
        "social_interaction": data.get("social_interaction") or "",
        "updated_at": now,
    }
    existing = db.checkins.find_one(
        {"user_id": config.DEMO_USER_ID, "checkin_type": data["checkin_type"], "date": today}
    )
    if existing:
        db.checkins.update_one({"_id": existing["_id"]}, {"$set": payload})
        doc = db.checkins.find_one({"_id": existing["_id"]})
    else:
        payload["created_at"] = now
        res = db.checkins.insert_one(payload)
        doc = db.checkins.find_one({"_id": res.inserted_id})
    return _serialize(doc)


def list_checkins(checkin_type: str | None = None, limit: int = 50) -> list[dict]:
    db = get_db()
    q: dict = {"user_id": config.DEMO_USER_ID}
    if checkin_type:
        q["checkin_type"] = checkin_type
    cursor = db.checkins.find(q).sort([("date", -1), ("updated_at", -1)]).limit(limit)
    return [_serialize(d) for d in cursor]


def latest_checkin() -> dict | None:
    db = get_db()
    doc = db.checkins.find_one({"user_id": config.DEMO_USER_ID}, sort=[("date", -1), ("updated_at", -1)])
    return _serialize(doc) if doc else None


def range_checkins(days: int) -> list[dict]:
    db = get_db()
    from datetime import timedelta

    start = (datetime.now() - timedelta(days=days)).date().isoformat()
    cursor = db.checkins.find(
        {"user_id": config.DEMO_USER_ID, "date": {"$gte": start}}
    ).sort([("date", -1), ("updated_at", -1)])
    return [_serialize(d) for d in cursor]


def recent_checkins(limit: int = 14) -> list[dict]:
    return list_checkins(limit=limit)


def checkin_status() -> dict:
    today = _today()
    db = get_db()
    types = {d["checkin_type"] for d in db.checkins.find(
        {"user_id": config.DEMO_USER_ID, "date": today}, {"checkin_type": 1}
    )}
    return {"midday": "midday" in types, "evening": "evening" in types, "today": today}
