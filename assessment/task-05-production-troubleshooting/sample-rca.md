# Sample Root Cause Analysis (RCA)

## Incident
Ledgerly dashboard returned HTTP 500 due to an unexpected dashboard-service exception.

## Classification
Controlled assessment simulation, not a real customer production incident.

## Summary
A deliberate exception was inserted into the dashboard service. An authenticated `GET /api/dashboard` request returned HTTP 500. Centralized error middleware returned a sanitized response and logged the exception with a request ID. Removing the temporary exception and rebuilding the API restored the dashboard.

## Impact
During the simulation, dashboard requests failed. No database records were intentionally changed. No real customer impact is claimed.

## Timeline
| Stage | Detail |
|---|---|
| Reproduction | Temporary `SIMULATED_INTERNAL_SERVER_ERROR` exception added to dashboard service |
| Detection | Authenticated dashboard request returned HTTP 500 / `INTERNAL_ERROR` |
| Investigation | API logs searched using request ID `5aa7620d77759bb2f109d03f1c447931` |
| Root cause | Stack identified `dashboard.service.ts:26`; log recorded status 500 |
| Resolution | Temporary exception removed and API rebuilt |
| Verification | Dashboard request returned HTTP 200 with dashboard data |

## Technical root cause
The dashboard service threw an unexpected JavaScript error. The centralized handler mapped it to HTTP 500, code `INTERNAL_ERROR`, and message `Something went wrong on our side.` The server log retained the stack and request ID; the authorization header was redacted.

## Contributing factors
The injected fault was deliberately placed in a critical dashboard path. No other production defect was established by this test.

## Resolution
Removed the temporary exception and rebuilt/redeployed the API container. A subsequent dashboard request succeeded with HTTP 200.

## What went well
- Centralized middleware prevented stack details reaching the client.
- Request ID enabled correlation between response and server logs.
- The failure was reversible and did not require database changes.

## Corrective and preventive actions
| Action | Priority |
|---|---|
| Verify temporary fault-injection code is removed before commit/release | High |
| Add/retain automated dashboard route tests for unexpected service errors | Medium |
| Alert on elevated dashboard HTTP 500 rate | Medium |
| Include request ID in support and incident workflow | Medium |
| Verify dashboard endpoint after each deployment | High |

## Verification
Recovery returned HTTP 200 with populated dashboard data. Supporting evidence should include the failure response, correlated logs and successful recovery response.

## Lessons learned
A generic client error can remain diagnosable when server logs retain stack traces and request IDs. Protect implementation details without sacrificing operational observability.
