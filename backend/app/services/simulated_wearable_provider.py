"""Simulated wearable data provider (no real hardware)."""
from __future__ import annotations

import random
from datetime import datetime


class WearableProviderInterface:
    def connect(self, user_id: str) -> dict: ...
    def disconnect(self, user_id: str) -> None: ...
    def generate_reading(self, user_id: str) -> dict: ...


class SimulatedWearableProvider(WearableProviderInterface):
    """Generates plausible-but-fake biometric readings for demo purposes."""

    DEVICE_NAME = "MindBand Sim"
    DEVICE_TYPE = "simulated wrist wearable"

    def connect(self, user_id: str) -> dict:
        return {
            "name": self.DEVICE_NAME,
            "device_type": self.DEVICE_TYPE,
            "is_simulated": True,
            "connected": True,
        }

    def disconnect(self, user_id: str) -> None:
        return None

    def generate_reading(self, user_id: str) -> dict:
        now = datetime.now()
        hour = now.hour + now.minute / 60.0

        # Heart rate: lower at night, higher midday, mild random variation.
        if 0 <= hour < 6:
            hr = random.randint(52, 62)
        elif 6 <= hour < 9:
            hr = random.randint(60, 75)
        elif 9 <= hour < 17:
            hr = random.randint(66, 95)
        elif 17 <= hour < 22:
            hr = random.randint(62, 85)
        else:
            hr = random.randint(55, 68)

        # Steps: cumulative-ish daily total that grows through the day.
        day_progress = min(1.0, max(0.05, (hour - 6) / 16.0)) if 6 <= hour <= 22 else 0.02
        daily_total = random.randint(int(4000 + 9000 * day_progress), int(6000 + 11000 * day_progress))
        steps = max(0, daily_total)

        sleep_hours = round(random.uniform(4.5, 9.0), 1)
        activity_minutes = random.randint(10, 90) if hour >= 6 else random.randint(0, 20)
        calories = random.randint(1400, 2800)

        activity_level = (
            "intense" if activity_minutes > 60 else
            "moderate" if activity_minutes > 25 else
            "light" if activity_minutes > 5 else "none"
        )

        return {
            "heart_rate": hr,
            "steps": steps,
            "sleep_duration": sleep_hours,
            "physical_activity": activity_level,
            "calories": calories,
            "recorded_at": now,
            "is_simulated": True,
        }
