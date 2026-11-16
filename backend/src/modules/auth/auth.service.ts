import type { AppContext } from '../../context.ts'
import { prismaErrorCode } from '../../db/client.ts'
import { publicUserSelect } from '../../db/selects.ts'
import { conflict, forbidden, unauthorized } from '../../lib/errors.ts'
import { burnVerifyTime, hashPassword, needsRehash, verifyPassword } from '../../lib/password.ts'
import type { LoginInput, RegisterInput } from './auth.schemas.ts'

const BAD_CREDENTIALS = 'Incorrect email or password.'

export function createAuthService({ db, tokens }: Pick<AppContext, 'db' | 'tokens'>) {
  return {
    // Public sign-up. The role column defaults to "user"; nothing the caller sends can change that.
    async register({ name, email, password }: RegisterInput) {
      const passwordHash = await hashPassword(password)
      try {
        const user = await db.user.create({
          data: { name, email, passwordHash, lastLoginAt: new Date() },
          select: publicUserSelect,
        })
        return { token: await tokens.sign(user), user }
      } catch (err) {
        if (prismaErrorCode(err) === 'P2002') {
          const message = 'An account with this email already exists.'
          throw conflict(message, { fieldErrors: { email: [message] } })
        }
        throw err
      }
    },

    async login({ email, password }: LoginInput) {
      const found = await db.user.findUnique({
        where: { email },
        select: { ...publicUserSelect, passwordHash: true },
      })

      if (!found) {
        await burnVerifyTime(password) // keep timing similar to the "wrong password" path
        throw unauthorized(BAD_CREDENTIALS)
      }
      if (!(await verifyPassword(found.passwordHash, password))) throw unauthorized(BAD_CREDENTIALS)
      // Only reveal that an account is deactivated to someone who proved they know the password.
      if (!found.isActive) throw forbidden('This account is deactivated. Contact an admin.')

      // Quietly upgrade the stored hash if our Argon2 settings have been raised since it was created.
      const upgraded = needsRehash(found.passwordHash) ? await hashPassword(password) : undefined
      const user = await db.user.update({
        where: { id: found.id },
        data: { lastLoginAt: new Date(), ...(upgraded ? { passwordHash: upgraded } : {}) },
        select: publicUserSelect,
      })
      return { token: await tokens.sign(user), user }
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>
