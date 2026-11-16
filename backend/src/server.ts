import { createApp } from './app.ts'
import { loadEnv } from './config/env.ts'
import { createDatabase } from './db/client.ts'
import { createLogger } from './lib/logger.ts'
import { createTokenService } from './lib/tokens.ts'

const env = loadEnv() // fails fast with a readable message if configuration is wrong
const logger = createLogger(env)
const { pool, db } = createDatabase(env, logger)
const app = createApp({ env, db, pool, logger, tokens: createTokenService(env) })

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'api listening')
})
// Keep connections open slightly longer than a typical reverse proxy idle timeout (60s)
// so Nginx never reuses a socket that Node has just closed.
server.keepAliveTimeout = 65_000
server.headersTimeout = 66_000

// Warn early if the database is unreachable; the API still starts and answers 503 until it recovers.
db.$queryRaw`SELECT 1`.then(
  () => logger.info('database connection ok'),
  (err: unknown) => logger.error({ err }, 'database is not reachable yet'),
)

// Graceful shutdown: stop accepting connections, let in-flight requests finish, then close the pool.
let shuttingDown = false
async function shutdown(signal: string, exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')

  const forceExit = setTimeout(() => {
    logger.error('shutdown timed out, forcing exit')
    process.exit(1)
  }, 10_000)
  forceExit.unref()

  server.close(async () => {
    try {
      await db.$disconnect()
      await pool.end()
    } catch (err) {
      logger.error({ err }, 'error while closing the database')
      exitCode = 1
    }
    process.exit(exitCode)
  })
  server.closeIdleConnections()
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
// A bug we did not anticipate: log it and restart cleanly rather than limp on in an unknown state.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled promise rejection')
  void shutdown('unhandledRejection', 1)
})
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception')
  void shutdown('uncaughtException', 1)
})
