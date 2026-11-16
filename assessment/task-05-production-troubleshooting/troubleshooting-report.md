# Ledgerly – Task 5: Production Troubleshooting Report

## Scope
Three controlled failures were simulated in the Ledgerly Docker Compose deployment. These are assessment exercises, not claims of real customer-facing incidents.

## Issue 1 – Database connection failure

### Reproduction
Checked the healthy baseline with `docker compose ps` and `GET /api/health/ready`, then stopped PostgreSQL using `docker compose stop db`.

### Investigation and observations
Backend logs recorded PostgreSQL error `57P01` (`terminating connection due to administrator command`) and Prisma errors stating `Can't reach database server at db`. Existing pooled connections were terminated. The API process remained running while database-dependent operations failed.

### Root cause
The PostgreSQL service was deliberately stopped, making the database unavailable to the API.

### Resolution and verification
Ran `docker compose start db`. PostgreSQL returned to `healthy`; `/api/health/ready` returned HTTP 200 with `database: up`. Docker health inspection later showed API `Status: healthy` and `FailingStreak: 0`, without restarting the API.

### Evidence
Screenshots are in `evidence/issue-01-database-connection-failure/`: healthy baseline, connection failure and investigation. Recovery was confirmed by `/api/health/ready` returning HTTP 200 with `database: up` and by the API container health status.

## Issue 2 – API returning HTTP 500

### Reproduction
Temporarily inserted this line into `backend/src/modules/dashboard/dashboard.service.ts`, inside `get()`:

```typescript
throw new Error('SIMULATED_INTERNAL_SERVER_ERROR')
```

Rebuilt the API and called authenticated `GET /api/dashboard`.

### Investigation and observations
The API returned HTTP 500:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong on our side.",
    "requestId": "5aa7620d77759bb2f109d03f1c447931"
  }
}
```

Searching API logs using that request ID identified `SIMULATED_INTERNAL_SERVER_ERROR` at `dashboard.service.ts:26`. The log recorded status 500 and an 8 ms response time. The authorization header was redacted.

### Root cause
An unexpected exception in the dashboard service. The centralized error handler correctly mapped it to HTTP 500 and returned a sanitized client response.

### Resolution and verification
Removed the temporary exception and rebuilt the API. A subsequent dashboard request returned HTTP 200 with dashboard totals, daily values, pending/failed counts, user statistics and recent transactions.

### Evidence
Screenshots are in `evidence/issue-02-api-http-500/`: the HTTP 500 response and the recovery response.

## Issue 3 – Frontend/backend connectivity failure

### Reproduction
Temporarily set `VITE_API_BASE_URL=/wrong-api` in `frontend/.env.production`. The `.dockerignore` rule `.env.*` initially excluded that file; a temporary exception was added so the test value entered the Docker build context. Rebuilt and redeployed the web image.

### Investigation and observations
The browser sent the login request to `/wrong-api/auth/login` rather than `/api/auth/login`. Nginx returned HTTP 405 Method Not Allowed and the UI displayed `Request failed (405)`.

### Root cause
The production frontend bundle contained an incorrect API base URL. Vite embeds `VITE_*` values at build time, so restarting the Nginx container alone does not update the compiled JavaScript. The `.dockerignore` rule also affected whether the temporary env file reached the build.

### Resolution and verification
Corrected `frontend/.env.production` to:

```env
VITE_API_BASE_URL=/api
```

Rebuilt with `docker compose build --no-cache web` and redeployed using `docker compose up -d web`. The web container became healthy and login worked again (`04-login-recovered.png`).

### Evidence
Screenshots are in `evidence/issue-03-frontend-backend-connectivity/`: the failed login request, the wrong configuration, the rebuild and the recovered login.

### Cleanup
The temporary `!.env.production` exception in `frontend/.dockerignore` and the test `frontend/.env.production` file were removed after the exercise. The final production build uses the default `/api` base path.

## Overall lessons
- Check dependency health and application readiness separately.
- Correlate client failures with server logs using request IDs.
- Keep client-facing errors sanitized while retaining server-side diagnostics.
- Treat Vite `VITE_*` values as build-time configuration.
- Verify actual browser requests after rebuilding, not only container status.
