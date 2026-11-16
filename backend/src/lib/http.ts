import type { Response } from 'express'
import { z } from 'zod'
import { validationError } from './errors.ts'

/**
 * Request model: parse untrusted input with a Zod schema or throw a 400 with per-field messages.
 * Unknown keys are dropped, strings are trimmed and coerced as the schema says.
 */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input ?? {})
  if (!result.success) throw validationError(z.flattenError(result.error))
  return result.data
}

/**
 * Response model: validate what we are about to send, then send only what the schema allows.
 * This is what stops fields such as passwordHash from ever leaking, even if a query selects them.
 * A mismatch is a server bug, so it becomes a 500 and is logged rather than sent to the client.
 */
export function sendJson<S extends z.ZodType>(res: Response, schema: S, data: z.input<S>, status = 200): void {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Response did not match its schema:\n${z.prettifyError(result.error)}`)
  }
  res.status(status).json(result.data)
}
