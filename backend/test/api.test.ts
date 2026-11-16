import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { resetTestDatabase, startTestServer } from './helpers/test-server.ts'
import type { TestServer } from './helpers/test-server.ts'

// Seed facts used below (see prisma/seed.ts): user 1 = Asha (admin), 2 = Rohan (admin), 3 = Meera (user),
// 18 = Pooja (deactivated), 22 users and 50 transactions in total, 4 failed payments in the last 7 days.
const ADMIN = { email: 'asha@example.com', password: 'Admin@123', id: 1 }
const MEERA = { email: 'meera@example.com', password: 'Password@123', id: 3 }
const POOJA_INACTIVE = { email: 'pooja@example.com', password: 'Password@123', id: 18 }

let api: TestServer
let adminToken: string
let meeraToken: string

before(async () => {
  await resetTestDatabase()
  api = await startTestServer()
  adminToken = await api.login(ADMIN.email, ADMIN.password)
  meeraToken = await api.login(MEERA.email, MEERA.password)
})
after(async () => {
  await api.close()
})

describe('health', () => {
  it('liveness answers without touching the database', async () => {
    const res = await api.call('GET', '/api/health')
    assert.equal(res.status, 200)
    assert.equal(res.body.status, 'ok')
  })

  it('readiness reports the database and pool numbers', async () => {
    const res = await api.call('GET', '/api/health/ready')
    assert.equal(res.status, 200)
    assert.equal(res.body.database, 'up')
    assert.equal(typeof res.body.pool.max, 'number')
  })
})

describe('request handling', () => {
  it('returns a JSON 404 with a request id for unknown routes', async () => {
    const res = await api.call('GET', '/api/nope')
    assert.equal(res.status, 404)
    assert.equal(res.body.error.code, 'NOT_FOUND')
    assert.ok(res.body.error.requestId)
  })

  it('echoes a safe incoming x-request-id and rejects an unsafe one', async () => {
    const good = await api.call('GET', '/api/health', { headers: { 'x-request-id': 'abc-123' } })
    assert.equal(good.headers.get('x-request-id'), 'abc-123')
    const bad = await api.call('GET', '/api/health', { headers: { 'x-request-id': 'bad id with spaces!' } })
    assert.notEqual(bad.headers.get('x-request-id'), 'bad id with spaces!')
  })

  it('answers malformed JSON with a clean 400', async () => {
    const res = await api.call('POST', '/api/auth/login', { rawBody: '{"email": ' })
    assert.equal(res.status, 400)
    assert.equal(res.body.error.code, 'BAD_REQUEST')
  })

  it('sends security headers and disables caching on the API', async () => {
    const res = await api.call('GET', '/api/health')
    assert.equal(res.headers.get('x-powered-by'), null)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(res.headers.get('cache-control'), 'no-store')
  })
})

describe('auth', () => {
  it('registers a regular user and ignores any role in the request', async () => {
    const res = await api.call('POST', '/api/auth/register', {
      body: { name: 'Test Person', email: 'Test.Person@Example.com', password: 'Strong123', role: 'admin' },
    })
    assert.equal(res.status, 201)
    assert.equal(res.body.user.role, 'user')
    assert.equal(res.body.user.email, 'test.person@example.com') // normalised to lowercase
    assert.equal(res.body.user.passwordHash, undefined) // response model never leaks it
    assert.ok(res.body.token)

    const me = await api.call('GET', '/api/auth/me', { token: res.body.token })
    assert.equal(me.status, 200)
    assert.equal(me.body.email, 'test.person@example.com')
  })

  it('rejects a duplicate email, whatever its letter case', async () => {
    const res = await api.call('POST', '/api/auth/register', {
      body: { name: 'Someone Else', email: 'ASHA@example.com', password: 'Strong123' },
    })
    assert.equal(res.status, 409)
    assert.deepEqual(res.body.error.details.fieldErrors.email, ['An account with this email already exists.'])
  })

  it('reports every invalid field at once', async () => {
    const res = await api.call('POST', '/api/auth/register', { body: { name: 'A', email: 'nope', password: 'short' } })
    assert.equal(res.status, 400)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    const fields = res.body.error.details.fieldErrors
    assert.ok(fields.name && fields.email && fields.password)
  })

  it('requires a number in the password (boundary: 8 characters, no digit)', async () => {
    const res = await api.call('POST', '/api/auth/register', {
      body: { name: 'No Digit', email: 'nodigit@example.com', password: 'abcdefgh' },
    })
    assert.equal(res.status, 400)
    assert.deepEqual(res.body.error.details.fieldErrors.password, ['Include at least one number.'])
  })

  it('logs in and records the last login time', async () => {
    const res = await api.call('POST', '/api/auth/login', { body: { email: MEERA.email, password: MEERA.password } })
    assert.equal(res.status, 200)
    assert.equal(res.body.user.id, MEERA.id)
    assert.ok(Date.now() - new Date(res.body.user.lastLoginAt).getTime() < 60_000)
  })

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const wrong = await api.call('POST', '/api/auth/login', { body: { email: MEERA.email, password: 'Wrong-pass-1' } })
    const unknown = await api.call('POST', '/api/auth/login', {
      body: { email: 'ghost@example.com', password: 'Wrong-pass-1' },
    })
    assert.equal(wrong.status, 401)
    assert.equal(unknown.status, 401)
    assert.equal(wrong.body.error.message, unknown.body.error.message)
  })

  it('refuses a deactivated account with a clear message', async () => {
    const res = await api.call('POST', '/api/auth/login', {
      body: { email: POOJA_INACTIVE.email, password: POOJA_INACTIVE.password },
    })
    assert.equal(res.status, 403)
    assert.match(res.body.error.message, /deactivated/i)
  })

  it('rejects missing, garbage and tampered tokens', async () => {
    assert.equal((await api.call('GET', '/api/dashboard')).status, 401)
    assert.equal((await api.call('GET', '/api/dashboard', { token: 'not-a-token' })).status, 401)
    const tampered = `${adminToken.slice(0, -4)}AAAA`
    assert.equal((await api.call('GET', '/api/dashboard', { token: tampered })).status, 401)
  })
})

