# Incident Management Plan – Login and Dashboard Unavailable During Client Presentation

## Scenario and objective
Users cannot log in and the client dashboard is unavailable during an important business presentation. The objective is to restore the critical user journey, communicate clearly, protect data and preserve evidence.

## Severity
Treat as Critical / P1 when multiple users are affected and the presentation or business operation is blocked.

Record start time and time zone, reporter, affected users, environment, deployment version, symptoms, request IDs and scope.

## Roles
| Role | Responsibility |
|---|---|
| Incident Commander | Coordinates response, severity, decisions and timeline |
| Technical Lead | Leads diagnosis and recovery |
| Backend/Database Owner | Checks API, authentication, database and migrations |
| Frontend/Infrastructure Owner | Checks browser requests, Nginx, deployment and connectivity |
| Client/Communications Lead | Sends timed stakeholder updates |
| Scribe | Records timeline, commands, evidence and decisions |

One person may hold multiple roles in a small team, but incident command and communications must be explicit.

## First five minutes
1. Acknowledge the incident and appoint an Incident Commander.
2. Confirm impact using an approved test account; capture failing URL, HTTP status and request ID.
3. Check services with `docker compose ps`.
4. Check Nginx: `curl -i http://localhost:8080/healthz`.
5. Check API liveness: `curl -i http://localhost:8080/api/health`.
6. Check readiness/database: `curl -i http://localhost:8080/api/health/ready`.
7. Inspect recent logs: `docker compose logs --since=10m api web db`.
8. Avoid destructive actions, database resets or unreviewed migrations.
9. Tell the client the team is investigating and give a realistic next-update time.

## Diagnostic path

### Login failure
- Inspect browser Network request: URL, method, status and response.
- Confirm the frontend calls `/api/auth/login`, not an incorrect base path.
- Check Nginx routing and API health.
- Correlate backend logs using request ID.
- Verify environment configuration without printing secrets.
- Check database readiness if authentication depends on PostgreSQL.

### Dashboard failure after login
- Verify token validity and `/api/auth/me`.
- Call `/api/dashboard`; record status and request ID.
- Correlate request ID with API logs.
- Check database readiness and query errors.
- Determine whether failure is isolated to dashboard logic or a shared dependency.

### Shared infrastructure failure
- Check DB/API/web health and Compose dependencies.
- Review recent deployment/configuration changes.
- Compare current image/configuration with last known-good version.
- Use only reviewed, reversible recovery actions.

## Recovery and validation
1. Confirm PostgreSQL is healthy and readiness reports database up.
2. Confirm API liveness and readiness.
3. Confirm Nginx health and `/api` proxy routing.
4. Verify login using an approved test account.
5. Verify authenticated dashboard response and key totals.
6. Ask the client/business owner to confirm presentation readiness.
7. Monitor logs and health checks during a stabilization period.

Do not declare recovery merely because a container is running; verify actual login and dashboard requests.

## Client communication

**Initial update**
> We are aware that users are currently unable to log in and the dashboard is unavailable. The technical team is investigating the application and database connectivity. We are prioritizing restoration ahead of the presentation and will provide the next update in 10 minutes.

**Investigation update**
> We have narrowed the investigation to [confirmed component or symptom]. We are validating the recovery path and checking the login and dashboard flows before declaring service restored. Our next update will be at [time].

**Recovery update**
> Login and dashboard access have been restored and verified using a test account. We are monitoring the services and will share a brief incident summary, including cause and preventive actions, after the presentation.

Only state a root cause when supported by evidence. Do not promise an unsupported ETA.

## Escalation
Escalate to application, database or infrastructure owners when the database remains unavailable, data integrity is uncertain, a migration may have caused the outage, security/credential exposure is suspected, or recovery risks data loss.

## Closure
Record detection, mitigation and recovery times; preserve request IDs, logs, deployment identifiers and screenshots; obtain business-owner acceptance; create an RCA; and assign corrective actions with owners and due dates.
