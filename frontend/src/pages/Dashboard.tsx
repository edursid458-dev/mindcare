import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  BarChart3,
  ClipboardList,
  CircleDashed,
} from 'lucide-react'
import { getDashboard, getCheckinStatus } from '../lib/api'
import type { CheckinStatus, DashboardResponse } from '../lib/types'
import { PageHeader, Card, Badge, PrimaryButton, GhostButton, CardSkeleton, ErrorBanner, EmptyState, SectionHeader } from '../components/ui'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [status, setStatus] = useState<CheckinStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getDashboard(), getCheckinStatus()])
      .then(([d, s]) => {
        if (cancelled) return
        setData(d)
        setStatus(s)
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const checkinCards = [
    { type: 'midday' as const, label: 'Midday Check-in', done: status?.midday ?? data?.checkin_status.midday ?? false },
    { type: 'evening' as const, label: 'Evening Check-in', done: status?.evening ?? data?.checkin_status.evening ?? false },
  ]

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">
      <PageHeader
        eyebrow={`${todayLabel()} — Daily Wellness Brief`}
        title={`${greeting()}, Alex.`}
        description="Your daily wellness snapshot — check in, reflect, and take one small step toward feeling better."
      />

      {error && (
        <div className="mb-8">
          <ErrorBanner message={error} onRetry={() => window.location.reload()} />
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* 01 — Wellness status */}
          <section>
            <SectionHeader index="01" label="Wellness Status" title="Today's check-ins" />
            <div className="grid gap-5 sm:grid-cols-2">
              {checkinCards.map((c, i) => (
                <Card key={c.type} className="flex flex-col p-6">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl font-bold tracking-tight text-ink/25">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {c.done ? (
                      <Badge tone="sage">
                        <CheckCircle2 size={12} /> Complete
                      </Badge>
                    ) : (
                      <Badge tone="amber">
                        <CircleDashed size={12} /> Open
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-bold tracking-tight">{c.label}</h3>
                  <p className="mt-1 flex-1 text-sm text-ink/55">
                    {c.done
                      ? 'Check-in submitted. Well done — your data helps personalize insights.'
                      : 'A quick 2-minute reflection on mood, stress, and energy.'}
                  </p>
                  <Link to="/checkins" className="mt-5">
                    {c.done ? (
                      <GhostButton className="w-full">
                        <ClipboardList size={15} /> View check-in
                      </GhostButton>
                    ) : (
                      <PrimaryButton className="w-full">
                        <CalendarCheck size={15} /> Complete check-in
                      </PrimaryButton>
                    )}
                  </Link>
                </Card>
              ))}
            </div>
          </section>

          <div className="my-14 border-t border-hairline" />

          {/* 02 — AI Daily Observations */}
          <section>
            <SectionHeader
              index="02"
              label="AI Daily Observations"
              title="What MindCare noticed"
              description="Statistical observations computed from your recent check-ins."
            />
            {data && data.wellness_observations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.wellness_observations.map((obs, i) => (
                  <Card key={i} className="flex gap-4 p-5">
                    <Sparkles size={18} className="mt-0.5 shrink-0 text-teal-700" strokeWidth={1.8} />
                    <p className="text-sm leading-relaxed text-ink/80">{obs}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Sparkles size={28} strokeWidth={1.5} />}
                title="No observations yet"
                description="Complete a few check-ins and MindCare will surface honest, data-backed observations about your patterns."
                action={
                  <Link to="/checkins">
                    <PrimaryButton className="px-4 py-2 text-xs">Start a check-in</PrimaryButton>
                  </Link>
                }
              />
            )}
          </section>

          <div className="my-14 border-t border-hairline" />

          {/* 03 — Recommendation preview */}
          <section>
            <SectionHeader
              index="03"
              label="Personalized Recommendations"
              title="Recommended for you"
              action={
                <Link to="/recommendations">
                  <GhostButton className="px-4 py-2 text-xs">
                    View all <ArrowRight size={14} />
                  </GhostButton>
                </Link>
              }
            />
            {data?.primary_recommendation ? (
              <Link to="/recommendations" className="block">
                <Card tinted className="group p-6 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <Badge tone="teal">{data.primary_recommendation.category.replace(/_/g, ' ')}</Badge>
                      <h3 className="mt-3 text-xl md:text-2xl font-bold tracking-tight group-hover:text-teal-700">
                        {data.primary_recommendation.activity_title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink/60">
                        {data.primary_recommendation.description}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-surface transition-colors group-hover:border-teal-700 group-hover:text-teal-700">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </Card>
              </Link>
            ) : (
              <EmptyState
                icon={<ClipboardList size={28} strokeWidth={1.5} />}
                title="Recommendations appear after your first check-in"
                description="Once you share how you're feeling, MindCare tailors small, evidence-informed activities to your state."
                action={
                  <Link to="/recommendations">
                    <GhostButton className="px-4 py-2 text-xs">Browse recommendations</GhostButton>
                  </Link>
                }
              />
            )}
          </section>

          <div className="my-14 border-t border-hairline" />

          {/* Quick actions */}
          <section>
            <SectionHeader index="04" label="Quick Actions" title="Jump in" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: '/chat', icon: <MessageCircle size={18} />, label: 'Talk to AI', desc: 'Chat with your wellness companion' },
                { to: '/checkins', icon: <CalendarCheck size={18} />, label: 'Complete Check-in', desc: 'Midday or evening reflection' },
                { to: '/insights', icon: <BarChart3 size={18} />, label: 'View Wellness Analytics', desc: 'Trends across mood, stress & sleep' },
                { to: '/recommendations', icon: <ClipboardList size={18} />, label: 'View Recommendations', desc: 'Personalized activities' },
              ].map((a) => (
                <Link key={a.to} to={a.to}>
                  <Card className="group flex h-full flex-col p-5 transition-colors hover:border-teal-700/40">
                    <span className="text-teal-700">{a.icon}</span>
                    <p className="mt-3 text-sm font-bold tracking-tight group-hover:text-teal-700">
                      {a.label}
                    </p>
                    <p className="mt-1 text-xs text-ink/50">{a.desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
