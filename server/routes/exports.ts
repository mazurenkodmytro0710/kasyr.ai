import { Router } from 'express'
import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm'
import { db } from '../db'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { bankAccounts, entrepreneurs, transactions } from '../db/schema'

const router = Router()
router.use(authMiddleware)

function csvCell(value: string | number | null | undefined): string {
  const normalized = value == null ? '' : String(value)
  return `"${normalized.replace(/"/g, '""')}"`
}

router.get('/accountant', async (req: AuthRequest, res, next) => {
  try {
    const year = Number(req.query['year'] ?? new Date().getFullYear())
    const quarter = req.query['quarter'] == null ? null : Number(req.query['quarter'])

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Invalid year' })
    }

    if (quarter != null && (!Number.isInteger(quarter) || quarter < 1 || quarter > 4)) {
      return res.status(400).json({ error: 'Invalid quarter' })
    }

    const [entrepreneur] = await db
      .select()
      .from(entrepreneurs)
      .where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.status(404).json({ error: 'No entrepreneur profile' })

    const betaFullAccess = true
    const hasExportAccess =
      betaFullAccess ||
      entrepreneur.subscriptionTier === 'pro' ||
      entrepreneur.subscriptionTier === 'business'
    if (!hasExportAccess) {
      return res
        .status(403)
        .json({ error: 'Експорт для бухгалтера зараз недоступний для цього акаунта' })
    }

    const accounts = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(eq(bankAccounts.entrepreneurId, entrepreneur.id))
    const accountIds = accounts.map((account) => account.id)

    let fromDate: string
    let toDate: string
    if (quarter) {
      const startMonth = (quarter - 1) * 3 + 1
      const endMonth = quarter * 3
      fromDate = `${year}-${String(startMonth).padStart(2, '0')}-01T00:00:00.000Z`
      const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate()
      toDate = `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`
    } else {
      fromDate = `${year}-01-01T00:00:00.000Z`
      toDate = `${year}-12-31T23:59:59.999Z`
    }

    const rows = accountIds.length
      ? await db
          .select()
          .from(transactions)
          .where(
            and(
              inArray(transactions.accountId, accountIds),
              gte(transactions.date, fromDate),
              lte(transactions.date, toDate),
            ),
          )
          .orderBy(asc(transactions.date))
      : []

    const csvLines = [
      ['Дата', 'Опис', 'Сума (грн)', 'Валюта', 'Категорія', 'Коментар'].map(csvCell).join(','),
      ...rows.map((row) =>
        [
          row.date.slice(0, 10),
          row.description || '',
          row.amount,
          row.currency,
          row.category,
          row.comment || '',
        ]
          .map(csvCell)
          .join(','),
      ),
    ]

    const filename = quarter ? `kasyr_export_${year}_Q${quarter}.csv` : `kasyr_export_${year}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(`\uFEFF${csvLines.join('\n')}`)
  } catch (err) {
    next(err)
  }
})

export default router
