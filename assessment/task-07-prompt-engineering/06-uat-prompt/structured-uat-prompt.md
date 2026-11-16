# Structured Prompt: Generate UAT Test Cases for Ledgerly

## Role

Act as a Senior QA Engineer responsible for designing comprehensive User Acceptance Testing (UAT) test cases for a transaction management application.

## Application context

Application name: Ledgerly

Technology:
- React frontend.
- Node.js (Express) backend API.
- PostgreSQL database.
- Prisma ORM.
- JWT-based authentication (token lifetime 1 hour).

Application functionality:
1. User registration.
2. User login and authentication.
3. Dashboard with transaction summaries.
4. Transaction listing, with search and status filters.
5. Transaction creation.
6. Transaction report: CSV download using the same filters and visibility rules as the list.
7. Administrator-only user listing.
8. Logout and session management.

## Implemented business rules (authoritative)

Treat these rules as the documented requirements. Use them for expected results and boundary values. Do not contradict them and do not add rules that are not listed.

| Area | Rule |
|---|---|
| Roles | `admin` and `user`. Users see and create only their own transactions. Admins see all transactions and all users |
| Transaction amount | Greater than 0, at most 10,000,000, at most 2 decimal places. Currency is INR |
| Transaction note | Optional, at most 120 characters |
| Transaction status | One of `success`, `pending`, `failed`. A new transaction created through the application is `pending` |
| Transaction list filters | Search text at most 100 characters; status filter `all`, `success`, `pending` or `failed` |
| User name | 2 to 100 characters |
| Email | Valid format, at most 254 characters, stored in lowercase, unique |
| Password | 8 to 128 characters, at least one digit |
| Login errors | A wrong password and an unknown email give the same generic message ("Incorrect email or password.") |
| Protected endpoints | No token or an invalid or expired token returns HTTP 401. A valid token without the required role returns HTTP 403 |

Validation messages produced by the application:

| Condition | Message |
|---|---|
| Name shorter than 2 characters | Enter your full name. |
| Name longer than 100 characters | Name is too long. |
| Invalid email | Enter a valid email address. |
| Password shorter than 8 characters | Use at least 8 characters. |
| Password with no digit | Include at least one number. |
| Amount 0 or negative | Amount must be greater than 0. |
| Amount above 10,000,000 | Amount cannot exceed 1,00,00,000. |
| More than 2 decimal places | Use at most 2 decimal places. |
| Note longer than 120 characters | Note can be at most 120 characters. |

## Objective

Generate a structured UAT test suite that validates the application's functional behavior, business rules, data validation, security and user permissions.

## Required test categories

### 1. Positive scenarios

Examples:
- Register with valid information.
- Login with valid credentials.
- Load dashboard for a user with transactions.
- Create a valid transaction.
- View authorized transaction records.
- Download the transaction report.
- Administrator accesses user listing.

### 2. Negative scenarios

Examples:
- Register with an existing email.
- Register with an invalid email.
- Login with an incorrect password.
- Login with an unknown email.
- Submit a transaction with a negative amount.
- Access protected resources without authentication.

### 3. Boundary scenarios

For every numeric or length rule in the table above, include the value just below the limit, the value at the limit and the value just above it, wherever those values are valid inputs. For example, for the amount: 0, 0.01, 10,000,000 and 10,000,000.01. Also include:
- Empty required fields.
- Dashboard for a user with zero transactions.

Do not invent limits. Raise a requirement gap only for a field that is not covered by the rules above.

### 4. Permission-based scenarios

Examples:
- Administrator accesses user listing.
- Regular user attempts to access administrator-only functionality.
- Unauthenticated user attempts to access protected resources, including the report download.
- User attempts to view another user's transactions.

### 5. Session management scenarios

Examples:
- Successful logout.
- Browser Back after logout.
- Refreshing a protected page without a session.
- Expired or invalid JWT token.

## Required output columns

| Column | Description |
|---|---|
| Test Case ID | Unique identifier |
| Category | Positive, Negative, Boundary or Permission |
| Test Scenario | What is being tested |
| Preconditions | Required setup |
| Test Steps | Ordered execution instructions |
| Test Data | Input values |
| Expected Result | Expected application behavior, using the messages and status codes above |
| Actual Result | Leave blank for execution |
| Status | Default to Not Run |
| Remarks | Additional information |

## Test case ID convention

Use the prefix `GEN-` so these generated cases never clash with the executed `UAT-` cases:
- GEN-REG for registration.
- GEN-AUTH for authentication.
- GEN-DASH for dashboard.
- GEN-TRN for transactions.
- GEN-RPT for the transaction report.
- GEN-PERM for permissions.
- GEN-SES for session management.

Assign sequential numbers within each functional area (for example GEN-TRN-001).

## Quality requirements

- Avoid duplicate test cases.
- Keep each test case independently executable.
- Include both UI and API validation where relevant.
- Provide realistic test data, and state exact values for boundary cases (for example "Name of 100 characters", not "a long name").
- Do not assume features that are not part of the application.
- Do not invent undocumented validation rules.
- List requirement gaps separately, and only for behavior not defined above.
- Ensure expected results are measurable and testable.
- Leave actual results blank until execution.
- Set all initial statuses to Not Run.

## Final output

1. Brief test coverage summary (counts per category that add up to the total).
2. Categorized UAT test case table.
3. Identified requirement gaps and assumptions.
4. Suggested evidence to capture for each category.

The output must be suitable for a formal client UAT assessment.
