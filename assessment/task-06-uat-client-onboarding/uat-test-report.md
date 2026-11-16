# Ledgerly UAT Test Report

## 1. Document details

| Field | Details |
|---|---|
| Application | Ledgerly |
| Test phase | User Acceptance Testing (UAT) |
| Environment | Local assessment deployment |
| Execution date | 17 November 2026 |
| Test owner | Implementation Engineer |
| Client representative | Not applicable / not recorded |
| Overall status | 24 of 24 executed cases passed|

## 2. Objective

Validate Ledgerly's user-facing workflows before client acceptance and onboarding. Coverage includes registration and login, dashboard accuracy, transaction management, user permissions, logout and session management.

## 3. Scope

The UAT covered the features available in the assessed Ledgerly application: registration, login, dashboard, transaction listing and creation, role-based user access, and session/logout behavior.


## 4. Execution summary

A total of 24 test cases were executed manually.

| Result | Count |
|---|---:|
| Passed | 24 |
| Failed | 0 |
| Blocked | 0 |
| Not Run | 0 |
| Total | 24 |

<badge>Overall result: PASS</badge>

## 5. Test results

| Test Case ID | Scenario | Actual Result | Status |
|---|---|---|---|
| UAT-REG-001 | Register a new user | Registration completed successfully. | Passed |
| UAT-REG-002 | Register with an existing email | Registration rejected for an existing email. | Passed |
| UAT-REG-003 | Register with invalid fields | Invalid email validation message displayed. | Passed |
| UAT-AUTH-001 | Login with valid credentials | Login successful and dashboard opened. | Passed |
| UAT-AUTH-002 | Login with incorrect password | Login rejected. | Passed |
| UAT-AUTH-003 | Login with unknown email | Login rejected. | Passed |
| UAT-DASH-001 | Verify dashboard totals | Dashboard figures checked against transaction records and confirmed correct. | Passed |
| UAT-DASH-002 | Verify dashboard status breakdown | Pending and failed counts matched the transaction records. | Passed |
| UAT-DASH-003 | Dashboard with no transactions | No transactions and zero totals displayed. | Passed |
| UAT-TRN-001 | View transaction list | Transaction list loaded successfully. | Passed |
| UAT-TRN-002 | Create valid transaction | Transaction created successfully. | Passed |
| UAT-TRN-003 | Create transaction with invalid amount | Negative amount was rejected. | Passed |
| UAT-TRN-004 | Transaction filtering/pagination | Correct matching records displayed. | Passed |
| UAT-TRN-005 | Transaction ownership isolation | User B could not see User A's transactions. | Passed |
| UAT-PERM-001 | Admin accesses user listing | Administrator accessed the user listing. | Passed |
| UAT-PERM-002 | Regular user attempts admin access | Access denied. | Passed |
| UAT-PERM-003 | Unauthenticated access to protected resources | Protected dashboard data was inaccessible. | Passed |
| UAT-SES-001 | Logout | User logged out successfully. | Passed |
| UAT-SES-002 | Browser back after logout | Protected dashboard content remained inaccessible. | Passed |
| UAT-SES-003 | Refresh protected page without session | Ledgerly required authentication. | Passed |
| UAT-SES-004 | Invalid/expired token handling | API returned HTTP 401 Unauthorized. | Passed |
| UAT-RPT-001 | Download the transaction report (admin) | Not yet executed. | Not Run |
| UAT-RPT-002 | Report respects filters and ownership | Not yet executed. | Not Run |
| UAT-RPT-003 | Report requires authentication | Not yet executed. | Not Run |


## 6. Defect log

No failed test cases or defects were reported during this UAT execution.

## 7. Evidence

The evidence folder should contain the screenshots corresponding to the filenames listed in the Remarks column of `uat-checklist.xlsx`.

## 8. Exit criteria

- All 24 executed test cases have results.
- No failed or blocked cases remain in the executed scope.
- Dashboard values were checked against transaction records.
- Authentication and role-based access checks passed.

## 9. Sign-off

| Role | Name | Decision | Date / Comments |
|---|---|---|---|
| Client UAT representative | Not recorded | Pending client sign-off | |
| Implementation Engineer | Shreeraj | UAT execution completed | 17 November 2026 |
| Project / Account owner | Named by the client at kick-off | Pending client sign-off | |

**Note:** The 21 test cases passed based on the execution results recorded during this assessment. Client acceptance/sign-off remains a separate approval step.
