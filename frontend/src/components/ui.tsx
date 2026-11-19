import { type ReactNode } from 'react'
import { cn } from '../lib/cn'

/* ---------- PageHeader: eyebrow + title + description ---------- */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-10 md:mb-14">
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-3xl md:text-5xl font-bold tracking-tight text-ink">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-base md:text-lg text-ink/60">{description}</p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}

/* ---------- SectionHeader: numbered editorial section ---------- */
export function SectionHeader({
  index,
  label,
  title,
  description,
  action,
}: {
  index?: string
  label?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {(index || label) && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
            {index && <span className="text-ink/40">{index} / </span>}
            {label ?? title}
          </p>
        )}
        <h2 className="mt-1.5 text-xl md:text-2xl font-bold tracking-tight text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm text-ink/55">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

/* ---------- Cards ---------- */
export function Card({
  children,
  className,
  tinted,
}: {
  children: ReactNode
  className?: string
  tinted?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-hairline bg-surface shadow-card',
        tinted && 'bg-sage/40',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ---------- Numbered data card ---------- */
export function NumberedCard({
  index,
  label,
  value,
  sub,
  icon,
}: {
  index: string
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
}) {
  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-start justify-between">
        <span className="text-2xl font-bold tracking-tight text-ink/25">{index}</span>
        {icon && <span className="text-teal-700">{icon}</span>}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
        {label}
      </p>
      <div className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-ink">
        {value}
      </div>
      {sub && <div className="mt-1 text-sm text-ink/55">{sub}</div>}
    </Card>
  )
}

/* ---------- Badge ---------- */
const badgeTones: Record<string, string> = {
  teal: 'bg-teal-50 text-teal-700 border-teal-100',
  sage: 'bg-sage text-ink/70 border-sage-dark/40',
  ink: 'bg-ink text-paper border-ink',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-neutral-100 text-ink/60 border-hairline',
}

export function Badge({
  children,
  tone = 'teal',
  className,
}: {
  children: ReactNode
  tone?: keyof typeof badgeTones
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---------- Buttons ---------- */
export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function TealButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border border-hairline bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-teal-700/40 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ---------- EmptyState ---------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface/60 px-6 py-14 text-center">
      {icon && <div className="mb-4 text-ink/30">{icon}</div>}
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-ink/55">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Loading skeletons ---------- */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-neutral-200/70', className)}
    />
  )
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="p-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-7 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="mt-3 h-4 w-full" />
      ))}
    </Card>
  )
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-10 w-72" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/* ---------- Spinner ---------- */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      aria-label="Loading"
    />
  )
}

/* ---------- Error banner ---------- */
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <GhostButton onClick={onRetry} className="shrink-0 px-4 py-1.5 text-xs">
          Retry
        </GhostButton>
      )}
    </div>
  )
}
