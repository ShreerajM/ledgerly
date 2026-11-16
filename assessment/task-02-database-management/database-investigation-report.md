# Ledgerly — Task 2: Database Management and Investigation

## 1. Objective

This task documents the PostgreSQL schema, executes database investigation queries, reviews transaction and user data, and evaluates database performance and connection health.

The findings below are based on the captured PostgreSQL query outputs from the current Ledgerly database. They describe the database at the time the queries were executed; they should not be interpreted as immutable seed-data counts.

## 2. Database environment

| Property | Observed value |
|---|---|
| Database | `ledgerly` |
| Connected database user | `ledgerly` |
| PostgreSQL version | PostgreSQL 18.7 |
| Session timezone | `Etc/UTC` |
| Current user records | 23 |
| Current transaction records | 52 |

The current database contains 23 users and 52 transactions. The original demo seed was designed around 22 users and 50 transactions. The additional records indicate that the database has changed since the original seed was created. The investigation therefore uses the live query results rather than assuming the seed counts are still current.

## 3. Schema and migration approach

The application uses Prisma with PostgreSQL. Prisma schema definitions and migrations are the source of truth for application database structure.

The SQL schema file in this assessment package is provided as a readable reference and for fresh-database setup where appropriate. It should not be run against an already migrated application database without first checking the migration state. For normal application setup and upgrades, use the repository's Prisma migration workflow rather than manually recreating tables.

The TypeScript seed script (`backend/prisma/seed.ts`) remains the source of truth for demo data, because passwords must be hashed with Argon2 when the data is loaded. For reviewers who expect plain SQL, `sql/04_sample_data_snapshot.sql` is a data-only export of the database after the investigation (24 users, 53 transactions). It is a read-only snapshot of the seed plus the rows created during Tasks 1 and 3 testing, not a second independently maintained dataset.

## 4. Investigation results

### 4.1 Duplicate normalized email addresses

**Query approach:** Group user email addresses by `lower(btrim(email))` and return groups with more than one record.

**Result:** 0 duplicate groups.

**Interpretation:** No duplicate email addresses were found after trimming leading/trailing whitespace and comparing values without case sensitivity. This is a useful data-quality check, but it does not replace enforcing a database-level unique constraint. The existing unique email index/constraint should remain in place.

### 4.2 Inactive users

**Result:** 5 inactive accounts.

| User ID | Name | Email |
|---:|---|---|
| 18 | Pooja Bhoir | pooja@example.com |
| 19 | Nikhil Sawant | nikhil@example.com |
| 20 | Anjali Kadam | anjali@example.com |
| 21 | Harsh Mehta | harsh@example.com |
| 22 | Divya Nair | divya@example.com |

All five records have `is_active = false`. Divya Nair's `last_login_at` is null; the other four records have a recorded last-login timestamp.

The separate optional query for users who have not logged in during the last 30 days is an activity-based definition. It should not be confused with the account-status definition `is_active = false`.

### 4.3 Users without transactions

**Result:** 7 users have no transaction rows.

| User ID | Name | Account status |
|---:|---|---|
| 13 | Sahil Khan | Active |
| 17 | Yash Thakur | Active |
| 18 | Pooja Bhoir | Inactive |
| 19 | Nikhil Sawant | Inactive |
| 20 | Anjali Kadam | Inactive |
| 21 | Harsh Mehta | Inactive |
| 22 | Divya Nair | Inactive |

This query uses a `LEFT JOIN` and filters for missing transaction IDs. It correctly distinguishes users with no transaction records from users who have transactions but no successful transactions.

### 4.4 Successful transaction totals by user

The aggregation returned 23 user rows. The highest successful transaction totals were:

| User | Successful transactions | Successful amount |
|---|---:|---:|
| Sneha Patil | 3 | ₹75,700.00 |
| Tanvi Gharat | 3 | ₹55,250.00 |
| Nisha Gawande | 3 | ₹52,850.75 |
| Arjun Naik | 3 | ₹52,400.50 |
| Asha Verma | 3 | ₹49,800.00 |

