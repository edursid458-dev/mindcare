"""Conversation + message persistence and chat orchestration."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from .. import config
from ..db import get_db
from . import llm_service


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt) -> str:
    return dt.isoformat() if isinstance(dt, datetime) else str(dt)


def _serialize_message(doc: dict) -> dict:
    return {
        "message_id": doc["message_id"],
        "role": doc["role"],
        "content": doc["content"],
        "timestamp": _iso(doc["timestamp"]),
        "feedback": doc.get("feedback"),
    }


def _serialize_conv(doc: dict, preview: str = "") -> dict:
    return {
        "conversation_id": doc["conversation_id"],
        "title": doc.get("title", "New conversation"),
        "created_at": _iso(doc["created_at"]),
        "updated_at": _iso(doc["updated_at"]),
        "preview": preview,
    }


def list_conversations() -> list[dict]:
    db = get_db()
    out = []
    for conv in db.conversations.find({"user_id": config.DEMO_USER_ID}).sort("updated_at", -1):
        first = db.chat_messages.find_one(
            {"conversation_id": conv["conversation_id"], "role": "user"},
            sort=[("timestamp", 1)],
        )
        preview = (first["content"][:80] + "…") if first and len(first["content"]) > 80 else (first["content"] if first else "")
        out.append(_serialize_conv(conv, preview))
    return out


def create_conversation() -> dict:
    db = get_db()
    now = _now()
    doc = {
        "conversation_id": str(uuid.uuid4()),
        "user_id": config.DEMO_USER_ID,
        "title": "New conversation",
        "created_at": now,
        "updated_at": now,
    }
    db.conversations.insert_one(doc)
    return _serialize_conv(doc, "")


def _get_conversation(conversation_id: str) -> dict | None:
    return get_db().conversations.find_one({"conversation_id": conversation_id})


def get_conversation(conversation_id: str) -> dict | None:
    conv = _get_conversation(conversation_id)
    if not conv:
        return None
    out = _serialize_conv(conv)
    msgs = get_db().chat_messages.find(
        {"conversation_id": conversation_id}
    ).sort("timestamp", 1)
    out["messages"] = [_serialize_message(m) for m in msgs]
    if out["messages"]:
        out["preview"] = out["messages"][0]["content"][:80]
    return out


def rename_conversation(conversation_id: str, title: str) -> dict | None:
    db = get_db()
    res = db.conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"title": title, "updated_at": _now()}},
    )
    if res.matched_count == 0:
        return None
    return get_conversation(conversation_id)


def delete_conversation(conversation_id: str) -> bool:
    db = get_db()
    res = db.conversations.delete_one({"conversation_id": conversation_id})
    if res.deleted_count:
        db.chat_messages.delete_many({"conversation_id": conversation_id})
        return True
    return False


def _insert_message(conversation_id: str, role: str, content: str, mode: str | None = None) -> dict:
    db = get_db()
    doc = {
        "message_id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "user_id": config.DEMO_USER_ID,
        "role": role,
        "content": content,
        "timestamp": _now(),
        "mode": mode,
        "feedback": None,
    }
    db.chat_messages.insert_one(doc)
    return doc


def send_message(conversation_id: str, content: str, mode: str) -> dict | None:
    """Appends user msg, calls LLM, appends assistant msg on success.
    Returns response dict or None if conversation missing."""
    db = get_db()
    conv = _get_conversation(conversation_id)
    if not conv:
        return None

    user_doc = _insert_message(conversation_id, "user", content, mode=mode)

    # History: last ~20 messages (including the one just added).
    hist_docs = list(db.chat_messages.find(
        {"conversation_id": conversation_id}
    ).sort("timestamp", -1).limit(20))
    hist_docs.reverse()
    history = [{"role": m["role"], "content": m["content"]} for m in hist_docs]

    reply, error = llm_service.chat_reply(history[:-1], content, mode)

    db.conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"updated_at": _now()}},
    )

    # Title generation after the first user message.
    user_msg_count = db.chat_messages.count_documents(
        {"conversation_id": conversation_id, "role": "user"}
    )
    if user_msg_count == 1 and conv.get("title", "New conversation") == "New conversation":
        title = llm_service.generate_title(content)
        db.conversations.update_one(
            {"conversation_id": conversation_id}, {"$set": {"title": title}}
        )

    resp = {
        "user_message": _serialize_message(user_doc),
        "assistant_message": None,
        "error": error,
    }
    if reply is not None:
        asst_doc = _insert_message(conversation_id, "assistant", reply)
        resp["assistant_message"] = _serialize_message(asst_doc)
    return resp


def set_message_feedback(message_id: str, feedback: str) -> dict | None:
    db = get_db()
    res = db.chat_messages.update_one(
        {"message_id": message_id}, {"$set": {"feedback": feedback}}
    )
    if res.matched_count == 0:
        return None
    doc = db.chat_messages.find_one({"message_id": message_id})
    return _serialize_message(doc)
