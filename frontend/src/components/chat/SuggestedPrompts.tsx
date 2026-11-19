import { Sparkles } from 'lucide-react'

export const SUGGESTED_PROMPTS = [
  "I've been feeling stressed lately — where do I start?",
  'Help me wind down before sleep tonight.',
  'I feel low on energy. What can I do right now?',
  'How can I handle anxious thoughts in the moment?',
  'What small habits could improve my mood this week?',
]

export function SuggestedPrompts({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8">
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
        Try asking
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => onPick(p)}
            className="group flex items-start gap-3 rounded-xl border border-hairline bg-surface p-4 text-left text-sm leading-snug text-ink/75 transition-colors hover:border-teal-700/40 hover:text-ink"
          >
            <Sparkles
              size={15}
              className="mt-0.5 shrink-0 text-teal-700/60 transition-colors group-hover:text-teal-700"
              strokeWidth={1.8}
            />
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

export const FOLLOW_UP_CHIPS = [
  'Can you explain that more simply?',
  'What should I try first?',
  'How does this connect to my check-ins?',
  'What if I only have five minutes?',
  'Can we talk about something else?',
]

export function FollowUpChips({ onPick }: { onPick: (chip: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 px-1 pb-2">
      {FOLLOW_UP_CHIPS.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className="rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:border-teal-700/40 hover:text-teal-700"
        >
          {c}
        </button>
      ))}
    </div>
  )
}
