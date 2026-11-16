// End-to-end check of a running Ledgerly stack, through the same URL a browser uses.
//   npm run smoke                      checks http://localhost:8080
//   node scripts/smoke-test.mjs https://my-server.example.com
// Uses the demo accounts. For a deployment without demo data set SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD
// and SMOKE_USER_EMAIL / SMOKE_USER_PASSWORD.
const base = (process.argv[2] ?? process.env.SMOKE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const admin = {
  email: process.env.SMOKE_ADMIN_EMAIL ?? 'asha@example.com',
  password: process.env.SMOKE_ADMIN_PASSWORD ?? 'Admin@123',
}
const user = {
  email: process.env.SMOKE_USER_EMAIL ?? 'meera@example.com',
  password: process.env.SMOKE_USER_PASSWORD ?? 'Password@123',
}

let failed = 0
async function check(name, fn) {
  try {
    await fn()
    console.log(`  ok    ${name}`)
  } catch (err) {
    failed++
    console.log(`  FAIL  ${name}\n        ${err.message}`)
  }
}
function expect(condition, message) {
  if (!condition) throw new Error(message)
}

async function call(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* not JSON */
  }
  return { res, text, json }
}

console.log(`Smoke test against ${base}\n`)

await check('web app is served', async () => {
  const { res, text } = await call('/')
  expect(res.status === 200, `GET / returned ${res.status}`)
  expect(text.includes('id="root"'), 'index.html does not contain the app root')
})

await check('web app sends security headers and hides the Nginx version', async () => {
  const { res } = await call('/')
  expect(res.headers.get('x-content-type-options') === 'nosniff', 'missing X-Content-Type-Options')
  expect(res.headers.get('content-security-policy'), 'missing Content-Security-Policy')
  expect(!/\d/.test(res.headers.get('server') ?? ''), `Server header leaks a version: ${res.headers.get('server')}`)
})

await check('app routes fall back to the single page (/users)', async () => {
  const { res, text } = await call('/users')
  expect(res.status === 200 && text.includes('id="root"'), `GET /users returned ${res.status}`)
})

await check('a missing static file is a real 404, not the app shell', async () => {
  const { res } = await call('/assets/does-not-exist.js')
  expect(res.status === 404, `expected 404, got ${res.status}`)
})

await check('API liveness and readiness through Nginx', async () => {
  const live = await call('/api/health')
  expect(live.json?.status === 'ok', 'liveness is not ok')
  const ready = await call('/api/health/ready')
  expect(ready.json?.database === 'up', `readiness: ${ready.text}`)
})

await check('unknown API route returns a JSON 404 with a request id', async () => {
  const { res, json } = await call('/api/nope')
  expect(res.status === 404 && json?.error?.requestId, `got ${res.status} ${JSON.stringify(json)}`)
  expect(res.headers.get('x-request-id'), 'missing X-Request-Id header')
})

let adminToken = ''
let userToken = ''
await check('admin and user can sign in; a wrong password is refused', async () => {
  const a = await call('/api/auth/login', { method: 'POST', body: admin })
  expect(a.res.status === 200 && a.json?.token, `admin login returned ${a.res.status}: ${a.text}`)
  adminToken = a.json.token
  const u = await call('/api/auth/login', { method: 'POST', body: user })
  expect(u.res.status === 200 && u.json?.token, `user login returned ${u.res.status}: ${u.text}`)
  userToken = u.json.token
  const bad = await call('/api/auth/login', { method: 'POST', body: { ...user, password: 'Wrong-pass-1' } })
  expect(bad.res.status === 401, `wrong password returned ${bad.res.status}`)
})

await check('admin dashboard has workspace-wide numbers and a 14-day chart', async () => {
  const { res, json } = await call('/api/dashboard', { token: adminToken })
  expect(res.status === 200, `returned ${res.status}`)
  expect(json.scope === 'all' && json.daily.length === 14 && json.users, 'unexpected dashboard shape')
})

await check('roles are enforced: users cannot list users, admins can', async () => {
  expect((await call('/api/users', { token: userToken })).res.status === 403, 'user was not refused')
  const ok = await call('/api/users', { token: adminToken })
  expect(ok.res.status === 200 && ok.json.total > 0, `admin got ${ok.res.status}`)
})

await check('a user can create a transaction and see it in their list', async () => {
  const created = await call('/api/transactions', { method: 'POST', token: userToken, body: { amount: 1.5, note: 'smoke test' } })
  expect(created.res.status === 201 && /^TXN-\d+/.test(created.json?.reference), `create returned ${created.res.status}: ${created.text}`)
  const list = await call('/api/transactions?pageSize=100', { token: userToken })
  expect(list.json.items.some((t) => t.reference === created.json.reference), 'new transaction is not in the list')
})

await check('invalid input is rejected with field messages', async () => {
  const { res, json } = await call('/api/transactions', { method: 'POST', token: userToken, body: { amount: 0 } })
  expect(res.status === 400 && json?.error?.details?.fieldErrors?.amount, `returned ${res.status}`)
})

console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.')
process.exit(failed ? 1 : 0)
