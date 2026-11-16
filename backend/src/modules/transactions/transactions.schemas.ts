import { z } from 'zod'
import { TransactionStatus } from '../../generated/prisma/enums.ts'
import { paginated, paginationQuery } from '../../lib/pagination.ts'

export const MAX_AMOUNT = 10_000_000

const statusSchema = z.enum(TransactionStatus)

// ---- Response models ----
export const transactionSchema = z.object({
  id: z.number().int(),
  reference: z.string(),
  customerId: z.number().int(),
  customerName: z.string(),
  amount: z.number(),
  status: statusSchema,
  note: z.string(),
  createdAt: z.date(),
})
export const transactionListSchema = paginated(transactionSchema)

// ---- Request models ----
export const listTransactionsQuery = paginationQuery.extend({
  q: z.string().trim().max(100).default(''),
  status: z.union([z.literal('all'), statusSchema]).default('all'),
})

// The report uses the same search and status filters as the list, without paging.
export const exportTransactionsQuery = listTransactionsQuery.pick({ q: true, status: true })

export const createTransactionBody = z.object({
  amount: z
    .number({ error: 'Amount must be a number.' })
    .gt(0, { error: 'Amount must be greater than 0.' })
    .max(MAX_AMOUNT, { error: 'Amount cannot exceed 1,00,00,000.' })
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, { error: 'Use at most 2 decimal places.' }),
  note: z.string().trim().max(120, { error: 'Note can be at most 120 characters.' }).default(''),
  // Only honoured for admins; everyone else always creates transactions for themselves.
  customerId: z.number().int().min(1).optional(),
})

export type ExportTransactionsQuery = z.output<typeof exportTransactionsQuery>
export type ListTransactionsQuery = z.output<typeof listTransactionsQuery>
export type CreateTransactionInput = z.output<typeof createTransactionBody>
