from pymongo import MongoClient
from pymongo.database import Database

from . import config

_client: MongoClient | None = None
_db: Database | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(config.MONGO_URL, serverSelectionTimeoutMS=5000)
    return _client


def get_db() -> Database:
    global _db
    if _db is None:
        _db = get_client()[config.DB_NAME]
    return _db


def ensure_indexes() -> None:
    db = get_db()
    db.users.create_index("user_id", unique=True)
    db.conversations.create_index("conversation_id", unique=True)
    db.conversations.create_index([("user_id", 1), ("updated_at", -1)])
    db.chat_messages.create_index("message_id", unique=True)
    db.chat_messages.create_index([("conversation_id", 1), ("timestamp", 1)])
    db.chat_messages.create_index("user_id")
    db.checkins.create_index([("user_id", 1), ("checkin_type", 1), ("date", 1)], unique=True)
    db.checkins.create_index([("user_id", 1), ("date", -1)])
    db.wearable_devices.create_index([("user_id", 1), ("connected", 1)])
    db.wearable_readings.create_index([("user_id", 1), ("recorded_at", -1)])
    db.activities.create_index("activity_id", unique=True)
    db.activities.create_index([("is_active", 1), ("category", 1)])
    db.recommendation_results.create_index([("user_id", 1), ("generated_at", -1)])
    db.activity_completions.create_index([("user_id", 1), ("completed_at", -1)])
    db.activity_completions.create_index([("user_id", 1), ("activity_id", 1)])
    db.saved_activities.create_index([("user_id", 1), ("activity_id", 1)], unique=True)
