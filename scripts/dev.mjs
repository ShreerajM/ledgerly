// Starts the whole application without Docker:  npm run dev
// Local PostgreSQL -> migrations -> demo data -> API (:4000) -> web app (:5173). Press Ctrl+C to stop everything.
// Run `npm run setup` once before this.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import net from 'node:net'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const backend = join(root, 'backend')
const frontend = join(root, 'frontend')
const isWindows = process.platform === 'win32'

if (!existsSync(join(backend, '.env'))) {
  console.error('backend/.env is missing. Run `npm run setup` first.')
  process.exit(1)
}

const envText = readFileSync(join(backend, '.env'), 'utf8')
const databaseUrl = envText.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL is not set in backend/.env.')
  process.exit(1)
}
const dbPort = Number(new URL(databaseUrl).port || 5432)

const children = []
let stopping = false

function stop(code = 0) {
  if (stopping) return
  stopping = true
  console.log('\nStopping...')

  const kill = ({ child }) => {
    try {
      // Children run in their own process group so their sub-processes stop too.
      if (isWindows) child.kill()
      else process.kill(-child.pid, 'SIGTERM')
    } catch {
      /* already gone */
    }
  }
  const exited = ({ child }) =>
    child.exitCode !== null || child.signalCode !== null ? Promise.resolve() : new Promise((resolve) => child.once('exit', resolve))
  const within = (promise, ms) => Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))])

  // App first, database last, so the API never sees its database disappear mid-request.
  const apps = children.filter((c) => c.label !== 'db')
  const databases = children.filter((c) => c.label === 'db')
  apps.forEach(kill)
  within(Promise.all(apps.map(exited)), 5000)
    .then(() => {
      databases.forEach(kill)
      return within(Promise.all(databases.map(exited)), 8000)
    })
    .then(() => process.exit(code))
}
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))

function start(label, args, cwd) {
  const child = spawn('npm', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], detached: !isWindows, shell: isWindows })
  const tag = `[${label}]`.padEnd(6)
  for (const stream of [child.stdout, child.stderr]) {
    let buffer = ''
    stream.on('data', (chunk) => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) if (line.trim()) console.log(`${tag} ${line}`)
    })
  }
  child.on('exit', (code, signal) => {
    if (stopping) return
    console.error(`${tag} stopped unexpectedly (${code ?? signal}).`)
    stop(code || 1)
  })
  children.push({ label, child })
}

function runStep(label, args, cwd) {
  console.log(`> ${label}`)
  const result = spawnSync('npm', args, { cwd, stdio: 'inherit', shell: isWindows })
  if (result.status !== 0) {
    console.error(`"${label}" failed.`)
    process.exit(result.status ?? 1)
  }
}

const portOpen = (port) =>
  new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' })
    socket.once('connect', () => (socket.destroy(), resolve(true)))
    socket.once('error', () => resolve(false))
  })

async function waitFor(check, what, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await check()) return
    await new Promise((r) => setTimeout(r, 500))
  }
  console.error(`Timed out waiting for ${what}.`)
  stop(1)
  await new Promise(() => {})
}

const httpOk = (url) => async () => {
  try {
    return (await fetch(url)).ok
  } catch {
    return false
  }
}

// 1. Database
if (await portOpen(dbPort)) {
  console.log(`> A PostgreSQL server is already running on port ${dbPort}, using it.`)
} else {
  console.log('> Starting local PostgreSQL 18...')
  start('db', ['run', 'db:dev'], backend)
  await waitFor(() => portOpen(dbPort), 'PostgreSQL to start')
}

// 2. Tables and demo data (both are safe to repeat)
runStep('Applying database migrations', ['run', 'db:migrate'], backend)
runStep('Loading demo data (skipped if it already exists)', ['run', 'db:seed'], backend)

// 3. API and web app
start('api', ['run', 'dev'], backend)
start('web', ['run', 'dev'], frontend)
await waitFor(httpOk('http://localhost:4000/api/health/ready'), 'the API')
await waitFor(httpOk('http://localhost:5173'), 'the web app')

console.log(`
  Ledgerly is running.

  Open   http://localhost:5173
  Admin  asha@example.com  / Admin@123
  User   meera@example.com / Password@123

  Press Ctrl+C to stop everything.
`)
