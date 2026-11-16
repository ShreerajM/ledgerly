import type { AppContext } from '../../context.ts'
import { toTransactionDto, transactionSelect } from '../../db/selects.ts'
import { Prisma } from '../../generated/prisma/client.ts'
import type { AuthUser } from '../../middleware/authenticate.ts'

interface TotalsRow {
  settled30d: number
  settledPrev30d: number
  pendingCount: number
  pendingAmount: number
  failed7d: number
  totalCount: number
}
interface DailyRow {
  date: Date | string
  total: number
}

// Everything here runs one query at a time, so a single dashboard request never holds
// more than one pooled connection (important when the pool is small).
export function createDashboardService({ db, env }: Pick<AppContext, 'db' | 'env'>) {
  return {
    async get(actor: AuthUser) {
      const isAdmin = actor.role === 'admin'
      // Admins aggregate everything; everyone else only their own rows.
      const scopeUserId = isAdmin ? null : actor.id
      const where = scopeUserId === null ? Prisma.empty : Prisma.sql`WHERE user_id = ${scopeUserId}`
      const tz = env.APP_TIMEZONE

      const [totals] = await db.$queryRaw<TotalsRow[]>`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE status = 'success' AND created_at >= now() - interval '30 days'), 0)::float8 AS "settled30d",
          COALESCE(SUM(amount) FILTER (WHERE status = 'success' AND created_at >= now() - interval '60 days'
                                         AND created_at < now() - interval '30 days'), 0)::float8 AS "settledPrev30d",
          (COUNT(*) FILTER (WHERE status = 'pending'))::int AS "pendingCount",
          COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::float8 AS "pendingAmount",
          (COUNT(*) FILTER (WHERE status = 'failed' AND created_at >= now() - interval '7 days'))::int AS "failed7d",
          COUNT(*)::int AS "totalCount"
        FROM transactions ${where}`
      if (!totals) throw new Error('Dashboard totals query returned no row')

      // One row per calendar day (in APP_TIMEZONE), including days with no settled payments.
      // Range comparisons keep the (created_at) indexes usable.
      const dailyRows = await db.$queryRaw<DailyRow[]>`
        WITH days AS (
          SELECT d::date AS day
          FROM generate_series(
            ((now() AT TIME ZONE ${tz}::text)::date - 13)::timestamp,
            (now() AT TIME ZONE ${tz}::text)::date::timestamp,
            interval '1 day') AS d
        )
        SELECT (days.day::timestamp AT TIME ZONE ${tz}::text) AS "date",
               COALESCE(SUM(t.amount), 0)::float8 AS "total"
        FROM days
        LEFT JOIN transactions t
          ON t.status = 'success'
         AND t.created_at >= (days.day::timestamp AT TIME ZONE ${tz}::text)
         AND t.created_at <  ((days.day + 1)::timestamp AT TIME ZONE ${tz}::text)
         ${scopeUserId === null ? Prisma.empty : Prisma.sql`AND t.user_id = ${scopeUserId}`}
        GROUP BY days.day
        ORDER BY days.day`

      const recent = await db.transaction.findMany({
        where: scopeUserId === null ? {} : { userId: scopeUserId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 6,
        select: transactionSelect,
      })

      let users = null
      if (isAdmin) {
        const [total, active, neverTransacted] = await db.$transaction([
          db.user.count(),
          db.user.count({ where: { isActive: true } }),
          db.user.count({ where: { transactions: { none: {} } } }),
        ])
        users = { total, active, inactive: total - active, neverTransacted }
      }

      return {
        scope: isAdmin ? ('all' as const) : ('self' as const),
        settled30d: totals.settled30d,
        deltaPct:
          totals.settledPrev30d > 0
            ? ((totals.settled30d - totals.settledPrev30d) / totals.settledPrev30d) * 100
            : null,
        daily: dailyRows.map((row) => ({ date: new Date(row.date), total: row.total })),
        pending: { count: totals.pendingCount, amount: totals.pendingAmount },
        failed7d: totals.failed7d,
        users,
        myTransactionCount: isAdmin ? null : totals.totalCount,
        recent: recent.map(toTransactionDto),
      }
    },
  }
}
