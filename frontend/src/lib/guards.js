import { redirect } from 'react-router'
import { clearSession, getSession } from './auth.js'
import { queryClient } from './queryClient.js'

export function requireUser() {
  const session = getSession()
  if (!session) throw redirect('/login')
  return session.user
}

export function requireGuest() {
  if (getSession()) throw redirect('/')
  return null
}

export function requireAdmin() {
  const user = requireUser()
  if (user.role !== 'admin') {
    throw new Response('Forbidden', { status: 403, statusText: 'Forbidden' })
  }
  return user
}

export function logoutAction() {
  clearSession()
  queryClient.clear()
  return redirect('/login')
}
