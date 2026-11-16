# Ledgerly — Task 3: API Development and Testing Report

## 1. Scope

The Ledgerly REST API was tested with Postman (collection `postman/Ledgerly.postman_collection.json`, environment `postman/Ledgerly Local.postman_environment.json`). Coverage:

| Required API | Requests |
|---|---|
| User registration | 08 (success), 09 (duplicate email), 10 (invalid input), 11 (new token works) |
| User login | 02 (admin), 14 (regular user), 17/18 (failure scenario F1) |
| User listing | 07 (admin), 15 (regular user denied) |
| Transaction creation | 06 (valid), 13 (invalid amount) |
| Transaction listing | 05 |
| Supporting | 01 health, 03 current user, 04 dashboard, 12 no token, 16 CSV report export |
| Introduced failures | 17–20 (scenarios F1 and F2, section 5) |

## 2. Environment

| Item | Value |
|---|---|
| Client | Postman |
| Base URL | `http://localhost:8080` (Nginx in front of the API) |
| Authentication | Bearer JWT (HS256) |
| Test accounts | Seeded admin and regular user (see the Postman environment) |
| Test date | 17 November 2026 |

## 3. Execution results

### 3.1 Requests with captured Postman evidence

| ID | Collection request | Scenario | Expected | Observed | Result | Evidence |
|---|---|---|---:|---:|---|---|
| API-01 | 01 | Health liveness | 200 | 200 | PASS | `01-health-liveness.png` |
| API-02 | 02 | Admin login | 200 | 200 | PASS | `02-admin-login.png` |
| API-03 | 03 | Current authenticated user | 200 | 200 | PASS | `03-current-user.png` |
| API-04 | 04 | Dashboard summary | 200 | 200 | PASS | `04-dashboard-summary.png` |
| API-05 | 05 | List transactions | 200 | 200 | PASS | `05-list-transactions.png` |
| API-06 | 06 | Create transaction | 201 | 201 | PASS | `06-create-transaction.png` |
| API-07 | 07 | List users as admin | 200 | 200 | PASS | `07-list-users-admin.png` |
| NEG-01 | 12 | Dashboard without bearer token | 401 | 401 | PASS | `08-unauthenticated-dashboard-401.png` |
| NEG-02 | 13 | Create transaction with negative amount | 400 | 400 | PASS | `09-invalid-transaction-400.png` |
| AUTH-01 | 14 | Regular-user login | 200 | 200 | PASS | `10-regular-user-login.png` |
| RBAC-01 | 15 | Regular user requests admin user listing | 403 | 403 | PASS | `11-rbac-user-forbidden-403.png` |

### 3.2 Requests added after the first test session

| ID | Collection request | Scenario | Expected | Status |
|---|---|---|---:|---|
| REG-01 | 08 | Register a new user (unique email generated per run) | 201, role `user`, no `passwordHash` | Defined in the collection |
| REG-02 | 09 | Register the same email again | 409 `CONFLICT` with an email field error | Defined in the collection |
| REG-03 | 10 | Register with an invalid email and a short password | 400 `VALIDATION_ERROR` for both fields | Defined in the collection |
| REG-04 | 11 | `GET /api/auth/me` with the token returned by registration | 200 | Defined in the collection |
| RPT-01 | 16 | `GET /api/transactions/export` as admin | 200, `text/csv`, attachment | Defined in the collection |
| F1-R / F1-F | 17 / 18 | Failure scenario F1 | 400 then 200 | Reproduced by script (section 5)|
| F2-R / F2-F | 19 / 20 | Failure scenario F2 | 401 then 200 | Reproduced by script (section 5)|


## 4. Notable response observations

- Health endpoint returned `{"status":"ok"}`.
- Admin login returned an access token and an admin user profile.
- `/api/auth/me` returned the authenticated admin profile.
- Dashboard returned `scope: all` and a 14-entry daily series, matching the collection assertions.
- Transaction listing returned a paginated `items` array.
- Transaction creation returned `201 Created` and reference `TXN-0053` for amount `123.45`, status `pending`.
- Admin user listing returned user records including `transactionCount`.
- Unauthenticated dashboard access returned `401 Unauthorized` with code `UNAUTHORIZED`.
- Negative transaction amount returned `400 Bad Request` with code `VALIDATION_ERROR` and the detail `Amount must be greater than 0.`
- A regular user requesting `GET /api/users` received `403 Forbidden` with code `FORBIDDEN`.

