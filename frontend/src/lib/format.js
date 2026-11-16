const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const dateTime = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const dayOnly = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })

export const formatINR = (n) => inr.format(n)

export function splitINR(n) {
  const s = inr.format(n)
  const i = s.lastIndexOf('.')
  return { whole: s.slice(0, i), cents: s.slice(i) }
}

export const formatDateTime = (iso) => dateTime.format(new Date(iso))
export const formatDay = (iso) => dayOnly.format(new Date(iso))

export function formatRelativeDay(iso) {
  if (!iso) return 'Never'
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((startOf(new Date()) - startOf(new Date(iso))) / 86400000)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return dayOnly.format(new Date(iso))
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
