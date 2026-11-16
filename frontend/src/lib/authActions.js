import { redirect } from 'react-router'
import { api } from './api.js'
import { setSession } from './auth.js'
import { queryClient } from './queryClient.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function loginAction({ request }) {
  const form = await request.formData()
  const email = String(form.get('email') ?? '').trim()
  const password = String(form.get('password') ?? '')
  const errors = {}
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Enter your password.'
  if (Object.keys(errors).length) return { errors, values: { email } }

  try {
    const session = await api.login({ email, password })
    queryClient.clear()
    setSession(session)
    return redirect('/')
  } catch (err) {
    return { formError: err.message, values: { email } }
  }
}

export async function registerAction({ request }) {
  const form = await request.formData()
  const name = String(form.get('name') ?? '').trim()
  const email = String(form.get('email') ?? '').trim()
  const password = String(form.get('password') ?? '')
  const confirm = String(form.get('confirm') ?? '')

  const errors = {}
  if (name.length < 2) errors.name = 'Enter your full name.'
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'
  if (password.length < 8 || !/\d/.test(password)) errors.password = 'Use 8 or more characters, including a number.'
  if (confirm !== password) errors.confirm = 'Passwords do not match.'
  if (Object.keys(errors).length) return { errors, values: { name, email } }

  try {
    // The role is never sent: sign-up always creates a regular user.
    const session = await api.register({ name, email, password })
    queryClient.clear()
    setSession(session)
    return redirect('/')
  } catch (err) {
    const field = err.status === 409 ? { errors: { email: err.message } } : { formError: err.message }
    return { ...field, values: { name, email } }
  }
}
