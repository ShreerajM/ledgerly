import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useRouteLoaderData } from 'react-router'
import { useUrlFilters } from '../lib/useUrlFilters.js'
import { TransactionList } from '../components/TransactionList.jsx'
import { Button, Card, EmptyState, ErrorNotice, Field, PageHeader, Pagination, Segmented, Skeleton } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { formatINR } from '../lib/format.js'
import { transactionsQuery, usersQuery } from '../lib/queries.js'

const PAGE_SIZE = 10
const MAX_AMOUNT = 10_000_000
const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

function NewTransactionForm({ onCreated }) {
  const user = useRouteLoaderData('app')
  const isAdmin = user.role === 'admin'
  const queryClient = useQueryClient()
  const formRef = useRef(null)
  const [errors, setErrors] = useState({})
  const [created, setCreated] = useState(null)

  const customers = useQuery({ ...usersQuery({ status: 'active', pageSize: 100 }), enabled: isAdmin })

  const mutation = useMutation({
    mutationFn: (body) => api.createTransaction(body),
    onSuccess: (tx) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      formRef.current?.reset()
      setErrors({})
      setCreated(tx)
      onCreated?.(tx)
    },
  })

  function onSubmit(e) {
    e.preventDefault()
    setCreated(null)
    const fd = new FormData(e.currentTarget)
    const raw = String(fd.get('amount') ?? '').replaceAll(',', '').trim()
    const next = {}
    if (isAdmin && !fd.get('customerId')) next.customerId = 'Choose a customer.'
    if (!raw) next.amount = 'Enter an amount.'
    else if (!/^\d+(\.\d{1,2})?$/.test(raw)) next.amount = 'Use numbers only, up to 2 decimal places.'
    else if (Number(raw) <= 0) next.amount = 'Amount must be greater than 0.'
    else if (Number(raw) > MAX_AMOUNT) next.amount = `Amount cannot exceed ${formatINR(MAX_AMOUNT)}.`
    setErrors(next)
    if (Object.keys(next).length) return
    mutation.mutate({
      amount: Number(raw),
      note: String(fd.get('note') ?? '').trim(),
      ...(isAdmin ? { customerId: Number(fd.get('customerId')) } : {}),
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {isAdmin && (
        <Field as="select" name="customerId" label="Customer" defaultValue="" error={errors.customerId}>
          <option value="" disabled>Select a user</option>
          {customers.data?.items.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Field>
      )}
      <Field name="amount" label="Amount (₹)" type="text" inputMode="decimal" placeholder="0.00" autoComplete="off" error={errors.amount} hint="Must be greater than 0." />
      <Field name="note" label="Note (optional)" type="text" maxLength={120} placeholder="Invoice or order number" />
      {mutation.isError && (
        <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad">{mutation.error.message}</p>
      )}
      {created && (
        <p role="status" className="rounded-xl bg-ok-bg px-4 py-3 text-sm text-ok">
          {created.reference} created for {formatINR(created.amount)}. It is pending until the payment settles.
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Creating…' : 'Create transaction'}
      </Button>
    </form>
  )
}

export function Component() {
  const user = useRouteLoaderData('app')
  const isAdmin = user.role === 'admin'
  const { params, urlQ, q, setQ, update, clear } = useUrlFilters()
  const status = params.get('status') ?? 'all'
  const page = Math.max(Number(params.get('page')) || 1, 1)
  const dialogRef = useRef(null)

  // Report: downloads the transactions matching the current search and status filter as a CSV file.
  const report = useMutation({
    mutationFn: () => api.exportTransactions({ q: urlQ, status }),
    onSuccess: ({ blob, name }) => {
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = name
      link.click()
      URL.revokeObjectURL(href)
    },
  })
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuery(
    transactionsQuery({ q: urlQ, status, page, pageSize: PAGE_SIZE }),
  )

  return (
    <>
      <title>Transactions · Ledgerly</title>
      <PageHeader eyebrow={data ? `${data.total} ${status === 'all' ? 'in total' : status}` : 'Loading…'} title="Transactions">
        <Button variant="quiet" onClick={() => report.mutate()} disabled={report.isPending}>
          <Download aria-hidden className="size-4" /> {report.isPending ? 'Preparing…' : 'Download report'}
        </Button>
        <Button className="lg:hidden" onClick={() => dialogRef.current?.showModal()}>
          <Plus aria-hidden className="size-4" /> New
        </Button>
      </PageHeader>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="flex flex-wrap items-center gap-4 p-4 md:px-6">
            <input
              type="search"
              aria-label="Search transactions"
              placeholder={isAdmin ? 'Search reference or customer' : 'Search by reference'}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-h-11 min-w-48 flex-1 rounded-xl border border-[#d2d2d7] bg-white px-4 text-sm placeholder:text-muted"
            />
            <Segmented
              label="Status"
              value={status}
              onChange={(v) => update({ status: v, page: 1 })}
              options={STATUS_OPTIONS}
              className="w-full md:w-auto"
            />
          </Card>

          {isError && <ErrorNotice error={error} onRetry={refetch} />}
          {report.isError && (
            <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad">
              Could not prepare the report: {report.error.message}
            </p>
          )}

          <Card className="overflow-hidden" aria-busy={isPending || isPlaceholderData}>
            {isPending ? (
              <div className="flex flex-col gap-3 p-4">
                {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : data?.items.length === 0 ? (
              <EmptyState title="No transactions found">
                Try a different search or status.{' '}
                <button type="button" className="min-h-11 cursor-pointer font-medium text-brand-ink" onClick={clear}>
                  Clear filters
                </button>
              </EmptyState>
            ) : data ? (
              <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
                <TransactionList items={data.items} showCustomer={isAdmin} />
                <div className="border-t border-line">
                  <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={(p) => update({ page: p })} />
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <Card className="sticky top-10 hidden p-7 lg:block" aria-label="New transaction">
          <h2 className="text-xl font-semibold tracking-tight">New transaction</h2>
          <p className="mt-1 mb-5 text-[13px] leading-relaxed text-muted">Saved as pending until the payment settles.</p>
          <NewTransactionForm />
        </Card>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="new-tx-title"
        className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-auto rounded-t-[28px] border-0 bg-white p-6 pb-10 backdrop:bg-black/40 lg:hidden"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="new-tx-title" className="text-xl font-semibold tracking-tight">New transaction</h2>
          <button type="button" aria-label="Close" onClick={() => dialogRef.current?.close()} className="grid size-11 cursor-pointer place-items-center rounded-full bg-chip">
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <NewTransactionForm onCreated={() => setTimeout(() => dialogRef.current?.close(), 1200)} />
      </dialog>
    </>
  )
}
