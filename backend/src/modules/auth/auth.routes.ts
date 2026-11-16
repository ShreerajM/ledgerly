import { Router } from 'express'
import type { RequestHandler } from 'express'
import type { AppContext } from '../../context.ts'
import { parseInput, sendJson } from '../../lib/http.ts'
import { currentUser } from '../../middleware/authenticate.ts'
import { createUsersService } from '../users/users.service.ts'
import { userSchema } from '../users/users.schemas.ts'
import { authResponseSchema, loginBody, registerBody } from './auth.schemas.ts'
import { createAuthService } from './auth.service.ts'

interface AuthRouterDeps {
  authenticate: RequestHandler
  loginLimiter: RequestHandler
  registerLimiter: RequestHandler
}

export function createAuthRouter(
  ctx: AppContext,
  { authenticate, loginLimiter, registerLimiter }: AuthRouterDeps,
): Router {
  const router = Router()
  const auth = createAuthService(ctx)
  const users = createUsersService(ctx)

  router.post('/register', registerLimiter, async (req, res) => {
    const input = parseInput(registerBody, req.body)
    sendJson(res, authResponseSchema, await auth.register(input), 201)
  })

  router.post('/login', loginLimiter, async (req, res) => {
    const input = parseInput(loginBody, req.body)
    sendJson(res, authResponseSchema, await auth.login(input))
  })

  // Who am I? Handy for Postman checks and for the web app to confirm a stored session.
  router.get('/me', authenticate, async (req, res) => {
    sendJson(res, userSchema, await users.me(currentUser(req).id))
  })

  return router
}
