import { Router } from 'express'
import type { AppContext } from '../../context.ts'
import { poolStats } from '../../db/client.ts'

const READY_TIMEOUT_MS = 2000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// Two probes, as orchestrators expect:
//   GET /api/health        liveness  - the process is up (never touches the database)
//   GET /api/health/ready  readiness - the database answers; 503 when it does not
// Both are public and expose no secrets. Pool numbers help when diagnosing exhaustion.
export function createHealthRouter({ db, pool }: Pick<AppContext, 'db' | 'pool'>): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) })
  })

  router.get('/ready', async (_req, res) => {
    try {
      await withTimeout(db.$queryRaw`SELECT 1`, READY_TIMEOUT_MS)
      res.json({ status: 'ready', database: 'up', pool: poolStats(pool) })
    } catch {
      res.status(503).json({ status: 'unavailable', database: 'down', pool: poolStats(pool) })
    }
  })

  return router
}
