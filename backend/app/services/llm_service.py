"""LLM orchestration: system prompts per mode, safety handling, titles."""
from __future__ import annotations

from . import gemini_provider, wellness_context_service

BASE_PERSONALITY = """You are MindCare AI, a calm, empathetic mental-wellness companion.
Style: warm, observant, and supportive. You may be slightly witty ONLY when the
user's mood is light and the moment is clearly casual — never during distress.
You NEVER diagnose medical or mental-health conditions, and you NEVER claim to
replace professional care. If the user seems to need professional help, gently
suggest speaking with a counselor, doctor, or a trusted person.
Keep replies concise (a few short paragraphs or a short list). Use the user's
wellness context when relevant, but do not recite it robotically."""

MODE_INSTRUCTIONS = {
    "balanced": (
        "Mode: BALANCED — respond with a helpful mix of empathy and light "
        "guidance. Validate feelings first, then offer one or two practical "
        "suggestions when appropriate."
    ),
    "listen": (
        "Mode: JUST LISTEN — your job is to reflect and make the user feel "
        "heard. Do NOT give advice, do NOT list suggestions, do NOT problem-solve. "
        "Mirror their emotions, ask at most one gentle clarifying question, and "
        "keep it warm and short."
    ),
    "think": (
        "Mode: HELP ME THINK IT THROUGH — act as a Socratic thinking partner. "
        "Ask open-ended questions that help the user explore their own thoughts, "
        "assumptions, and options. Do NOT tell them what to do; guide them to "
        "their own insight. One or two questions per reply is ideal."
    ),
    "steps": (
        "Mode: PRACTICAL NEXT STEPS — the user wants actionable help. Offer a "
        "small, concrete, ordered set of next steps (usually 2-4) they can do "
        "today. Keep each step specific and achievable."
    ),
}

SAFETY_NOTE = """SAFETY: If the user's message suggests serious emotional distress,
crisis, or any risk of self-harm, respond with deep empathy FIRST. Do not "
"minimize. Then include this support information naturally:
- In India, Tele-MANAS (Government of India mental health helpline) is available
  24/7 at 14416 (toll-free).
- If there is immediate danger, urge them to contact local emergency services
  right away.
- Suggest reaching out to a trusted person or a mental-health professional.
Do not be clinical or alarmist — be humane."""

CRISIS_FOLLOWUP = (
    "\n\n---\nIf you are in immediate danger, please contact your local emergency "
    "services right away. In India, you can call Tele-MANAS at 14416 (toll-free, "
    "24/7) to speak with a mental-health professional. You deserve support."
)


def _system_prompt(mode: str) -> str:
    context = wellness_context_service.build_context()
    return (
        f"{BASE_PERSONALITY}\n\n{MODE_INSTRUCTIONS.get(mode, MODE_INSTRUCTIONS['balanced'])}\n\n"
        f"{SAFETY_NOTE}\n\n"
        "USER WELLNESS CONTEXT (some data may be simulated — say so if relevant):\n"
        f"{context}"
    )


def check_safety_risk(user_message: str, history: list[dict]) -> bool:
    """LLM-based distress/self-harm classifier (not keyword matching)."""
    if not gemini_provider.is_configured():
        return False
    recent = "\n".join(
        f"{m['role']}: {m['content'][:300]}" for m in history[-6:]
    )
    prompt = (
        "You are a safety classifier for a mental-wellness chat. Decide whether the "
        "user's latest message indicates serious emotional distress, a mental-health "
        "crisis, or ANY risk of self-harm or suicide — even if phrased indirectly, "
        "sarcastically, or vaguely.\n\n"
        f"Recent conversation:\n{recent}\n\n"
        f"Latest user message: \"{user_message[:1000]}\"\n\n"
        "Answer with exactly one word: YES or NO."
    )
    try:
        answer = gemini_provider.generate(
            system_instruction="You are a precise binary classifier. Reply YES or NO only.",
            contents=[{"role": "user", "text": prompt}],
            timeout_s=15,
        )
        return answer.strip().upper().startswith("YES")
    except Exception:
        return False


def chat_reply(history: list[dict], user_message: str, mode: str) -> tuple[str | None, str | None]:
    """Returns (reply_text, error_code)."""
    if not gemini_provider.is_configured():
        return None, "ai_not_configured"

    system = _system_prompt(mode)
    contents = [{"role": m["role"], "text": m["content"]} for m in history[-20:]]
    contents.append({"role": "user", "text": user_message})

    try:
        reply = gemini_provider.generate(system, contents)
    except Exception as e:
        code = "ai_not_configured" if "ai_not_configured" in str(e) else "llm_error"
        return None, code

    # LLM-based safety check: if risk detected and the reply doesn't already
    # mention crisis support, append the support note.
    try:
        if check_safety_risk(user_message, history) and "14416" not in reply:
            reply = reply.rstrip() + CRISIS_FOLLOWUP
    except Exception:
        pass

    return reply, None


def generate_title(first_user_message: str) -> str:
    """≤6-word conversation title via a tiny LLM call; falls back to truncation."""
    fallback = first_user_message.strip().split("\n")[0][:60]
    if not gemini_provider.is_configured():
        return fallback
    try:
        title = gemini_provider.generate(
            system_instruction=(
                "Generate a very short conversation title (maximum 6 words, "
                "no quotes, no punctuation at the end) summarizing the topic."
            ),
            contents=[{"role": "user", "text": f"User's first message: {first_user_message[:500]}"}],
            timeout_s=15,
        )
        title = title.strip().strip('"').split("\n")[0][:80]
        return title or fallback
    except Exception:
        return fallback
