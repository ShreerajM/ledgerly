import { Router } from 'express'
import type { RequestHandler } from 'express'
import type { AppContext } from '../../context.ts'
import { parseInput, sendJson } from '../../lib/http.ts'
import { currentUser } from '../../middleware/authenticate.ts'
import { requireRole } from '../../middleware/authorize.ts'
import {
  changeRoleBody,
  changeStatusBody,
  listUsersQuery,
  userIdParams,
  userListSchema,
  userSchema,
} from './users.schemas.ts'
import { createUsersService } from './users.service.ts'

// Admin-only user management. Role changes and (de)activation take effect on the very next request.
export function createUsersRouter(ctx: AppContext, authenticate: RequestHandler): Router {
  const router = Router()
  const service = createUsersService(ctx)

  router.use(authenticate, requireRole('admin'))

  router.get('/', async (req, res) => {
    const query = parseInput(listUsersQuery, req.query)
    sendJson(res, userListSchema, await service.list(query))
  })

  router.patch('/:id/role', async (req, res) => {
    const { id } = parseInput(userIdParams, req.params)
    const { role } = parseInput(changeRoleBody, req.body)
    sendJson(res, userSchema, await service.changeRole(currentUser(req), id, role))
  })

  router.patch('/:id/status', async (req, res) => {
    const { id } = parseInput(userIdParams, req.params)
    const { isActive } = parseInput(changeStatusBody, req.body)
    sendJson(res, userSchema, await service.changeStatus(currentUser(req), id, isActive))
  })

  return router
}
