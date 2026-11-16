# Ledgerly Web (React + Vite)

Ledgerly web frontend (React + Vite). It talks to the Ledgerly REST API in `../backend`
(proxied through Vite in development). A built-in mock API with the same response shapes lets the UI run with no backend.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to the backend on :4000 (start it first)
npm run build      # production build in dist/
npm run preview    # serve dist/ locally
npm test           # Vitest + Testing Library UI tests (mock API)
npm run lint       # Oxlint
```

Requires Node.js 22.22 or newer (React Router 8 needs it). Check with `node -v`.

### Demo accounts (seeded database and mock mode)
| Role  | Email               | Password       |
|-------|---------------------|----------------|
| Admin | asha@example.com    | Admin@123      |
| User  | meera@example.com   | Password@123   |

## Real backend or mock
The dev default is the real backend: start it first (see `../backend/README.md`), then `npm run dev`.
Vite proxies `/api` to `http://localhost:4000` (override with `VITE_PROXY_TARGET`).
To work on the UI alone, set `VITE_USE_MOCK=true` in `.env.development` (or `.env.local`); the tests always use the mock.

In production, Nginx serves `dist/` and forwards `/api` to the backend, so the base path stays `/api`.

## Roles
- **Admin**: sees every transaction and the global dashboard, opens the Users page, can make a user an admin (or back to user) and activate or deactivate accounts.
- **User**: sees only their own transactions and dashboard, can create transactions for themselves, cannot open `/users` (403 page).
- Public sign-up always creates a **User**. The role is never sent from the browser.
- No invite or email flow: an admin promotes people from the Users page.

## API contract the UI expects
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | public | `{email,password}` returns `{token,user}` |
| POST | `/api/auth/register` | public | `{name,email,password}` returns `{token,user}`; 409 if the email exists |
| GET | `/api/dashboard` | signed in | totals scoped to the caller (all data for admin, own data for user) |
| GET | `/api/transactions?q&status&page&pageSize` | signed in | returns `{items,total,page,pageSize}` |
| POST | `/api/transactions` | signed in | `{amount,note,customerId?}`; amount > 0 and <= 10,000,000; `customerId` honoured for admins only |
| GET | `/api/users?q&role&status&page&pageSize` | admin | adds `transactionCount` per user |
| PATCH | `/api/users/:id/role` | admin | `{role:'admin'\|'user'}`; cannot target yourself |
| PATCH | `/api/users/:id/status` | admin | `{isActive:boolean}`; cannot target yourself |

Auth is `Authorization: Bearer <JWT>`. A 401 clears the session and returns to the sign-in page.
Errors use `{ "error": { "message": "..." } }`. The full response shapes are in `src/lib/mock.js`.

## Stack (versions checked against the npm registry and official docs on 13 Nov 2026)
| Package | Version | Why / what the docs say |
|---|---|---|
| vite | 8.3.8 | Rolldown + Oxc based; needs Node 20.19+ / 22.12+ |
| @vitejs/plugin-react | 6.3.0 | Oxc based Fast Refresh; peer `vite ^8` |
| react, react-dom | 19.3.1 | 19.3 made `<ViewTransition>` and Fragment refs stable; this app uses React 19 `<title>` tags and `ref` as a prop |
| react-router | 8.5.1 | Data mode: `createBrowserRouter` from `react-router`, `RouterProvider` from `react-router/dom`; needs Node 22.22+ and React 19.2.7+ |
| @tanstack/react-query | 5.107.1 | v5 object syntax, `queryOptions`, `placeholderData: keepPreviousData` |
| tailwindcss, @tailwindcss/vite | 4.3.5 | CSS-first config (`@import "tailwindcss"`, `@theme`), no `tailwind.config.js` |
| lucide-react | 1.72.0 | v1: brand icons removed (none used), icons are `aria-hidden` by default |
| @fontsource/poppins | 5.3.0 | Self-hosted Poppins (weights 400, 500, 600), no external font CDN |
| oxlint | 1.93.0 | Linter shipped by the current `create-vite` React template |
| vitest, jsdom, @testing-library/* | 5.1.0 / latest | UI tests |

## Structure
```
src/
  main.jsx            entry: fonts, QueryClientProvider, RouterProvider
  router.jsx          routes, guards (loaders) and auth actions
  index.css           Tailwind + design tokens (@theme)
  components/         AppShell, AuthShell, ui primitives, TransactionList
  routes/             Login, Register, Dashboard, Transactions, Users, ErrorPage
  lib/                api, auth session, queries, guards, formatting, mock API
  app.test.jsx        UI tests
```

## Decisions and trade-offs
- **JavaScript, not TypeScript**: smaller surface to explain in a live demo.
- **Router data mode**: route loaders do the auth and role guards; forms submit to route actions; pages are lazy-loaded.
- **TanStack Query** for server data (caching, loading and error states, refetch after a mutation).
- **Session in localStorage**: simple for the assignment. Production would prefer an httpOnly cookie.
- **UI hides what a role cannot do, the server enforces it.** The UI checks are cosmetic.
- **Responsive**: sidebar and tables on desktop, bottom tab bar, cards and a bottom sheet form on phones.
