// In-memory mock of the REST API (same paths and JSON shapes). Used only when VITE_USE_MOCK=true, for UI tests and offline demos.
// Offline stand-in for the backend, so the UI can be run and tested without it.
import { ApiError } from './errors.js'

const DAY = 86_400_000

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(2026)

const NAMES = [
  'Asha Verma', 'Rohan Deshmukh', 'Meera Kulkarni', 'Farah Sheikh', 'Arjun Naik', 'Sneha Patil',
  'Kabir Joshi', 'Isha Rane', 'Vikram More', 'Nisha Gawande', 'Aditya Pawar', 'Priya Mhatre',
  'Sahil Khan', 'Tanvi Gharat', 'Omkar Patil', 'Riya Shah', 'Yash Thakur', 'Pooja Bhoir',
  'Nikhil Sawant', 'Anjali Kadam', 'Harsh Mehta', 'Divya Nair',
]
// Users that never create transactions (so "users without transactions" has rows).
const NO_TXN = new Set([12, 16, 17, 18, 19, 20, 21])

const now = Date.now()
const users = NAMES.map((name, i) => {
  const active = i < 17
  return {
    id: i + 1,
    name,
    email: `${name.split(' ')[0].toLowerCase()}@example.com`,
    role: i < 2 ? 'admin' : 'user',
    isActive: active,
    lastLoginAt:
      i === 21 ? null : new Date(now - (active ? rand() * 4 : 35 + rand() * 60) * DAY).toISOString(),
    createdAt: new Date(now - (70 + rand() * 60) * DAY).toISOString(),
  }
})
const passwords = new Map(users.map((u) => [u.id, u.role === 'admin' ? 'Admin@123' : 'Password@123']))

const eligible = users.filter((u) => !NO_TXN.has(users.indexOf(u)))
let transactions = Array.from({ length: 50 }, () => {
  const ageDays = rand() ** 1.6 * 60
  const r = rand()
  let status = 'success'
  if (ageDays < 4 && r > 0.45) status = 'pending'
  else if (ageDays < 7 && r > 0.4) status = 'failed'
  else if (r > 0.86) status = 'failed'
  const amount = Math.round((400 + rand() ** 2 * 48_000) * 100) / 100
  return {
    customerId: eligible[Math.floor(rand() * eligible.length)].id,
    amount,
    status,
    note: '',
    createdAt: new Date(now - ageDays * DAY).toISOString(),
  }
})
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  .map((t, i) => ({ ...t, id: i + 1, reference: `TXN-${String(i + 1).padStart(4, '0')}` }))

const userById = (id) => users.find((u) => u.id === Number(id))
const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive,
  lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
})
const withCustomer = (t) => ({ ...t, customerName: userById(t.customerId)?.name ?? 'Unknown' })
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

function authenticate(token) {
  const id = token?.startsWith('mock-') ? Number(token.slice(5)) : NaN
  const user = userById(id)
  if (!user) throw new ApiError('Please sign in to continue.', 401)
  if (!user.isActive) throw new ApiError('This account is deactivated.', 403)
  return user
}
function requireAdmin(user) {
  if (user.role !== 'admin') throw new ApiError('Admin access required.', 403)
}
const scoped = (user) =>
  user.role === 'admin' ? transactions : transactions.filter((t) => t.customerId === user.id)

function paginate(list, params) {
  const pageSize = Math.min(Math.max(Number(params.pageSize) || 10, 1), 100)
  const page = Math.max(Number(params.page) || 1, 1)
  return { items: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize }
}

function dashboard(user) {
  const list = scoped(user)
  const settled = list.filter((t) => t.status === 'success')
  const sumSince = (from, to) =>
    settled
      .filter((t) => {
        const ts = Date.parse(t.createdAt)
        return ts >= from && ts < to
      })
      .reduce((s, t) => s + t.amount, 0)
  const settled30d = sumSince(now - 30 * DAY, now + DAY)
  const previous = sumSince(now - 60 * DAY, now - 30 * DAY)

  const daily = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * DAY)
    const key = d.toDateString()
    return {
      date: d.toISOString(),
      total: settled
        .filter((t) => new Date(t.createdAt).toDateString() === key)
        .reduce((s, t) => s + t.amount, 0),
    }
  })
  const pending = list.filter((t) => t.status === 'pending')
  const counts = new Map()
  transactions.forEach((t) => counts.set(t.customerId, (counts.get(t.customerId) ?? 0) + 1))

  return {
    scope: user.role === 'admin' ? 'all' : 'self',
    settled30d,
    deltaPct: previous > 0 ? ((settled30d - previous) / previous) * 100 : null,
    daily,
    pending: { count: pending.length, amount: pending.reduce((s, t) => s + t.amount, 0) },
    failed7d: list.filter((t) => t.status === 'failed' && Date.parse(t.createdAt) > now - 7 * DAY).length,
    users:
      user.role === 'admin'
        ? {
            total: users.length,
            active: users.filter((u) => u.isActive).length,
            inactive: users.filter((u) => !u.isActive).length,
            neverTransacted: users.filter((u) => !counts.has(u.id)).length,
          }
        : null,
    myTransactionCount: user.role === 'admin' ? null : list.length,
    recent: [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map(withCustomer),
  }
}

