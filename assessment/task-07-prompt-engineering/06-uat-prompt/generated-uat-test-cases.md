# Ledgerly – Generated UAT Test Suite

Test case IDs use the `GEN-` prefix so they do not clash with the executed Task 6 cases (`UAT-…`). Boundary values are taken from the implemented validation rules (see section 3).

## 1. Test coverage summary

| Category | Test cases |
|---|---:|
| Positive | 9 |
| Negative | 9 |
| Boundary | 11 |
| Permission | 5 |
| **Total** | **34** |

Session-management cases are counted under Positive, Negative or Permission according to their expected outcome.

## 2. UAT test cases

| Test Case ID | Category | Test Scenario | Preconditions | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| GEN-REG-001 | Positive | Register a new user | Email not registered | Valid name, email and password (8+ characters, one digit) | Account created successfully | | Not Run |
| GEN-REG-002 | Negative | Register with existing email | Account already exists | Existing email | Registration rejected (HTTP 409) | | Not Run |
| GEN-REG-003 | Negative | Register with invalid email | Registration page available | `invalid-email` | Validation message displayed | | Not Run |
| GEN-REG-004 | Boundary | Name below minimum length | Registration page available | Name of 1 character | Rejected: "Enter your full name." | | Not Run |
| GEN-REG-005 | Boundary | Name at minimum length | Email not registered | Name of 2 characters | Account created | | Not Run |
| GEN-REG-006 | Boundary | Name at maximum length | Email not registered | Name of 100 characters | Account created | | Not Run |
| GEN-REG-007 | Boundary | Name above maximum length | Registration page available | Name of 101 characters | Rejected: "Name is too long." | | Not Run |
| GEN-AUTH-001 | Positive | Login with valid credentials | Registered active account | Valid email and password | Login successful | | Not Run |
| GEN-AUTH-002 | Negative | Login with incorrect password | Registered account | Incorrect password | Login rejected with the generic message "Incorrect email or password." | | Not Run |
| GEN-AUTH-003 | Negative | Login with unknown email | Login page available | Unregistered email | Same generic rejection as for a wrong password | | Not Run |
| GEN-DASH-001 | Positive | Verify dashboard totals | User has transactions | Existing transaction records | Dashboard totals match source records | | Not Run |
| GEN-DASH-002 | Positive | Verify status breakdown | Records with different statuses | Successful, pending and failed records | Status totals match records and sum to the total | | Not Run |
| GEN-DASH-003 | Boundary | Dashboard with zero transactions | User has no transactions | Empty transaction history | Dashboard displays zero/empty values | | Not Run |
| GEN-TRN-001 | Positive | View transaction list | User has transactions | Existing records | Authorized records displayed | | Not Run |
| GEN-TRN-002 | Positive | Create a transaction | Authenticated user | Amount 123.45, short note | Transaction created (HTTP 201), status pending | | Not Run |
| GEN-TRN-003 | Negative | Submit negative transaction amount | Authenticated user | Amount: -100 | Rejected: "Amount must be greater than 0." | | Not Run |
| GEN-TRN-004 | Boundary | Submit zero transaction amount | Authenticated user | Amount: 0 | Rejected: "Amount must be greater than 0." | | Not Run |
| GEN-TRN-005 | Boundary | Submit minimum permitted amount | Authenticated user | Amount: 0.01 | Transaction accepted | | Not Run |
| GEN-TRN-006 | Boundary | Submit maximum permitted amount | Authenticated user | Amount: 10000000 | Transaction accepted | | Not Run |
| GEN-TRN-007 | Negative | Submit missing transaction fields | Authenticated user | Amount omitted | Validation prevents submission | | Not Run |
| GEN-TRN-008 | Boundary | Submit amount just above maximum | Authenticated user | Amount: 10000000.01 | Rejected: amount cannot exceed 1,00,00,000 | | Not Run |
| GEN-TRN-009 | Boundary | Note at maximum length | Authenticated user | Note of 120 characters | Transaction accepted | | Not Run |
| GEN-TRN-010 | Boundary | Note above maximum length | Authenticated user | Note of 121 characters | Rejected: note can be at most 120 characters | | Not Run |
| GEN-RPT-001 | Positive | Download the transaction report | Authenticated user with transactions | Click Download report with no filters | CSV file `ledgerly-transactions-<date>.csv` downloads (HTTP 200, `text/csv`) with the header Reference, Customer, Amount (INR), Status, Note, Created at (UTC) and one row per visible transaction | | Not Run |
| GEN-RPT-002 | Positive | Report respects the list filters | Records with different statuses | Status filter `failed`, then download | Only failed transactions are in the CSV, matching the filtered list | | Not Run |
| GEN-PERM-001 | Permission | Admin accesses user listing | Admin account | Admin credentials | User listing accessible | | Not Run |
| GEN-PERM-002 | Permission | Regular user accesses admin functionality | Regular account | Regular user credentials | Access denied (HTTP 403) | | Not Run |
| GEN-PERM-003 | Permission | Access protected resource without login | No active session | No authentication token | HTTP 401 or login redirect | | Not Run |
| GEN-PERM-004 | Permission | Access another user's transactions | Two user accounts | User B attempts to access User A's data | Only User B's own records are returned | | Not Run |
| GEN-RPT-003 | Permission | Report requires authentication | No active session | `GET /api/transactions/export` with no token | HTTP 401 and no CSV content | | Not Run |
| GEN-SES-001 | Positive | Logout | Authenticated user | Valid session | Session cleared and user logged out | | Not Run |
| GEN-SES-002 | Negative | Browser Back after logout | User has logged out | Browser Back action | Protected content remains inaccessible | | Not Run |
| GEN-SES-003 | Negative | Invalid JWT token | Protected API endpoint | Invalid token | HTTP 401 Unauthorized | | Not Run |
| GEN-SES-004 | Negative | Expired JWT token | Protected API endpoint | Expired token | HTTP 401 Unauthorized | | Not Run |

## 3. Business rules used for boundary tests

These limits are enforced by the implemented validation (Zod schemas in `backend/src/modules/*/*.schemas.ts`) and by database CHECK constraints (`backend/prisma/migrations/`):

| Field | Rule |
|---|---|
| Transaction amount | Greater than 0, at most 10,000,000, at most 2 decimal places |
| Transaction note | At most 120 characters |
| User name | 2 to 100 characters |
| Email | Valid format, at most 254 characters, stored in lowercase |
| Password | 8 to 128 characters, at least one digit |

## 4. Suggested evidence

| Category | Evidence |
|---|---|
| Positive | Successful registration, login and transaction creation screenshots |
| Negative | Validation messages and rejected API responses |
| Boundary | Input values and corresponding validation responses |
| Permission | Admin and regular user access comparison |
| Session | Logout, browser navigation and invalid token responses |
