import { useCallback, useEffect, useState } from 'react'
import {
  Laugh,
  Smile,
  Meh,
  Frown,
  CloudRain,
  Wind,
  Angry,
  ChevronDown,
  CheckCircle2,
  CircleDashed,
  Moon,
  Footprints,
} from 'lucide-react'
import {
  createCheckin,
  getCheckinStatus,
  getLatestCheckin,
  listCheckins,
} from '../lib/api'
import type {
  Checkin,
  CheckinFormPayload,
  CheckinType,
  Mood,
  PhysicalActivity,
  SleepQuality,
} from '../lib/types'
import {
  PageHeader,
  Card,
  Badge,
  PrimaryButton,
  GhostButton,
  SectionHeader,
  EmptyState,
  ErrorBanner,
} from '../components/ui'
import { useToast } from '../components/Toast'
import { cn } from '../lib/cn'

const MOODS: { id: Mood; label: string; icon: typeof Smile }[] = [
  { id: 'very_happy', label: 'Very Happy', icon: Laugh },
  { id: 'happy', label: 'Happy', icon: Smile },
  { id: 'neutral', label: 'Neutral', icon: Meh },
  { id: 'sad', label: 'Sad', icon: Frown },
  { id: 'very_sad', label: 'Very Sad', icon: CloudRain },
  { id: 'anxious', label: 'Anxious', icon: Wind },
  { id: 'irritated', label: 'Irritated', icon: Angry },
]

const SLEEP_QUALITY: { id: SleepQuality; label: string }[] = [
  { id: 'very_poor', label: 'Very Poor' },
  { id: 'poor', label: 'Poor' },
  { id: 'average', label: 'Average' },
  { id: 'good', label: 'Good' },
  { id: 'excellent', label: 'Excellent' },
]

const ACTIVITY: { id: PhysicalActivity; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'light', label: 'Light' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'intense', label: 'Intense' },
]

const moodLabel = (m: Mood) => MOODS.find((x) => x.id === m)?.label ?? m
const fmt = (v: number | null | undefined, unit = '') =>
  v === null || v === undefined ? '—' : `${v}${unit}`

