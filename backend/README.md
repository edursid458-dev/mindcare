# MindCare AI — Backend

FastAPI + MongoDB backend for the MindCare AI mental-wellness companion.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then edit .env
```

MongoDB must be running locally (default `mongodb://localhost:27017`, db `mindcare`).
With Homebrew: `brew services start mongodb-community`.

## Environment (.env)

| Var | Purpose |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name (`mindcare`) |
| `GEMINI_API_KEY` | Gemini API key — leave empty to disable AI chat |
| `GEMINI_MODEL` | Model name (default `gemini-3.5-flash`) |
| `CORS_ORIGINS` | Comma-separated allowed origins (default `http://localhost:5173`) |

## Seed the activity library

The 70-activity library is NOT seeded on startup. Run once (idempotent):

```bash
python scripts/seed_activities.py        # from backend/
# or: python -m scripts.seed_activities
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API base: `http://localhost:8000/api` (see `../API_CONTRACT.md`).

Without a `GEMINI_API_KEY`, chat endpoints return `assistant_message: null` with
`error: "ai_not_configured"` — everything else works fully.

## Layout

```
app/
  main.py            app factory, CORS, routers, startup (indexes + demo user)
  config.py          env-driven settings
  db.py              pymongo client + index creation
  models.py          pydantic v2 request/response schemas
  api/               route handlers (thin — delegate to services)
  services/          business logic
    user_service            demo-user bootstrap
    checkin_service         check-in CRUD/upsert
    wearable_service        device + simulated readings
    simulated_wearable_provider.py
    analytics_service       trends + observations
    activity_service        library, completions, saves, status
    recommendation_service  deterministic weighted scoring
    conversation_service    conversations/messages/feedback
    wellness_context_service  builds LLM context block
    llm_service             modes, safety, titles
    gemini_provider         google-genai wrapper
    feedback_service        rating/feedback persistence helpers
scripts/
  seed_activities.py  70-activity seed data (idempotent upsert)
```

## Design notes

- One fixed demo user (`demo-user`), no auth.
- Check-ins upsert per `(user_id, checkin_type, local date)`.
- Wearable data is fully simulated (`is_simulated: true` on readings).
- Analytics trend points: one point per day = the latest-updated check-in of that day.
- Recommendations: weighted dimension matching minus recency/completion penalties;
  results persisted to `recommendation_results`.
- Safety: LLM-based distress classification; India support info (Tele-MANAS 14416)
  is appended when risk is detected.
