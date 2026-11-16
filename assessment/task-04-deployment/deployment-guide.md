# Ledgerly deployment guide (Task 4)

## 1. Scope and deployment topology

This assessment deployment runs locally with Docker Compose. The observed host entry point is `http://localhost:8080`. The Compose stack contains PostgreSQL (`db`), a one-off Prisma migration/seed job (`migrate`), the Node.js API (`api`), and the React/Nginx frontend (`web`). Only `web` publishes a host port. The database and API communicate on the Compose private network and are not directly published to the host.

Startup dependency order is: PostgreSQL healthy → migrations complete successfully (and optional seed) → API healthy → web. PostgreSQL data is persisted in the named `pgdata` volume. The API and web services use `restart: unless-stopped`; the migration job uses `restart: "no"`.

## 2. Prerequisites and server setup

Install Docker Engine or Docker Desktop with the Docker Compose v2 plugin. The evidence captured for this run shows Docker 29.5.2, Compose v5.1.3, and an ARM64 Linux container runtime. Exact host OS and production server provisioning are outside this local deployment evidence.

From the project root:

```bash
cp .env.example .env
# Edit .env for the intended environment.
docker compose config --quiet
docker compose up --build -d
docker compose ps -a
```

Open `http://localhost:8080` after the web service is healthy. The `migrate` container is expected to exit successfully after applying migrations; it is a one-off job, not a long-running service.

## 3. Environment variables

Compose reads the root `.env` file. The checked-in `.env.example` contains explicitly labelled demo-only values intended for local evaluation. Do not use those values on a public or production server. For a real deployment, replace the database password and JWT secret with strong unique values, set `ALLOW_DEMO_SECRETS=false`, and set `SEED_DEMO_DATA=false` unless demo data is deliberately required. Keep `.env` out of source control and do not include its contents in screenshots or shared deliverables.

Key settings include `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, `WEB_PORT`, `SEED_DEMO_DATA`, `ALLOW_DEMO_SECRETS`, and optional `APP_TIMEZONE` / `LOG_LEVEL`. Compose passes `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `PORT`, and proxy settings to the API. The database URL uses the internal Compose hostname `db`, not `localhost`.

## 4. PostgreSQL connectivity and persistence

The database service uses `postgres:18`, a named `pgdata` volume, and a `pg_isready` health check. The API readiness endpoint checks database connectivity:

```bash
curl -i http://localhost:8080/api/health/ready
```

The captured result returned HTTP 200 with `status: ready`, `database: up`, and a pool snapshot (`max: 10`, `total: 1`, `idle: 1`, `waiting: 0`). A direct SQL query against the database also returned the current database, user, and PostgreSQL version. These results demonstrate both application-level and direct database connectivity.

Avoid `docker compose down -v` during routine deployment: removing volumes can delete persisted database data. Back up PostgreSQL before risky migrations or maintenance.

## 5. Frontend, backend and Nginx

The frontend image uses a multi-stage Node build and an unprivileged Nginx runtime listening on container port 8080. The host port is configurable with `WEB_PORT` (8080 in the captured deployment). Nginx serves the React build and proxies `/api/` to `http://api:4000`, preserving the request URI. The API is not published directly to the host.

Nginx forwards Host, client address, forwarded protocol and request ID headers. It defines `/healthz` for the Nginx container health check, static asset caching, SPA fallback routing, and request timeouts/body-size limits. Static-site security headers are configured in `security-headers.conf`. The API also applies its own security headers.

Useful checks:

```bash
curl -I http://localhost:8080/
curl -i http://localhost:8080/api/health
curl -i http://localhost:8080/api/health/ready
```

## 6. SSL / HTTPS applicability

This evidence is for a local HTTP deployment at `localhost:8080`; no public domain or TLS certificate is configured. Therefore HTTPS termination is not demonstrated and is not applicable to this local assessment instance. For a public deployment, provision a domain and certificate, configure TLS termination at the public reverse proxy/load balancer, redirect HTTP to HTTPS, and enable HSTS only after HTTPS is correctly working. The API response observed in this local run included an HSTS header; that header alone does not mean TLS is configured.

## 7. Health checks and operational verification

The Compose configuration uses a PostgreSQL `pg_isready` check. The API Docker health check calls `/api/health/ready`, which includes database readiness. The Nginx container health check calls `/healthz`.

```bash
docker compose ps -a
curl -i http://localhost:8080/healthz
curl -i http://localhost:8080/api/health
curl -i http://localhost:8080/api/health/ready
docker compose logs --no-color --tail=50 db api web
```