Eight users have zero successful transactions in the result. This is not the same as having no transactions: a user can have pending or failed transactions and still have zero successful transactions.

The query uses conditional aggregation with `FILTER` and `COALESCE`, so users with no successful transactions remain in the result with a zero count and zero total.

### 4.5 Failed transactions in the last seven days

**Result:** 4 failed transactions were returned.

| Reference | User | Amount | Failure note | Recorded timestamp (UTC) |
|---|---|---:|---|---|
| TXN-0046 | Kabir Joshi | ₹1,250.00 | Card declined | 2026-11-15 02:21:20 |
| TXN-0044 | Riya Shah | ₹2,999.00 | Gateway timeout | 2026-11-14 03:21:20 |
| TXN-0041 | Aditya Pawar | ₹7,450.00 | Card declined | 2026-11-12 07:21:20 |
| TXN-0038 | Isha Rane | ₹21,000.00 | Gateway timeout | 2026-11-10 06:21:20 |

The returned failure notes fall into two broad categories:

- **Card declined:** likely requires checking the payment method, issuer response and user-facing guidance.
- **Gateway timeout:** requires checking gateway availability, request latency, timeout configuration and whether retry handling could create duplicate payment attempts.

The database records alone do not establish the external payment gateway's root cause. Gateway logs and provider responses would be needed for that conclusion.

### 4.6 Dashboard count reconciliation

The all-user transaction aggregation returned:

| Metric | Count |
|---|---:|
| Total transactions, all statuses | 52 |
| Successful | 38 |
| Pending | 6 |
| Failed | 8 |
| Failed in the last seven days | 4 |

The status counts reconcile: 38 + 6 + 8 = 52.

For user ID 3, the query returned 5 total transactions: 3 successful, 2 pending and 0 failed. This provides a concrete check of user-scoped dashboard totals.

The join fan-out diagnostic returned 52 joined rows and 52 distinct transaction IDs, with 0 possible fan-out rows. For the tested `transactions` to `users` join, there is no evidence of duplicated transaction rows inflating the count.

## 5. Performance and connection diagnostics

### 5.1 Connection snapshot

At the time of the captured diagnostic:

- 3 sessions were idle.
- 1 session was active (the diagnostic query itself).
- The application connection appeared as `ledgerly-api` and was idle after executing `SELECT 1`.
- PostgreSQL `max_connections` was 100.
- No active long-running transaction was shown in the transaction-age query.

This snapshot does not indicate connection exhaustion. It is only a point-in-time observation and does not prove that the application can never exhaust its pool under load.

### 5.2 Table statistics

The captured `pg_stat_user_tables` output showed:

| Table | Sequential scans | Rows read by sequential scans | Index scans | Live rows estimate | Dead rows estimate |
|---|---:|---:|---:|---:|---:|
| transactions | 76 | 3,543 | 67 | 52 | 0 |
| users | 50 | 1,028 | 168 | 23 | 11 |

These are cumulative PostgreSQL statistics, not per-request timings. The live-row and dead-row values are estimates from PostgreSQL statistics.

### 5.3 Existing indexes

The database contains indexes relevant to the main access patterns, including:

- `transactions_created_at_idx`
- `transactions_status_created_at_idx`
- `transactions_user_id_created_at_idx`
- `transactions_reference_key`
- `users_email_key`
- `users_is_active_role_idx`
- Primary-key indexes on both tables

The presence of an index does not guarantee the query planner will use it. PostgreSQL chooses a plan based on estimated cost, table size, selectivity and statistics.

### 5.4 EXPLAIN ANALYZE findings

Two representative queries were inspected with `EXPLAIN ANALYZE`.

| Query | Plan observed | Execution time |
|---|---|---:|
| Failed transactions in the last seven days | Sequential scan followed by sort | 0.020 ms |
| Latest transactions for user ID 3, limited to 5 | Sequential scan followed by sort | 0.016 ms |

