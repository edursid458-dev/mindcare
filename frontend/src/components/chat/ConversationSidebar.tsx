import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquarePlus,
  Search,
  Trash2,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import type { ConversationSummary } from '../../lib/types'
import { cn } from '../../lib/cn'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay)
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function ConversationSidebar({
  conversations,
  activeId,
  search,
  onSearch,
  onSelect,
  onNew,
  onDelete,
  onRename,
  loading,
}: {
  conversations: ConversationSummary[]
  activeId: string | null
  search: string
  onSearch: (v: string) => void
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  loading: boolean
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      c.title.toLowerCase().includes(q) ||
      (c.preview ?? '').toLowerCase().includes(q)
    )
  })

  const commitRename = (id: string) => {
    const t = editValue.trim()
    if (t) onRename(id, t)
    setEditingId(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-hairline p-4">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-teal-800"
        >
          <MessageSquarePlus size={15} /> New conversation
        </button>
        <div className="relative mt-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-lg border border-hairline bg-paper py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-ink/40 focus:border-teal-700/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg bg-neutral-200/70 p-3">
                <div className="h-3.5 w-3/4 rounded bg-neutral-300/70" />
                <div className="mt-2 h-3 w-1/2 rounded bg-neutral-300/50" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-ink/45">
            {search ? 'No conversations match.' : 'No conversations yet.'}
          </p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((c) => {
              const active = c.conversation_id === activeId
              const editing = editingId === c.conversation_id
              return (
                <li key={c.conversation_id}>
                  {editing ? (
                    <div className="flex items-center gap-1 rounded-lg border border-teal-700/40 bg-sage/40 p-1.5">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(c.conversation_id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
                      />
                      <button
                        onClick={() => commitRename(c.conversation_id)}
                        className="rounded p-1 text-teal-700 hover:bg-teal-50"
                        aria-label="Save title"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded p-1 text-ink/50 hover:bg-neutral-200"
                        aria-label="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'group flex cursor-pointer items-start gap-1 rounded-lg px-3 py-2.5 transition-colors',
                        active ? 'bg-sage/60' : 'hover:bg-sage/30',
                      )}
                      onClick={() => onSelect(c.conversation_id)}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm font-semibold',
                            active ? 'text-teal-700' : 'text-ink',
                          )}
                        >
                          {c.title}
                        </p>
                        {c.preview && (
                          <p className="mt-0.5 truncate text-xs text-ink/50">
                            {c.preview}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-ink/35">
                          {formatTime(c.updated_at)}
                        </p>
                      </div>
                      <div className="hidden shrink-0 gap-0.5 group-hover:flex">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(c.conversation_id)
                            setEditValue(c.title)
                          }}
                          className="rounded p-1 text-ink/40 hover:bg-surface hover:text-ink"
                          aria-label="Rename"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(c.conversation_id)
                          }}
                          className="rounded p-1 text-ink/40 hover:bg-surface hover:text-red-600"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-hairline p-3">
        <Link
          to="/"
          className="block rounded-lg px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45 transition-colors hover:text-teal-700"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  )
}
