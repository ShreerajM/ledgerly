# Ledgerly

A simple transaction management application built with React, Node.js, Express and PostgreSQL. It supports user registration and sign-in, a dashboard with transaction information, transaction creation, listing and CSV export, and two roles (admin and user).

## Contents

- [Getting started (Docker)](#getting-started-docker)
- [Stopping and restarting](#stopping-and-restarting)
- [Architecture](#architecture)
- [API reference](#api-reference)
- [Testing](#testing)
- [Running without Docker](#running-without-docker-optional)
- [Operations](#operations)
- [Project layout](#project-layout)
- [Assessment documentation](#assessment-documentation)

## Getting started (Docker)

Follow these steps to run Ledgerly on your computer.

### 1. Prerequisites

Make sure you have the following installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker 24+ and Docker Compose v2.20+)
- [Git](https://git-scm.com/downloads) (if you haven't downloaded the project yet)

**Note:** Make sure Docker Desktop is running before proceeding. You don't need to install Node.js or PostgreSQL separately.

### 2. Download the project

If you haven't already downloaded the project, run:

```bash
git clone https://github.com/ShreerajM/ledgerly.git
cd ledgerly
```

### 3. Start the application

Run the following commands from the project directory:

```bash
cp .env.example .env
docker compose up --build
```

On Windows PowerShell, use `copy .env.example .env` instead.

Docker will automatically:
- Set up the PostgreSQL database.
- Create the required database tables.
- Load the demo data.
- Start the backend API and frontend.

**Note:** The first startup may take a few minutes while Docker downloads and builds the required images.

### 4. Open Ledgerly

Once all services have started, open:

**http://localhost:8080**

You can sign in using either of the following demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | asha@example.com | `Admin@123` |
| User | meera@example.com | `Password@123` |

The application comes with 22 demo users and 50 sample transactions.

## Stopping and restarting

To stop Ledgerly, press `Ctrl + C` in the terminal.

To start it again later, run:

```bash
docker compose up -d
```

To stop the application:

```bash
docker compose down
```

Your database and application data will be preserved when you stop the containers. Do not use `docker compose down -v` unless you want to delete the database volume and all its data.

## Architecture

Browser → Nginx (serves the React build and proxies `/api/`) → Express API → PostgreSQL. Only the web container publishes a port (8080). The API and database are reachable only on the Compose network.

Diagrams (system, request flow, data model, Docker deployment) and the written description are in [`assessment/task-01-application-setup/architecture/`](assessment/task-01-application-setup/architecture/architecture.md).

| Layer | Technology |
|---|---|
| Frontend | React, React Router, TanStack Query, Tailwind CSS, built with Vite |
| Backend | Node.js 24, Express 5, Prisma, Zod validation, JWT authentication, Argon2 password hashing |
| Database | PostgreSQL 18 (tables: users, transactions) |
| Deployment | Docker Compose, Nginx |

## API reference

All paths are served through Nginx, so with the Docker stack the base URL is `http://localhost:8080`. Send `Authorization: Bearer <token>` on every endpoint marked "Token". Request bodies are JSON.

| Method and path | Access | Purpose |
|---|---|---|
| `GET /api/health` | Public | Liveness check |
| `GET /api/health/ready` | Public | Readiness: database connectivity and connection pool statistics (503 if the database is unreachable) |
| `POST /api/auth/register` | Public | Create a regular user account |
| `POST /api/auth/login` | Public (rate limited) | Sign in and receive a token |
| `GET /api/auth/me` | Token | Current user |
| `GET /api/dashboard` | Token | Dashboard summary. Admins see workspace-wide figures; users see their own |
| `GET /api/transactions` | Token | List transactions (filters and paging; users see only their own, admins see all) |
| `POST /api/transactions` | Token | Create a transaction |
| `GET /api/transactions/export` | Token | Download the transaction report as CSV (same filters and visibility as the list) |
| `GET /api/users` | Admin | List users |
| `PATCH /api/users/:id/role` | Admin | Change a user's role |
| `PATCH /api/users/:id/status` | Admin | Activate or deactivate a user |

Errors use a consistent JSON shape with an error code, field details where relevant and a request ID that matches the API log and the `X-Request-Id` response header. Typical status codes are 400 (validation), 401 (missing or invalid token), 403 (role not allowed), 404, 409 (duplicate email) and 503 (database unavailable).

### Postman

The collection and environment are in [`assessment/task-03-api-development-testing/postman/`](assessment/task-03-api-development-testing/postman/). Import both files, select the `Ledgerly Local` environment and run the requests in order (the report [`api-test-report.md`](assessment/task-03-api-development-testing/api-test-report.md) explains each request and the two introduced failure scenarios).

## Testing

Run these from the project root (Node.js 24 or newer; run `npm run setup` once to install dependencies):

| Command | What it does |
|---|---|
| `npm run check` | Backend lint, type check and tests; frontend lint, tests and production build |
| `npm run smoke` | End-to-end check of a running stack through Nginx. It checks `http://localhost:8080` by default; use `npm run smoke -- <url>` for another URL. It creates one small test transaction for the demo user |
| `npm --prefix backend test` | Backend API tests only. They need `DATABASE_URL` in `backend/.env` and a reachable PostgreSQL server (`npm run db:dev` in `backend/` starts a local one). They drop and recreate a separate test database on that server, not the application database |
| `npm --prefix frontend test` | Frontend tests only |

Failure and incident exercises used in the assessment:

```bash
# Introduced API failures (needs the Docker stack running). Set INCLUDE_RATE_LIMIT=1 only if you
# also want scenario F3, which locks the login endpoint for your IP for up to 15 minutes.
node assessment/task-03-api-development-testing/scripts/failure-scenarios.mjs

# Connection pool exhaustion simulation (from backend/, needs DATABASE_URL and a PostgreSQL server).
# Like the tests, it drops and recreates a separate test database, not the application database.
cd backend && node --env-file-if-exists=.env scripts/simulate-pool-exhaustion.ts
```

## Running without Docker (optional)

Requires Node.js 24 or newer.

```bash
npm run setup   # installs dependencies and creates backend/.env with random local secrets
npm run dev     # local PostgreSQL, migrations, demo data, API on :4000, web app on :5173
```

Press `Ctrl + C` to stop everything.

## Operations

```bash
docker compose ps                                  # service status and health
curl -i http://localhost:8080/api/health/ready     # API and database readiness
docker compose logs --since=10m api web db         # recent logs
docker compose restart api                         # restart one service
```

Release, rollback, restart, health check and environment configuration procedures are in the [deployment guide](assessment/task-04-deployment/deployment-guide.md). Troubleshooting, the incident management plan and the sample RCA are in [`assessment/task-05-production-troubleshooting/`](assessment/task-05-production-troubleshooting/).

## Project layout

| Path | Contents |
|---|---|
| `backend/` | Express API, Prisma schema, migrations and seed, tests, simulation scripts |
| `frontend/` | React application and Nginx configuration |
| `scripts/` | Local setup, local dev runner and the smoke test |
| `compose.yaml`, `compose.release.yaml` | Docker Compose stack and the override that pins versioned image tags for release and rollback |
| `assessment/` | Assessment documentation and evidence for Tasks 1 to 8 |

## Assessment documentation

Start with [`assessment/README.md`](assessment/README.md). It lists where each required deliverable is, and records the assumptions, technical decisions, open-source components and AI usage.
