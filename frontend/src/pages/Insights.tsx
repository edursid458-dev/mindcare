import { useCallback, useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Sparkles, TrendingDown, TrendingUp, Minus, ClipboardCheck, BarChart3 } from 'lucide-react'
import { getTrends } from '../lib/api'
import type { TrendsResponse, TrendPoint } from '../lib/types'
import {
  PageHeader,
  Card,
  Badge,
  SectionHeader,
  EmptyState,
  ErrorBanner,
  Skeleton,
  NumberedCard,
} from '../components/ui'
import { cn } from '../lib/cn'

const RANGES = [7, 30, 90] as const

const moodLabel = (v: number | null) => {
  if (v == null) return '—'
  const map: Record<number, string> = { 5: 'Very Happy', 4: 'Happy', 3: 'Neutral', 2: 'Sad', 1: 'Very Sad' }
  return map[v] ?? `${v}`
}

function ChartCard({
  index,
  title,
  subtitle,
  yDomain,
  yTicks,
  yTickFormatter,
  data,
  dataKey,
  stroke,
  tooltipLabel,
}: {
  index: string
  title: string
  subtitle: string
  yDomain: [number, number]
  yTicks?: number[]
  yTickFormatter?: (v: number) => string
  data: TrendPoint[]
  dataKey: keyof TrendPoint
  stroke: string
  tooltipLabel: (v: number | null) => string
}) {
  const hasData = data.some((p) => p[dataKey] != null)
  const chartData = data.map((p) => ({
    date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: p[dataKey],
  }))

  return (
    <Card className="p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="text-2xl font-bold tracking-tight text-ink/20">{index}</span>
          <h3 className="mt-1 text-base font-bold tracking-tight">{title}</h3>
          <p className="mt-0.5 text-xs text-ink/50">{subtitle}</p>
        </div>
        {!hasData && <Badge tone="gray">No data</Badge>}
      </div>
      {hasData ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DC" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E2DC' }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                domain={yDomain}
                ticks={yTicks}
                tickFormatter={yTickFormatter}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #E5E2DC',
                  fontSize: 13,
                  background: '#fff',
                }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(v) => [tooltipLabel(v as number | null), title]}
              />
              {yDomain[0] <= 3.5 && yDomain[1] >= 4.5 && <ReferenceLine y={3} stroke="#0E7C66" strokeDasharray="4 4" strokeOpacity={0.4} />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={stroke}
                strokeWidth={2}
                dot={{ r: 3, fill: stroke, strokeWidth: 0 }}
                connectNulls
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          icon={<BarChart3 size={24} strokeWidth={1.5} />}
          title="Not enough data yet"
          description={`Complete check-ins over the past ${data.length || 'selected'} days to see this trend.`}
        />
      )}
    </Card>
  )
}

function Delta({ label, value, suffix = '', invertGood = false }: { label: string; value: number | null; suffix?: string; invertGood?: boolean }) {
  if (value == null) {
    return (
      <div className="rounded-lg border border-hairline p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">{label}</p>
        <p className="mt-1 text-lg font-bold text-ink/40">—</p>
      </div>
    )
  }
  const up = value > 0
  const good = invertGood ? !up : up
  const Icon = value === 0 ? Minus : up ? TrendingUp : TrendingDown
  return (
    <div className="rounded-lg border border-hairline p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">{label}</p>
      <p className={cn('mt-1 flex items-center gap-1.5 text-lg font-bold', good ? 'text-teal-700' : 'text-ink/60')}>
        <Icon size={16} />
        {up ? '+' : ''}
        {value}
        {suffix}
      </p>
    </div>
  )
}

