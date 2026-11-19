"""Assembles a compact wellness context block for the LLM system prompt."""
from __future__ import annotations

from . import activity_service, analytics_service, checkin_service, wearable_service


def build_context() -> str:
    lines: list[str] = []

    # --- Recent check-ins (last ~14) ---
    checkins = checkin_service.recent_checkins(limit=14)
    if checkins:
        lines.append("RECENT CHECK-INS (user-reported, most recent first):")
        for c in checkins[:14]:
            lines.append(
                f"- {c['date']} {c['checkin_type']}: mood={c['mood']}, "
                f"stress={c['stress_level']}/10, energy={c['energy_level']}/10, "
                f"sleep={c.get('sleep_duration')}h/{c.get('sleep_quality')}, "
                f"activity={c.get('physical_activity')}"
            )
    else:
        lines.append("RECENT CHECK-INS: none yet — the user has not completed any check-ins.")

    # --- Wearable readings (simulated) ---
    reading = wearable_service.latest_reading()
    if reading:
        lines.append(
            "LATEST WEARABLE READING (SIMULATED DATA — always label it as simulated if you mention it): "
            f"heart_rate={reading['heart_rate']}bpm, steps={reading['steps']}, "
            f"sleep={reading['sleep_duration']}h, activity={reading['physical_activity']}, "
            f"calories={reading['calories']}, recorded_at={reading['recorded_at']}"
        )
    else:
        lines.append("WEARABLE DATA: none — no simulated wearable readings yet.")

    # --- Analytics summary (7 days) ---
    try:
        trends = analytics_service.trends(7)
        if trends["points"]:
            avg_stress = sum(p["stress_level"] for p in trends["points"]) / len(trends["points"])
            lines.append(
                f"ANALYTICS (last 7 days): {len(trends['points'])} days with data, "
                f"avg stress ~{avg_stress:.1f}/10, "
                f"completion rate {int(trends['completion_rate'] * 100)}%."
            )
            for obs in trends["observations"][:3]:
                lines.append(f"  - {obs}")
        else:
            lines.append("ANALYTICS: no check-in data in the last 7 days.")
    except Exception:
        lines.append("ANALYTICS: unavailable right now.")

    # --- Top recommendations ---
    try:
        from . import recommendation_service
        recs = recommendation_service.get_recommendations()
        if recs.get("primary"):
            p = recs["primary"]
            lines.append(
                f"CURRENT TOP RECOMMENDATION: '{p['activity_title']}' ({p['category']})"
                + (f" — reason: {p.get('reason')}" if p.get("reason") else "")
            )
    except Exception:
        pass

    # --- Recent activity completions ---
    try:
        comps = activity_service.recent_completions_for_context(limit=5)
        if comps:
            lines.append("RECENT ACTIVITY COMPLETIONS:")
            for c in comps:
                lines.append(f"- {c.get('activity_title') or c['activity_id']} on {str(c['completed_at'])[:10]}")
        else:
            lines.append("RECENT ACTIVITY COMPLETIONS: none yet.")
    except Exception:
        pass

    return "\n".join(lines)
