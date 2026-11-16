import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

// Filters live in the URL (shareable, back-button friendly).
// The search box keeps local state and only writes to the URL after a short pause in typing.
export function useUrlFilters() {
  const [params, setParams] = useSearchParams()
  const urlQ = params.get('q') ?? ''
  const [q, setQ] = useState(urlQ)

  const update = useCallback(
    (next) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(next)) {
            if (value === '' || value == null || value === 'all' || (key === 'page' && value === 1)) p.delete(key)
            else p.set(key, String(value))
          }
          return p
        },
        { replace: true },
      )
    },
    [setParams],
  )

  useEffect(() => {
    if (q.trim() === urlQ) return
    const t = setTimeout(() => update({ q: q.trim(), page: 1 }), 300)
    return () => clearTimeout(t)
  }, [q, urlQ, update])

  const clear = useCallback(() => {
    setQ('')
    setParams({}, { replace: true })
  }, [setParams])

  return { params, urlQ, q, setQ, update, clear }
}
