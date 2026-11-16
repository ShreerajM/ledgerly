import type { Pool } from 'pg'
import type { Env } from './config/env.ts'
import type { Database } from './db/client.ts'
import type { Logger } from './lib/logger.ts'
import type { TokenService } from './lib/tokens.ts'

// Everything the app needs from the outside world, passed in explicitly (dependency injection).
// Tests build the same app with a different database and logger.
export interface AppContext {
  env: Env
  db: Database
  pool: Pool
  logger: Logger
  tokens: TokenService
}
