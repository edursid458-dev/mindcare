from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .api import (
    routes_activities,
    routes_analytics,
    routes_checkins,
    routes_conversations,
    routes_dashboard,
    routes_recommendations,
    routes_wearables,
)
from .db import ensure_indexes
from .services.user_service import ensure_demo_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_indexes()
    ensure_demo_user()
    yield


app = FastAPI(title="MindCare AI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (
    routes_checkins.router,
    routes_wearables.router,
    routes_analytics.router,
    routes_activities.router,
    routes_recommendations.router,
    routes_conversations.router,
    routes_conversations.feedback_router,
    routes_dashboard.router,
):
    app.include_router(r, prefix="/api")
