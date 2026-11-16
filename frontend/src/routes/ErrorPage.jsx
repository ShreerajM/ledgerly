import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

function Shell({ code, title, children }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md text-center">
        <title>{`${title} · Ledgerly`}</title>
        {code && <p className="text-sm font-medium text-muted">{code}</p>}
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em]">{title}</h1>
        <p className="mt-2 text-[15px] text-muted">{children}</p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-medium text-white hover:bg-brand-ink">
          Back to overview
        </Link>
      </div>
    </div>
  )
}

export function NotFound() {
  return <Shell code="404" title="Page not found">The page you are looking for does not exist.</Shell>
}

export function ErrorPage() {
  const error = useRouteError()
  if (isRouteErrorResponse(error)) {
    if (error.status === 403) return <Shell code="403" title="No access">You do not have permission to view this page. Ask an admin if you need access.</Shell>
    if (error.status === 404) return <NotFound />
  }
  return <Shell title="Something went wrong">An unexpected error occurred. Please try again.</Shell>
}

export function Splash() {
  return <div role="status" aria-label="Loading" className="grid min-h-dvh place-items-center text-sm text-muted">Loading…</div>
}
