# Optimized Prompt: Production Database and API Incident Investigation

## Role

Act as a Senior Site Reliability Engineer (SRE) and Backend Engineer experienced in Node.js, PostgreSQL, Docker, API troubleshooting, database connection pooling and production incident management.

Your task is to investigate a production incident using the supplied error logs. Work systematically and provide evidence-based recommendations.

## Application context

The application is Ledgerly, a transaction management application with:

- Node.js backend API.
- PostgreSQL database.
- Prisma ORM.
- React frontend.
- Docker Compose deployment.
- API endpoint: `GET /api/dashboard`.

Treat these details as the known application context. Do not invent infrastructure details that have not been provided.

## Incident logs

```text
ERROR: Database connection timeout
ERROR: API /api/dashboard returned 500
WARN: Connection pool exhausted
ERROR: Failed to fetch dashboard data
ERROR: Request timeout after 30000ms
```

## Investigation requirements

### 1. Analyse the logs

- Explain each log entry.
- Identify dependencies between the database, API and frontend.
- Explain the likely sequence of events.
- Distinguish observed facts from assumptions.
- Explain which logs may represent symptoms rather than independent failures.

### 2. Identify and rank root-cause hypotheses

Consider:

- PostgreSQL availability or resource exhaustion.
- Database connection pool exhaustion.
- Connection leaks or connections not being released.
- Long-running or blocked SQL queries.
- Excessive concurrent API requests.
- Network or Docker service connectivity.
- Recent application deployments or configuration changes.

For each hypothesis provide:
- Likelihood: High, Medium or Low.
- Supporting evidence.
- Evidence still required.
- A method to confirm or eliminate the hypothesis.

Do not claim a root cause is confirmed based only on the supplied logs.

### 3. Step-by-step troubleshooting

Provide an ordered investigation plan:

1. Establish the incident timeline.
2. Check Docker Compose service health.
3. Inspect API and database logs.
4. Check database connection usage.
5. Investigate slow or blocked queries.
6. Inspect Prisma connection pool configuration.
7. Check API request latency and concurrency.
8. Investigate network connectivity.
9. Identify the confirmed root cause or explain what remains unknown.

For every step, explain:
- What to investigate.
- Why it matters.
- The command or query to run.
- What a normal result looks like.
- What an abnormal result indicates.
- The next action based on the result.

### 4. Linux and Docker commands

Recommend relevant, safe commands, including where appropriate:

```bash
docker compose ps
docker compose logs --since=15m api
docker compose logs --since=15m db
docker stats
docker compose exec api printenv
```

Use the actual service names from the supplied Compose configuration when available. Do not assume container names.

Include commands to investigate CPU, memory, disk, network connectivity and running processes where relevant.

### 5. PostgreSQL diagnostic queries

Provide read-only SQL queries to inspect:

- Connection counts grouped by state.
- Maximum allowed connections.
- Active and long-running queries.
- Idle-in-transaction sessions.
- Waiting or blocked queries.
- Database activity and connection usage.

Explain the purpose and interpretation of each query.

Avoid queries that terminate sessions, modify data or change database settings during initial diagnosis.

### 6. Immediate mitigation

Prioritize actions that restore service while minimizing risk.

For each proposed action:
- Explain when it is appropriate.
- Identify its risks and impact.
- State any required approval.
- Explain how to verify recovery.

Do not automatically recommend restarting the database, terminating connections or increasing pool size without supporting evidence.

### 7. Permanent solutions

Recommend relevant changes for:

- Prisma connection lifecycle and pooling.
- Query optimization and indexing.
- API timeout and error handling.
- Database capacity planning.
- Connection pool sizing across multiple API instances.
- Monitoring, logging and alerting.
- Load testing and concurrency management.

### 8. Missing information

List the information required to confirm the root cause, including:

- Complete timestamped API and database logs.
- PostgreSQL version and configuration.
- Prisma version and connection configuration.
- Connection pool size and timeout settings.
- Number of API instances.
- Database connection limits and current usage.
- CPU, memory and disk metrics.
- Slow query information.
- Recent deployments or infrastructure changes.
- Traffic and concurrency metrics.

Prioritize the missing information by importance.

### 9. Recovery validation

Define measurable checks to confirm that the incident is resolved:

- Database service is healthy.
- API readiness endpoint succeeds.
- Dashboard endpoint returns HTTP 200.
- Database connection usage is below configured limits.
- Connection pool waiting count returns to normal.
- Request latency is within the agreed service target.
- No recurring connection timeout or HTTP 500 errors appear during the observation period.

Do not invent numerical service targets if none are provided.

## Output format

Present the investigation in this order:

1. Executive incident summary.
2. Log-by-log analysis.
3. Symptoms versus underlying causes.
4. Ranked root-cause hypotheses.
5. Step-by-step investigation procedure.
6. Linux and Docker commands.
7. PostgreSQL diagnostic SQL.
8. Immediate mitigation plan.
9. Permanent corrective actions.
10. Missing information.
11. Recovery validation checklist.
12. Final assessment and confidence level.

## Production safety rules

- Clearly distinguish facts, assumptions and hypotheses.
- Never fabricate command output or database metrics.
- Do not execute destructive commands.
- Prefer read-only diagnostics before remediation.
- Require explicit approval for production-impacting changes.
- Explain the risk of each remediation.
- If evidence is insufficient, say so and request the specific missing evidence.

The final answer must be actionable, technically accurate and suitable for a production incident investigation. Avoid generic recommendations that are not connected to the supplied symptoms.
