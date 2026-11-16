import { z } from 'zod'
import { UserRole as UserRoleValues } from '../../generated/prisma/enums.ts'
import { paginated, paginationQuery } from '../../lib/pagination.ts'

const roleSchema = z.enum(UserRoleValues)

// ---- Response models (what the API is allowed to send) ----
export const userSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  isActive: z.boolean(),
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
})
export const userWithCountSchema = userSchema.extend({ transactionCount: z.number().int().min(0) })
export const userListSchema = paginated(userWithCountSchema)

// ---- Request models (what the API accepts) ----
export const listUsersQuery = paginationQuery.extend({
  q: z.string().trim().max(100).default(''),
  role: z.union([z.literal('all'), roleSchema]).default('all'),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
})
export const userIdParams = z.object({ id: z.coerce.number().int().min(1) })
export const changeRoleBody = z.object({ role: roleSchema })
export const changeStatusBody = z.object({ isActive: z.boolean() })

export type ListUsersQuery = z.output<typeof listUsersQuery>
export type UserRole = z.infer<typeof roleSchema>
