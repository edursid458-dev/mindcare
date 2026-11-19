import { useState } from 'react'
import { ThumbsUp, ThumbsDown, User } from 'lucide-react'
import type { ChatMessage } from '../../lib/types'
import { cn } from '../../lib/cn'

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-[11px] font-bold text-teal-800">
        MC
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-hairline bg-surface px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-teal-700/60"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export function MessageBubble({
  message,
  onFeedback,
}: {
  message: ChatMessage
  onFeedback?: (messageId: string, feedback: 'up' | 'down') => void
}) {
  const isUser = message.role === 'user'
  const [feedback, setFeedback] = useState(message.feedback)

  const handleFeedback = (f: 'up' | 'down') => {
    const next = feedback === f ? null : f
    setFeedback(next)
    if (next) onFeedback?.(message.message_id, next)
  }

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
          isUser
            ? 'bg-teal-700 text-white'
            : 'bg-sage text-teal-800',
        )}
      >
        {isUser ? <User size={14} /> : 'MC'}
      </span>

      <div className={cn('max-w-[85%] md:max-w-[75%]', isUser && 'flex flex-col items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'rounded-br-md bg-teal-50 text-ink border border-teal-100'
              : 'rounded-bl-md border border-hairline bg-surface text-ink shadow-card',
          )}
        >
          {message.content}
        </div>

        <div className="mt-1.5 flex items-center gap-2 px-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-ink/40">
            {isUser ? 'You' : 'MindCare AI'} · {formatTime(message.timestamp)}
          </span>
          {!isUser && onFeedback && (
            <span className="flex gap-0.5">
              <button
                onClick={() => handleFeedback('up')}
                className={cn(
                  'rounded p-1 transition-colors',
                  feedback === 'up'
                    ? 'text-teal-700'
                    : 'text-ink/30 hover:text-ink/60',
                )}
                aria-label="Helpful"
              >
                <ThumbsUp size={13} fill={feedback === 'up' ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => handleFeedback('down')}
                className={cn(
                  'rounded p-1 transition-colors',
                  feedback === 'down'
                    ? 'text-red-600'
                    : 'text-ink/30 hover:text-ink/60',
                )}
                aria-label="Not helpful"
              >
                <ThumbsDown size={13} fill={feedback === 'down' ? 'currentColor' : 'none'} />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
