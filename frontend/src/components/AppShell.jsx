import { ArrowLeftRight, LayoutGrid, LogOut, Users } from 'lucide-react'
import { Form, NavLink, Outlet, useNavigation, useRouteLoaderData } from 'react-router'
import { cx } from '../lib/cx.js'
import { RoleChip } from './ui.jsx'

export function AppShell() {
  const user = useRouteLoaderData('app')
  const navigation = useNavigation()
  const items = [
    { to: '/', label: 'Overview', icon: LayoutGrid, end: true },
    { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    ...(user.role === 'admin' ? [{ to: '/users', label: 'Users', icon: Users }] : []),
  ]

  return (
    <div className="min-h-dvh">
      {navigation.state === 'loading' && (
        <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-brand" />
      )}

      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-7 border-r border-line bg-white/70 px-4 py-7 backdrop-blur-xl md:flex">
        <div className="pl-3.5 text-[22px] font-semibold tracking-tight">Ledgerly</div>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium',
                  isActive ? 'bg-brand/12 text-brand-ink' : 'text-[#424245] hover:bg-black/5',
                )
              }
            >
              <Icon aria-hidden className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-[18px] bg-canvas p-4">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="truncate text-[13px] text-muted">{user.email}</p>
          <div className="mt-2.5 flex items-center justify-between">
            <RoleChip role={user.role} />
            <Form method="post" action="/logout">
              <button type="submit" className="flex min-h-11 cursor-pointer items-center gap-1.5 px-1 text-[13px] font-medium text-brand-ink">
                <LogOut aria-hidden className="size-4" />
                Sign out
              </button>
            </Form>
          </div>
        </div>
      </aside>

      <main className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 pt-14 pb-32 md:ml-60 md:px-12 md:pt-10 md:pb-14">
        <Outlet />
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/85 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-xl md:hidden"
      >
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                'flex min-h-11 flex-1 flex-col items-center gap-0.5 text-[11px] font-medium',
                isActive ? 'text-brand-ink' : 'text-muted',
              )
            }
          >
            <Icon aria-hidden className="size-6" />
            {label}
          </NavLink>
        ))}
        <Form method="post" action="/logout" className="flex flex-1">
          <button type="submit" className="flex min-h-11 flex-1 cursor-pointer flex-col items-center gap-0.5 text-[11px] font-medium text-muted">
            <LogOut aria-hidden className="size-6" />
            Sign out
          </button>
        </Form>
      </nav>
    </div>
  )
}
