import { cn } from '../../lib/cn'
import type { ChatMode } from '../../lib/types'

export const MODES: { id: ChatMode; label: string; hint: string }[] = [
  { id: 'balanced', label: 'Balanced', hint: 'Supportive, practical guidance' },
  { id: 'listen', label: 'Just Listen', hint: 'Mostly listening, minimal advice' },
  { id: 'think', label: 'Help Me Think', hint: 'Explore thoughts and feelings together' },
  { id: 'steps', label: 'Practical Steps', hint: 'Concrete next actions' },
]

export function ModeSelector({
  mode,
  onChange,
  disabled,
}: {
  mode: ChatMode
  onChange: (m: ChatMode) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MODES.map((m) => (
        <button
          key={m.id}
          disabled={disabled}
          onClick={() => onChange(m.id)}
          title={m.hint}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
            mode === m.id
              ? 'border-teal-700 bg-teal-700 text-white'
              : 'border-hairline bg-surface text-ink/60 hover:border-teal-700/40 hover:text-teal-700',
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
