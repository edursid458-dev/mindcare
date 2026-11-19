import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '../lib/cn'

export type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const icons: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 size={16} className="text-teal-700" />,
  error: <XCircle size={16} className="text-red-600" />,
  info: <Info size={16} className="text-ink/60" />,
}

const borders: Record<ToastKind, string> = {
  success: 'border-teal-700/30',
  error: 'border-red-300',
  info: 'border-hairline',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev.slice(-4), { id, kind, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-20 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2 md:right-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-lg border bg-surface px-4 py-3 text-sm text-ink shadow-card',
              borders[t.kind],
            )}
          >
            {icons[t.kind]}
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
