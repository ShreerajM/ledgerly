import type { AppContext } from '../../context.ts'
import { prismaErrorCode } from '../../db/client.ts'
import { publicUserSelect } from '../../db/selects.ts'
import type { Prisma } from '../../generated/prisma/client.ts'
import { badRequest, notFound } from '../../lib/errors.ts'
import { escapeLike, offsetFor } from '../../lib/pagination.ts'
import type { AuthUser } from '../../middleware/authenticate.ts'
import type { ListUsersQuery, UserRole } from './users.schemas.ts'

export function createUsersService({ db }: Pick<AppContext, 'db'>) {
  async function update(actor: AuthUser, id: number, data: Prisma.UserUpdateInput) {
    // An admin cannot lock themselves out, which also guarantees at least one active admin remains.
    if (id === actor.id) throw badRequest('You cannot change your own role or status.')

    try {
      return await db.user.update({ where: { id }, data, select: publicUserSelect })
    } catch (err) {
      if (prismaErrorCode(err) === 'P2025') throw notFound('User not found.') // no row with that id
      throw err
    }
  }

  return {
    async list({ q, role, status, page, pageSize }: ListUsersQuery) {
      const where: Prisma.UserWhereInput = {
        ...(role !== 'all' && { role }),
        ...(status !== 'all' && { isActive: status === 'active' }),
        ...(q && {
          OR: [
            { name: { contains: escapeLike(q), mode: 'insensitive' } },
            { email: { contains: escapeLike(q), mode: 'insensitive' } },
          ],
        }),
      }

      // One database transaction, so the count and the page come from the same snapshot.
      const [total, rows] = await db.$transaction([
        db.user.count({ where }),
        db.user.findMany({
          where,
          orderBy: { id: 'asc' },
          skip: offsetFor(page, pageSize),
          take: pageSize,
          select: { ...publicUserSelect, _count: { select: { transactions: true } } },
        }),
      ])

      const items = rows.map(({ _count, ...user }) => ({ ...user, transactionCount: _count.transactions }))
      return { items, total, page, pageSize }
    },

    async me(id: number) {
      const user = await db.user.findUnique({ where: { id }, select: publicUserSelect })
      if (!user) throw notFound('User not found.')
      return user
    },

    changeRole: (actor: AuthUser, id: number, role: UserRole) => update(actor, id, { role }),
    changeStatus: (actor: AuthUser, id: number, isActive: boolean) => update(actor, id, { isActive }),
  }
}

export type UsersService = ReturnType<typeof createUsersService>
