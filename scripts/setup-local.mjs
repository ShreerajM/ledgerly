// One-time setup for the optional no-Docker route:  npm run setup
// Installs both apps and creates backend/.env with a random local database password and JWT secret.
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const isWindows = process.platform === 'win32'

const major = Number(process.versions.node.split('.')[0])
if (major < 24) {
  console.error(`Node.js 24 or newer is required (you have ${process.versions.node}). Install it from https://nodejs.org`)
  process.exit(1)
}

for (const app of ['backend', 'frontend']) {
  console.log(`\n> Installing ${app} dependencies...`)
  const result = spawnSync('npm', ['install', '--no-audit', '--no-fund'], {
    cwd: join(root, app),
    stdio: 'inherit',
    shell: isWindows,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const envPath = join(root, 'backend', '.env')
if (existsSync(envPath)) {
  console.log('\n> backend/.env already exists, leaving it alone.')
} else {
  const dbPassword = randomBytes(12).toString('base64url')
  const jwtSecret = randomBytes(48).toString('base64url')
  const example = readFileSync(join(root, 'backend', '.env.example'), 'utf8')
  const env = example
    .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=postgres://ledgerly:${dbPassword}@localhost:5432/ledgerly`)
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${jwtSecret}`)
  writeFileSync(envPath, env, { mode: 0o600 })
  console.log('\n> Created backend/.env with a random local database password and JWT secret.')
}

console.log('\nSetup complete. Start everything with:  npm run dev')
