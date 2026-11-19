import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Brain, Bell, Menu, X, Leaf } from 'lucide-react'
import { getDashboard } from '../lib/api'
import type { DashboardResponse } from '../lib/types'
import { cn } from '../lib/cn'

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/chat', label: 'AI Chatbot' },
  { to: '/checkins', label: 'Check-ins' },
  { to: '/wearables', label: 'Wearables' },
  { to: '/insights', label: 'Insights' },
  { to: '/recommendations', label: 'Recommendations' },
]

function useNotifications() {
  const [items, setItems] = useState<{ label: string; done: boolean }[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    getDashboard()
      .then((d: DashboardResponse) => {
        if (cancelled) return
        const list: { label: string; done: boolean }[] = []
        if (!d.checkin_status.midday)
          list.push({ label: 'Midday check-in is still open', done: false })
        if (!d.checkin_status.evening)
          list.push({ label: 'Evening check-in is still open', done: false })
        if ((d.wellness_observations?.length ?? 0) > 0)
          list.push({ label: 'New wellness observations available', done: false })
        setItems(list)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { items, open, setOpen }
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { items, open, setOpen } = useNotifications()
  const unread = items.length

  // close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setOpen(false)
  }, [location.pathname, setOpen])

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="sticky top-0 z-50 border-b border-hairline bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Leaf size={16} strokeWidth={1.8} />
            </span>
            <span className="text-lg font-bold tracking-tight">
              MindCare <span className="text-teal-700">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative py-1 text-[13px] font-semibold transition-colors',
                    isActive ? 'text-teal-700' : 'text-ink/60 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-[21px] left-0 h-[2px] w-full bg-teal-700" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* notifications */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink/70 transition-colors hover:border-teal-700/40 hover:text-teal-700"
                aria-label="Notifications"
              >
                <Bell size={17} strokeWidth={1.8} />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {open && (
                <div className="absolute right-0 top-11 w-72 rounded-xl border border-hairline bg-surface p-2 shadow-card">
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
                    Notifications
                  </p>
                  {items.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-ink/50">
                      You're all caught up.
                    </p>
                  ) : (
                    items.map((it, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-ink/80"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-700" />
                        {it.label}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink/70 lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* mobile nav */}
        {menuOpen && (
          <nav className="border-t border-hairline bg-paper px-5 py-3 lg:hidden">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'block rounded-lg px-3 py-2.5 text-sm font-semibold',
                    isActive
                      ? 'bg-sage/60 text-teal-700'
                      : 'text-ink/70 hover:bg-sage/30',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-hairline bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-10 md:flex-row md:items-center md:px-8">
          <div className="flex items-center gap-2.5">
            <Brain size={18} className="text-teal-700" strokeWidth={1.8} />
            <span className="text-sm font-bold tracking-tight">
              MindCare AI
            </span>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-ink/50">
            MindCare AI is a wellness companion, not medical care. If you are in
            crisis, please reach out to Tele-MANAS at <span className="font-semibold text-ink/70">14416</span>.
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Editorial Wellness · Est. 2025
          </p>
        </div>
      </footer>
    </div>
  )
}
