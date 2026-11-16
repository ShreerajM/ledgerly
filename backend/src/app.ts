import { randomUUID } from 'node:crypto'
import express from 'express'
import type { Express, RequestHandler } from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import type { AppContext } from './context.ts'
import { createAuthenticate } from './middleware/authenticate.ts'
import { errorHandler, notFoundHandler } from './middleware/error-handler.ts'
import { createRateLimiters } from './middleware/rate-limit.ts'
import { createAuthRouter } from './modules/auth/auth.routes.ts'
import { createDashboardRouter } from './modules/dashboard/dashboard.routes.ts'
import { createHealthRouter } from './modules/health/health.routes.ts'
import { createTransactionsRouter } from './modules/transactions/transactions.routes.ts'
import { createUsersRouter } from './modules/users/users.routes.ts'

const REQUEST_ID = /^[\w-]{1,64}$/

// API responses can contain personal data, so browsers and proxies must not cache them.
const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
}

export function createApp(ctx: AppContext): Express {
  const { env, logger } = ctx
  const limiters = createRateLimiters(env)
  const authenticate = createAuthenticate(ctx)

  const app = express()
  app.disable('x-powered-by')
  // Behind Nginx the client IP arrives in X-Forwarded-For; trust exactly that many proxy hops.
  app.set('trust proxy', env.TRUST_PROXY > 0 ? env.TRUST_PROXY : false)

  // One structured log line per request, tagged with a request id that is also returned to the client.
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id']
        const id = typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : randomUUID()
        res.setHeader('x-request-id', id)
        return id
      },
      // Health probes run every few seconds; logging them would drown out real traffic.
      autoLogging: { ignore: (req) => req.url?.startsWith('/api/health') ?? false },
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
    }),
  )
  app.use(helmet())
  app.use('/api', noStore)
  app.use('/api', limiters.api)
  app.use(express.json({ limit: '10kb' }))

  app.use('/api/health', createHealthRouter(ctx))
  app.use(
    '/api/auth',
    createAuthRouter(ctx, {
      authenticate,
      loginLimiter: limiters.login,
      registerLimiter: limiters.register,
    }),
  )
  app.use('/api/dashboard', createDashboardRouter(ctx, authenticate))
  app.use('/api/transactions', createTransactionsRouter(ctx, authenticate))
  app.use('/api/users', createUsersRouter(ctx, authenticate))

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
