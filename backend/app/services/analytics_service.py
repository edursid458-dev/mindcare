"""Analytics: trend aggregation + honest, Python-computed observations."""
from __future__ import annotations

from datetime import datetime, timedelta

from . import checkin_service

MOOD_VALUES = {
    "very_happy": 5, "happy": 4, "neutral": 3,
    "sad": 2, "very_sad": 1, "anxious": 2, "irritated": 2,
}


def _avg(vals: list[float]) -> float | None:
    vals = [v for v in vals if v is not None]
    return round(sum(vals) / len(vals), 2) if vals else None


def _period_checkins(days: int) -> tuple[list[dict], list[dict]]:
    """Returns (current_period, previous_period) check-in lists."""
    # Fetch a window covering both periods and split by date.
    all_docs = checkin_service.range_checkins(days * 2)
    today = datetime.now().date()
    start_current = today - timedelta(days=days - 1)
    start_prev = today - timedelta(days=days * 2 - 1)
    cur, prev = [], []
    for d in all_docs:
        try:
            ddate = datetime.fromisoformat(d["date"]).date() if "T" not in d["date"] else datetime.fromisoformat(d["date"]).date()
        except Exception:
            ddate = datetime.now().date()
        if ddate >= start_current:
            cur.append(d)
        elif ddate >= start_prev:
            prev.append(d)
    return cur, prev


def _latest_per_day(docs: list[dict]) -> dict[str, dict]:
    """One representative check-in per date: the latest updated of that day."""
    best: dict[str, dict] = {}
    for d in docs:
        date = d["date"]
        if date not in best or str(d.get("updated_at", "")) > str(best[date].get("updated_at", "")):
            best[date] = d
    return best


def _points(docs: list[dict]) -> list[dict]:
    per_day = _latest_per_day(docs)
    points = []
    for date in sorted(per_day):
        d = per_day[date]
        points.append({
            "date": date,
            "mood": d["mood"],
            "mood_value": MOOD_VALUES.get(d["mood"], 3),
            "stress_level": d["stress_level"],
            "sleep_duration": d.get("sleep_duration"),
            "energy_level": d["energy_level"],
        })
    return points


def _observations(points: list[dict], cur_docs: list[dict], prev_docs: list[dict], days: int) -> list[str]:
    obs: list[str] = []
    n = len(points)

    if n < 3:
        obs.append(
            f"Data is limited — only {n} day(s) of check-ins in this {days}-day window. "
            "Observations will become more reliable with a few more check-ins."
        )
        return obs

    cur_stress = _avg([p["stress_level"] for p in points])
    prev_points = _points(prev_docs)
    prev_stress = _avg([p["stress_level"] for p in prev_points])
    if cur_stress is not None and prev_stress is not None:
        delta = round(cur_stress - prev_stress, 1)
        if abs(delta) < 0.5:
            obs.append(f"Your average stress has stayed roughly steady ({cur_stress}/10) versus the previous period.")
        elif delta > 0:
            obs.append(f"Your average stress is up {delta} points ({cur_stress}/10 now vs {prev_stress}/10 before) — consider extra-rest activities.")
        else:
            obs.append(f"Your average stress is down {abs(delta)} points ({cur_stress}/10 now vs {prev_stress}/10 before) — nice progress.")
    elif cur_stress is not None:
        obs.append(f"Average stress this period: {cur_stress}/10 (no prior-period data to compare).")

    # Sleep < 6h analysis
    short_sleep = [p for p in points if p.get("sleep_duration") is not None and p["sleep_duration"] < 6]
    if short_sleep:
        avg_energy = _avg([p["energy_level"] for p in short_sleep])
        obs.append(
            f"You slept under 6 hours on {len(short_sleep)} day(s); "
            f"average energy on those days was {avg_energy}/10."
        )
    else:
        obs.append("No nights under 6 hours of sleep were recorded in this window.")

    # Mood distribution
    moods = {}
    for p in points:
        moods[p["mood"]] = moods.get(p["mood"], 0) + 1
    top_mood = max(moods.items(), key=lambda kv: kv[1])
    obs.append(f"Most common mood: {top_mood[0].replace('_', ' ')} ({top_mood[1]} of {n} days).")

    # Consistency
    expected = days * 2
    submitted = len(cur_docs)
    obs.append(
        f"Check-in consistency: {submitted} of ~{expected} expected check-ins "
        f"({round(min(1.0, submitted / expected) * 100)}%)."
    )
    return obs


def _progress(points: list[dict], prev_points: list[dict]) -> dict:
    def delta(field):
        cur = _avg([p[field] for p in points if p.get(field) is not None])
        prev = _avg([p[field] for p in prev_points if p.get(field) is not None])
        if cur is None or prev is None:
            return None
        return round(cur - prev, 2)

    return {
        "stress_delta": delta("stress_level"),
        "energy_delta": delta("energy_level"),
        "sleep_delta": delta("sleep_duration"),
    }


def trends(days: int) -> dict:
    cur_docs, prev_docs = _period_checkins(days)
    points = _points(cur_docs)
    prev_points = _points(prev_docs)

    expected = days * 2
    submitted = len(cur_docs)
    completion_rate = round(min(1.0, submitted / expected), 3) if expected else 0.0

    return {
        "days": days,
        "points": points,
        "checkin_count": submitted,
        "completion_rate": completion_rate,
        "observations": _observations(points, cur_docs, prev_docs, days),
        "progress": _progress(points, prev_points),
    }
