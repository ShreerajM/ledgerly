// Starts a local PostgreSQL 18 server without Docker, using the credentials in DATABASE_URL.
// Handy when Docker is unavailable. The Docker route (docker compose up -d db) uses the same URL.
// Data lives in backend/.pgdata (git-ignored). Stop with Ctrl+C.
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env first.')
  process.exit(1)
}

const url = new URL(process.env.DATABASE_URL)
const databaseDir = fileURLToPath(new URL('../.pgdata', import.meta.url))
const dbName = url.pathname.slice(1)

let stopping = false

const pg = new EmbeddedPostgres({
  databaseDir,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  port: Number(url.port || 5432),
  persistent: true,
  onLog: () => {},
  // While shutting down, the server closes its own connections; that is expected, not an error.
  onError: (message) => {
    if (!stopping) console.error(String(message).trim())
  },
})

if (!existsSync(`${databaseDir}/PG_VERSION`)) await pg.initialise()
await pg.start()
try {
  await pg.createDatabase(dbName)
} catch (err) {
  if (!/already exists/i.test(String((err as Error | null)?.message))) throw err
}

console.log(`PostgreSQL is running on port ${url.port || 5432}, database "${dbName}". Press Ctrl+C to stop.`)

let shuttingDown = false
async function stop() {
  if (shuttingDown) return
  shuttingDown = true
  stopping = true
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
setInterval(() => {}, 1 << 30)