describe('role-based access', () => {
  it('keeps the Users API admin-only', async () => {
    assert.equal((await api.call('GET', '/api/users', { token: meeraToken })).status, 403)
    assert.equal(
      (await api.call('PATCH', '/api/users/5/role', { token: meeraToken, body: { role: 'admin' } })).status,
      403,
    )
    const ok = await api.call('GET', '/api/users', { token: adminToken })
    assert.equal(ok.status, 200)
    assert.ok(ok.body.total >= 22)
    assert.equal(ok.body.items[0].transactionCount >= 0, true)
  })

  it('filters users by role and status, and treats % in search literally', async () => {
    const admins = await api.call('GET', '/api/users?role=admin', { token: adminToken })
    assert.equal(admins.body.total, 2)
    const inactive = await api.call('GET', '/api/users?status=inactive', { token: adminToken })
    assert.equal(inactive.body.total, 5)
    const percent = await api.call('GET', '/api/users?q=%25', { token: adminToken })
    assert.equal(percent.body.total, 0)
  })

  it('lets users see only their own transactions, and admins see everything', async () => {
    const mine = await api.call('GET', '/api/transactions?pageSize=100', { token: meeraToken })
    assert.ok(mine.body.total > 0)
    assert.ok(mine.body.items.every((t: { customerId: number }) => t.customerId === MEERA.id))
    const all = await api.call('GET', '/api/transactions?pageSize=100', { token: adminToken })
    assert.ok(all.body.total >= 50)
  })

  it('blocks an admin from changing their own role or status', async () => {
    const res = await api.call('PATCH', `/api/users/${ADMIN.id}/role`, { token: adminToken, body: { role: 'user' } })
    assert.equal(res.status, 400)
    assert.match(res.body.error.message, /your own/i)
  })

  it('validates role changes and unknown ids', async () => {
    assert.equal(
      (await api.call('PATCH', '/api/users/5/role', { token: adminToken, body: { role: 'superuser' } })).status,
      400,
    )
    assert.equal(
      (await api.call('PATCH', '/api/users/abc/role', { token: adminToken, body: { role: 'user' } })).status,
      400,
    )
    assert.equal(
      (await api.call('PATCH', '/api/users/99999/role', { token: adminToken, body: { role: 'user' } })).status,
      404,
    )
  })

  it('promotes and demotes a user', async () => {
    const up = await api.call('PATCH', '/api/users/5/role', { token: adminToken, body: { role: 'admin' } })
    assert.equal(up.status, 200)
    assert.equal(up.body.role, 'admin')
    const arjunToken = await api.tokenFor(5)
    assert.equal((await api.call('GET', '/api/users', { token: arjunToken })).status, 200) // effective immediately
    await api.call('PATCH', '/api/users/5/role', { token: adminToken, body: { role: 'user' } })
    assert.equal((await api.call('GET', '/api/users', { token: arjunToken })).status, 403)
  })

  it('cuts off a deactivated user immediately, even with a valid token', async () => {
    const farahToken = await api.tokenFor(4)
    assert.equal((await api.call('GET', '/api/dashboard', { token: farahToken })).status, 200)
    const off = await api.call('PATCH', '/api/users/4/status', { token: adminToken, body: { isActive: false } })
    assert.equal(off.body.isActive, false)
    assert.equal((await api.call('GET', '/api/dashboard', { token: farahToken })).status, 401)
    await api.call('PATCH', '/api/users/4/status', { token: adminToken, body: { isActive: true } })
    assert.equal((await api.call('GET', '/api/dashboard', { token: farahToken })).status, 200)
  })
})