## 5. Introduced API failure scenarios

Two faults were deliberately introduced and investigated using the same method: reproduce, investigate, root cause, fix, verify. They are scripted in `scripts/failure-scenarios.mjs` (repeatable) and defined as Postman requests 17–20. Output of the run on 17 November 2026: `evidence/failure-scenarios-output.txt`.

### F1 — Login returns 400 "Enter your email" although the body contains an email

| Step | Detail |
|---|---|
| Reproduce | `POST /api/auth/login` with the correct JSON body but `Content-Type: text/plain` (in Postman: Body type set to Text). Response: `400 VALIDATION_ERROR` with `fieldErrors: { email: ["Enter your email."], password: ["Enter your password."] }`. |
| Investigate | The error claims both fields are missing, yet the request body shows both. The validator reports what it received, so the body reached the validator empty. In `backend/src/app.ts`, `express.json()` only parses bodies whose `Content-Type` is JSON; for any other type `req.body` stays undefined. `parseInput()` in `backend/src/lib/http.ts` then validates `{}`. |
| Root cause | Client-side: missing or incorrect `Content-Type: application/json` header. The API is behaving as designed, but the message does not hint at the real cause. |
| Fix | Send `Content-Type: application/json` (Postman: Body > raw > JSON). |
| Verify | The same payload with the correct header returns `200` (request 18). |
| Prevention | Collection requests use raw JSON bodies. Optional improvement: return a 415 or a hint when the content type is not JSON. |

### F2 — Authenticated requests return 401 "session has expired" with a token that has not expired

| Step | Detail |
|---|---|
| Reproduce | `GET /api/dashboard` with a token signed with a different secret from the API's `JWT_SECRET`, as happens after a secret rotation or when a token from another environment is reused. Response: `401 UNAUTHORIZED` "Your session has expired. Please sign in again." Postman request 19 reproduces it by altering the signature of the admin token. |
| Investigate | Decoded the token (header and payload are Base64URL JSON): algorithm HS256, issuer `ledgerly-api`, audience `ledgerly-web`, expiry one hour ahead. Every claim is valid and unexpired. A token issued by a fresh login has identical claims and is accepted. The 401 text is generic: `backend/src/middleware/authenticate.ts` maps every verification failure to the same message. |
| Root cause | Signature verification failure: the token was signed under a different `JWT_SECRET` than the one the API runs with. |
| Fix | Sign in again to get a token signed with the current secret (request 02, then request 20). Do not move tokens between environments. After any `JWT_SECRET` change in `.env`, restart the API and expect all existing sessions to be invalidated. |
| Verify | `GET /api/dashboard` with the new token returns `200`. |
| Prevention | Treat `JWT_SECRET` rotation as a planned change with a user-communication step. Optional improvement: log the specific verification error server-side. |

### Optional scenario F3 — Login blocked with 429

`INCLUDE_RATE_LIMIT=1 node scripts/failure-scenarios.mjs` sends 11 failed logins. The endpoint then returns `429 RATE_LIMITED` even for the correct password until the 15-minute window passes or the API restarts. It is not part of the default run because it locks login for the tester's IP.

## 6. Security and test-data notes

- Login responses contain a JWT. Evidence copies redact the token. Do not attach or publish screenshots or Postman exports containing live bearer tokens, passwords or secrets.
- The create-transaction test inserted `TXN-0053` (amount `123.45`, status `pending`). Each run of request 08 also creates one new user. Account for this test data when reconciling counts.
- Registration is limited to 20 requests per hour per IP, and failed logins to 10 per 15 minutes, so repeated collection runs can return 429. Use a local assessment database for repeat runs.
- If a token shown in an unredacted screenshot was shared outside the trusted assessment context, invalidate it by rotating the JWT signing secret and restarting the API.

## 7. Evidence

`evidence/` contains the 11 Postman screenshots listed in section 3.1, plus `failure-scenarios-output.txt` (scripted run of scenarios F1 and F2). Screenshots for requests 08–11 and 16–20 are to be added after they are run in Postman.

## 8. Conclusion

All API endpoints required by Task 3 (registration, login, user listing, transaction creation and listing) are implemented and have test requests. Eleven requests were executed in Postman and passed; the remaining requests are ready to run. Two API failure scenarios were introduced, investigated to root cause and resolved, and they are scripted so they can be reproduced live during the technical demonstration. This report does not claim a full Collection Runner export or a load test.
