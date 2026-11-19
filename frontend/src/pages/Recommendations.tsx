import { useCallback, useEffect, useState } from 'react'
import {
  Sparkles,
  Play,
  BookOpen,
  Star,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Gauge,
  Tag,
} from 'lucide-react'
import {
  completeActivity,
  getActivityStatus,
  getRecommendations,
  saveActivity,
  unsaveActivity,
} from '../lib/api'
import type { Activity, ActivityStatus, RecommendationsResponse } from '../lib/types'
import {
  PageHeader,
  Card,
  Badge,
  PrimaryButton,
  GhostButton,
  SectionHeader,
  EmptyState,
  ErrorBanner,
  CardSkeleton,
} from '../components/ui'
import { ActivityDemo } from '../components/recommendations/ActivityDemo'
import { InstructionPanel } from '../components/recommendations/InstructionPanel'
import { useToast } from '../components/Toast'
import { cn } from '../lib/cn'

const CATEGORY_LABELS: Record<string, string> = {
  stress_management: 'Stress Management',
  sleep_improvement: 'Sleep Improvement',
  mood_improvement: 'Mood Improvement',
  low_energy: 'Low Energy',
  physical_activity: 'Physical Activity',
  mindfulness: 'Mindfulness',
  general_wellness: 'General Wellness',
}

function Stars({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            size={22}
            className={cn(
              n <= value ? 'fill-amber-400 text-amber-400' : 'text-hairline',
            )}
          />
        </button>
      ))}
    </div>
  )
}

