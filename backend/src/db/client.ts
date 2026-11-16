import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import type { Env } from '../config/env.ts'
import { PrismaClient } from '../generated/prisma/client.ts'
import type { Logger } from '../lib/logger.ts'

// One pool per process, owned here and handed to Prisma through its pg driver adapter.
// Every setting is a lever you can pull when debugging "connection timeout" or
// "pool exhausted" errors (see the troubleshooting notes in the README).
export function createDatabase(env: Env, logger: Logger) {
  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    // Wait this long for a free connection before failing the request.
    connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
    // Close connections that sit idle, so the pool shrinks when traffic drops.
    idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
    // The database cancels any statement that runs longer than this.
    statement_timeout: env.DB_STATEMENT_TIMEOUT_MS,
    // Shows up in pg_stat_activity, so you can tell which app owns a connection.
    application_name: 'ledgerly-api',
    // Always talk to the database in UTC, so results never depend on the host machine's timezone.
    options: '-c TimeZone=UTC',
    keepAlive: true,
    ssl: env.DB_SSL ? { rejectUnauthorized: true } : undefined,
  })

  // An idle client can fail (database restart, network drop). Without a handler this would crash Node.
  pool.on('error', (err) => logger.error({ err }, 'unexpected error on an idle database client'))

  const db = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: [
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
  })
  db.$on('warn', (event) => logger.warn({ prisma: event.message }, 'prisma warning'))
  db.$on('error', (event) => logger.error({ prisma: event.message }, 'prisma error'))

  return { pool, db }
}

export type Database = ReturnType<typeof createDatabase>['db']

export function poolStats(pool: pg.Pool) {
  return {
    max: pool.options.max ?? 10,
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  }
}

/** Prisma error code (for example P2002 = unique constraint violated), when the error is a known Prisma error. */
export function prismaErrorCode(err: unknown): string | undefined {
  const code = (err as { code?: unknown } | null)?.code
  return typeof code === 'string' && /^P\d{4}$/.test(code) ? code : undefined
}
