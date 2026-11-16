import type { ErrorRequestHandler, RequestHandler } from 'express'
import { prismaErrorCode } from '../db/client.ts'
import { AppError, notFound } from '../lib/errors.ts'
import type { ErrorCode } from '../lib/errors.ts'

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(notFound(`Route ${req.method} ${req.path} was not found.`))
}

interface Mapped {
  status: number
  code: ErrorCode
  message: string
  details?: unknown
  /** Log level: server-side problems are errors, client mistakes are not worth an alert. */
  level: 'error' | 'warn' | 'info'
}

// Prisma codes that mean "the database is unreachable, too slow, or the pool ran dry".
//   P1001 cannot reach server   P1002 server timed out   P1008 operation timed out
//   P1017 server closed the connection   P2024 timed out waiting for a pool connection
const DB_UNAVAILABLE_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024'])
// Wording used by node-postgres and the OS when the connection itself fails.
const DB_UNAVAILABLE_MESSAGE =
  /timeout exceeded when trying to connect|Connection terminated|connection error|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|too many clients|the database system is (starting up|shutting down)/i
const DB_TIMEOUT_MESSAGE = /canceling statement due to statement timeout/i

function mapError(err: unknown): Mapped {
  if (err instanceof AppError) {
    return {
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details,
      level: err.status >= 500 ? 'error' : 'info',
    }
  }

  // Errors raised by Express's JSON body parser.
  const parserType = (err as { type?: string } | null)?.type
  if (parserType === 'entity.parse.failed') {
    return { status: 400, code: 'BAD_REQUEST', message: 'The request body must be valid JSON.', level: 'info' }
  }
  if (parserType === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.', level: 'info' }
  }

  // Database trouble: tell the client to retry instead of reporting a bug.
  const prismaCode = prismaErrorCode(err)
  const text = describe(err)
  if (DB_TIMEOUT_MESSAGE.test(text)) {
    return {
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'The database took too long to respond. Please try again.',
      level: 'error',
    }
  }
  if ((prismaCode && DB_UNAVAILABLE_PRISMA_CODES.has(prismaCode)) || DB_UNAVAILABLE_MESSAGE.test(text)) {
    return {
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'The database is unavailable right now. Please try again shortly.',
      level: 'error',
    }
  }
  if (prismaCode === 'P2002') {
    return { status: 409, code: 'CONFLICT', message: 'That value already exists.', level: 'info' }
  }

  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong on our side.', level: 'error' }
}

// Prisma wraps the driver's error; collect the messages from the whole chain to recognise connection problems.
function describe(err: unknown): string {
  const parts: string[] = []
  let current: unknown = err
  for (let depth = 0; current && depth < 5; depth++) {
    const e = current as { message?: unknown; cause?: unknown; meta?: { driverAdapterError?: unknown } }
    if (typeof e.message === 'string') parts.push(e.message)
    current = e.cause ?? e.meta?.driverAdapterError
  }
  return parts.join(' | ')
}

// Last stop for every error. Clients always get { error: { code, message, details?, requestId } }.
// Stack traces and SQL never leave the server; they go to the logs, tagged with the same requestId.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err)

  const mapped = mapError(err)
  req.log[mapped.level]({ err }, mapped.status >= 500 ? 'request failed' : 'request rejected')

  res.status(mapped.status).json({
    error: {
      code: mapped.code,
      message: mapped.message,
      ...(mapped.details === undefined ? {} : { details: mapped.details }),
      requestId: String(req.id),
    },
  })
}
