// Session lives in localStorage so a refresh keeps you signed in.
// Trade-off: any XSS could read it. A production system would prefer an httpOnly cookie.
const KEY = 'ledgerly.session'

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    /* storage unavailable: session lasts until reload */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export const getToken = () => getSession()?.token ?? null
