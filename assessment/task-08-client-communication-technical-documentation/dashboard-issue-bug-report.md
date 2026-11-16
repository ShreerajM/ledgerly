# Developer Bug Report: Dashboard Availability / Loading Failure

| Field | Details |
|---|---|
| Issue ID | LEDGERLY-BUG-001 (assessment reference; replace with tracker ID) |
| Issue title | Dashboard fails to load or returns an error |
| Application | Ledgerly |
| Environment | Environment where the client observed the issue: **not yet confirmed** |
| Reported duration | Approximately two days, according to the client |
| Affected area | Dashboard UI and dashboard data API |
| Severity | **Critical (proposed)**, consistent with `incident-management-plan.md` and `sample-rca.md` |
| Priority | **P1 (proposed, subject to business-hours and user-count confirmation)** |
| Status | Open – investigation required |
| Root cause | Not yet confirmed. The supplied log lines (section 6) point to database connection timeouts and connection pool exhaustion as the leading hypothesis |
| Assigned team | Backend / Frontend / Implementation teams |

## 1. Issue summary

The client reports that the Ledgerly dashboard has been experiencing issues for the last two days and that the problem is preventing normal work.

The complaint does not specify whether the dashboard is completely unavailable, loads partially, displays stale or incorrect values, or intermittently fails. The exact failure mode must be confirmed with the client and reproduced by the technical team.

## 2. Environment details

The following is the known application context from the Ledgerly assessment. It is not confirmation that the client's affected deployment uses these exact versions or settings.

| Component | Known project context | Client environment confirmation |
|---|---|---|
| Frontend | React application served through Nginx in the Docker deployment | Pending |
| Backend | Node.js API | Pending |
| Database | PostgreSQL | Pending |
| ORM / database access | Prisma | Pending |
| Deployment | Docker Compose setup used in the assessment | Pending |
| Dashboard endpoint | `GET /api/dashboard` | Confirm against affected deployment |
| Web entry point | Assessment deployment exposed on port `8080` over HTTP | Pending |

**Information to collect:** deployment name, environment (production/staging), application build or image tag, deployment timestamp, browser and version, operating system, affected user IDs (or anonymised identifiers), and approximate time/time zone of failures.

## 3. Steps to reproduce

The client has not yet supplied exact reproduction steps. Use the following initial reproduction procedure in the affected environment:

1. Open the Ledgerly application using the client's affected URL.
2. Sign in with an authorised test account or an account approved for troubleshooting.
3. Navigate to the dashboard.
4. Observe whether the dashboard loads completely.
5. Record any error message, blank section, missing metric, stale value, or loading indicator that does not finish.
6. In browser developer tools, inspect the Network tab and locate the `GET /api/dashboard` request.
7. Record the HTTP status, response body (with sensitive information removed), request duration, and request/correlation ID if available.
8. Correlate the request timestamp and ID with backend and database logs.

**Reproduction status:** Not independently reproduced in the client's environment at the time this report was prepared.

## 4. Expected behaviour

- An authenticated user should be able to open the dashboard.
- The dashboard API should return a successful response for a valid authorised request.
- Dashboard totals and status breakdowns should load and reflect the underlying transaction data.
- The UI should display a clear, recoverable error if the API is unavailable rather than appearing to load indefinitely.
- Users should not see another user's restricted data.

## 5. Actual behaviour

**Client-reported:** Dashboard issues have persisted for approximately two days, and the client says their team cannot continue working normally.

**Shown by the supplied log lines (section 6):** the dashboard API `/api/dashboard` returned an error (logged as HTTP 500), the dashboard data fetch failed, and requests timed out after 30000 ms, alongside database connection timeouts and connection pool exhaustion.

**Not yet confirmed:** exact UI behaviour seen by users, affected user scope, frequency, data correctness, whether the issue is constant or intermittent, and whether the log lines cover the full two-day period. The log lines carry no timestamps or request IDs, so they cannot yet be matched to specific user reports.

Do not record any further specific HTTP status, incorrect total or database failure as an observed fact until supported by evidence from the affected environment.

## 6. Logs and diagnostic evidence

### Log lines supplied with the assessment brief