describe('transactions', () => {
  const create = (token: string, body: unknown) => api.call('POST', '/api/transactions', { token, body })

  it('validates the amount, including both boundaries', async () => {
    const messageFor = async (amount: unknown) =>
      (await create(meeraToken, { amount })).body.error?.details?.fieldErrors?.amount?.[0]
    assert.equal(await messageFor(0), 'Amount must be greater than 0.')
    assert.equal(await messageFor(-5), 'Amount must be greater than 0.')
    assert.equal(await messageFor(10_000_000.01), 'Amount cannot exceed 1,00,00,000.')
    assert.equal(await messageFor(12.345), 'Use at most 2 decimal places.')
    assert.equal(await messageFor('100'), 'Amount must be a number.')
    assert.equal(await messageFor(undefined), 'Amount must be a number.')
    assert.equal((await create(meeraToken, { amount: 0.01 })).status, 201) // smallest valid amount
    assert.equal((await create(meeraToken, { amount: 10_000_000 })).status, 201) // largest valid amount
  })

  it('creates a pending transaction with a generated reference', async () => {
    const res = await create(meeraToken, { amount: 1234.5, note: '  Invoice 9  ' })
    assert.equal(res.status, 201)
    assert.equal(res.body.status, 'pending')
    assert.equal(res.body.amount, 1234.5)
    assert.equal(res.body.note, 'Invoice 9') // trimmed
    assert.match(res.body.reference, /^TXN-\d{4,}$/)
    assert.equal(res.body.customerName, 'Meera Kulkarni')
  })

  it('ignores customerId from a regular user', async () => {
    const res = await create(meeraToken, { amount: 10, customerId: 5 })
    assert.equal(res.status, 201)
    assert.equal(res.body.customerId, MEERA.id)
  })

  it('lets an admin create for an active customer only', async () => {
    const ok = await create(adminToken, { amount: 75, customerId: 5 })
    assert.equal(ok.status, 201)
    assert.equal(ok.body.customerId, 5)
    const inactive = await create(adminToken, { amount: 75, customerId: POOJA_INACTIVE.id })
    assert.equal(inactive.status, 400)
    const missing = await create(adminToken, { amount: 75, customerId: 99999 })
    assert.equal(missing.status, 400)
  })

  it('filters, searches and paginates', async () => {
    const failed = await api.call('GET', '/api/transactions?status=failed&pageSize=100', { token: adminToken })
    assert.ok(failed.body.total > 0)
    assert.ok(failed.body.items.every((t: { status: string }) => t.status === 'failed'))

    const byRef = await api.call('GET', '/api/transactions?q=TXN-0050', { token: adminToken })
    assert.equal(byRef.body.total, 1)
    assert.equal(byRef.body.items[0].reference, 'TXN-0050')

    const byName = await api.call('GET', '/api/transactions?q=sneha', { token: adminToken })
    assert.ok(byName.body.items.every((t: { customerName: string }) => t.customerName === 'Sneha Patil'))

    // Wildcard characters in the search box are matched literally, not as patterns.
    assert.equal((await api.call('GET', '/api/transactions?q=%25', { token: adminToken })).body.total, 0)
    assert.equal((await api.call('GET', '/api/transactions?q=_', { token: adminToken })).body.total, 0)

    const page2 = await api.call('GET', '/api/transactions?pageSize=5&page=2', { token: adminToken })
    assert.equal(page2.body.items.length, 5)
    assert.equal(page2.body.page, 2)
    const beyond = await api.call('GET', '/api/transactions?pageSize=5&page=9999', { token: adminToken })
    assert.deepEqual(beyond.body.items, [])
    assert.equal((await api.call('GET', '/api/transactions?pageSize=500', { token: adminToken })).status, 400)
  })

  it('returns newest first', async () => {
    const res = await api.call('GET', '/api/transactions?pageSize=100', { token: adminToken })
    const times = res.body.items.map((t: { createdAt: string }) => Date.parse(t.createdAt))
    assert.deepEqual(
      times,
      [...times].sort((a, b) => b - a),
    )
  })
})

