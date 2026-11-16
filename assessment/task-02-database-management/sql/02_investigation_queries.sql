-- Ledgerly | Task 2: Database investigation queries

-- ---------------------------------------------------------------------------
-- 1. Identify duplicate email addresses.
-- ---------------------------------------------------------------------------
SELECT
    lower(btrim(email)) AS normalized_email,
    COUNT(*) AS duplicate_count,
    ARRAY_AGG(id ORDER BY id) AS user_ids
FROM users
GROUP BY lower(btrim(email))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, normalized_email;

-- ---------------------------------------------------------------------------
-- 2. Find inactive users.
-- ---------------------------------------------------------------------------
SELECT id, name, email, role, is_active, last_login_at, created_at
FROM users
WHERE is_active = FALSE
ORDER BY last_login_at NULLS FIRST, id;

-- Optional alternative: users who have not logged in during the last 30 days.
-- This is an activity definition, not the account-status definition above.
SELECT id, name, email, is_active, last_login_at
FROM users
WHERE last_login_at IS NULL
   OR last_login_at < now() - INTERVAL '30 days'
ORDER BY last_login_at NULLS FIRST, id;

-- ---------------------------------------------------------------------------
-- 3. Find users without transactions.
-- ---------------------------------------------------------------------------
SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at
FROM users AS u
LEFT JOIN transactions AS t ON t.user_id = u.id
WHERE t.id IS NULL
ORDER BY u.id;

-- ---------------------------------------------------------------------------
-- 4. Successful transaction totals per user.
-- ---------------------------------------------------------------------------
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    COUNT(t.id) FILTER (WHERE t.status = 'success') AS successful_transaction_count,
    COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'success'), 0.00) AS successful_transaction_total
FROM users AS u
LEFT JOIN transactions AS t ON t.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY successful_transaction_total DESC, u.id;

-- ---------------------------------------------------------------------------
-- 5. Failed transactions from the last seven days.
-- ---------------------------------------------------------------------------
SELECT
    t.id,
    t.reference,
    t.user_id,
    u.name AS user_name,
    u.email,
    t.amount,
    t.status,
    t.note,
    t.created_at
FROM transactions AS t
JOIN users AS u ON u.id = t.user_id
WHERE t.status = 'failed'
  AND t.created_at >= now() - INTERVAL '7 days'
  AND t.created_at <= now()
ORDER BY t.created_at DESC;

-- ---------------------------------------------------------------------------
-- 6A. Reconcile dashboard transaction counts by status.
-- The admin dashboard's totalCount is COUNT(*) across ALL statuses. Pending
-- and failed counts are separate filtered counts. This query makes the
-- definitions explicit and helps detect accidental status filtering.
-- ---------------------------------------------------------------------------
SELECT
    COUNT(*) AS total_transactions_all_statuses,
    COUNT(*) FILTER (WHERE status = 'success') AS successful_transactions,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_transactions,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_transactions,
    COUNT(*) FILTER (
        WHERE status = 'failed'
          AND created_at >= now() - INTERVAL '7 days'
    ) AS failed_transactions_last_7_days
FROM transactions;

-- ---------------------------------------------------------------------------
-- 6B. Reconcile dashboard counts for one non-admin user.
-- Replace :user_id with an integer ID (for example, 3) when running directly
-- in psql/pgAdmin. This mirrors the user-scoped dashboard totalCount.
-- ---------------------------------------------------------------------------
SELECT
    COUNT(*) AS user_transaction_count,
    COUNT(*) FILTER (WHERE status = 'success') AS successful_count,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_count
FROM transactions
WHERE user_id = 3;

-- ---------------------------------------------------------------------------
-- 6C. Detect join fan-out, a common cause of inflated dashboard totals.
-- Compare the raw transaction count with the joined row count. Joining a
-- one-to-many relation (for example, transactions to multiple child rows)
-- can multiply transaction rows. COUNT(DISTINCT t.id) avoids that inflation.
-- ---------------------------------------------------------------------------
SELECT
    COUNT(*) AS joined_rows,
    COUNT(DISTINCT t.id) AS distinct_transactions,
    COUNT(*) - COUNT(DISTINCT t.id) AS possible_fanout_rows
FROM transactions AS t
JOIN users AS u ON u.id = t.user_id;
