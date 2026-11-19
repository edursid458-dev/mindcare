"""Pydantic v2 schemas for all API request/response bodies."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

Mood = Literal["very_happy", "happy", "neutral", "sad", "very_sad", "anxious", "irritated"]
SleepQuality = Literal["very_poor", "poor", "average", "good", "excellent"]
PhysicalActivity = Literal["none", "light", "moderate", "intense"]
CheckinType = Literal["midday", "evening"]
ChatMode = Literal["balanced", "listen", "think", "steps"]


# ---------- Check-ins ----------
class CheckinCreate(BaseModel):
    checkin_type: CheckinType
    mood: Mood
    stress_level: int = Field(ge=1, le=10)
    energy_level: int = Field(ge=1, le=10)
    sleep_duration: Optional[float] = Field(default=None, ge=0, le=24)
    sleep_quality: Optional[SleepQuality] = None
    physical_activity: Optional[PhysicalActivity] = None
    emotional_notes: Optional[str] = ""
    daily_challenges: Optional[str] = ""
    social_interaction: Optional[str] = ""


class CheckinOut(CheckinCreate):
    checkin_id: str
    date: str
    created_at: str
    updated_at: str


class CheckinStatus(BaseModel):
    midday: bool
    evening: bool
    today: str


# ---------- Wearables ----------
class WearableDeviceOut(BaseModel):
    device_id: str
    name: str
    device_type: str
    is_simulated: bool
    connected: bool
    last_received_at: Optional[str] = None


class WearableStatus(BaseModel):
    connected: bool
    device: Optional[WearableDeviceOut] = None
    last_received_at: Optional[str] = None


class ReadingOut(BaseModel):
    reading_id: str
    heart_rate: int
    steps: int
    sleep_duration: float
    physical_activity: str
    calories: int
    recorded_at: str
    is_simulated: bool = True


# ---------- Analytics ----------
class TrendPoint(BaseModel):
    date: str
    mood: str
    mood_value: int
    stress_level: int
    sleep_duration: Optional[float] = None
    energy_level: int


class Progress(BaseModel):
    stress_delta: Optional[float] = None
    energy_delta: Optional[float] = None
    sleep_delta: Optional[float] = None


class TrendsResponse(BaseModel):
    days: int
    points: list[TrendPoint]
    checkin_count: int
    completion_rate: float
    observations: list[str]
    progress: Progress


# ---------- Activities & recommendations ----------
class InstructionStep(BaseModel):
    step: int
    text: str


class ActivityOut(BaseModel):
    activity_id: str
    activity_title: str
    category: str
    description: str
    target_scenario: str
    suitable_mood: list[str]
    suitable_stress_levels: list[str]
    suitable_energy_levels: list[str]
    suitable_sleep_conditions: list[str]
    suitable_activity_levels: list[str]
    suitable_time_of_day: list[str]
    estimated_duration: str
    difficulty_level: str
    required_materials: list[str]
    instructions: list[InstructionStep]
    demonstration_type: str
    animation_reference: str
    benefits: list[str]
    contraindications_or_precautions: list[str]
    priority: int
    is_active: bool
    reason: Optional[str] = None


class PrimaryRecommendation(BaseModel):
    recommendation: Optional[ActivityOut] = None
    has_checkin: bool


class RecommendationsResponse(BaseModel):
    primary: Optional[ActivityOut] = None
    additional: list[ActivityOut]
    personalized: bool


class CompleteRequest(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    feedback: Optional[str] = None


class SaveResponse(BaseModel):
    activity_id: str
    saved: bool


class ActivityStatus(BaseModel):
    completed: bool
    saved: bool
    last_rating: Optional[int] = None


class CompletionRecord(BaseModel):
    completion_id: str
    activity_id: str
    activity_title: Optional[str] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None
    completed_at: str


# ---------- Conversations ----------
class ConversationListItem(BaseModel):
    conversation_id: str
    title: str
    created_at: str
    updated_at: str
    preview: str


class ConversationOut(ConversationListItem):
    messages: list["MessageOut"] = []


class MessageOut(BaseModel):
    message_id: str
    role: Literal["user", "assistant"]
    content: str
    timestamp: str
    feedback: Optional[Literal["up", "down"]] = None


class PostMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=8000)
    mode: ChatMode = "balanced"


class SendMessageResponse(BaseModel):
    user_message: MessageOut
    assistant_message: Optional[MessageOut] = None
    error: Optional[Literal["ai_not_configured", "llm_error"]] = None


class PatchConversationRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)


class FeedbackRequest(BaseModel):
    feedback: Literal["up", "down"]


# ---------- Dashboard ----------
class DashboardResponse(BaseModel):
    checkin_status: dict
    primary_recommendation: Optional[ActivityOut] = None
    recent_checkins_count: int
    wellness_observations: list[str]
