import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import { useRouteLoaderData } from 'react-router'
import { useUrlFilters } from '../lib/useUrlFilters.js'
import { Avatar, Card, Chip, EmptyState, ErrorNotice, PageHeader, Pagination, RoleChip, Segmented, Skeleton } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { formatRelativeDay } from '../lib/format.js'
import { usersQuery } from '../lib/queries.js'

const PAGE_SIZE = 10
const ROLE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
]
const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

function StatusPill({ active }) {
  return active ? <Chip tone="ok" dot>Active</Chip> : <Chip tone="neutral" dot>Inactive</Chip>
}

function RowActions({ u, me, onRole, onStatus, disabled }) {
  if (u.id === me.id) return <span className="px-3 text-xs text-muted">You</span>
  const close = (e) => e.currentTarget.closest('details')?.removeAttribute('open')
  const item = 'flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 text-left text-sm hover:bg-black/5 disabled:opacity-60'
  return (
    <details className="relative">
      <summary aria-label={`Actions for ${u.name}`} className="grid size-11 cursor-pointer list-none place-items-center rounded-full text-muted hover:bg-black/5 [&::-webkit-details-marker]:hidden">
        <MoreHorizontal aria-hidden className="size-5" />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-48 rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-black/5">
        <button type="button" disabled={disabled} className={item} onClick={(e) => { close(e); onRole(u, u.role === 'admin' ? 'user' : 'admin') }}>
          {u.role === 'admin' ? 'Make user' : 'Make admin'}
        </button>
        <button type="button" disabled={disabled} className={item} onClick={(e) => { close(e); onStatus(u, !u.isActive) }}>
          {u.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </details>
  )
}

export function Component() {
  const me = useRouteLoaderData('app')
  const queryClient = useQueryClient()
  const { params, urlQ, q, setQ, update } = useUrlFilters()
  const role = params.get('role') ?? 'all'
  const status = params.get('status') ?? 'all'
  const page = Math.max(Number(params.get('page')) || 1, 1)

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuery(
    usersQuery({ q: urlQ, role, status, page, pageSize: PAGE_SIZE }),
  )

  const change = useMutation({
    mutationFn: ({ id, role: nextRole, isActive }) =>
      nextRole ? api.setUserRole(id, nextRole) : api.setUserStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
  const onRole = (u, nextRole) => change.mutate({ id: u.id, role: nextRole })
  const onStatus = (u, isActive) => change.mutate({ id: u.id, isActive })
  const actionProps = { me, onRole, onStatus, disabled: change.isPending }

  return (
    <>
      <title>Users · Ledgerly</title>
      <PageHeader eyebrow={data ? `${data.total} people in this workspace` : 'Loading…'} title="Users" />

      <Card className="flex flex-wrap items-center gap-4 p-4 md:px-6">
        <input
          type="search"
          aria-label="Search users"
          placeholder="Search by name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-h-11 min-w-48 flex-1 rounded-xl border border-[#d2d2d7] bg-white px-4 text-sm placeholder:text-muted"
        />
        <Segmented label="Role" value={role} onChange={(v) => update({ role: v, page: 1 })} options={ROLE_OPTIONS} className="w-full md:w-auto" />
        <Segmented label="Status" value={status} onChange={(v) => update({ status: v, page: 1 })} options={STATUS_OPTIONS} className="w-full md:w-auto" />
      </Card>

      {isError && <ErrorNotice error={error} onRetry={refetch} />}
      {change.isError && <ErrorNotice error={change.error} />}

      <Card className="overflow-visible" aria-busy={isPending || isPlaceholderData}>
        {isPending ? (
          <div className="flex flex-col gap-3 p-4">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : data?.items.length === 0 ? (
          <EmptyState title="No users found">Try a different search or filter.</EmptyState>
        ) : data ? (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-muted">
                    <th scope="col" className="px-6 py-3 font-medium">User</th>
                    <th scope="col" className="px-4 py-3 font-medium">Role</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium">Last login</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Transactions</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u.id} className="border-t border-line">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} />
                          <div className="min-w-0">
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><RoleChip role={u.role} /></td>
                      <td className="px-4 py-3.5"><StatusPill active={u.isActive} /></td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-muted">{formatRelativeDay(u.lastLoginAt)}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{u.transactionCount}</td>
                      <td className="px-3 py-3.5 text-right"><RowActions u={u} {...actionProps} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col gap-3 p-3 md:hidden">
              {data.items.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-[18px] bg-canvas px-4 py-3">
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{u.name}</p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                    <p className="mt-0.5 text-xs text-muted">{u.isActive ? 'Active' : 'Inactive'} · {u.transactionCount} transactions</p>
                  </div>
                  <div className="flex flex-none items-center gap-1">
                    <RoleChip role={u.role} />
                    <RowActions u={u} {...actionProps} />
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line">
              <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={(p) => update({ page: p })} />
            </div>
          </div>
        ) : null}
      </Card>
    </>
  )
}
