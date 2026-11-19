# MindCare AI — Smart Mental Wellness Companion

A full-stack mental wellness app: React + TypeScript + Tailwind frontend,
FastAPI backend, MongoDB database, and Gemini-powered AI chatbot.
Six pages: Dashboard, AI Chatbot, Check-ins, Wearables, Wellness Insights &
Progress, Recommendations (70+ activity library with animated demos).

```
mindcare/
├── backend/    FastAPI + MongoDB + Gemini
├── frontend/   React + Vite + Tailwind + Recharts + Framer Motion
└── API_CONTRACT.md   (frontend/backend shared API spec)
```

## One-time setup (already done on this Mac)

- Node.js, Python 3, MongoDB 7 (Homebrew) — installed.
- `backend/.venv` created, dependencies installed.
- `frontend/node_modules` installed.

## Starting the app — 3 terminals

### 1. MongoDB

```bash
mongod --dbpath /opt/homebrew/var/mongodb --bind_ip 127.0.0.1 --port 27017 --fork --logpath /tmp/mongod.log
```

(If it says "already running", that's fine. `brew services` did not work on this machine — use the command above.)

### 2. Backend (port 8000)

```bash
cd ~/Desktop/mindcare/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

First run only — seed the database (70 activities + demo user):

```bash
python scripts/seed_activities.py
```

### 3. Frontend (port 5173)

```bash
cd ~/Desktop/mindcare/frontend
npm run dev
```

Open http://localhost:5173

## Adding your Gemini API key (for the AI chatbot)

1. Go to https://aistudio.google.com/apikey and create a free API key.
2. `cd ~/Desktop/mindcare/backend && cp .env.example .env`
3. Paste your key into `.env` as `GEMINI_API_KEY=...`
4. Restart the backend (Ctrl+C, then `uvicorn app.main:app --reload --port 8000`).

Without a key the app works fully except the chatbot shows a clear
"AI not configured" state with a retry button — by design.

## Resetting demo data

```bash
mongosh mindcare --eval 'db.dropDatabase()'
# then re-run: python scripts/seed_activities.py  (in backend/.venv)
```

## Deploying (free tiers)

The app has 3 pieces: React frontend, FastAPI backend, MongoDB.

1. **MongoDB** — create a free cluster at https://www.mongodb.com/atlas,
   add a database user, and allow access from `0.0.0.0/0` (or your host's IPs).
   Copy the connection string into the backend's `MONGO_URL` env var.
2. **Backend** — deploy `backend/` to https://render.com (free):
   - New → Web Service → connect your GitHub repo (push this folder to GitHub first)
   - Root directory: `backend`, Build: `pip install -r requirements.txt`,
     Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment vars: `MONGO_URL`, `DB_NAME=mindcare`, `GEMINI_API_KEY`,
     `GEMINI_MODEL=gemini-3.5-flash`, `CORS_ORIGINS=https://your-frontend-url`
   - After first deploy, run the seed once (Render Shell or locally against Atlas):
     `python scripts/seed_activities.py`
3. **Frontend** — deploy `frontend/` to https://vercel.com:
   - Import repo, Root directory: `frontend`
   - Build: `npm run build`, Output: `dist`
   - Env var: `VITE_API_URL=https://your-backend.onrender.com` (no /api suffix)

Note: Render free tier sleeps after ~15 min idle — the first request after
sleep takes ~30-60s. MongoDB Atlas free tier (M0) works fine for a demo.

## Notes

- Wearable data is **simulated** (labeled in the UI) — there is no real device.
- Crisis support info (Tele-MANAS 14416) is built into the chatbot safety layer.
- `npm run build` in `frontend/` produces a production build in `frontend/dist/`.
