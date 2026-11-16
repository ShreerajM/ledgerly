import type { RequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import type { Env } from '../config/env.ts'
import { tooManyRequests } from '../lib/errors.ts'

// In-memory counters are fine for one API instance. With several instances, use a shared store (Redis).
export function createRateLimiters(env: Env): Record<'api' | 'login' | 'register', RequestHandler> {
  if (!env.RATE_LIMIT_ENABLED) {
    const passthrough: RequestHandler = (_req, _res, next) => next()
    return { api: passthrough, login: passthrough, register: passthrough }
  }

  const base = {
    standardHeaders: 'draft-8', // modern RateLimit header
    legacyHeaders: false, // no X-RateLimit-*
    handler: (_req, _res, next) => next(tooManyRequests()),
  } satisfies Parameters<typeof rateLimit>[0]

  return {
    // General ceiling for the whole API, per client IP.
    api: rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 600 }),
    // Slows password guessing. Successful logins do not count against the limit.
    login: rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true }),
    register: rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 20 }),
  }
}
