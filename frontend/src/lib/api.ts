import type {
  Activity,
  ActivityStatus,
  Checkin,
  CheckinFormPayload,
  CheckinStatus,
  CheckinType,
  ChatMode,
  CompletionRecord,
  Conversation,
  ConversationSummary,
  DashboardResponse,
  PrimaryRecommendationResponse,
  RecommendationsResponse,
  SendMessageResponse,
  TrendsResponse,
  WearableReading,
  WearablesStatus,
} from './types'

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

export class ApiError extends Error {
  status: number
  detail: string
  code?: string

  constructor(status: number, detail: string, code?: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.code = code
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : null
  if (!res.ok) {
    const detail =
      data && typeof data === 'object' && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : `Request failed (${res.status})`
    throw new ApiError(res.status, detail)
  }
  return data as T
}

const get = <T>(path: string) => request<T>(path)
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' })

// ---------- Dashboard ----------
export const getDashboard = () => get<DashboardResponse>('/dashboard')

// ---------- Check-ins ----------
export const getCheckinStatus = () => get<CheckinStatus>('/checkins/status')
export const listCheckins = (type?: CheckinType, limit = 50) => {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  params.set('limit', String(limit))
  return get<Checkin[]>(`/checkins?${params.toString()}`)
}
export const getLatestCheckin = () => get<Checkin | null>('/checkins/latest')
export const createCheckin = (payload: CheckinFormPayload) =>
  post<Checkin>('/checkins', payload)
export const getCheckinsRange = (days: number) =>
  get<Checkin[]>(`/checkins/range?days=${days}`)

// ---------- Wearables ----------
export const getWearablesStatus = () => get<WearablesStatus>('/wearables/status')
export const connectWearable = () => post<WearablesStatus>('/wearables/connect')
export const disconnectWearable = () => post<WearablesStatus>('/wearables/disconnect')
export const syncWearable = () => post<WearableReading>('/wearables/sync')
export const getWearableReadings = (limit = 20) =>
  get<WearableReading[]>(`/wearables/readings?limit=${limit}`)
export const getLatestReading = () => get<WearableReading | null>('/wearables/latest')

// ---------- Analytics ----------
export const getTrends = (days: number) =>
  get<TrendsResponse>(`/analytics/trends?days=${days}`)

// ---------- Recommendations ----------
export const getPrimaryRecommendation = () =>
  get<PrimaryRecommendationResponse>('/recommendations/primary')
export const getRecommendations = () => get<RecommendationsResponse>('/recommendations')
export const listActivities = () => get<Activity[]>('/activities')
export const getActivity = (id: string) => get<Activity>(`/activities/${id}`)
export const completeActivity = (id: string, rating?: number, feedback?: string) =>
  post<CompletionRecord>(`/activities/${id}/complete`, {
    ...(rating !== undefined ? { rating } : {}),
    ...(feedback !== undefined ? { feedback } : {}),
  })
export const saveActivity = (id: string) => post(`/activities/${id}/save`)
export const unsaveActivity = (id: string) => del(`/activities/${id}/save`)
export const getActivityStatus = (id: string) =>
  get<ActivityStatus>(`/activities/${id}/status`)
export const getCompletions = () => get<CompletionRecord[]>('/recommendations/completions')

// ---------- Conversations / Chat ----------
export const listConversations = () => get<ConversationSummary[]>('/conversations')
export const createConversation = () => post<ConversationSummary>('/conversations')
export const getConversation = (id: string) => get<Conversation>(`/conversations/${id}`)
export const renameConversation = (id: string, title: string) =>
  patch<ConversationSummary>(`/conversations/${id}`, { title })
export const deleteConversation = (id: string) =>
  del<{ ok?: boolean }>(`/conversations/${id}`)

export function sendMessage(
  conversationId: string,
  content: string,
  mode: ChatMode,
  signal?: AbortSignal,
): Promise<SendMessageResponse> {
  return request<SendMessageResponse>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, mode }),
    signal,
  })
}

export const sendMessageFeedback = (
  messageId: string,
  feedback: 'up' | 'down',
) => post(`/messages/${messageId}/feedback`, { feedback })
