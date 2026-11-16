import { clearSession, getToken } from './auth.js'
import { ApiError } from './errors.js'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

async function request(path, { method = 'GET', body, params, signal } = {}) {
  const token = getToken()

  if (USE_MOCK) {
    const { handle } = await import('./mock.js')
    return handle({ method, path, body, params, token })
  }

  const url = new URL(`${BASE}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      url.searchParams.set(key, String(value))
    }
  }

  let res
  try {
    res = await fetch(url, {
      method,
      signal,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0)
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401 && token) {
      clearSession()
      onUnauthorized()
    }
    throw new ApiError(
      data?.error?.message ?? data?.message ?? `Request failed (${res.status})`,
      res.status,
      data,
    )
  }
  return data
}

// Downloads the transaction report. Not JSON, so it has its own small fetch (still sends the bearer token).
async function downloadTransactionsReport(params = {}) {
  if (USE_MOCK) throw new ApiError('The report is not available in demo mode.', 501)
  const url = new URL(`${BASE}/transactions/export`, window.location.origin)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') url.searchParams.set(key, String(value))
  }
  const token = getToken()
  let res
  try {
    res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0)
  }
  if (!res.ok) {
    if (res.status === 401 && token) {
      clearSession()
      onUnauthorized()
    }
    const data = await res.json().catch(() => null)
    throw new ApiError(data?.error?.message ?? `Request failed (${res.status})`, res.status, data)
  }
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'ledgerly-transactions.csv'
  return { blob: await res.blob(), name }
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  dashboard: (signal) => request('/dashboard', { signal }),
  transactions: (params, signal) => request('/transactions', { params, signal }),
  exportTransactions: downloadTransactionsReport,
  createTransaction: (body) => request('/transactions', { method: 'POST', body }),
  users: (params, signal) => request('/users', { params, signal }),
  setUserRole: (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
  setUserStatus: (id, isActive) =>
    request(`/users/${id}/status`, { method: 'PATCH', body: { isActive } }),
}
