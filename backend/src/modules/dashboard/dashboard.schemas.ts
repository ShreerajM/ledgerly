import { z } from 'zod'
import { transactionSchema } from '../transactions/transactions.schemas.ts'

// Response model for GET /api/dashboard.
// Admins get totals for every transaction ("all"); regular users get their own ("self").
export const dashboardSchema = z.object({
  scope: z.enum(['all', 'self']),
  settled30d: z.number(),
  /** % change against the previous 30 days; null when there is nothing to compare with. */
  deltaPct: z.number().nullable(),
  /** Settled amount per calendar day for the last 14 days, oldest first. */
  daily: z.array(z.object({ date: z.date(), total: z.number() })).length(14),
  pending: z.object({ count: z.number().int(), amount: z.number() }),
  failed7d: z.number().int(),
  /** Workspace-wide user counts. Admin only, null for everyone else. */
  users: z
    .object({
      total: z.number().int(),
      active: z.number().int(),
      inactive: z.number().int(),
      neverTransacted: z.number().int(),
    })
    .nullable(),
  /** Number of the caller's own transactions. Regular users only, null for admins. */
  myTransactionCount: z.number().int().nullable(),
  recent: z.array(transactionSchema),
})
