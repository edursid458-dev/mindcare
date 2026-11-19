"""Wearable device + simulated reading persistence."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from .. import config
from ..db import get_db
from .simulated_wearable_provider import SimulatedWearableProvider

_provider = SimulatedWearableProvider()


def _serialize_reading(doc: dict) -> dict:
    out = dict(doc)
    out["reading_id"] = str(out.pop("_id"))
    if isinstance(out.get("recorded_at"), datetime):
        out["recorded_at"] = out["recorded_at"].isoformat()
    return out


def _serialize_device(doc: dict | None) -> dict | None:
    if not doc:
        return None
    out = dict(doc)
    out["device_id"] = str(out.pop("_id"))
    if isinstance(out.get("last_received_at"), datetime):
        out["last_received_at"] = out["last_received_at"].isoformat()
    return out


def _get_device() -> dict | None:
    return get_db().wearable_devices.find_one({"user_id": config.DEMO_USER_ID})


def status() -> dict:
    device = _get_device()
    if not device or not device.get("connected"):
        return {"connected": False, "device": None, "last_received_at": None}
    dev = _serialize_device(device)
    last = get_db().wearable_readings.find_one(
        {"user_id": config.DEMO_USER_ID}, sort=[("recorded_at", -1)]
    )
    last_at = last["recorded_at"].isoformat() if last and isinstance(last.get("recorded_at"), datetime) else None
    return {"connected": True, "device": dev, "last_received_at": last_at or device.get("last_received_at")}


def connect() -> dict:
    db = get_db()
    info = _provider.connect(config.DEMO_USER_ID)
    now = datetime.now(timezone.utc)
    existing = _get_device()
    if existing:
        db.wearable_devices.update_one(
            {"_id": existing["_id"]},
            {"$set": {**info, "user_id": config.DEMO_USER_ID, "connected": True}},
        )
    else:
        db.wearable_devices.insert_one({**info, "user_id": config.DEMO_USER_ID, "last_received_at": None})
    st = status()
    # Ensure a first reading exists so /latest isn't empty right after connect.
    if not db.wearable_readings.find_one({"user_id": config.DEMO_USER_ID}):
        sync()
        st = status()
    return st


def disconnect() -> dict:
    db = get_db()
    device = _get_device()
    if device:
        db.wearable_devices.update_one({"_id": device["_id"]}, {"$set": {"connected": False}})
    return {"connected": False, "device": None, "last_received_at": None}


def sync() -> dict:
    db = get_db()
    reading = _provider.generate_reading(config.DEMO_USER_ID)
    doc = {
        "user_id": config.DEMO_USER_ID,
        "reading_id": str(uuid.uuid4()),
        "heart_rate": reading["heart_rate"],
        "steps": reading["steps"],
        "sleep_duration": reading["sleep_duration"],
        "physical_activity": reading["physical_activity"],
        "calories": reading["calories"],
        "recorded_at": reading["recorded_at"],
        "is_simulated": True,
    }
    db.wearable_readings.insert_one(doc)
    device = _get_device()
    if device:
        db.wearable_devices.update_one(
            {"_id": device["_id"]},
            {"$set": {"last_received_at": reading["recorded_at"], "connected": True}},
        )
    return _serialize_reading(doc)


def readings(limit: int = 20) -> list[dict]:
    cursor = get_db().wearable_readings.find(
        {"user_id": config.DEMO_USER_ID}
    ).sort("recorded_at", -1).limit(limit)
    return [_serialize_reading(d) for d in cursor]


def latest_reading() -> dict | None:
    doc = get_db().wearable_readings.find_one(
        {"user_id": config.DEMO_USER_ID}, sort=[("recorded_at", -1)]
    )
    return _serialize_reading(doc) if doc else None
