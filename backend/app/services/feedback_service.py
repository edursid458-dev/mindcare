"""Lightweight activity feedback helpers (ratings / free text)."""
from __future__ import annotations

from datetime import datetime, timezone

from ..db import get_db


def record_completion_feedback(completion_id: str, rating: int | None, feedback: str | None) -> None:
    update: dict = {}
    if rating is not None:
        update["rating"] = rating
    if feedback:
        update["feedback"] = feedback
    if update:
        get_db().activity_completions.update_one(
            {"completion_id": completion_id}, {"$set": update}
        )


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
