"""Deterministic, explainable activity recommendation engine.

Score = weighted sum of dimension matches
        (mood 25%, stress 20%, energy 20%, sleep 15%, activity 10%, time-of-day 10%)
        minus recency/completion penalties, normalized to ~0-1.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from .. import config
from ..db import get_db
from . import activity_service, checkin_service

DIMENSION_WEIGHTS = {
    "mood": 0.25,
    "stress": 0.20,
    "energy": 0.20,
    "sleep": 0.15,
    "activity": 0.10,
    "time": 0.10,
}

GENERAL_REASON = "General suggestion — complete a check-in for personalization"


def _bucket(level: int) -> str:
    return "low" if level <= 3 else ("medium" if level <= 6 else "high")


def _sleep_bucket(checkin: dict) -> str:
    sq = checkin.get("sleep_quality")
    sd = checkin.get("sleep_duration")
    if sq in ("very_poor", "poor") or (sd is not None and sd < 6):
        return "poor"
    if sq == "average":
        return "average"
    return "good"


def _time_bucket() -> str:
    h = datetime.now().hour
    if h < 12:
        return "morning"
    if h < 17:
        return "afternoon"
    return "evening"


def _match(activity: dict, field: str, value: str) -> bool:
    suitable = activity.get(field) or []
    return value in suitable or "any" in suitable or "all" in suitable or "anytime" in suitable


def _score_activity(act: dict, checkin: dict, prefs: dict[str, float],
                    recent_ids: set[str], counts: dict[str, int],
                    saved: set[str]) -> tuple[float, list[str]]:
    reasons: list[str] = []
    raw = 0.0

    dims = [
        ("mood", "suitable_mood", checkin.get("mood"),
         f"your mood ({checkin.get('mood')})"),
        ("stress", "suitable_stress_levels", _bucket(checkin["stress_level"]),
         f"your high stress ({checkin['stress_level']}/10)" if checkin["stress_level"] >= 7
         else f"your stress level ({checkin['stress_level']}/10)"),
        ("energy", "suitable_energy_levels", _bucket(checkin["energy_level"]),
         f"your {'low' if checkin['energy_level'] <= 4 else 'energy'} level ({checkin['energy_level']}/10)"),
        ("sleep", "suitable_sleep_conditions", _sleep_bucket(checkin),
         f"your {'poor' if _sleep_bucket(checkin) == 'poor' else 'sleep'} quality"),
        ("activity", "suitable_activity_levels", checkin.get("physical_activity") or "light",
         f"your activity level ({checkin.get('physical_activity')})"),
        ("time", "suitable_time_of_day", _time_bucket(), f"the { _time_bucket() } time of day"),
    ]
    for key, field, value, label in dims:
        if _match(act, field, value):
            raw += DIMENSION_WEIGHTS[key]
            reasons.append(label)

    # Penalties / boosts
    aid = act["activity_id"]
    if aid in recent_ids:
        raw -= 0.15
    raw -= min(0.10, counts.get(aid, 0) * 0.02)
    if aid in saved:
        raw += 0.03
    cat_pref = prefs.get(act.get("category"), 0.0)
    if cat_pref > 0:
        raw += min(0.08, cat_pref * 0.03)
    elif cat_pref < 0:
        raw -= min(0.12, abs(cat_pref) * 0.05)

    score = max(0.0, min(1.0, raw))
    return score, reasons


def _reason_string(reasons: list[str]) -> str:
    if not reasons:
        return "Good general fit for how you're feeling right now"
    if len(reasons) == 1:
        return f"Matches {reasons[0]}"
    return "Matches " + ", ".join(reasons[:-1]) + f" and {reasons[-1]}"


def _general_suggestions(n_primary: int = 1, n_additional: int = 4) -> tuple[list[dict], list[dict]]:
    acts = activity_service.all_activities()
    general = [a for a in acts if a.get("category") == "general_wellness" and a.get("is_active")]
    general.sort(key=lambda a: a.get("priority", 99))
    if not general:
        general = sorted([a for a in acts if a.get("is_active")],
                         key=lambda a: a.get("priority", 99))
    picks = general[: n_primary + n_additional]
    primary = {**picks[0], "reason": GENERAL_REASON} if picks else None
    additional = [{**p, "reason": GENERAL_REASON} for p in picks[1:]]
    return ([primary] if primary else []), additional


def get_recommendations() -> dict:
    """Returns {primary, additional, personalized}."""
    checkin = checkin_service.latest_checkin()
    db = get_db()

    if not checkin:
        prim, add = _general_suggestions()
        primary = prim[0] if prim else None
        _store_result(primary, [a["activity_id"] for a in add], personalized=False)
        return {"primary": primary, "additional": add, "personalized": False}

    acts = activity_service.list_active()
    prefs = activity_service.category_preferences()
    recent_ids = activity_service.recent_completion_ids(hours=24)
    counts = activity_service.completion_counts()
    saved = activity_service.saved_activity_ids()

    scored = []
    for act in acts:
        score, reasons = _score_activity(act, checkin, prefs, recent_ids, counts, saved)
        scored.append((score, act, reasons))
    scored.sort(key=lambda t: t[0], reverse=True)

    # Rotation: don't repeat the same primary when an equally suitable
    # alternative exists and the top pick was completed in the last 24h.
    if len(scored) > 1 and scored[0][1]["activity_id"] in recent_ids \
            and scored[0][0] - scored[1][0] < 0.05:
        scored = [scored[1], scored[0]] + scored[2:]

    def to_out(score, act, reasons):
        return {**act, "reason": _reason_string(reasons)}

    primary = to_out(*scored[0]) if scored else None
    additional = [to_out(s, a, r) for s, a, r in scored[1:5]]

    _store_result(primary, [a["activity_id"] for a in additional], personalized=True)
    return {"primary": primary, "additional": additional, "personalized": True}


def _store_result(primary: dict | None, additional_ids: list[str], personalized: bool) -> None:
    if isinstance(primary, list):
        primary = primary[0] if primary else None
    get_db().recommendation_results.insert_one({
        "result_id": str(uuid.uuid4()),
        "user_id": config.DEMO_USER_ID,
        "primary_activity_id": primary["activity_id"] if primary else None,
        "additional_activity_ids": additional_ids,
        "personalized": personalized,
        "generated_at": datetime.now(timezone.utc),
    })


def primary_recommendation() -> dict:
    recs = get_recommendations()
    checkin = checkin_service.latest_checkin()
    return {"recommendation": recs["primary"], "has_checkin": checkin is not None}