These five lines are the production log excerpt given in the Task 7 brief for the same dashboard problem. They are reproduced verbatim. They have no timestamps, request IDs or host names, so the time of failure and the affected users are not known.

```text
ERROR: Database connection timeout
ERROR: API /api/dashboard returned 500
WARN: Connection pool exhausted
ERROR: Failed to fetch dashboard data
ERROR: Request timeout after 30000ms
```

Reading of the evidence (hypothesis, not a confirmed cause):

| Log line | Interpretation |
|---|---|
| `Database connection timeout` and `Connection pool exhausted` | The API could not obtain a database connection in time. Pool exhaustion is usually a symptom: connections are held by slow or blocked queries, leaked, or the pool is too small for the load |
| `API /api/dashboard returned 500` and `Failed to fetch dashboard data` | The dashboard endpoint failed as a result, and the frontend could not load its data |
| `Request timeout after 30000ms` | Requests waited the full timeout instead of failing fast, which matches requests queuing behind an exhausted pool |

The same symptom chain was reproduced in a controlled simulation (`task-07-prompt-engineering/04-validation/pool-exhaustion-simulation-output.txt`) and analysed in `task-05-production-troubleshooting/sample-rca.md`. In that simulation, a database lock held the only pooled connection. Our API returned 503 rather than 500 in that case, so the client's 500 may come from a different failure path and must be confirmed from the real logs.

### Still needed from the client environment

No client production log extract with timestamps was supplied with the complaint itself. Capture the following evidence during investigation.

### Application and API logs

```bash
docker compose ps
docker compose logs --since=2h api
```

If the deployment uses a different service name or log platform, use the corresponding service and time range.

### Database logs

```bash
docker compose logs --since=2h db
```

### Resource utilisation

```bash
docker stats --no-stream
df -h
```

### Dashboard API check

```bash
curl -i -w '\nTotal time: %{time_total}s\n' \
  -H "Authorization: Bearer <REDACTED_TOKEN>" \
  http://localhost:8080/api/dashboard
```

Run this only against the correct environment and replace the host with the approved affected endpoint. Do not place real credentials or tokens in the ticket.

### Evidence to attach

- Timestamp and time zone of each failed attempt.
- HTTP status and sanitised response body.
- Request/correlation ID.
- Relevant API and database log excerpts.
- Screenshot or short recording of the dashboard behaviour.
- Recent deployment/configuration changes.
- Whether the issue affects all users or only specific roles/accounts.

## 7. Initial investigation areas (not confirmed causes)

1. Dashboard API returning an error or timing out.
2. Database connectivity problems or connection-pool saturation.
3. Slow or blocked database queries.
4. Incorrect frontend API base URL or reverse-proxy routing.
5. Recent application, configuration, or infrastructure changes.
6. Authentication/session problems affecting dashboard requests.

Investigate using timestamps and request IDs before changing production configuration.

## 8. Business impact

- Client users report that they cannot continue normal work because of the dashboard issue.
- Dashboard visibility and access to operational summaries may be impaired.
- The duration of approximately two days increases the urgency and requires proactive client communication.
- The exact number of affected users, operational processes blocked, and any financial or reporting impact remain to be confirmed.

## 9. Severity and priority assessment

**Proposed severity: Critical.** The client reports a sustained issue, lasting about two days, that stops their team working, and the supplied logs show the dashboard API failing. This matches the Critical / P1 rating in the incident management plan. Confirm whether the dashboard is completely unavailable, whether a workaround exists, and how many users and business processes are affected.

**Proposed priority: P1.** Treat as urgent while impact is being validated. Escalate according to the organisation's incident policy. If the impact turns out to be limited and a safe workaround exists, the incident manager may lower the severity and priority, and this report should be updated.

## 10. Resolution and closure criteria

Do not close the bug until:

- The failure has been reproduced or the affected behaviour has been sufficiently evidenced.
- Root cause is supported by logs or other diagnostic evidence.
- A fix or approved workaround has been implemented.
- Dashboard API requests succeed consistently in the affected environment.
- Dashboard values are checked against the underlying data for representative accounts.
- Authentication and role-based access remain correct.
- Monitoring shows no recurrence during an agreed observation period.
- The client has been informed of the outcome.

**Current resolution:** Pending investigation. No fix or root cause is claimed in this report.
