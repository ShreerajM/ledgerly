import { useId } from 'react'
import { ChevronLeft, ChevronRight, TriangleAlert } from 'lucide-react'
import { cx } from '../lib/cx.js'
import { initials } from '../lib/format.js'

const TONES = {
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  bad: 'bg-bad-bg text-bad',
  brand: 'bg-brand-soft text-brand-ink',
  neutral: 'bg-chip text-chip-ink',
}

export function Chip({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {dot && <i aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

const STATUS = {
  success: ['ok', 'Success'],
  pending: ['warn', 'Pending'],
  failed: ['bad', 'Failed'],
}
export function StatusChip({ status }) {
  const [tone, label] = STATUS[status] ?? ['neutral', status]
  return (
    <Chip tone={tone} dot>
      {label}
    </Chip>
  )
}

export function RoleChip({ role }) {
  return <Chip tone={role === 'admin' ? 'brand' : 'neutral'}>{role === 'admin' ? 'Admin' : 'User'}</Chip>
}

export function Card({ className, ...props }) {
  return <div className={cx('rounded-card bg-white shadow-card', className)} {...props} />
}

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-ink',
  dark: 'bg-ink text-white hover:bg-black',
  light: 'bg-white text-ink hover:bg-white/90',
  quiet: 'bg-chip text-ink hover:bg-black/10',
}
export function Button({ variant = 'primary', className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}

const INPUT =
  'min-h-12 w-full rounded-xl border border-[#d2d2d7] bg-white px-4 text-[15px] text-ink placeholder:text-muted aria-[invalid=true]:border-bad'

export function Field({ label, error, hint, as: Tag = 'input', className, children, ...props }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium">
        {label}
      </label>
      <Tag
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={INPUT}
        {...props}
      >
        {children}
      </Tag>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function Segmented({ label, value, onChange, options, className }) {
  return (
    <div role="group" aria-label={label} className={cx('flex gap-0.5 rounded-xl bg-chip p-[3px]', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'min-h-11 flex-1 cursor-pointer rounded-[9px] px-4 text-[13px] font-medium whitespace-nowrap transition-colors md:min-h-9 md:flex-none',
            value === o.value ? 'bg-white text-ink shadow-sm' : 'text-[#424245] hover:bg-black/5',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Avatar({ name, className }) {
  return (
    <span
      aria-hidden
      className={cx(
        'inline-grid size-10 flex-none place-items-center rounded-full bg-chip text-[13px] font-semibold text-[#424245]',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

const PAGER =
  'grid size-11 cursor-pointer place-items-center rounded-full bg-chip text-ink transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-40'

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(Math.ceil(total / pageSize), 1)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 px-5 py-4 text-[13px] text-muted">
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} className={PAGER}>
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <span className="min-w-16 text-center tabular-nums">
          {page} / {pages}
        </span>
        <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} className={PAGER}>
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
    </nav>
  )
}

export function Skeleton({ className }) {
  return <div aria-hidden className={cx('animate-pulse rounded-xl bg-black/5', className)} />
}

export function EmptyState({ title, children }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-[15px] font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  )
}

export function ErrorNotice({ error, onRetry }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-bad-bg px-5 py-4 text-sm text-bad">
      <TriangleAlert aria-hidden className="size-4 flex-none" />
      <span className="flex-1">{error?.message ?? 'Something went wrong.'}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="min-h-11 cursor-pointer font-semibold underline">
          Try again
        </button>
      )}
    </div>
  )
}

export function PageHeader({ eyebrow, title, children }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[13px] font-medium text-muted">{eyebrow}</p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.025em] md:text-[34px]">{title}</h1>
      </div>
      {children}
    </header>
  )
}
