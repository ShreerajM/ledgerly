# Ledgerly User Training Guide

## 1. Overview

Ledgerly is a transaction management application with user registration and login, a dashboard, transaction listing and creation, and role-based access. The exact screens and available fields may vary by deployed build.

## 2. Sign in

1. Open the Ledgerly application URL provided by your administrator.
2. Enter your registered email address and password.
3. Select **Login**.
4. If sign-in fails, check the email and password and try again. If the problem continues, contact your administrator or support team.

Never share your password or authentication token.

## 3. Register an account

If self-registration is enabled:

1. Open the registration page.
2. Enter the requested details.
3. Use a valid email address and a password that meets the application's validation rules.
4. Submit the form.
5. Sign in after registration completes.

If registration is disabled or unavailable, ask the client administrator to arrange access.

## 4. Understand the dashboard

1. After signing in, open the dashboard.
2. Review the transaction totals and status breakdown displayed.
3. Use the transaction list as the source for checking individual records.
4. If a total appears incorrect, record the signed-in user, time, visible dashboard values and relevant transaction IDs, then report the discrepancy.

Dashboard figures should be compared using the same user scope, date range and status rules. Do not assume that totals from different filters are directly comparable.

## 5. View transactions

1. Open the Transactions section.
2. Review the available transaction records.
3. Use available search, filter or pagination controls if present.
4. Open or inspect a record to verify its details, where the interface supports it.
5. Report missing, duplicated or unexpected records to the administrator.

Users should only access transaction data permitted by their role.

### Download a transaction report

1. Open the Transactions section.
2. Optionally search or choose a status (All, Success, Pending, Failed) to narrow the report.
3. Select **Download report**.
4. Open the downloaded CSV file in Excel or Google Sheets. It lists the reference, customer, amount, status, note and creation time (UTC) of every matching transaction.

Regular users receive only their own transactions; administrators receive all transactions. Do not share the file outside your organization, because it contains financial records.

## 6. Create a transaction

1. Open the transaction creation action.
2. Enter the required transaction details.
3. Enter a valid positive amount.
4. Review the information before submitting.
5. Submit once and wait for confirmation.
6. Return to the transaction list and confirm that the new record appears.
7. Keep the transaction ID for reference if the application displays one.

Do not repeatedly submit when the page appears slow. First check whether the transaction was already created.

## 7. Roles and permissions

- **Administrator:** can access administrator-only user listing/management functions available in the deployed build.
- **Regular user:** can use permitted application workflows but cannot access administrator-only user information.

If you believe you need additional access, request it from the client administrator. Do not attempt to bypass permission restrictions.

## 8. Logout and session safety

1. Use the application's **Logout** action when finished.
2. Confirm that the application returns to the login screen.
3. Close the browser when using a shared device.
4. Do not save passwords on public or shared computers.
5. If the application unexpectedly displays a login screen, sign in again. If the issue repeats, contact support.

## 9. Common issues

| Issue | What to do |
|---|---|
| Login rejected | Check the email and password; confirm your account is active with the administrator. |
| Dashboard does not load | Refresh once. If it persists, note the time and contact support. |
| Transaction not visible | Check filters and pagination; verify whether submission succeeded before retrying. |
| Access denied | Confirm that your account has the required role; ask the administrator. |
| Session ended | Sign in again. |
| Unexpected totals | Capture the dashboard values and relevant transaction IDs for reconciliation. |

## 10. Good operating practices

- Use your own account.
- Verify transaction details before submission.
- Avoid duplicate submissions.
- Log out on shared devices.
- Report suspicious activity or unexpected access promptly.
- Include the time, screen, action and any transaction ID when reporting an issue.
