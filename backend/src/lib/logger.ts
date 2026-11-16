import { pino } from 'pino'
import type { Logger } from 'pino'
import type { Env } from '../config/env.ts'

export type { Logger }

// Structured JSON logs to stdout (the 12-factor default). `npm run dev` pretty-prints them.
export function createLogger(env: Env): Logger {
  return pino({
    level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
    base: { service: 'ledgerly-api' },
    // Never write credentials to logs.
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.passwordHash',
        '*.token',
      ],
      censor: '[Redacted]',
    },
  })
}
