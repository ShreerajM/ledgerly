import { z } from 'zod'

const timezone = z.string().refine(
  (tz) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: tz })
      return true
    } catch {
      return false
    }
  },
  { error: 'Must be a valid IANA time zone, for example Asia/Kolkata.' },
)

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: 'Must be a postgres:// connection URL.' }),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(100).default(5000),
    DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
    DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(100).default(15000),
    DB_SSL: z.stringbool().default(false),

    JWT_SECRET: z.string().min(32, { error: 'JWT_SECRET must be at least 32 characters.' }),
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^\d+[smhdw]$/, { error: 'Use a duration like 15m, 1h or 7d.' })
      .default('1h'),
    JWT_ISSUER: z.string().min(1).default('ledgerly-api'),
    JWT_AUDIENCE: z.string().min(1).default('ledgerly-web'),

    // Number of reverse proxies in front of the API (Nginx = 1). 0 means no proxy.
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
    RATE_LIMIT_ENABLED: z.stringbool().default(true),
    // Used to bucket the dashboard chart into calendar days.
    APP_TIMEZONE: timezone.default('Asia/Kolkata'),

    // Safety switch for local demos. The demo values in .env.example contain "demo-only-";
    // in production the API refuses to start with them unless this is explicitly set to true.
    ALLOW_DEMO_SECRETS: z.stringbool().default(false),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production' || env.ALLOW_DEMO_SECRETS) return
    for (const key of ['JWT_SECRET', 'DATABASE_URL'] as const) {
      if (env[key].includes('demo-only-')) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} still has a demo-only value. Set a real one, or set ALLOW_DEMO_SECRETS=true for a local demo.`,
        })
      }
    }
  })

export type Env = Readonly<z.infer<typeof envSchema>>

// Validates the environment once at startup and fails fast with a readable message.
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`)
  }
  return Object.freeze(result.data)
}
