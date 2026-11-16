import { formatDateTime, formatINR } from '../lib/format.js'
import { StatusChip } from './ui.jsx'

// One data set, two layouts: a table on tablets and up, stacked cards on phones.
export function TransactionList({ items, showCustomer = true }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-muted">
              <th scope="col" className="px-6 py-3 font-medium">Reference</th>
              {showCustomer && <th scope="col" className="px-4 py-3 font-medium">Customer</th>}
              <th scope="col" className="px-4 py-3 font-medium">Date</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-6 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-6 py-4 tabular-nums">{t.reference}</td>
                {showCustomer && <td className="px-4 py-4">{t.customerName}</td>}
                <td className="px-4 py-4 whitespace-nowrap tabular-nums">{formatDateTime(t.createdAt)}</td>
                <td className="px-4 py-4"><StatusChip status={t.status} /></td>
                <td className="px-6 py-4 text-right font-medium tabular-nums">{formatINR(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 p-3 md:hidden">
        {items.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-canvas px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{showCustomer ? t.customerName : t.reference}</p>
              <p className="text-xs text-muted tabular-nums">
                {showCustomer ? `${t.reference} · ` : ''}
                {formatDateTime(t.createdAt)}
              </p>
            </div>
            <div className="flex flex-none flex-col items-end gap-1">
              <p className="text-sm font-semibold tabular-nums">{formatINR(t.amount)}</p>
              <StatusChip status={t.status} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
