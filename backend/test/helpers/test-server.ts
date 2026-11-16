import { execFileSync } from 'node:child_process'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { createApp } from '../../src/app.ts'
import { loadEnv } from '../../src/config/env.ts'
import { createDatabase } from '../../src/db/client.ts'
import { createLogger } from '../../src/lib/logger.ts'
import { createTokenService } from '../../src/lib/tokens.ts'

const backendDir = fileURLToPath(new URL('../../', import.meta.url))
const TEST_DB = 'ledgerly_test'

function withDatabase(url: string, name: string): string {
  const parsed = new URL(url)
  parsed.pathname = `/${name}`
  return parsed.toString()
}

export function testDatabaseUrl(): string {
  const base = process.env.DATABASE_URL
  if (!base) throw new Error('DATABASE_URL is required to run the tests (copy .env.example to .env)')
  return withDatabase(base, TEST_DB)
}

/** Drops and recreates the test database, applies the real migrations, then loads the demo seed. */
export async function resetTestDatabase(): Promise<string> {
  const testUrl = testDatabaseUrl()
  const admin = new pg.Client({ connectionString: withDatabase(testUrl, 'postgres') })
  await admin.connect()
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`)
    await admin.query(`CREATE DATABASE ${TEST_DB}`)
  } finally {
    await admin.end()
  }
  const env = { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test' }
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], { cwd: backendDir, env, stdio: 'pipe' })
  execFileSync('node', ['prisma/seed.ts'], { cwd: backendDir, env, stdio: 'pipe' })
  return testUrl
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any
export interface ApiResponse {
  status: number
  body: Json
  headers: Headers
}

export interface TestServer {
  baseUrl: string
  /** Sign a valid token for a user id without going through /login. */
  tokenFor(userId: number): Promise<string>
  call(
    method: string,
    path: string,
    options?: { token?: string; body?: unknown; rawBody?: string; headers?: Record<string, string> },
  ): Promise<ApiResponse>
  login(email: string, password: string): Promise<string>
  close(): Promise<void>
}

export async function startTestServer(overrides: Record<string, string> = {}): Promise<TestServer> {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: testDatabaseUrl(),
    JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
    RATE_LIMIT_ENABLED: 'false',
    ...overrides,
  })
  const logger = createLogger(env)
  const { pool, db } = createDatabase(env, logger)
  const tokens = createTokenService(env)
  const app = createApp({ env, db, pool, logger, tokens })

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  async function call(
    method: string,
    path: string,
    options: { token?: string; body?: unknown; rawBody?: string; headers?: Record<string, string> } = {},
  ): Promise<ApiResponse> {
    const hasBody = options.body !== undefined || options.rawBody !== undefined
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(hasBody ? { 'content-type': 'application/json' } : {}),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
      body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
    })
    const text = await res.text()
    let body: Json = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }
    return { status: res.status, body, headers: res.headers }
  }

  return {
    baseUrl,
    tokenFor: (userId) => tokens.sign({ id: userId }),
    call,
    async login(email, password) {
      const res = await call('POST', '/api/auth/login', { body: { email, password } })
      if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`)
      return res.body.token as string
    },
    async close() {
      await new Promise<void>((resolve) => {
        server.close(() => resolve())
        server.closeAllConnections()
      })
      await db.$disconnect()
      await pool.end()
    },
  }
}