export async function handle({ method, path, body, params = {}, token }) {
  await delay(150 + Math.random() * 200)

  if (method === 'POST' && path === '/auth/login') {
    const user = users.find((u) => u.email === String(body?.email ?? '').trim().toLowerCase())
    if (!user || passwords.get(user.id) !== body?.password) {
      throw new ApiError('Incorrect email or password.', 401)
    }
    if (!user.isActive) throw new ApiError('This account is deactivated. Contact an admin.', 403)
    user.lastLoginAt = new Date().toISOString()
    return { token: `mock-${user.id}`, user: publicUser(user) }
  }

  if (method === 'POST' && path === '/auth/register') {
    const email = String(body?.email ?? '').trim().toLowerCase()
    if (users.some((u) => u.email === email)) {
      throw new ApiError('An account with this email already exists.', 409)
    }
    const user = {
      id: Math.max(...users.map((u) => u.id)) + 1,
      name: String(body?.name ?? '').trim(),
      email,
      role: 'user', // sign-up can never create an admin
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    users.push(user)
    passwords.set(user.id, body?.password)
    return { token: `mock-${user.id}`, user: publicUser(user) }
  }

  const me = authenticate(token)

  if (method === 'GET' && path === '/dashboard') return dashboard(me)

  if (method === 'GET' && path === '/transactions') {
    const q = String(params.q ?? '').trim().toLowerCase()
    const list = scoped(me)
      .filter((t) => !params.status || params.status === 'all' || t.status === params.status)
      .map(withCustomer)
      .filter((t) => !q || t.reference.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return paginate(list, params)
  }

  if (method === 'POST' && path === '/transactions') {
    const amount = Number(body?.amount)
    if (!Number.isFinite(amount) || amount <= 0) throw new ApiError('Amount must be greater than 0.', 400)
    if (amount > 10_000_000) throw new ApiError('Amount cannot exceed 1,00,00,000.', 400)
    let customerId = me.id
    if (me.role === 'admin' && body?.customerId) {
      const customer = userById(body.customerId)
      if (!customer?.isActive) throw new ApiError('Choose an active customer.', 400)
      customerId = customer.id
    }
    const id = transactions.length + 1
    const tx = {
      id,
      reference: `TXN-${String(id).padStart(4, '0')}`,
      customerId,
      amount: Math.round(amount * 100) / 100,
      status: 'pending',
      note: String(body?.note ?? '').slice(0, 120),
      createdAt: new Date().toISOString(),
    }
    transactions = [...transactions, tx]
    return withCustomer(tx)
  }

  if (method === 'GET' && path === '/users') {
    requireAdmin(me)
    const q = String(params.q ?? '').trim().toLowerCase()
    const counts = new Map()
    transactions.forEach((t) => counts.set(t.customerId, (counts.get(t.customerId) ?? 0) + 1))
    const list = users
      .filter((u) => !params.role || params.role === 'all' || u.role === params.role)
      .filter((u) => !params.status || params.status === 'all' || (params.status === 'active') === u.isActive)
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.includes(q))
      .map((u) => ({ ...publicUser(u), transactionCount: counts.get(u.id) ?? 0 }))
    return paginate(list, params)
  }

  const m = path.match(/^\/users\/(\d+)\/(role|status)$/)
  if (method === 'PATCH' && m) {
    requireAdmin(me)
    const target = userById(m[1])
    if (!target) throw new ApiError('User not found.', 404)
    if (target.id === me.id) throw new ApiError('You cannot change your own role or status.', 400)
    if (m[2] === 'role') {
      if (!['admin', 'user'].includes(body?.role)) throw new ApiError('Role must be admin or user.', 400)
      target.role = body.role
    } else {
      target.isActive = Boolean(body?.isActive)
    }
    return publicUser(target)
  }

  throw new ApiError(`No mock route for ${method} ${path}`, 404)
}
