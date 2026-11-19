import {
  Info,
  Target,
  Package,
  ListOrdered,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import type { Activity } from '../../lib/types'

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4 border-b border-hairline/70 py-4 last:border-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage text-teal-800">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">
          {label}
        </p>
        <div className="mt-1 text-sm leading-relaxed text-ink/80">{children}</div>
      </div>
    </div>
  )
}

export function InstructionPanel({ activity }: { activity: Activity }) {
  return (
    <div>
      <Row icon={<Info size={15} />} label="What it is">
        {activity.description ?? 'A guided wellness activity.'}
        {activity.target_scenario && (
          <p className="mt-1.5 text-ink/55">
            <span className="font-semibold text-ink/70">Best for: </span>
            {activity.target_scenario}
          </p>
        )}
      </Row>

      <Row icon={<Target size={15} />} label="Why it helps">
        {activity.benefits.length > 0 ? (
          <ul className="space-y-1.5">
            {activity.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-700" />
                {b}
              </li>
            ))}
          </ul>
        ) : (
          'Supports emotional regulation and stress reduction.'
        )}
      </Row>

      <Row icon={<Package size={15} />} label="What you'll need">
        {activity.required_materials.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activity.required_materials.map((m, i) => (
              <span
                key={i}
                className="rounded-md border border-hairline bg-surface px-2.5 py-1 text-xs font-medium text-ink/70"
              >
                {m}
              </span>
            ))}
          </div>
        ) : (
          'Nothing — just a few quiet minutes.'
        )}
      </Row>

      <Row icon={<ListOrdered size={15} />} label="How to do it">
        {activity.instructions.length > 0 ? (
          <ol className="space-y-2">
            {activity.instructions.map((inst) => (
              <li key={inst.step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper">
                  {inst.step}
                </span>
                <span>{inst.text}</span>
              </li>
            ))}
          </ol>
        ) : (
          'Follow the guided demonstration, then repeat at your own pace.'
        )}
      </Row>

      <Row icon={<Clock size={15} />} label="Time & difficulty">
        <p>
          {activity.estimated_duration != null
            ? `About ${activity.estimated_duration} minutes.`
            : 'A short practice.'}{' '}
          Difficulty:{' '}
          <span className="font-semibold capitalize">
            {activity.difficulty_level?.replace(/_/g, ' ') ?? 'gentle'}
          </span>
          .
        </p>
      </Row>

      {(activity.contraindications_or_precautions?.length ?? 0) > 0 && (
        <Row icon={<AlertTriangle size={15} />} label="Precautions">
          <ul className="space-y-1.5">
            {activity.contraindications_or_precautions.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-ink/70">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-600" />
                {p}
              </li>
            ))}
          </ul>
        </Row>
      )}
    </div>
  )
}
