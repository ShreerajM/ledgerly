import type { Prisma } from '../generated/prisma/client.ts'

// The only user fields that may leave the database layer. passwordHash is deliberately absent.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect

// A transaction together with the name of the user it belongs to (the "customer").
export const transactionSelect = {
  id: true,
  reference: true,
  userId: true,
  amount: true,
  status: true,
  note: true,
  createdAt: true,
  user: { select: { name: true } },
} satisfies Prisma.TransactionSelect

type TransactionRecord = Prisma.TransactionGetPayload<{ select: typeof transactionSelect }>

/** Database record -> API shape. numeric(12,2) arrives as a Decimal; the API contract uses a JSON number. */
export const toTransactionDto = (row: TransactionRecord) => ({
  id: row.id,
  reference: row.reference,
  customerId: row.userId,
  customerName: row.user.name,
  amount: row.amount.toNumber(),
  status: row.status,
  note: row.note,
  createdAt: row.createdAt,
})