describe('dashboard', () => {
  it('gives admins workspace-wide numbers', async () => {
    const res = await api.call('GET', '/api/dashboard', { token: adminToken })
    assert.equal(res.status, 200)
    assert.equal(res.body.scope, 'all')
    assert.equal(res.body.failed7d, 4) // from the seed
    assert.equal(res.body.daily.length, 14)
    assert.equal(res.body.recent.length, 6)
    assert.ok(res.body.users.total >= 22)
    assert.equal(res.body.users.total, res.body.users.active + res.body.users.inactive)
    assert.equal(res.body.myTransactionCount, null)
    assert.ok(res.body.settled30d > 0)
  })

  it('scopes a regular user to their own data', async () => {
    const dash = await api.call('GET', '/api/dashboard', { token: meeraToken })
    const list = await api.call('GET', '/api/transactions?pageSize=1', { token: meeraToken })
    assert.equal(dash.body.scope, 'self')
    assert.equal(dash.body.users, null)
    assert.equal(dash.body.myTransactionCount, list.body.total) // dashboard count agrees with the list
    assert.ok(dash.body.recent.every((t: { customerId: number }) => t.customerId === MEERA.id))
  })

  it('daily chart days are consecutive and end today', async () => {
    const res = await api.call('GET', '/api/dashboard', { token: adminToken })
    const days = res.body.daily.map((d: { date: string }) => Date.parse(d.date))
    for (let i = 1; i < days.length; i++) assert.equal(days[i] - days[i - 1], 86_400_000)
    assert.ok(Date.now() - days[13] < 86_400_000 + 1000)
  })
})

describe('abuse protection', () => {
  it('rate limits repeated failed logins', async () => {
    const limited = await startTestServer({ RATE_LIMIT_ENABLED: 'true' })
    try {
      let last = 0
      for (let i = 0; i < 12; i++) {
        last = (await limited.call('POST', '/api/auth/login', { body: { email: MEERA.email, password: `Wrong-${i}` } }))
          .status
      }
      assert.equal(last, 429)
      const res = await limited.call('POST', '/api/auth/login', {
        body: { email: MEERA.email, password: MEERA.password },
      })
      assert.equal(res.status, 429) // still blocked: this IP used up its failed-attempt budget
      assert.equal(res.body.error.code, 'RATE_LIMITED')
    } finally {
      await limited.close()
    }
  })
})

describe('database outage', () => {
  it('answers 503 (not 500) when the database is unreachable', async () => {
    const down = await startTestServer({
      DATABASE_URL: 'postgres://nobody:nothing@127.0.0.1:1/none',
      DB_CONNECTION_TIMEOUT_MS: '500',
    })
    try {
      const ready = await down.call('GET', '/api/health/ready')
      assert.equal(ready.status, 503)
      assert.equal(ready.body.database, 'down')
      // Liveness must stay green: the process is fine, only its dependency is down.
      assert.equal((await down.call('GET', '/api/health')).status, 200)

      const token = await down.tokenFor(1)
      const res = await down.call('GET', '/api/dashboard', { token })
      assert.equal(res.status, 503)
      assert.equal(res.body.error.code, 'SERVICE_UNAVAILABLE')
    } finally {
      await down.close()
    }
  })
})

describe('transaction report (CSV export)', () => {
  it('requires authentication', async () => {
    const res = await api.call('GET', '/api/transactions/export')
    assert.equal(res.status, 401)
  })

  it('gives an admin every transaction as a CSV download', async () => {
    const res = await api.call('GET', '/api/transactions/export', { token: adminToken })
    assert.equal(res.status, 200)
    assert.match(res.headers.get('content-type') ?? '', /text\/csv/)
    assert.match(res.headers.get('content-disposition') ?? '', /attachment; filename="ledgerly-transactions-\d{4}-\d{2}-\d{2}\.csv"/)
    const lines = String(res.body).replace(/^\uFEFF/, '').trim().split('\r\n')
    assert.equal(lines[0], 'Reference,Customer,Amount (INR),Status,Note,Created at (UTC)')
    const total = (await api.call('GET', '/api/transactions?pageSize=1', { token: adminToken })).body.total
    assert.equal(lines.length - 1, total)
  })

  it('limits a regular user to their own transactions', async () => {
    const res = await api.call('GET', '/api/transactions/export', { token: meeraToken })
    assert.equal(res.status, 200)
    const rows = String(res.body).replace(/^\uFEFF/, '').trim().split('\r\n').slice(1)
    const ownTotal = (await api.call('GET', '/api/transactions?pageSize=1', { token: meeraToken })).body.total
    assert.equal(rows.length, ownTotal)
    assert.ok(rows.every((row) => row.includes('Meera')))
  })

  it('applies the status filter', async () => {
    const res = await api.call('GET', '/api/transactions/export?status=failed', { token: adminToken })
    assert.equal(res.status, 200)
    const rows = String(res.body).replace(/^\uFEFF/, '').trim().split('\r\n').slice(1)
    assert.ok(rows.length > 0)
    assert.ok(rows.every((row) => row.includes(',failed,')))
  })
})