function SegmentedScale({
  value,
  onChange,
  low,
  high,
  label,
}: {
  value: number
  onChange: (v: number) => void
  low: string
  high: string
  label: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-ink">{label}</label>
        <span className="rounded-md bg-sage px-2 py-0.5 text-sm font-bold text-teal-800">
          {value}
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'h-9 rounded-md border text-xs font-semibold transition-colors',
              n === value
                ? 'border-teal-700 bg-teal-700 text-white'
                : n < value
                  ? 'border-teal-700/30 bg-teal-50 text-teal-800 hover:bg-teal-100'
                  : 'border-hairline bg-surface text-ink/50 hover:border-teal-700/40',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-medium uppercase tracking-wider text-ink/45">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

export default function Checkins() {
  const { toast } = useToast()
  const [type, setType] = useState<CheckinType>('midday')
  const [status, setStatus] = useState<{ midday: boolean; evening: boolean } | null>(null)
  const [mood, setMood] = useState<Mood | null>(null)
  const [stress, setStress] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [sleepHours, setSleepHours] = useState('')
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null)
  const [activity, setActivity] = useState<PhysicalActivity | null>(null)
  const [notes, setNotes] = useState('')
  const [challenges, setChallenges] = useState('')
  const [social, setSocial] = useState('')
  const [saving, setSaving] = useState<'draft' | 'submit' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previous, setPrevious] = useState<Checkin[]>([])
  const [prevLoading, setPrevLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [s, latest, list] = await Promise.all([
        getCheckinStatus(),
        getLatestCheckin(),
        listCheckins(type, 10),
      ])
      setStatus(s)
      setPrevious(list)
      // prefill from latest check-in of this type if exists
      const mine = latest && latest.checkin_type === type ? latest : list[0]
      if (mine && mine.checkin_type === type) {
        setMood(mine.mood)
        setStress(mine.stress_level)
        setEnergy(mine.energy_level)
        setSleepHours(mine.sleep_duration != null ? String(mine.sleep_duration) : '')
        setSleepQuality(mine.sleep_quality)
        setActivity(mine.physical_activity)
        setNotes(mine.emotional_notes ?? '')
        setChallenges(mine.daily_challenges ?? '')
        setSocial(mine.social_interaction ?? '')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load check-ins')
    } finally {
      setPrevLoading(false)
    }
  }, [type])

  useEffect(() => {
    setPrevLoading(true)
    setExpanded(null)
    load()
  }, [load])

  const done = type === 'midday' ? status?.midday : status?.evening

  const save = async (kind: 'draft' | 'submit') => {
    setError(null)
    if (!mood) {
      setError('Please select how you are feeling before saving.')
      return
    }
    const sleep = sleepHours.trim() === '' ? null : Number(sleepHours)
    if (sleep !== null && (Number.isNaN(sleep) || sleep < 0 || sleep > 24)) {
      setError('Sleep duration must be between 0 and 24 hours.')
      return
    }
    const payload: CheckinFormPayload = {
      checkin_type: type,
      mood,
      stress_level: stress,
      energy_level: energy,
      sleep_duration: sleep,
      sleep_quality: sleepQuality,
      physical_activity: activity,
      emotional_notes: notes.trim() || null,
      daily_challenges: challenges.trim() || null,
      social_interaction: social.trim() || null,
    }
    setSaving(kind)
    try {
      await createCheckin(payload)
      toast(
        kind === 'submit' ? 'Check-in submitted — thank you.' : 'Draft saved.',
        'success',
      )
      await load()
      const s = await getCheckinStatus()
      setStatus(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save check-in')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">
      <PageHeader
        eyebrow="Daily Check-in"
        title="How are you, really?"
        description="Two short check-ins a day — midday and evening — help MindCare understand your patterns. All fields except mood are optional."
      />

      {/* type selector */}
      <div className="mb-8 inline-flex rounded-lg border border-hairline bg-surface p-1">
        {(['midday', 'evening'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              'flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold capitalize transition-colors',
              type === t
                ? 'bg-ink text-paper'
                : 'text-ink/55 hover:text-ink',
            )}
          >
            {t === 'midday' ? <SunIcon /> : <Moon size={15} />}
            {t}
            {(t === 'midday' ? status?.midday : status?.evening) && (
              <CheckCircle2 size={13} className="text-teal-600" />
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* form */}
        <div className="lg:col-span-3">
          <Card className="p-6 md:p-8">
            {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

            {/* mood */}
            <div>
              <p className="text-sm font-semibold text-ink">
                How are you feeling? <span className="text-red-600">*</span>
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {MOODS.map((m) => {
                  const Icon = m.icon
                  const selected = mood === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3.5 text-[11px] font-semibold transition-colors',
                        selected
                          ? 'border-teal-700 bg-sage/60 text-teal-800'
                          : 'border-hairline bg-surface text-ink/55 hover:border-teal-700/40 hover:text-ink',
                      )}
                    >
                      <Icon size={22} strokeWidth={1.6} />
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-8 space-y-8">
              <SegmentedScale
                label="Stress level"
                value={stress}
                onChange={setStress}
                low="Low"
                high="High"
              />
              <SegmentedScale
                label="Energy level"
                value={energy}
                onChange={setEnergy}
                low="Drained"
                high="Charged"
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-ink">
                    Last night's sleep (hours)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full rounded-lg border border-hairline bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-700/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-ink">
                    Sleep quality
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SLEEP_QUALITY.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSleepQuality(sleepQuality === s.id ? null : s.id)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                          sleepQuality === s.id
                            ? 'border-teal-700 bg-teal-700 text-white'
                            : 'border-hairline bg-surface text-ink/55 hover:border-teal-700/40',
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">
                  Physical activity today
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ACTIVITY.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setActivity(activity === a.id ? null : a.id)}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                        activity === a.id
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-hairline bg-surface text-ink/55 hover:border-teal-700/40',
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    Emotional notes <span className="font-normal text-ink/45">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="What influenced your mood today?"
                    className="w-full resize-none rounded-lg border border-hairline bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-teal-700/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    Daily challenges <span className="font-normal text-ink/45">(optional)</span>
                  </label>
                  <textarea
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    rows={3}
                    placeholder="Anything that was harder than usual?"
                    className="w-full resize-none rounded-lg border border-hairline bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-teal-700/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    Social interaction <span className="font-normal text-ink/45">(optional)</span>
                  </label>
                  <textarea
                    value={social}
                    onChange={(e) => setSocial(e.target.value)}
                    rows={3}
                    placeholder="Time with others, connection, loneliness…"
                    className="w-full resize-none rounded-lg border border-hairline bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-teal-700/50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-hairline pt-6">
              <GhostButton
                onClick={() => save('draft')}
                disabled={saving !== null}
                className="px-6"
              >
                {saving === 'draft' ? 'Saving…' : 'Save Draft'}
              </GhostButton>
              <PrimaryButton
                onClick={() => save('submit')}
                disabled={saving !== null}
                className="px-6"
              >
                {saving === 'submit'
                  ? 'Submitting…'
                  : done
                    ? 'Update Check-in'
                    : `Submit ${type} Check-in`}
              </PrimaryButton>
            </div>
          </Card>
        </div>

        {/* status + previous */}
        <div className="space-y-8 lg:col-span-2">
          <Card className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              Today's Status
            </p>
            <div className="mt-4 space-y-3">
              {(['midday', 'evening'] as const).map((t) => {
                const d = t === 'midday' ? status?.midday : status?.evening
                return (
                  <div
                    key={t}
                    className="flex items-center justify-between rounded-lg border border-hairline px-4 py-3"
                  >
                    <span className="text-sm font-semibold capitalize">{t}</span>
                    {d ? (
                      <Badge tone="sage">
                        <CheckCircle2 size={12} /> Complete
                      </Badge>
                    ) : (
                      <Badge tone="amber">
                        <CircleDashed size={12} /> Pending
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          <div>
            <SectionHeader
              index="01"
              label="History"
              title={`Previous ${type} check-ins`}
            />
            {prevLoading ? (
              <Card className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-neutral-200/70" />
                ))}
              </Card>
            ) : previous.length === 0 ? (
              <EmptyState
                icon={<Footprints size={26} strokeWidth={1.5} />}
                title={`No ${type} check-ins yet`}
                description="Your saved check-ins will appear here with full detail."
              />
            ) : (
              <div className="space-y-2">
                {previous.map((c) => {
                  const open = expanded === c.checkin_id
                  const MoodIcon = MOODS.find((m) => m.id === c.mood)?.icon ?? Smile
                  return (
                    <Card key={c.checkin_id} className="overflow-hidden">
                      <button
                        onClick={() => setExpanded(open ? null : c.checkin_id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        <MoodIcon size={18} className="shrink-0 text-teal-700" strokeWidth={1.8} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {moodLabel(c.mood)} · Stress {c.stress_level}/10 · Energy{' '}
                            {c.energy_level}/10
                          </p>
                          <p className="text-xs text-ink/50">
                            {new Date(c.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <ChevronDown
                          size={16}
                          className={cn('shrink-0 text-ink/40 transition-transform', open && 'rotate-180')}
                        />
                      </button>
                      {open && (
                        <div className="border-t border-hairline px-4 py-4 text-sm">
                          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                            <Detail k="Mood" v={moodLabel(c.mood)} />
                            <Detail k="Stress" v={`${c.stress_level}/10`} />
                            <Detail k="Energy" v={`${c.energy_level}/10`} />
                            <Detail k="Sleep" v={`${fmt(c.sleep_duration, ' h')}${c.sleep_quality ? ` · ${c.sleep_quality}` : ''}`} />
                            <Detail k="Activity" v={c.physical_activity ?? '—'} />
                            <Detail k="Type" v={c.checkin_type} />
                          </dl>
                          {c.emotional_notes && (
                            <p className="mt-3 rounded-lg bg-sage/40 p-3 text-ink/75">
                              <span className="font-semibold">Notes: </span>
                              {c.emotional_notes}
                            </p>
                          )}
                          {c.daily_challenges && (
                            <p className="mt-2 rounded-lg bg-sage/40 p-3 text-ink/75">
                              <span className="font-semibold">Challenges: </span>
                              {c.daily_challenges}
                            </p>
                          )}
                          {c.social_interaction && (
                            <p className="mt-2 rounded-lg bg-sage/40 p-3 text-ink/75">
                              <span className="font-semibold">Social: </span>
                              {c.social_interaction}
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">{k}</dt>
      <dd className="mt-0.5 font-medium capitalize">{v}</dd>
    </div>
  )
}
