import { Router } from 'express'
import type { RequestHandler } from 'express'
import type { AppContext } from '../../context.ts'
import { toCsv } from '../../lib/csv.ts'
import { parseInput, sendJson } from '../../lib/http.ts'
import { currentUser } from '../../middleware/authenticate.ts'
import {
  createTransactionBody,
  exportTransactionsQuery,
  listTransactionsQuery,
  transactionListSchema,
  transactionSchema,
} from './transactions.schemas.ts'
import { createTransactionsService } from './transactions.service.ts'

export function createTransactionsRouter(ctx: AppContext, authenticate: RequestHandler): Router {
  const router = Router()
  const service = createTransactionsService(ctx)

  router.use(authenticate)

  router.get('/', async (req, res) => {
    const query = parseInput(listTransactionsQuery, req.query)
    sendJson(res, transactionListSchema, await service.list(currentUser(req), query))
  })

  // Transaction report as a CSV download. Same filters and visibility rules as the list.
  router.get('/export', async (req, res) => {
    const filters = parseInput(exportTransactionsQuery, req.query)
    const rows = await service.exportRows(currentUser(req), filters)
    const csv = toCsv(
      ['Reference', 'Customer', 'Amount (INR)', 'Status', 'Note', 'Created at (UTC)'],
      rows.map((t) => [t.reference, t.customerName, t.amount.toFixed(2), t.status, t.note, t.createdAt]),
    )
    const day = new Date().toISOString().slice(0, 10)
    res
      .status(200)
      .type('text/csv; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="ledgerly-transactions-${day}.csv"`)
      .send(csv)
  })

  router.post('/', async (req, res) => {
    const input = parseInput(createTransactionBody, req.body)
    sendJson(res, transactionSchema, await service.create(currentUser(req), input), 201)
  })

  return router
}
