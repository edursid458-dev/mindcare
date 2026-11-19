from .. import config
from ..db import get_db


def ensure_demo_user() -> None:
    """Idempotently ensure the fixed demo user document exists."""
    get_db().users.update_one(
        {"user_id": config.DEMO_USER_ID},
        {"$setOnInsert": {"user_id": config.DEMO_USER_ID, "name": config.DEMO_USER_NAME}},
        upsert=True,
    )