`/api/health` is the API liveness endpoint; `/api/health/ready` checks whether the API can reach PostgreSQL. The captured checks returned HTTP 200.

## 8. Restart and recovery

Restart an individual service without rebuilding the stack:

```bash
docker compose restart api
# or
docker compose restart db
```

Then wait for the relevant container to report `healthy`:

```bash
docker compose ps
curl -i http://localhost:8080/api/health/ready
```

The assessment run exercised API restart recovery and PostgreSQL restart recovery. After PostgreSQL restart, allow its health check to complete before treating the restart as fully recovered. A successful readiness response with `database: up` confirms application-to-database connectivity has returned.

## 9. Release and rollback procedure

Application releases are deployed from immutable, versioned image tags rather than from a rebuilt `:local` image. A previous version is retained as a tag so that it can be restored without rebuilding.

| Item | Value |
|---|---|
| Tags | `ledgerly-api:v1` / `ledgerly-web:v1` (previous release), `ledgerly-api:v2` / `ledgerly-web:v2` (current release) |
| Pinning file | `compose.release.yaml`, an override that selects the image tag with `RELEASE_TAG` (copy in `configuration/`) |
| Demo script | `scripts/rollback-demo.sh` |
| What differs between v1 and v2 | v2 adds the CSV report endpoint `GET /api/transactions/export`. v1 returns 404 for it. This gives a visible, harmless way to tell which release is running. |
| Database impact | None. The v1 to v2 release contains no schema migration, so v1 is compatible with the current database. |

### 9.1 Retain the current release (before deploying a new one)

```bash
docker tag ledgerly-api:local ledgerly-api:v1
docker tag ledgerly-web:local ledgerly-web:v1
docker images | grep ledgerly
```

### 9.2 Deploy the new release (v2)

```bash
docker compose build api web
docker tag ledgerly-api:local ledgerly-api:v2
docker tag ledgerly-web:local ledgerly-web:v2
RELEASE_TAG=v2 docker compose -f compose.yaml -f compose.release.yaml up -d --no-build --no-deps api web
docker compose ps
curl -i http://localhost:8080/api/health/ready
```

### 9.3 Roll back to v1

Decision point: roll back when, within 10 minutes of a release, readiness or login fails, a smoke test fails, or the error rate rises and a fix is not available in that time. Do not roll back across a schema migration unless the previous version is compatible with the migrated schema.

```bash
RELEASE_TAG=v1 docker compose -f compose.yaml -f compose.release.yaml config --quiet
RELEASE_TAG=v1 docker compose -f compose.yaml -f compose.release.yaml up -d --no-build --no-deps api web
docker compose ps
curl -i http://localhost:8080/api/health
curl -i http://localhost:8080/api/health/ready
```

`--no-build` guarantees Compose uses the retained image and does not rebuild from the current source. The `pgdata` volume is untouched.

### 9.4 Verify the rollback

1. `docker compose ps` shows `api` and `web` healthy.
2. `/api/health/ready` returns 200 with `database: up`.
3. Sign-in works and the dashboard loads.
4. `GET /api/transactions/export` returns 404, confirming v1 is the running release (it returns 200 on v2).
5. Record the time of the rollback and the reason in the incident log.

### 9.5 Database recovery (separate from application rollback)

If data or schema recovery is required, use a verified PostgreSQL backup under a separately approved restore plan. Never delete the `pgdata` volume as a rollback shortcut.

### 9.6 Rollback demonstration script

`bash assessment/task-04-deployment/scripts/rollback-demo.sh` (run from the repository root) runs the whole sequence (retained v1, build and deploy v2, roll back to v1, verify). Set `ROLL_FORWARD=1` to finish on v2. The script can be run live during the technical demonstration.

> **Status:** the v1 images were tagged on 17 November 2026, the override file validates (`docker compose config --quiet`) and the script passes `bash -n`. The deploy/rollback sequence itself was **not executed for this submission and no rollback screenshots are included**. The rollback procedure in sections 9.1 to 9.5 is documented and scripted but not evidenced. Restart recovery is evidenced separately (`evidence/15-database-restart.png`, `evidence/16-api-restart-recovery.png`).

## 10. Evidence index

The `evidence/` folder contains the screenshots captured during this assessment for Docker versions, Linux runtime, running services, environment template/Compose configuration, PostgreSQL readiness/query, frontend/backend responses, Nginx proxy configuration/test, and health endpoints/database restart. API restart recovery is shown in `16-api-restart-recovery.png` and PostgreSQL restart in `15-database-restart.png`.
