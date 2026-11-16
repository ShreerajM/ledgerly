// Reproduces the Task 7 incident on a throw-away database, with evidence printed to the terminal:
//   "Database connection timeout" -> "Connection pool exhausted" -> "/api/dashboard failed" -> "Request timeout".
//
// How: a small API pool (1 connection, 500 ms wait) plus a session that holds an exclusive lock on the
// transactions table, as a long-running migration or report would. Dashboard queries then block while
// holding the only pooled connection, so every other request runs out of connections.
//
// Run from backend/ (needs the local database from `npm run db:dev`, or any PostgreSQL in DATABASE_URL):
//   node --env-file-if-exists=.env scripts/simulate-pool-exhaustion.ts
import pg from 'pg'
import { resetTestDatabase, startTestServer, testDatabaseUrl } from '../test/helpers/test-server.ts'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const stamp = () => new Date().toISOString()
const say = (msg: string) => console.log(`[${stamp()}] ${msg}`)

await resetTestDatabase()
const api = await startTestServer({
  NODE_ENV: 'development', // test mode silences the logger; we want the server logs in the evidence
  LOG_LEVEL: 'warn',
  DB_POOL_MAX: '1',
  DB_CONNECTION_TIMEOUT_MS: '500',
  DB_STATEMENT_TIMEOUT_MS: '4000',
})
const token = await api.login('asha@example.com', 'Admin@123')

async function probe(label: string, path: string, authed = true) {
  const started = Date.now()
  const res = await api.call('GET', path, authed ? { token } : {})
  const ms = Date.now() - started
  const extra = path.includes('ready') ? ` pool=${JSON.stringify(res.body.pool)}` : res.status >= 400 ? ` code=${res.body?.error?.code}` : ''
  say(`${label.padEnd(26)} GET ${path.padEnd(18)} -> HTTP ${res.status} in ${String(ms).padStart(5)} ms${extra}`)
  return res
}

say('--- STEP 1: healthy baseline (pool max=1) ---')
await probe('baseline readiness', '/api/health/ready', false)
await probe('baseline dashboard', '/api/dashboard')

say('--- STEP 2: inject the fault: another session locks the transactions table ---')
const locker = new pg.Client({ connectionString: testDatabaseUrl(), application_name: 'incident-simulator' })
await locker.connect()
await locker.query('BEGIN')
await locker.query('LOCK TABLE transactions IN ACCESS EXCLUSIVE MODE')
say('lock acquired by application_name=incident-simulator (transaction left open)')

say('--- STEP 3: users hit the dashboard (6 concurrent requests) ---')
const burst = Promise.all(
  Array.from({ length: 6 }, (_, i) => probe(`user request ${i + 1}`, '/api/dashboard')),
)
await sleep(1200)

say('--- STEP 4: investigate while the incident is live ---')
await probe('readiness during incident', '/api/health/ready', false)
const { rows: sessions } = await locker.query(`
  SELECT pid, application_name, state, wait_event_type, wait_event,
         pg_blocking_pids(pid) AS blocked_by, left(query, 60) AS query
  FROM pg_stat_activity
  WHERE datname = current_database() AND pid <> pg_backend_pid()
  ORDER BY pid`)
say('pg_stat_activity (sessions on this database):')
console.table(sessions)
const { rows: counts } = await locker.query(`
  SELECT state, count(*)::int AS sessions, (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections
  FROM pg_stat_activity WHERE datname = current_database() GROUP BY state`)
say('connections by state:')
console.table(counts)

await burst
say('--- STEP 5: resolve: end the blocking transaction ---')
await locker.query('ROLLBACK')
await locker.end()
await sleep(500)

say('--- STEP 6: verify recovery ---')
await probe('readiness after fix', '/api/health/ready', false)
await probe('dashboard after fix', '/api/dashboard')

await api.close()
say('simulation finished')
