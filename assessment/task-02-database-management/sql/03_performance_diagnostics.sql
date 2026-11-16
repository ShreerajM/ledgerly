-- Ledgerly | Task 2: PostgreSQL performance and connection diagnostics

-- 1. Current server and database context.
SELECT current_database() AS database_name,
       current_user AS connected_user,
       version() AS postgres_version,
       current_setting('TimeZone') AS session_timezone;

-- 2. Current connection usage by database and state.
SELECT datname,
       state,
       COUNT(*) AS connection_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY datname, state
ORDER BY connection_count DESC;

-- 3. Inspect active sessions, query age, wait events and query text.
-- Avoid sharing query text publicly if it can contain sensitive literals.
SELECT pid,
       usename,
       application_name,
       client_addr,
       state,
       wait_event_type,
       wait_event,
       now() - query_start AS query_age,
       LEFT(query, 500) AS query_excerpt
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid()
ORDER BY query_start NULLS LAST;

-- 4. Detect long-running transactions, including idle-in-transaction sessions.
SELECT pid,
       usename,
       application_name,
       state,
       now() - xact_start AS transaction_age,
       now() - state_change AS state_age,
       wait_event_type,
       wait_event,
       LEFT(query, 500) AS query_excerpt
FROM pg_stat_activity
WHERE datname = current_database()
  AND xact_start IS NOT NULL
ORDER BY xact_start;

-- 5. Table-level read/write and sequential-scan indicators.
-- Small demo tables may legitimately use sequential scans; interpret with table size.
SELECT relname AS table_name,
       seq_scan,
       seq_tup_read,
       idx_scan,
       idx_tup_fetch,
       n_live_tup,
       n_dead_tup,
       last_analyze,
       last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- 6. Index usage and size.
SELECT t.relname AS table_name,
       i.relname AS index_name,
       s.idx_scan,
       pg_size_pretty(pg_relation_size(i.oid)) AS index_size
FROM pg_stat_user_indexes AS s
JOIN pg_class AS t ON t.oid = s.relid
JOIN pg_class AS i ON i.oid = s.indexrelid
JOIN pg_namespace AS n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
ORDER BY t.relname, i.relname;

-- 7. EXPLAIN the failed-transaction lookup used by Task 2.
-- EXPLAIN (ANALYZE, BUFFERS) executes the SELECT; use only on safe read queries.
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, reference, user_id, amount, status, created_at
FROM transactions
WHERE status = 'failed'
  AND created_at >= now() - INTERVAL '7 days'
  AND created_at <= now()
ORDER BY created_at DESC;

-- 8. EXPLAIN the per-user newest-first transaction lookup.
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, reference, user_id, amount, status, created_at
FROM transactions
WHERE user_id = 3
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- 9. Inspect configured connection limits.
SELECT name, setting, unit, source
FROM pg_settings
WHERE name IN ('max_connections', 'superuser_reserved_connections',
               'statement_timeout', 'idle_in_transaction_session_timeout')
ORDER BY name;

-- Application-side pool statistics are not visible in pg_stat_activity as a
-- complete pg.Pool snapshot. Ledgerly exposes pool max/total/idle/waiting via
-- GET /api/health/ready; compare that endpoint with the server-side sessions.
