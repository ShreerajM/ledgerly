import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useRouteLoaderData } from 'react-router'
import { TransactionList } from '../components/TransactionList.jsx'
import { Card, Chip, ErrorNotice, Skeleton } from '../components/ui.jsx'
import { formatDay, formatINR, greeting, splitINR } from '../lib/format.js'
import { dashboardQuery } from '../lib/queries.js'

function SettledChart({ daily }) {
  const W = 640, H = 150, gap = 14
  const max = Math.max(...daily.map((d) => d.total), 1)
  const bw = (W - gap * (daily.length - 1)) / daily.length
  const total = daily.reduce((s, d) => s + d.total, 0)
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Settled amount per day for the last 14 days, ${formatINR(total)} in total`} className="mt-6 h-auto w-full">
        {daily.map((d, i) => {
          const h = Math.max((d.total / max) * (H - 8), 4)
          return (
            <rect key={d.date} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx="7" fill={i === daily.length - 1 ? '#cce3fa' : '#0071e3'} />
          )
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{formatDay(daily[0].date)}</span>
        <span>Today (so far)</span>
      </div>
    </>
  )
}

function Stat({ label, children, note, className }) {
  return (
    <Card className={`px-6 py-[18px] ${className ?? ''}`}>
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">{children}</div>
      {note && <p className="mt-1 text-[13px] text-muted">{note}</p>}
    </Card>
  )
}
const statValue = 'text-[26px] font-semibold tracking-[-0.02em] tabular-nums md:text-[28px]'

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Skeleton className="h-72 rounded-card" />
      <div className="grid gap-6">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>
    </div>
  )
}

export function Component() {
  const user = useRouteLoaderData('app')
  const [today] = useState(() => new Date())
  const { data, isPending, isError, error, refetch } = useQuery(dashboardQuery())
  const isAdmin = user.role === 'admin'
  const money = data ? splitINR(data.settled30d) : null

  return (
    <>
      <title>Overview · Ledgerly</title>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-muted">
            {new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(today)}
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.025em] md:text-[34px]">
            {greeting(today)}, {user.name.split(' ')[0]}
          </h1>
        </div>
        <Link to="/transactions" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-ink">
          New transaction
        </Link>
      </header>

      {isPending && <DashboardSkeleton />}
      {isError && <ErrorNotice error={error} onRetry={refetch} />}

      {data && (
        <>
          <section aria-label="Summary" className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Card className="p-6 md:p-8">
              <p className="text-[13px] font-medium text-muted">Settled, last 30 days</p>
              <p className="mt-2 mb-1 text-4xl font-semibold tracking-[-0.035em] tabular-nums md:text-[56px]">
                {money.whole}
                <span className="text-[0.55em] text-[#86868b]">{money.cents}</span>
              </p>
              {data.deltaPct !== null && (
                <p className={`text-sm font-medium ${data.deltaPct >= 0 ? 'text-ok' : 'text-bad'}`}>
                  {data.deltaPct >= 0 ? '▲' : '▼'} {Math.abs(data.deltaPct).toFixed(1)}% compared with the previous 30 days
                </p>
              )}
              <SettledChart daily={data.daily} />
            </Card>

            <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
              <Stat label="In flight">
                <span className={statValue}>{formatINR(data.pending.amount).replace(/\.00$/, '')}</span>
                <Chip tone="warn" dot>{data.pending.count} pending</Chip>
              </Stat>
              <Stat label="Failed, last 7 days">
                <span className={statValue}>{data.failed7d}</span>
                {data.failed7d > 0 && <Chip tone="bad" dot>Needs review</Chip>}
              </Stat>
              {isAdmin && data.users ? (
                <Stat label="Active users" note={`${data.users.inactive} inactive`} className="col-span-2 lg:col-span-1">
                  <span className={statValue}>
                    {data.users.active}
                    <span className="text-lg font-medium text-[#86868b]"> / {data.users.total}</span>
                  </span>
                </Stat>
              ) : (
                <Stat label="Your transactions" className="col-span-2 lg:col-span-1">
                  <span className={statValue}>{data.myTransactionCount}</span>
                </Stat>
              )}
            </div>
          </section>

          {(data.failed7d > 0 || (isAdmin && data.users?.neverTransacted > 0)) && (
            <section aria-label="Needs attention" className="flex flex-wrap items-center gap-5 rounded-card bg-ink px-6 py-5 text-canvas md:px-8">
              <h2 className="text-lg font-semibold tracking-tight md:min-w-40">Needs attention</h2>
              <ul className="min-w-60 flex-1 space-y-1 text-sm text-[#c7c7cc]">
                {data.failed7d > 0 && <li>{data.failed7d} failed payment{data.failed7d === 1 ? '' : 's'} in the last 7 days.</li>}
                {isAdmin && data.users?.neverTransacted > 0 && (
                  <li>{data.users.neverTransacted} users have never created a transaction.</li>
                )}
              </ul>
              {data.failed7d > 0 && (
                <Link to="/transactions?status=failed" className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-ink">
                  Review failures
                </Link>
              )}
            </section>
          )}

          <Card aria-label="Recent transactions" className="overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h2 className="text-xl font-semibold tracking-tight">Recent transactions</h2>
              <Link to="/transactions" className="inline-flex min-h-11 items-center text-sm font-medium text-brand-ink">View all</Link>
            </div>
            {data.recent.length === 0 ? (
              <p className="px-6 pb-8 text-sm text-muted">No transactions yet.</p>
            ) : (
              <TransactionList items={data.recent} showCustomer={isAdmin} />
            )}
          </Card>
        </>
      )}
    </>
  )
}

