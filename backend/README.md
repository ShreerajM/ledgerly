# Ledgerly API

REST API for the Ledgerly transactions console. Express 5 on Node.js 26, TypeScript run directly by Node
(no build step), PostgreSQL 18 through Prisma, Zod request and response models.

## Quick start

Needs Node.js 24 or newer (26 recommended) and a PostgreSQL 18 server.

```bash
cp .env.example .env            # then set DATABASE_URL and JWT_SECRET
npm install

# 1. A database. Pick one:
npm run db:dev                  # local PostgreSQL 18 with no Docker (keep this terminal open)
#    or, from the repository root:  docker compose up -d db

# 2. Create the tables and load demo data
npm run db:migrate              # applies prisma/migrations
npm run db:seed                 # 22 users and 50 transactions

# 3. Run the API on http://localhost:4000
npm run dev
```

Demo accounts: `asha@example.com` / `Admin@123` (admin) and `meera@example.com` / `Password@123` (user).

## Scripts

| Command                                     | What it does                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`                               | API with auto-restart, pretty logs                                                   |
| `npm start`                                 | API for production (reads real environment variables)                                |
| `npm run check`                             | Lint, typecheck and tests in one go                                                  |
| `npm test`                                  | Integration tests (builds a fresh `ledgerly_test` database from the real migrations) |
| `npm run typecheck` / `lint` / `format`     | Quality tools (TypeScript, Oxlint, Prettier)                                         |
| `npm run db:migrate:dev -- --name <change>` | Create and apply a new migration after editing `prisma/schema.prisma`                |
| `npm run db:migrate`                        | Apply pending migrations (use this in CI and production)                             |
| `npm run db:migrate:status`                 | Show which migrations are applied                                                    |
| `npm run db:seed`                           | Load demo data (skips if users already exist, refuses in production)                 |
| `npm run db:reset`                          | Drop everything, re-migrate and re-seed (development only)                           |
| `npm run db:studio`                         | Browse data in Prisma Studio                                                         |

## Database migrations

The schema lives in `prisma/schema.prisma`. Changing it is a three-step habit:

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate:dev -- --name add_something` writes a SQL file under `prisma/migrations/` and applies it.
3. Review the SQL, commit both the schema and the migration folder.

Things Prisma cannot express, such as `CHECK` constraints and the generated `reference` column, are written by hand
in the migration SQL (see `20261114164733_init`). Prisma keeps them and does not report drift.
Production applies migrations with `npm run db:migrate` (`prisma migrate deploy`), which never prompts and never resets.

> **Version pin.** Prisma 7.10.1 is pinned exactly in `package.json`. Since August 2026 the `latest` tag on npm for the
> `prisma` CLI points at the Prisma 8 release candidate, which has a different workflow (no `schema.prisma`, no
> `migrate dev`). Do not run `npm install prisma@latest` until 8.x is stable and this project is upgraded on purpose.

## API reference

Base path `/api`. JSON in and out. Protected routes need `Authorization: Bearer <token>`.

| Method | Path                | Access    | Purpose                                                                                       |
| ------ | ------------------- | --------- | --------------------------------------------------------------------------------------------- |
| GET    | `/health`           | public    | Liveness                                                                                      |
| GET    | `/health/ready`     | public    | Readiness: database check plus pool numbers (503 if down)                                     |
| POST   | `/auth/register`    | public    | `{ name, email, password }` creates a User, returns `{ token, user }`                         |
| POST   | `/auth/login`       | public    | `{ email, password }` returns `{ token, user }`                                               |
| GET    | `/auth/me`          | signed in | The current user                                                                              |
| GET    | `/dashboard`        | signed in | Totals, 14-day chart, pending and failed counts, recent items (admin sees all, user sees own) |
| GET    | `/transactions`     | signed in | Query: `q`, `status` (all, success, pending, failed), `page`, `pageSize` (1 to 100)           |
| POST   | `/transactions`     | signed in | `{ amount, note?, customerId? }`; `customerId` only honoured for admins                       |
| GET    | `/users`            | admin     | Query: `q`, `role`, `status` (all, active, inactive), `page`, `pageSize`                      |
| PATCH  | `/users/:id/role`   | admin     | `{ role: "admin" \| "user" }`, not allowed on yourself                                        |
| PATCH  | `/users/:id/status` | admin     | `{ isActive: boolean }`, not allowed on yourself                                              |

Rules worth knowing: amount must be greater than 0 and at most 10,000,000 with up to 2 decimals; passwords need 8 to 128
characters including a digit; emails are stored lowercase.

Every error has the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": { "formErrors": [], "fieldErrors": { "amount": ["Amount must be greater than 0."] } },
    "requestId": "1f0c..."
  }
}
```

Codes: `VALIDATION_ERROR` 400, `BAD_REQUEST` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409,
`PAYLOAD_TOO_LARGE` 413, `RATE_LIMITED` 429, `INTERNAL_ERROR` 500, `SERVICE_UNAVAILABLE` 503.
Quote the `requestId` when reporting a problem; it is in the server logs too.

## Configuration

All settings are environment variables, validated at startup (`src/config/env.ts`). See `.env.example` for the full list
and defaults. Required: `DATABASE_URL`, `JWT_SECRET` (32+ characters).

## Project layout

```
backend/
  prisma/            schema.prisma, migrations/, seed.ts
  prisma.config.ts   Prisma CLI settings (schema, migrations folder, seed command)
  scripts/           dev-db.ts (local PostgreSQL without Docker)
  src/
    server.ts        process entry: start, graceful shutdown
    app.ts           builds the Express app (also used by tests)
    config/          environment validation
    db/              Prisma client + connection pool, shared selects
    lib/             errors, logger, password hashing, tokens, http helpers
    middleware/      authenticate, requireRole, rate limits, error handler
    modules/         auth, users, transactions, dashboard, health
                     each: *.schemas.ts (request and response models), *.service.ts, *.routes.ts
    generated/       Prisma Client (created by `npm run db:generate`, git-ignored)
  test/              integration tests
```

## Troubleshooting

| Symptom                                                       | What to check                                                                                                                                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API exits at startup with "Invalid environment configuration" | The message names the bad variable. Fix `.env`.                                                                                                                                                                               |
| `/api/health/ready` returns 503, requests return 503          | Database down or unreachable: `DATABASE_URL`, is PostgreSQL running, firewall.                                                                                                                                                |
| Requests hang, then 503 after about 5 seconds                 | Pool exhausted. Look at `pool.waiting` in `/api/health/ready`; find long queries with `SELECT pid, state, now() - query_start AS age, query FROM pg_stat_activity WHERE application_name = 'ledgerly-api' ORDER BY age DESC;` |
| 503 "database took too long"                                  | A statement hit `DB_STATEMENT_TIMEOUT_MS`. Find the slow query and check its indexes with `EXPLAIN ANALYZE`.                                                                                                                  |
| 429 on login                                                  | Too many failed attempts from one IP; wait 15 minutes. Behind Nginx make sure `TRUST_PROXY=1` so the real client IP is used.                                                                                                  |
| 401 right after an admin changed your account                 | The account was deactivated; the web app signs you out.                                                                                                                                                                       |
| Search returns odd results                                    | `%` and `_` are matched literally by design.                                                                                                                                                                                  |
