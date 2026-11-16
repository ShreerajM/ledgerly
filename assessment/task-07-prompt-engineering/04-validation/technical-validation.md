# Technical Validation of AI Recommendations

## 1. AI tool used

| Item | Value |
|---|---|
| Tool | ChatGPT (web chat interface) |
| Model / version | GPT-5 |
| Date used | 16 November 2026 |
| Used for | Initial and optimised troubleshooting responses, and the generated UAT test cases |

## 2. Validation method

Each recommendation from the optimised response (`03-optimized-prompt/final-ai-response.md`) was classified in one of three ways:

1. **Executed** against the live Ledgerly Docker Compose stack, read-only. Output: `live-validation-output.txt` (run on 17 November 2026).
2. **Reproduced** in a controlled incident simulation. Script: `backend/scripts/simulate-pool-exhaustion.ts`. Output: `pool-exhaustion-simulation-output.txt`.
3. **Reviewed only**, where running it would be unsafe or meaningless on a healthy system.

## 3. Executed recommendations (live stack)

| AI recommendation | Result on the live stack | Outcome |
|---|---|---|
| `docker compose ps` | `api`, `db`, `web` all `Up ... (healthy)` | Works as described |
| `docker compose logs --since=15m api` | Ran; no error lines in the last 15 minutes | Works; healthy baseline |
| `docker stats` | Ran with `--no-stream`; CPU 0%, API 189 MiB, DB about 29 MiB | Works. `--no-stream` is needed for a one-off capture |
| `df -h` | Ran; the host disk is 85% used with 2.2 GiB free | Works. This is a real finding to watch, not an incident |
| `SELECT state, COUNT(*) FROM pg_stat_activity GROUP BY state` | 1 active, 1 idle, 8 sessions with a blank state | Works. Blank-state rows are PostgreSQL background processes, not application connections. The AI response did not mention this |
| `SHOW max_connections` | 100 | Works |
| Long-running active queries query | Only the diagnostic query itself, 0 seconds | Works; nothing long-running |
| Blocked-queries query (`pg_blocking_pids`) | 0 rows | Works; no blocking |
| API readiness (`/api/health/ready`) | 200, pool `max 10, total 1, idle 1, waiting 0` | Works; the pool snapshot is the quickest check for exhaustion |

## 4. Incident reproduction (pool exhaustion)

The incident in the brief was reproduced on a throw-away database with a pool of 1 connection and a 500 ms wait. A second session held a lock on the `transactions` table, and six dashboard requests were fired at once. The full output is in `pool-exhaustion-simulation-output.txt`.

| Time (UTC) | Observation | Matches the brief's log line |
|---|---|---|
| 06:39:27 | Baseline: readiness 200, dashboard 200 in 22 ms | none |
| 06:39:28 | Five requests fail after about 520 ms with `timeout exceeded when trying to connect` | "Database connection timeout" |
| 06:39:29 | Readiness returns 503; pool `idle: 0`; `pg_stat_activity` shows the dashboard query waiting on a `relation` lock held by PID 64443 | "Connection pool exhausted" |
| 06:39:31 | The request that held the only connection is cancelled by the statement timeout (code 57014) after 4 s | "Request timeout" |
| 06:39:31 | Each failed request is logged server-side with its request ID, and the client receives 503 `SERVICE_UNAVAILABLE` | "Failed to fetch dashboard data" (client-side symptom; the brief's wording is not a Ledgerly UI string) |
| 06:39:32 | After `ROLLBACK` of the blocking transaction, readiness is 200 and the dashboard is 200 in 9 ms | recovery |

What this validated:

- The AI's ordering was right: connection timeout and pool exhaustion are the underlying problem, and the dashboard failure and fetch error are downstream symptoms.
- Its suggested queries (`pg_stat_activity`, `pg_blocking_pids`) found the real cause during the simulation: a lock held by another session. Without that evidence, "pool exhaustion" would only have been a hypothesis.
- The AI said a pool-exhausted warning "does not prove a connection leak". The simulation confirms this. The pool was exhausted by a lock, with no leak.

### Difference from the brief

The brief lists `/api/dashboard returned 500`. Ledgerly's error handler maps database timeouts and pool timeouts to **HTTP 503 `SERVICE_UNAVAILABLE`**, so the simulation returned 503 rather than 500. A 500 from this application would indicate an unexpected application error, so in this implementation a 500 and a 503 point to different investigations. The AI response treated "500" as a database-related symptom; that assumption should be verified against the request ID and stack trace, not taken from the status code alone.

## 5. Recommendations reviewed but not executed

| Recommendation | Assessment | Reason not executed |
|---|---|---|
| Increase pool size | Conditional. It can overload PostgreSQL (limit 100 connections here) and in the simulation would only have increased the number of blocked sessions | Would change production configuration |
| Restart API or database | Conditional. It hides the root cause and interrupts users | Needs approval and a prior capture of evidence |
| Terminate database sessions | Needs approval. It can abort transactions | Destructive |
| Review Prisma pooling | Relevant. The pool is configured through `DB_POOL_MAX` and `DB_CONNECTION_TIMEOUT_MS` in `backend/src/config/env.ts` | Configuration review only |

## 6. Corrections to the AI output

1. `docker compose exec api printenv` must not be used for capture, because secrets would be exposed. Inspect individual, non-secret values only.
2. `docker stats` should include `--no-stream` for a point-in-time capture.
3. The state-count query returns blank-state background rows. Filter with `WHERE datname = current_database()` when counting application connections.
4. Exact Prisma pooling behaviour depends on the version and driver adapter. Verify the real configuration (the pool is created in `backend/src/db/client.ts`) before recommending parameter changes.
5. The dashboard 500 or 503 must be traced through its request ID and server log, not assumed to be a database failure.

## 7. Conclusion

The optimised response gives a technically sound investigation plan. Its commands and queries were run against the live stack and worked as described, and its root-cause reasoning was confirmed by a controlled reproduction of the incident. Two corrections were needed (section 6) and one assumption (HTTP 500) differs from how this application behaves. No live production root cause is claimed: the brief supplied error messages only, without timestamps or metrics.
