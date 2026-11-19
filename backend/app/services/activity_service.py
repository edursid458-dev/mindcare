"""Activity library CRUD, completions, saves, and status."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from .. import config
from ..db import get_db
from .feedback_service import now_utc


def _serialize_activity(doc: dict) -> dict:
    out = dict(doc)
    out.pop("_id", None)
    if isinstance(out.get("created_at"), datetime):
        out["created_at"] = out["created_at"].isoformat()
    return out


def list_active() -> list[dict]:
    cursor = get_db().activities.find({"is_active": True}).sort([("category", 1), ("priority", 1)])
    return [_serialize_activity(d) for d in cursor]


def get_activity(activity_id: str) -> dict | None:
    doc = get_db().activities.find_one({"activity_id": activity_id, "is_active": True})
    return _serialize_activity(doc) if doc else None


def all_activities() -> list[dict]:
    cursor = get_db().activities.find({}).sort([("category", 1), ("priority", 1)])
    return [_serialize_activity(d) for d in cursor]


def _activity_title(activity_id: str) -> str | None:
    doc = get_db().activities.find_one({"activity_id": activity_id}, {"activity_title": 1})
    return doc["activity_title"] if doc else None


def complete_activity(activity_id: str, rating: int | None, feedback: str | None) -> dict:
    db = get_db()
    act = db.activities.find_one({"activity_id": activity_id, "is_active": True})
    if not act:
        return None  # type: ignore[return-value]
    completion_id = str(uuid.uuid4())
    doc = {
        "completion_id": completion_id,
        "user_id": config.DEMO_USER_ID,
        "activity_id": activity_id,
        "activity_title": act["activity_title"],
        "rating": rating,
        "feedback": feedback,
        "completed_at": now_utc(),
    }
    db.activity_completions.insert_one(doc)
    return {
        "completion_id": completion_id,
        "activity_id": activity_id,
        "activity_title": act["activity_title"],
        "rating": rating,
        "feedback": feedback,
        "completed_at": doc["completed_at"].isoformat(),
    }


def save_activity(activity_id: str) -> dict:
    db = get_db()
    if not db.activities.find_one({"activity_id": activity_id, "is_active": True}):
        return None  # type: ignore[return-value]
    db.saved_activities.update_one(
        {"user_id": config.DEMO_USER_ID, "activity_id": activity_id},
        {"$setOnInsert": {"user_id": config.DEMO_USER_ID, "activity_id": activity_id,
                          "saved_at": now_utc()}},
        upsert=True,
    )
    return {"activity_id": activity_id, "saved": True}


def unsave_activity(activity_id: str) -> dict:
    get_db().saved_activities.delete_one(
        {"user_id": config.DEMO_USER_ID, "activity_id": activity_id}
    )
    return {"activity_id": activity_id, "saved": False}


def activity_status(activity_id: str) -> dict:
    db = get_db()
    completed = db.activity_completions.find_one(
        {"user_id": config.DEMO_USER_ID, "activity_id": activity_id},
        sort=[("completed_at", -1)],
    )
    saved = db.saved_activities.find_one(
        {"user_id": config.DEMO_USER_ID, "activity_id": activity_id}
    )
    return {
        "completed": completed is not None,
        "saved": saved is not None,
        "last_rating": completed.get("rating") if completed else None,
    }


def completions_history(limit: int = 50) -> list[dict]:
    cursor = get_db().activity_completions.find(
        {"user_id": config.DEMO_USER_ID}
    ).sort("completed_at", -1).limit(limit)
    out = []
    for d in cursor:
        out.append({
            "completion_id": d["completion_id"],
            "activity_id": d["activity_id"],
            "activity_title": d.get("activity_title"),
            "rating": d.get("rating"),
            "feedback": d.get("feedback"),
            "completed_at": d["completed_at"].isoformat() if isinstance(d.get("completed_at"), datetime) else str(d.get("completed_at")),
        })
    return out


# ---------- recommendation-support queries ----------

def recent_completion_ids(hours: int = 24) -> set[str]:
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    ids = get_db().activity_completions.distinct(
        "activity_id",
        {"user_id": config.DEMO_USER_ID, "completed_at": {"$gte": since}},
    )
    return set(ids)


def completion_counts() -> dict[str, int]:
    pipeline = [
        {"$match": {"user_id": config.DEMO_USER_ID}},
        {"$group": {"_id": "$activity_id", "n": {"$sum": 1}}},
    ]
    return {d["_id"]: d["n"] for d in get_db().activity_completions.aggregate(pipeline)}


def category_preferences() -> dict[str, float]:
    """Net preference per category from ratings (1-5). +1 for >=4, -1 for <=2."""
    acts = {a["activity_id"]: a.get("category") for a in get_db().activities.find({}, {"activity_id": 1, "category": 1})}
    prefs: dict[str, float] = {}
    cursor = get_db().activity_completions.find(
        {"user_id": config.DEMO_USER_ID, "rating": {"$ne": None}}
    )
    for d in cursor:
        cat = acts.get(d["activity_id"])
        if not cat:
            continue
        r = d["rating"]
        delta = 1.0 if r >= 4 else (-1.0 if r <= 2 else 0.0)
        prefs[cat] = prefs.get(cat, 0.0) + delta
    return prefs


def saved_activity_ids() -> set[str]:
    return set(get_db().saved_activities.distinct(
        "activity_id", {"user_id": config.DEMO_USER_ID}
    ))


def recent_completions_for_context(limit: int = 5) -> list[dict]:
    return completions_history(limit=limit)
