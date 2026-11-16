import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// Prisma 7 no longer reads .env files by itself. Node's built-in loader does it,
// and never overrides variables that are already set (so Docker and CI values win).
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `npm run db:seed` runs this. Node executes the TypeScript file directly.
    seed: 'node --env-file-if-exists=.env prisma/seed.ts',
  },
  datasource: {
    // Empty fallback so `prisma generate` works in builds that have no database.
    url: process.env.DATABASE_URL ?? '',
  },
})
