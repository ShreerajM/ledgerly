# Ledgerly Client Onboarding Guide

## 1. Purpose

This guide helps a client administrator prepare Ledgerly for use, confirm access, and support the initial rollout.

## 2. Before onboarding

Confirm the following with the implementation team:

- The agreed Ledgerly environment and application URL.
- The deployed application version and planned go-live date.
- The client administrator contact.
- The list of users who need access and their intended roles.
- The approved test or opening transaction data.
- The support contact and escalation route.

Do not send passwords or tokens in plain email or chat.

## 3. Environment access

1. Open the Ledgerly URL supplied by the implementation team.
2. Confirm that the login page loads.
3. Use the administrator account provisioned through the agreed secure process.
4. Confirm that the administrator can sign in and access the functions permitted to that role.
5. Ask a regular user to sign in and confirm that their access is appropriately restricted.

For the assessed local deployment, the web application was exposed at `http://localhost:8080`. This is a local assessment URL, not a production client URL. Use the actual client environment URL for onboarding.

## 4. User setup

1. Agree the user list with the client owner.
2. Confirm each user's name, business email and required role.
3. Create accounts using the registration workflow or the approved administrator process available in the deployed build.
4. Ask each user to sign in and verify access.
5. Remove or disable access through the approved process when a user leaves or no longer requires access, if that capability is available in the deployed version.

Use named accounts. Do not share one login among multiple employees.

## 5. Initial validation

Complete these checks with the client:

- A new user can register where self-registration is enabled.
- Existing users can log in with valid credentials.
- Invalid credentials are rejected.
- Dashboard totals reconcile with agreed sample transactions.
- Users can view their permitted transaction records.
- A valid transaction can be created and appears in the list.
- Invalid transaction input is rejected.
- Administrator-only user management is unavailable to regular users.
- Logout returns the user to the login screen and protected pages require authentication again.

Record any mismatch in the UAT checklist and defect log.

## 6. Go-live readiness

Before enabling wider use, confirm:

- UAT results and client sign-off are recorded.
- No unresolved critical issue remains.
- User access and roles have been reviewed.
- Client users have completed basic training.
- Support and escalation contacts are known.
- Backup, recovery and operational ownership have been agreed with the service owner.
- Any out-of-scope or unavailable feature is documented.

## 7. Handover information

Provide the client with:

- Application URL and environment name.
- User access instructions.
- Administrator and support contact details.
- User training guide.
- Known limitations and agreed workarounds.
- UAT report and sign-off record.
- Incident reporting and escalation procedure.

## 8. Onboarding completion

The onboarding is complete when the client administrator confirms access, nominated users can sign in, core workflows have been demonstrated, training has been delivered, and outstanding issues have owners and target dates.
