import { z } from 'zod'
import { userSchema } from '../users/users.schemas.ts'

// ---- Request models ----
const email = z
  .string({ error: 'Enter a valid email address.' })
  .trim()
  .max(254, { error: 'Email is too long.' })
  .pipe(z.email({ error: 'Enter a valid email address.' }))
  .transform((value) => value.toLowerCase())

export const registerBody = z.object({
  name: z
    .string({ error: 'Enter your full name.' })
    .trim()
    .min(2, { error: 'Enter your full name.' })
    .max(100, { error: 'Name is too long.' }),
  email,
  // The upper bound stops absurdly long inputs from being used to burn CPU in the hasher.
  password: z
    .string({ error: 'Choose a password.' })
    .min(8, { error: 'Use at least 8 characters.' })
    .max(128, { error: 'Use at most 128 characters.' })
    .regex(/\d/, { error: 'Include at least one number.' }),
  // `role` is intentionally not accepted: public sign-up always creates a regular user.
})

export const loginBody = z.object({
  // No format rules on login: a wrong email and a wrong password must look identical to the caller.
  email: z
    .string({ error: 'Enter your email.' })
    .trim()
    .min(1, { error: 'Enter your email.' })
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string({ error: 'Enter your password.' }).min(1, { error: 'Enter your password.' }).max(128),
})

// ---- Response model ----
export const authResponseSchema = z.object({ token: z.string(), user: userSchema })

export type RegisterInput = z.output<typeof registerBody>
export type LoginInput = z.output<typeof loginBody>