export default function Insights() {
  const [days, setDays] = useState<number>(30)
  const [data, setData] = useState<TrendsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (d: number) => {
    setLoading(true)
    setError(null)
    try {
      setData(await getTrends(d))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(days)
  }, [days, load])

  const points = data?.points ?? []
  const pct = data ? Math.round(data.completion_rate * (data.completion_rate <= 1 ? 100 : 1)) : 0

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">
      <PageHeader
        eyebrow="Insights & Progress"
        title="Your wellness, over time."
        description="Trends computed from your check-ins. We show what the data says — nothing more."
      >
        <div className="inline-flex rounded-lg border border-hairline bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                days === r ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink',
              )}
            >
              {r} days
            </button>
          ))}
        </div>
      </PageHeader>

      {error && (
        <div className="mb-8">
          <ErrorBanner message={error} onRetry={() => load(days)} />
        </div>
      )}

      {/* summary row */}
      <div className="mb-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => <Card key={i} className="p-6"><Skeleton className="h-3 w-20" /><Skeleton className="mt-4 h-8 w-24" /></Card>)
        ) : (
          <>
            <NumberedCard index="01" label="Check-ins" value={data?.checkin_count ?? 0} sub={`in the last ${days} days`} icon={<ClipboardCheck size={18} />} />
            <NumberedCard
              index="02"
              label="Completion Rate"
              value={`${pct}%`}
              sub={data ? `${data.checkin_count} check-ins logged` : '—'}
              icon={<BarChart3 size={18} />}
            />
            <NumberedCard
              index="03"
              label="Mood Trend"
              value={moodLabel(points.length ? avgMood(points) : null)}
              sub="average mood value"
            />
            <NumberedCard
              index="04"
              label="Stress Trend"
              value={data?.progress.stress_delta != null ? `${data.progress.stress_delta > 0 ? '+' : ''}${data.progress.stress_delta}` : '—'}
              sub="change vs. earlier period"
            />
          </>
        )}
      </div>

      {/* progress deltas */}
      {data && !loading && (
        <section className="mb-14">
          <SectionHeader index="01" label="Progress Summary" title="Direction of change" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Delta label="Stress" value={data.progress?.stress_delta} suffix=" pts" invertGood />
            <Delta label="Energy" value={data.progress?.energy_delta} suffix=" pts" />
            <Delta label="Sleep" value={data.progress?.sleep_delta} suffix=" h" />
          </div>
        </section>
      )}

      {/* charts */}
      <section className="mb-14">
        <SectionHeader
          index="02"
          label="Trends"
          title="Mood, stress, sleep & energy"
          description="One point per day with a check-in. Mood uses a 1–5 scale: 5 = Very Happy, 1 = Very Sad."
        />
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-4 h-56 w-full" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <ChartCard
              index="01"
              title="Mood"
              subtitle="Daily mood, 1–5 scale"
              yDomain={[0.5, 5.5]}
              yTicks={[1, 2, 3, 4, 5]}
              yTickFormatter={(v) => moodLabel(v)}
              data={points}
              dataKey="mood_value"
              stroke="#0E7C66"
              tooltipLabel={(v) => (v == null ? 'No data' : moodLabel(Math.round(v)))}
            />
            <ChartCard
              index="02"
              title="Stress"
              subtitle="Daily stress, 1–10 scale"
              yDomain={[0, 10]}
              yTicks={[1, 5, 10]}
              data={points}
              dataKey="stress_level"
              stroke="#B45309"
              tooltipLabel={(v) => (v == null ? 'No data' : `${v}/10`)}
            />
            <ChartCard
              index="03"
              title="Sleep"
              subtitle="Hours slept per night"
              yDomain={[0, 12]}
              yTicks={[0, 4, 8, 12]}
              data={points}
              dataKey="sleep_duration"
              stroke="#4C6A92"
              tooltipLabel={(v) => (v == null ? 'No data' : `${v} h`)}
            />
            <ChartCard
              index="04"
              title="Energy"
              subtitle="Daily energy, 1–10 scale"
              yDomain={[0, 10]}
              yTicks={[1, 5, 10]}
              data={points}
              dataKey="energy_level"
              stroke="#7A8B3D"
              tooltipLabel={(v) => (v == null ? 'No data' : `${v}/10`)}
            />
          </div>
        )}
      </section>

      {/* AI observations */}
      <section>
        <SectionHeader
          index="03"
          label="AI-Generated Wellness Insights"
          title="What the numbers suggest"
          description="Statistical observations computed from your check-in history."
          action={<Badge tone="teal"><Sparkles size={11} /> Powered by AI</Badge>}
        />
        {loading ? (
          <Card className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </Card>
        ) : data && data.observations.length > 0 ? (
          <div className="space-y-3">
            {data.observations.map((o, i) => (
              <Card key={i} className="flex gap-4 p-5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-bold text-teal-800">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-ink/80">{o}</p>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Sparkles size={26} strokeWidth={1.5} />}
            title="Not enough data for insights"
            description="With a few weeks of regular check-ins, MindCare will surface honest statistical observations here."
          />
        )}
      </section>
    </div>
  )
}

function avgMood(points: TrendPoint[]): number | null {
  const vals = points.map((p) => p.mood_value).filter((v): v is number => v != null)
  if (vals.length === 0) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}
