# MindCare AI — API Contract (shared between frontend & backend)

Base URL: `http://localhost:8000/api` (frontend dev proxy `/api` → backend).
All responses JSON. Errors: `{ "detail": "..." }` with appropriate HTTP status.
Demo user is fixed server-side: `demo-user` (no auth).

## Check-ins
- `GET /checkins/status` → `{ midday: bool, evening: bool, today: "YYYY-MM-DD" }`
- `GET /checkins?type=midday|evening&limit=50` → list of check-in objects (newest first)
- `GET /checkins/latest` → latest check-in or `null`
- `POST /checkins` body = check-in fields → saved check-in (upsert for same type+date)
- `GET /checkins/range?days=7|30|90` → check-ins within range

Check-in object:
```
{ checkin_id, checkin_type: "midday"|"evening", mood, stress_level(1-10),
  energy_level(1-10), sleep_duration(hours float|null), sleep_quality,
  physical_activity, emotional_notes, daily_challenges, social_interaction,
  created_at, updated_at }
```
Mood enum: very_happy, happy, neutral, sad, very_sad, anxious, irritated
Sleep quality: very_poor, poor, average, good, excellent
Physical activity: none, light, moderate, intense

## Wearables
- `GET /wearables/status` → `{ connected, device: {...}|null, last_received_at }`
- `POST /wearables/connect` → connects simulated device, returns status
- `POST /wearables/disconnect` → disconnects
- `POST /wearables/sync` → generates & stores a new simulated reading, returns it
- `GET /wearables/readings?limit=20` → list of readings
- `GET /wearables/latest` → latest reading or null

Reading: `{ reading_id, heart_rate, steps, sleep_duration, physical_activity, calories, recorded_at }` — always simulated; frontend must label "Simulated data".

## Analytics
- `GET /analytics/trends?days=7|30|90` → `{ days, points: [{date, mood, mood_value, stress_level, sleep_duration, energy_level}], checkin_count, completion_rate, observations: [str], progress: {stress_delta, energy_delta, sleep_delta} }`
  - `mood_value`: numeric mapping very_happy=5, happy=4, neutral=3, sad=2, very_sad=1, anxious=2, irritated=2
  - `observations`: server-computed statistical observations (strings), honest when insufficient data

## Recommendations
- `GET /recommendations/primary` → `{ recommendation: ActivityWithReason|null, has_checkin: bool }`
- `GET /recommendations` → `{ primary, additional: [...], personalized: bool }`
- `GET /activities` → list of all active activities (library)
- `GET /activities/{id}` → full activity incl. instructions & demonstration data
- `POST /activities/{id}/complete` body `{rating?:1-5, feedback?:str}` → completion record
- `POST /activities/{id}/save` → saved record; `DELETE /activities/{id}/save`
- `GET /activities/{id}/status` → `{ completed: bool, saved: bool, last_rating }`
- `GET /recommendations/completions` → completion history

Activity object:
```
{ activity_id, activity_title, category, description, target_scenario,
  suitable_mood[], suitable_stress_levels[], suitable_energy_levels[],
  suitable_sleep_conditions[], suitable_activity_levels[],
  suitable_time_of_day[], estimated_duration, difficulty_level,
  required_materials[], instructions: [{step, text}], demonstration_type,
  animation_reference, benefits[], contraindications_or_precautions,
  priority, is_active, reason? (only in recommendation responses) }
```
Categories: stress_management, sleep_improvement, mood_improvement,
low_energy, physical_activity, mindfulness, general_wellness

## Conversations / Chat
- `GET /conversations` → list `{ conversation_id, title, created_at, updated_at, preview }`
- `POST /conversations` → new conversation `{ conversation_id, title:"New conversation", ... }`
- `GET /conversations/{id}` → conversation + `messages: [{message_id, role:"user"|"assistant", content, timestamp, feedback}]`
- `PATCH /conversations/{id}` body `{title?}` → rename
- `DELETE /conversations/{id}` → delete
- `POST /conversations/{id}/messages` body `{content, mode?: "balanced"|"listen"|"think"|"steps"}` → `{ user_message, assistant_message }` (assistant_message may be null on LLM error with `error` field)
- `POST /messages/{message_id}/feedback` body `{feedback: "up"|"down"}`

If Gemini key missing → assistant_message null + `error: "ai_not_configured"`. Frontend shows retry.

## Dashboard composite
- `GET /dashboard` → `{ checkin_status:{midday,evening}, primary_recommendation, recent_checkins_count, wellness_observations: [str] }`
