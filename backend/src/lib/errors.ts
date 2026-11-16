// One error type for everything the API reports on purpose.
// The error handler turns it into: { "error": { "code", "message", "details"? } }
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'

export class AppError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly details?: unknown

  // Written out longhand (no parameter properties) so Node can run this file with type stripping.
  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (message: string, details?: unknown) => new AppError(400, 'BAD_REQUEST', message, details)
export const validationError = (details: unknown) =>
  new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid.', details)
export const unauthorized = (message = 'Please sign in to continue.') => new AppError(401, 'UNAUTHORIZED', message)
export const forbidden = (message = 'You do not have permission to do that.') => new AppError(403, 'FORBIDDEN', message)
export const notFound = (message = 'Not found.') => new AppError(404, 'NOT_FOUND', message)
export const conflict = (message: string, details?: unknown) => new AppError(409, 'CONFLICT', message, details)
export const tooManyRequests = () =>
  new AppError(429, 'RATE_LIMITED', 'Too many requests. Please wait a moment and try again.')
export const serviceUnavailable = (message = 'The service is temporarily unavailable.') =>
  new AppError(503, 'SERVICE_UNAVAILABLE', message)
