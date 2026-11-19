"""Thin wrapper around the google-genai SDK. Backend-only; never exposes keys."""
from __future__ import annotations

from .. import config

_client = None


def is_configured() -> bool:
    return bool(config.GEMINI_API_KEY)


def _get_client():
    global _client
    if _client is None:
        from google import genai
        _client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _client


def generate(system_instruction: str, contents: list[dict], timeout_s: int = 30) -> str:
    """contents: list of {"role": "user"|"model", "text": str}.
    Returns the model's text reply. Raises on any failure."""
    if not is_configured():
        raise RuntimeError("ai_not_configured")

    from google.genai import types

    client = _get_client()
    # google-genai expects Content-shaped dicts: {"role": ..., "parts": [{"text": ...}]}
    normalized = [
        {
            "role": "model" if m["role"] in ("assistant", "model") else "user",
            "parts": [{"text": m["text"]}],
        }
        for m in contents
    ]
    resp = client.models.generate_content(
        model=config.GEMINI_MODEL,
        contents=normalized,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
        ),
    )
    text = getattr(resp, "text", None)
    if not text:
        raise RuntimeError("empty_response")
    return text.strip()
