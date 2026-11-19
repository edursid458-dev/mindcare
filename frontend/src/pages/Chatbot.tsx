import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Send,
  Square,
  RotateCcw,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  PanelLeft,
} from 'lucide-react'
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  renameConversation,
  sendMessage,
  sendMessageFeedback,
} from '../lib/api'
import { ApiError } from '../lib/api'
import type { ChatMessage, ChatMode, Conversation, ConversationSummary } from '../lib/types'
import { ConversationSidebar } from '../components/chat/ConversationSidebar'
import { MessageBubble, TypingIndicator } from '../components/chat/ChatMessageBubble'
import { ModeSelector } from '../components/chat/ModeSelector'
import { SuggestedPrompts, FollowUpChips } from '../components/chat/SuggestedPrompts'
import { useToast } from '../components/Toast'
import { cn } from '../lib/cn'

interface PendingError {
  content: string
  mode: ChatMode
  kind: 'ai_not_configured' | 'error'
}

export default function Chatbot() {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [active, setActive] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [convLoading, setConvLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<ChatMode>('balanced')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingError, setPendingError] = useState<PendingError | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const refreshList = useCallback(async () => {
    const list = await listConversations()
    setConversations(list)
    return list
  }, [])

  const openConversation = useCallback(async (id: string) => {
    setConvLoading(true)
    setPendingError(null)
    try {
      const conv = await getConversation(id)
      setActive(conv)
      setMessages(conv.messages ?? [])
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load conversation', 'error')
    } finally {
      setConvLoading(false)
    }
  }, [toast])

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (active) return active.conversation_id
    const created = await createConversation()
    setConversations((prev) => [
      {
        conversation_id: created.conversation_id,
        title: created.title,
        created_at: created.created_at,
        updated_at: created.updated_at,
        preview: created.preview ?? null,
      },
      ...prev,
    ])
    setActive({ ...created, messages: [] } as Conversation)
    setMessages([])
    return created.conversation_id
  }, [active])

  // initial load: list conversations, open most recent or create one
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await listConversations()
        if (cancelled) return
        setConversations(list)
        if (list.length > 0) {
          await openConversation(list[0].conversation_id)
        } else {
          const created = await createConversation()
          if (cancelled) return
          setActive({ ...created, messages: [] } as Conversation)
          setConversations([
            {
              conversation_id: created.conversation_id,
              title: created.title,
              created_at: created.created_at,
              updated_at: created.updated_at,
              preview: created.preview ?? null,
            },
          ])
        }
      } catch (e) {
        if (!cancelled)
          toast(e instanceof Error ? e.message : 'Failed to load chat', 'error')
      } finally {
        if (!cancelled) setListLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // autoscroll on new messages / sending state
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending])

  const doSend = useCallback(
    async (content: string, m: ChatMode) => {
      const text = content.trim()
      if (!text || sending) return
      setPendingError(null)
      setSending(true)
      setInput('')
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const convId = await ensureConversation()
        const res = await sendMessage(convId, text, m, controller.signal)
        setMessages((prev) => [
          ...prev,
          res.user_message,
          ...(res.assistant_message ? [res.assistant_message] : []),
        ])
        if (res.assistant_message === null || res.error) {
          const kind = res.error === 'ai_not_configured' ? 'ai_not_configured' : 'error'
          setPendingError({ content: text, mode: m, kind })
        }
        // refresh conversation list (titles/previews may update)
        refreshList().catch(() => {})
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          toast('Response stopped', 'info')
        } else if (e instanceof ApiError) {
          setPendingError({ content: text, mode: m, kind: 'error' })
        } else {
          setPendingError({ content: text, mode: m, kind: 'error' })
        }
      } finally {
        setSending(false)
        abortRef.current = null
      }
    },
    [sending, ensureConversation, refreshList, toast],
  )

  const handleSend = () => doSend(input, mode)

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const handleRetry = () => {
    if (pendingError) doSend(pendingError.content, pendingError.mode)
  }

  const handleNew = async () => {
    try {
      const created = await createConversation()
      const summary: ConversationSummary = {
        conversation_id: created.conversation_id,
        title: created.title,
        created_at: created.created_at,
        updated_at: created.updated_at,
        preview: created.preview ?? null,
      }
      setConversations((prev) => [summary, ...prev])
      setActive({ ...created, messages: [] } as Conversation)
      setMessages([])
      setPendingError(null)
      setSidebarOpen(false)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to create conversation', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.conversation_id !== id))
      if (active?.conversation_id === id) {
        const remaining = conversations.filter((c) => c.conversation_id !== id)
        if (remaining.length > 0) {
          openConversation(remaining[0].conversation_id)
        } else {
          handleNew()
        }
      }
      toast('Conversation deleted', 'info')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete', 'error')
    }
  }

  const handleRename = async (id: string, title: string) => {
    try {
      await renameConversation(id, title)
      setConversations((prev) =>
        prev.map((c) => (c.conversation_id === id ? { ...c, title } : c)),
      )
      if (active?.conversation_id === id)
        setActive((a) => (a ? { ...a, title } : a))
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to rename', 'error')
    }
  }

  const handleClear = async () => {
    if (!active) return
    if (!window.confirm('Clear this conversation? This cannot be undone.')) return
    await handleDelete(active.conversation_id)
  }

  const handleFeedback = async (messageId: string, feedback: 'up' | 'down') => {
    try {
      await sendMessageFeedback(messageId, feedback)
    } catch {
      toast('Could not save feedback', 'error')
    }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  const showFollowUps =
    !sending && !pendingError && lastAssistant && messages.length > 0

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* toolbar */}
      <div className="border-b border-hairline bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink/70 lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle conversations"
            >
              <PanelLeft size={17} />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                AI Companion
              </p>
              <h1 className="text-lg font-bold tracking-tight md:text-xl">
                {active?.title ?? 'MindCare AI'}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ModeSelector mode={mode} onChange={setMode} disabled={sending} />
            <button
              onClick={handleClear}
              disabled={!active || messages.length === 0 || sending}
              className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
            >
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden">
        {/* sidebar */}
        <aside
          className={cn(
            'w-full shrink-0 border-r border-hairline bg-surface/60 lg:w-80 lg:static',
            sidebarOpen ? 'absolute inset-0 z-40 lg:relative' : 'hidden lg:block',
          )}
        >
          <div className="h-full lg:sticky lg:top-16">
            <ConversationSidebar
              conversations={conversations}
              activeId={active?.conversation_id ?? null}
              search={search}
              onSearch={setSearch}
              onSelect={(id) => {
                openConversation(id)
                setSidebarOpen(false)
              }}
              onNew={handleNew}
              onDelete={handleDelete}
              onRename={handleRename}
              loading={listLoading}
            />
          </div>
        </aside>

        {/* chat column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {pendingError?.kind === 'ai_not_configured' && (
            <div className="border-b border-amber-200 bg-amber-50 px-5 py-3">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm text-amber-800">
                  <AlertTriangle size={15} className="shrink-0" />
                  The AI assistant isn't configured yet (missing API key). Your
                  message was not answered.
                </p>
                <button
                  onClick={handleRetry}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-surface px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                >
                  <RotateCcw size={13} /> Retry
                </button>
              </div>
            </div>
          )}
          {pendingError?.kind === 'error' && (
            <div className="border-b border-red-200 bg-red-50 px-5 py-3">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle size={15} className="shrink-0" />
                  Something went wrong sending your message.
                </p>
                <button
                  onClick={handleRetry}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-surface px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <RotateCcw size={13} /> Retry
                </button>
              </div>
            </div>
          )}

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-6">
              {convLoading ? (
                <div className="space-y-6">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={cn('flex gap-3', i % 2 === 1 && 'flex-row-reverse')}
                    >
                      <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200" />
                      <div
                        className={cn(
                          'h-16 animate-pulse rounded-2xl bg-neutral-200/70',
                          i % 2 === 1 ? 'w-48' : 'w-64',
                        )}
                      />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 && !sending ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage text-teal-800">
                    <ShieldAlert size={24} strokeWidth={1.6} />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">
                    How are you doing today?
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-ink/55">
                    I'm here to listen, reflect, and help you think things
                    through. This is a wellness conversation, not medical care.
                  </p>
                  <div className="mt-8 w-full">
                    <SuggestedPrompts onPick={(p) => doSend(p, mode)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((m) => (
                    <MessageBubble key={m.message_id} message={m} onFeedback={handleFeedback} />
                  ))}
                  {sending && <TypingIndicator />}
                  {showFollowUps && <FollowUpChips onPick={(c) => doSend(c, mode)} />}
                </div>
              )}
            </div>
          </div>

          {/* input */}
          <div className="border-t border-hairline bg-paper">
            <div className="mx-auto max-w-3xl px-4 py-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={1}
                  placeholder="Share what's on your mind…"
                  className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-hairline bg-surface px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-ink/40 focus:border-teal-700/50"
                />
                {sending ? (
                  <button
                    onClick={handleStop}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition-colors hover:bg-red-700"
                    aria-label="Stop generating"
                  >
                    <Square size={15} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white transition-colors hover:bg-teal-800 disabled:opacity-40"
                    aria-label="Send"
                  >
                    <Send size={17} />
                  </button>
                )}
              </div>
              <p className="mt-2.5 text-center text-[11px] leading-relaxed text-ink/40">
                MindCare AI is a wellness companion, not medical care. In crisis:
                Tele-MANAS <span className="font-semibold">14416</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
