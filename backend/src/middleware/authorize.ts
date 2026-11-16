import type { RequestHandler } from 'express'
import { forbidden } from '../lib/errors.ts'
import { currentUser } from './authenticate.ts'
import type { AuthUser } from './authenticate.ts'

// Role-based access control: allow the request only for the listed roles.
// Always place this after `authenticate`. The web app also hides these screens, but this is the real gate.
export const requireRole =
  (...roles: AuthUser['role'][]): RequestHandler =>
  (req, _res, next) => {
    if (!roles.includes(currentUser(req).role)) throw forbidden()
    next()
  }
