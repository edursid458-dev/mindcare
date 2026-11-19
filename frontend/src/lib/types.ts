// MindCare AI — TypeScript types matching API_CONTRACT.md

export type CheckinType = 'midday' | 'evening'

export type Mood =
  | 'very_happy'
  | 'happy'
  | 'neutral'
  | 'sad'
  | 'very_sad'
  | 'anxious'
  | 'irritated'

export type SleepQuality = 'very_poor' | 'poor' | 'average' | 'good' | 'excellent'
export type PhysicalActivity = 'none' | 'light' | 'moderate' | 'intense'

export interface Checkin {
  checkin_id: string
  checkin_type: CheckinType
  mood: Mood
  stress_level: number // 1-10
  energy_level: number // 1-10
  sleep_duration: number | null // hours
  sleep_quality: SleepQuality | null
  physical_activity: PhysicalActivity | null
  emotional_notes: string | null
  daily_challenges: string | null
  social_interaction: string | null
  created_at: string
  updated_at: string
}

export interface CheckinStatus {
  midday: boolean
  evening: boolean
  today: string
}

export interface CheckinFormPayload {
  checkin_type: CheckinType
  mood: Mood
  stress_level: number
  energy_level: number
  sleep_duration: number | null
  sleep_quality: SleepQuality | null
  physical_activity: PhysicalActivity | null
  emotional_notes: string | null
  daily_challenges: string | null
  social_interaction: string | null
}

export interface WearableDevice {
  device_id?: string
  name: string
  type: string
  connected_at?: string
  [key: string]: unknown
}

export interface WearablesStatus {
  connected: boolean
  device: WearableDevice | null
  last_received_at: string | null
}

export interface WearableReading {
  reading_id: string
  heart_rate: number | null
  steps: number | null
  sleep_duration: number | null
  physical_activity: string | null
  calories: number | null
  recorded_at: string
}

export interface TrendPoint {
  date: string
  mood: Mood | null
  mood_value: number | null
  stress_level: number | null
  sleep_duration: number | null
  energy_level: number | null
}

export interface ProgressDeltas {
  stress_delta: number | null
  energy_delta: number | null
  sleep_delta: number | null
}

export interface TrendsResponse {
  days: number
  points: TrendPoint[]
  checkin_count: number
  completion_rate: number
  observations: string[]
  progress: ProgressDeltas
}

export type ChatMode = 'balanced' | 'listen' | 'think' | 'steps'

export interface ChatMessage {
  message_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  feedback: 'up' | 'down' | null
}

export interface ConversationSummary {
  conversation_id: string
  title: string
  created_at: string
  updated_at: string
  preview: string | null
}

export interface Conversation extends ConversationSummary {
  messages: ChatMessage[]
}

export interface SendMessageResponse {
  user_message: ChatMessage
  assistant_message: ChatMessage | null
  error?: string
}

// ---- Activities & recommendations ----

export type DemonstrationType =
  | 'box_breathing'
  | 'stretch_demo'
  | 'senses_sequence'
  | 'walking_animation'
  | 'journaling_demo'
  | 'generic_steps'
  | string

export interface InstructionStep {
  step: number
  text: string
}

export interface Activity {
  activity_id: string
  activity_title: string
  category: string
  description: string | null
  target_scenario: string | null
  suitable_mood: string[]
  suitable_stress_levels: string[]
  suitable_energy_levels: string[]
  suitable_sleep_conditions: string[]
  suitable_activity_levels: string[]
  suitable_time_of_day: string[]
  estimated_duration: number | null // minutes
  difficulty_level: string | null
  required_materials: string[]
  instructions: InstructionStep[]
  demonstration_type: DemonstrationType
  animation_reference: string | null
  benefits: string[]
  contraindications_or_precautions: string[]
  priority: number
  is_active: boolean
  // present in recommendation responses:
  reason?: string | null
}

export interface PrimaryRecommendationResponse {
  recommendation: Activity | null
  has_checkin: boolean
}

export interface RecommendationsResponse {
  primary: Activity | null
  additional: Activity[]
  personalized: boolean
}

export interface ActivityStatus {
  completed: boolean
  saved: boolean
  last_rating: number | null
}

export interface CompletionRecord {
  completion_id?: string
  activity_id: string
  activity_title?: string
  rating?: number | null
  feedback?: string | null
  completed_at?: string
  [key: string]: unknown
}

// ---- Dashboard ----

export interface DashboardResponse {
  checkin_status: { midday: boolean; evening: boolean }
  primary_recommendation: Activity | null
  recent_checkins_count: number
  wellness_observations: string[]
}
