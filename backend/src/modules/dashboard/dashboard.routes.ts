import { Router } from 'express'
import type { RequestHandler } from 'express'
import type { AppContext } from '../../context.ts'
import { sendJson } from '../../lib/http.ts'
import { currentUser } from '../../middleware/authenticate.ts'
import { dashboardSchema } from './dashboard.schemas.ts'
import { createDashboardService } from './dashboard.service.ts'

export function createDashboardRouter(ctx: AppContext, authenticate: RequestHandler): Router {
  const router = Router()
  const service = createDashboardService(ctx)

  router.get('/', authenticate, async (req, res) => {
    sendJson(res, dashboardSchema, await service.get(currentUser(req)))
  })

  return router
}