The failed-transaction query scanned 52 rows, returned 4 and filtered out 48. The user-scoped query scanned 52 rows, returned 5 and filtered out 47.

**Interpretation:** Sequential scans are reasonable for a table containing only 52 rows. The measured execution times are extremely small. These results do not demonstrate a slow-query problem, and they do not justify adding more indexes solely to force index usage. On a much larger production dataset, the same query plans should be re-evaluated with representative data volume and workload.

## 6. Troubleshooting playbook

The captured environment did not show an active database incident. The following is the diagnostic and response procedure to use if the corresponding symptoms occur. These are operational recommendations, not claims that the issues were reproduced during this investigation.

### 6.1 Slow query investigation

**Symptoms:** A dashboard or API endpoint takes unusually long, database CPU rises, or query latency increases.

**Investigation steps:**

1. Identify the slow endpoint and capture the SQL statement and parameters (without logging secrets or sensitive values).
2. Measure query duration and compare it with the normal baseline.
3. Run `EXPLAIN (ANALYZE, BUFFERS)` with representative parameters in a safe environment.
4. Check whether the plan performs large sequential scans, expensive sorts, repeated nested-loop lookups or spills.
5. Check table statistics and whether `ANALYZE`/autovacuum has kept statistics current.
6. Review result size, pagination, N+1 query patterns and unnecessary columns.
7. Add or adjust an index only when the query pattern and measured plan justify it.
8. Re-test with representative data and compare latency before and after the change.

**Remediation options:** Optimize predicates and joins, paginate large result sets, remove N+1 access patterns, maintain statistics, and introduce targeted indexes only when evidence supports them.

### 6.2 Connection exhaustion

**Symptoms:** New requests fail to acquire a database connection, connection errors increase, or active connections approach the configured limit.

**Investigation steps:**

1. Inspect `pg_stat_activity`, grouped by database, user, application name and session state.
2. Compare active, idle and idle-in-transaction sessions with `max_connections`.
3. Identify long-running queries and sessions idle inside open transactions.
4. Check application logs for pool acquisition timeouts and connection errors.
5. Verify that each request releases its connection and that transactions are committed or rolled back.
6. Check whether multiple application replicas have pool limits whose combined maximum exceeds the database connection budget.

**Remediation options:** Fix connection leaks, close transactions promptly, set sensible pool limits and acquisition timeouts, and reserve database capacity for administration and other services. Increasing `max_connections` should not be the first response because each connection consumes database resources.

### 6.3 Connection-pool saturation

**Symptoms:** API requests wait for a connection even though PostgreSQL itself is responsive.

**Investigation steps:**

1. Inspect pool metrics such as total, idle and waiting connections, plus acquisition latency and timeout counts.
2. Compare application pool limits with PostgreSQL connection usage.
3. Look for slow queries or long transactions holding connections.
4. Check whether the application creates a new database client per request instead of reusing a shared client.
5. Review concurrency and replica count.

**Remediation options:** Reuse a singleton Prisma client within the running application process, keep transactions short, tune pool size against the database's total connection budget, and add a pooler such as PgBouncer only if the deployment architecture and workload require it.

## 7. Findings and recommendations

1. No duplicate normalized email addresses were found.
2. Five accounts are inactive; seven users have no transaction records.
3. The database contained 52 transactions when the investigation queries were run: 38 successful, 6 pending and 8 failed. One further pending transaction (`TXN-0053`) was created later during Task 3 Postman testing, so the data snapshot in `sql/04_sample_data_snapshot.sql` holds 53 transactions (38 successful, 7 pending, 8 failed).
4. Four failed transactions fall within the seven-day investigation window. Two have card-decline notes and two have gateway-timeout notes.
5. Dashboard status totals reconcile to the total transaction count.
6. The tested user join does not introduce row fan-out.
7. The captured connection snapshot does not indicate connection exhaustion.
8. The inspected queries execute in approximately 0.02 ms on the current small dataset. Sequential scans are expected at this scale.
9. Performance conclusions should be revisited with production-like data volume and workload before changing indexes or connection settings.