export default function Recommendations() {
  const { toast } = useToast()
  const [data, setData] = useState<RecommendationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Activity | null>(null)
  const [demoFor, setDemoFor] = useState<Activity | null>(null)
  const [statuses, setStatuses] = useState<Record<string, ActivityStatus>>({})
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await getRecommendations()
      setData(d)
      const primary = d.primary
      setSelected((prev) => prev ?? primary ?? null)
      // fetch statuses for primary + additional
      const ids = [d.primary?.activity_id, ...(d.additional ?? []).map((a) => a.activity_id)].filter(
        (x): x is string => !!x,
      )
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            return [id, await getActivityStatus(id)] as const
          } catch {
            return [id, { completed: false, saved: false, last_rating: null }] as const
          }
        }),
      )
      setStatuses(Object.fromEntries(entries))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // when selected activity changes, sync rating/status
  useEffect(() => {
    if (!selected) return
    const st = statuses[selected.activity_id]
    if (st?.last_rating) setRating(st.last_rating)
    else setRating(0)
    setFeedback('')
  }, [selected?.activity_id, statuses])

  const primary = data?.primary ?? null
  const additional = data?.additional ?? []
  const statusOf = (id: string): ActivityStatus =>
    statuses[id] ?? { completed: false, saved: false, last_rating: null }

  const scrollToInstructions = () => {
    document.getElementById('activity-instructions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSaveToggle = async (a: Activity) => {
    setBusy(`save-${a.activity_id}`)
    try {
      const st = statusOf(a.activity_id)
      if (st.saved) {
        await unsaveActivity(a.activity_id)
        setStatuses((p) => ({ ...p, [a.activity_id]: { ...st, saved: false } }))
        toast('Removed from saved', 'info')
      } else {
        await saveActivity(a.activity_id)
        setStatuses((p) => ({ ...p, [a.activity_id]: { ...st, saved: true } }))
        toast('Saved for later', 'success')
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update saved status', 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleComplete = async () => {
    if (!selected) return
    setBusy(`complete-${selected.activity_id}`)
    try {
      await completeActivity(
        selected.activity_id,
        rating > 0 ? rating : undefined,
        feedback.trim() || undefined,
      )
      const st = statusOf(selected.activity_id)
      setStatuses((p) => ({
        ...p,
        [selected.activity_id]: { ...st, completed: true, last_rating: rating || st.last_rating },
      }))
      toast('Activity marked as completed', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not mark completed', 'error')
    } finally {
      setBusy(null)
    }
  }

  const ActivityMeta = ({ a }: { a: Activity }) => (
    <div className="flex flex-wrap gap-2">
      {a.estimated_duration != null && (
        <Badge tone="sage"><Clock size={11} /> {a.estimated_duration} min</Badge>
      )}
      {a.difficulty_level && (
        <Badge tone="gray"><Gauge size={11} /> {a.difficulty_level.replace(/_/g, ' ')}</Badge>
      )}
      <Badge tone="teal"><Tag size={11} /> {CATEGORY_LABELS[a.category] ?? a.category.replace(/_/g, ' ')}</Badge>
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">
      <PageHeader
        eyebrow="Recommendations"
        title="Small steps, chosen for you."
        description="Activities matched to how you're feeling right now — based on your latest check-in."
      />

      {error && (
        <div className="mb-8">
          <ErrorBanner message={error} onRetry={load} />
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <CardSkeleton lines={5} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <CardSkeleton key={i} lines={2} />
            ))}
          </div>
        </div>
      ) : !data || (!primary && additional.length === 0) ? (
        <EmptyState
          icon={<Sparkles size={28} strokeWidth={1.5} />}
          title="No recommendations yet"
          description="Complete a check-in and MindCare will suggest personalized activities based on your mood, stress, and energy."
        />
      ) : (
        <>
          {/* A — primary hero */}
          {primary && (
            <section className="mb-14">
              <SectionHeader
                index="A"
                label="Recommended for You"
                title="Today's top pick"
                description={data.personalized ? 'Personalized from your latest check-in.' : 'A gentle general-wellness activity.'}
              />
              <Card tinted className="overflow-hidden">
                <div className="border-b border-hairline/70 bg-sage/50 px-6 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="teal"><Sparkles size={11} /> Recommended for You</Badge>
                    {statusOf(primary.activity_id).completed && (
                      <Badge tone="sage"><CheckCircle2 size={11} /> Completed</Badge>
                    )}
                    {statusOf(primary.activity_id).saved && (
                      <Badge tone="gray"><BookmarkCheck size={11} /> Saved</Badge>
                    )}
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <ActivityMeta a={primary} />
                  <h3 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight">
                    {primary.activity_title}
                  </h3>
                  {primary.reason && (
                    <p className="mt-2 flex items-start gap-2 text-sm text-teal-800">
                      <Sparkles size={15} className="mt-0.5 shrink-0" />
                      <span><span className="font-semibold">Why this: </span>{primary.reason}</span>
                    </p>
                  )}
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/65">
                    {primary.description ?? '—'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(primary.benefits ?? []).slice(0, 4).map((b, i) => (
                      <span key={i} className="rounded-full bg-sage/70 px-3 py-1 text-xs font-medium text-ink/70">
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <PrimaryButton onClick={() => setDemoFor(primary)}>
                      <Play size={15} /> Start Activity
                    </PrimaryButton>
                    <GhostButton onClick={() => { setSelected(primary); scrollToInstructions() }}>
                      <BookOpen size={15} /> View Instructions
                    </GhostButton>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* D — additional recommendations */}
          {additional.length > 0 && (
            <section className="mb-14">
              <SectionHeader
                index="B"
                label="More Options"
                title="Other activities for you"
                description="Alternative practices you can try any time."
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {additional.map((a) => (
                  <Card key={a.activity_id} className="flex flex-col p-5">
                    <ActivityMeta a={a} />
                    <h3 className="mt-3 text-base font-bold tracking-tight leading-snug">
                      {a.activity_title}
                    </h3>
                    <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-ink/55">
                      {a.description ?? '—'}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => setDemoFor(a)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-paper transition-colors hover:bg-teal-800"
                      >
                        <Play size={12} /> View Activity
                      </button>
                      <button
                        onClick={() => { setSelected(a); scrollToInstructions() }}
                        className="rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-ink/60 transition-colors hover:border-teal-700/40 hover:text-teal-700"
                      >
                        Instructions
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* C — instructions */}
          {selected && (
            <section id="activity-instructions" className="mb-14 scroll-mt-24">
              <SectionHeader
                index="C"
                label="Instructions"
                title={selected.activity_title}
                description="Everything you need to practice this activity safely."
              />
              <Card className="p-6 md:p-8">
                <InstructionPanel activity={selected} />
                <div className="mt-6 flex flex-wrap gap-3 border-t border-hairline pt-6">
                  <GhostButton onClick={() => setDemoFor(selected)}>
                    <Play size={14} /> Watch Demo
                  </GhostButton>
                  <GhostButton
                    onClick={() => handleSaveToggle(selected)}
                    disabled={busy === `save-${selected.activity_id}`}
                  >
                    {statusOf(selected.activity_id).saved ? (
                      <><BookmarkCheck size={14} className="text-teal-700" /> Saved</>
                    ) : (
                      <><Bookmark size={14} /> Save for Later</>
                    )}
                  </GhostButton>
                </div>
              </Card>
            </section>
          )}

          {/* E — completion */}
          {selected && (
            <section className="mb-8">
              <SectionHeader
                index="D"
                label="Track Progress"
                title="Mark activity complete"
                description="Tell MindCare how it went — this helps personalize future recommendations."
              />
              <Card className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={statusOf(selected.activity_id).completed ? 'sage' : 'gray'}>
                    {statusOf(selected.activity_id).completed ? (
                      <><CheckCircle2 size={11} /> Completed</>
                    ) : (
                      <>Not completed yet</>
                    )}
                  </Badge>
                  {statusOf(selected.activity_id).saved && (
                    <Badge tone="gray"><BookmarkCheck size={11} /> Saved for later</Badge>
                  )}
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-ink">How would you rate it?</p>
                  <div className="mt-2">
                    <Stars value={rating} onChange={setRating} />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    Notes <span className="font-normal text-ink/45">(optional)</span>
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    placeholder="What did you notice? What got in the way?"
                    className="w-full resize-none rounded-lg border border-hairline bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink/35 focus:border-teal-700/50"
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <PrimaryButton
                    onClick={handleComplete}
                    disabled={busy === `complete-${selected.activity_id}`}
                    className="px-6"
                  >
                    {busy === `complete-${selected.activity_id}`
                      ? 'Saving…'
                      : statusOf(selected.activity_id).completed
                        ? 'Update Completion'
                        : 'Mark Completed'}
                  </PrimaryButton>
                  <GhostButton onClick={() => handleSaveToggle(selected)}>
                    {statusOf(selected.activity_id).saved ? 'Unsave' : 'Save for Later'}
                  </GhostButton>
                </div>
              </Card>
            </section>
          )}
        </>
      )}

      <ActivityDemo
        activity={demoFor}
        open={demoFor !== null}
        onClose={() => setDemoFor(null)}
        onComplete={() => {
          // demo finished — gently prompt completion tracking
          if (demoFor) {
            setSelected(demoFor)
            setTimeout(scrollToInstructions, 50)
          }
        }}
      />
    </div>
  )
}
