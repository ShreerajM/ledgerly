import type { Request, RequestHandler } from 'express'
import type { AppContext } from '../context.ts'
import { unauthorized } from '../lib/errors.ts'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

/** The signed-in user. Only call this in handlers that sit behind `authenticate`. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized()
  return req.user
}

// Verifies the Bearer token, then loads the user from the database on every request.
// One primary-key lookup is cheap, and it means role changes and deactivation apply immediately.
export function createAuthenticate({ db, tokens }: Pick<AppContext, 'db' | 'tokens'>): RequestHandler {
  return async (req, _res, next) => {
    const [scheme, token] = (req.get('authorization') ?? '').split(' ')
    if (scheme?.toLowerCase() !== 'bearer' || !token) throw unauthorized()

    let userId: number
    try {
      userId = await tokens.verify(token)
    } catch {
      throw unauthorized('Your session has expired. Please sign in again.')
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })

    // 401 (not 403) for a deactivated account so the web app signs the person out.
    if (!user || !user.isActive) throw unauthorized('This account is no longer active.')

    req.user = { id: user.id, name: user.name, email: user.email, role: user.role }
    next()
  }
}
