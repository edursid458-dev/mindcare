import { useCallback, useEffect, useState } from 'react'
import {
  HeartPulse,
  Footprints,
  Moon,
  Activity,
  Flame,
  Watch,
  RefreshCw,
  Unplug,
  PlugZap,
  FlaskConical,
} from 'lucide-react'
import {
  connectWearable,
  disconnectWearable,
  getLatestReading,
  getWearableReadings,
  getWearablesStatus,
  syncWearable,
} from '../lib/api'
import type { WearableReading, WearablesStatus } from '../lib/types'
import {
  PageHeader,
  Card,
  Badge,
  PrimaryButton,
  GhostButton,
  NumberedCard,
  SectionHeader,
  EmptyState,
  ErrorBanner,
  Skeleton,
} from '../components/ui'
import { useToast } from '../components/Toast'

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const fmtNum = (v: number | null | undefined) =>
  v === null || v === undefined ? 'N/A' : v.toLocaleString()

export default function Wearables() {
  const { toast } = useToast()
  const [status, setStatus] = useState<WearablesStatus | null>(null)
  const [readings, setReadings] = useState<WearableReading[]>([])
  const [latest, setLatest] = useState<WearableReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [s, r, l] = await Promise.all([
        getWearablesStatus(),
        getWearableReadings(20),
        getLatestReading(),
      ])
      setStatus(s)
      setReadings(r)
      setLatest(l)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wearables')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (kind: 'connect' | 'disconnect' | 'sync') => {
    setBusy(kind)
    setError(null)
    try {
      if (kind === 'connect') {
        const s = await connectWearable()
        setStatus(s)
        toast('MindBand Sim connected', 'success')
      } else if (kind === 'disconnect') {
        const s = await disconnectWearable()
        setStatus(s)
        toast('Device disconnected', 'info')
      } else {
        const reading = await syncWearable()
        setLatest(reading)
        setReadings((prev) => [reading, ...prev].slice(0, 20))
        toast('New simulated reading synced', 'success')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Action failed'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setBusy(null)
    }
  }

  const connected = status?.connected ?? false

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">
      <PageHeader
        eyebrow="Wearables"
        title="Body signals, simulated"
        description="MindCare works with a simulated wearable (MindBand Sim) so you can explore how biometric data connects to your wellness patterns."
      >
        <Badge tone="amber">
          <FlaskConical size={12} /> Simulated data — not real biometrics
        </Badge>
      </PageHeader>

      {error && (
        <div className="mb-8">
          <ErrorBanner message={error} onRetry={load} />
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="space-y-3 p-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-40" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* status card */}
          <Card className="mb-12 flex flex-wrap items-center justify-between gap-5 p-6 md:p-8">
            <div className="flex items-center gap-4">
              <span
                className={
                  'flex h-12 w-12 items-center justify-center rounded-xl ' +
                  (connected ? 'bg-sage text-teal-800' : 'bg-neutral-100 text-ink/40')
                }
              >
                <Watch size={22} strokeWidth={1.6} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold tracking-tight">
                    {connected ? status?.device?.name ?? 'MindBand Sim' : 'No device connected'}
                  </p>
                  {connected && <Badge tone="sage">Connected</Badge>}
                  {connected && <Badge tone="amber">Simulated</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-ink/55">
                  {connected
                    ? `${status?.device?.type ?? 'Simulated wearable'} · Last data received ${fmtTime(status?.last_received_at ?? null)}`
                    : 'Connect the simulated device to start receiving readings.'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {connected ? (
                <>
                  <GhostButton onClick={() => act('sync')} disabled={busy !== null} className="px-4 py-2 text-xs">
                    <RefreshCw size={14} className={busy === 'sync' ? 'animate-spin' : ''} />
                    {busy === 'sync' ? 'Syncing…' : 'Sync'}
                  </GhostButton>
                  <GhostButton onClick={() => act('disconnect')} disabled={busy !== null} className="px-4 py-2 text-xs hover:border-red-300 hover:text-red-600">
                    <Unplug size={14} /> Disconnect
                  </GhostButton>
                </>
              ) : (
                <PrimaryButton onClick={() => act('connect')} disabled={busy !== null} className="px-5 py-2 text-xs">
                  <PlugZap size={14} />
                  {busy === 'connect' ? 'Connecting…' : 'Connect Device'}
                </PrimaryButton>
              )}
            </div>
          </Card>

          {/* measurements */}
          <section className="mb-14">
            <SectionHeader
              index="01"
              label="Latest Readings"
              title="Current signals"
              description="Values from the most recent simulated sync."
            />
            {connected && latest ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                  <NumberedCard index="01" label="Heart Rate" icon={<HeartPulse size={18} />} value={latest.heart_rate != null ? `${latest.heart_rate} bpm` : 'N/A'} sub="beats per minute" />
                  <NumberedCard index="02" label="Steps" icon={<Footprints size={18} />} value={fmtNum(latest.steps)} sub="today (simulated)" />
                  <NumberedCard index="03" label="Sleep" icon={<Moon size={18} />} value={latest.sleep_duration != null ? `${latest.sleep_duration} h` : 'N/A'} sub="last night" />
                  <NumberedCard index="04" label="Activity" icon={<Activity size={18} />} value={latest.physical_activity ?? 'N/A'} sub="activity level" />
                  <NumberedCard index="05" label="Calories" icon={<Flame size={18} />} value={fmtNum(latest.calories)} sub="kcal (simulated)" />
                </div>
                <p className="mt-4 text-xs text-ink/45">
                  Latest reading: {fmtTime(latest.recorded_at)} · All values are simulated.
                </p>
              </>
            ) : (
              <EmptyState
                icon={<Watch size={28} strokeWidth={1.5} />}
                title={connected ? 'No readings yet' : 'Device not connected'}
                description={
                  connected
                    ? 'Press Sync to generate the first simulated reading.'
                    : 'Connect MindBand Sim above to view measurement cards.'
                }
                action={
                  connected ? (
                    <GhostButton onClick={() => act('sync')} disabled={busy !== null} className="px-4 py-2 text-xs">
                      <RefreshCw size={14} /> Sync now
                    </GhostButton>
                  ) : undefined
                }
              />
            )}
          </section>

          {/* history table */}
          <section>
            <SectionHeader
              index="02"
              label="History"
              title="Readings log"
              description="Most recent 20 simulated readings, newest first."
            />
            {readings.length === 0 ? (
              <EmptyState
                icon={<Activity size={26} strokeWidth={1.5} />}
                title="No readings yet"
                description="Synced readings will be listed here."
              />
            ) : (
              <Card className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-left">
                      {['Time', 'Heart Rate', 'Steps', 'Sleep (h)', 'Activity', 'Calories'].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r) => (
                      <tr key={r.reading_id} className="border-b border-hairline/60 last:border-0 hover:bg-sage/20">
                        <td className="px-5 py-3 font-medium">{fmtTime(r.recorded_at)}</td>
                        <td className="px-5 py-3">{r.heart_rate != null ? `${r.heart_rate} bpm` : '—'}</td>
                        <td className="px-5 py-3">{fmtNum(r.steps)}</td>
                        <td className="px-5 py-3">{r.sleep_duration != null ? `${r.sleep_duration} h` : '—'}</td>
                        <td className="px-5 py-3 capitalize">{r.physical_activity ?? '—'}</td>
                        <td className="px-5 py-3">{fmtNum(r.calories)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  )
}
