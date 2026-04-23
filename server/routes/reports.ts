import { Router } from 'express'
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { db } from '../db'
import { bankAccounts, entrepreneurs, reports, transactions } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { getQuarterBounds } from '../services/taxService'
import { generateIncomeBookPdf, generateQuarterReportPdf } from '../services/pdfService'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.json([])

    const rows = await db
      .select()
      .from(reports)
      .where(eq(reports.entrepreneurId, entrepreneur.id))
      .orderBy(desc(reports.createdAt))

    res.json(rows)
  } catch (error) {
    next(error)
  }
})

router.post('/generate', async (req: AuthRequest, res, next) => {
  try {
    const { period, type } = req.body as { period?: string; type?: string }
    if (!period) return res.status(400).json({ error: 'Period is required' })

    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.status(400).json({ error: 'Complete entrepreneur setup first' })

    const [report] = await db
      .insert(reports)
      .values({
        entrepreneurId: entrepreneur.id,
        period,
        type: type ?? 'ep_declaration',
        status: 'draft',
        fileUrl: null,
        submittedAt: null,
      })
      .returning()

    res.json(report)
  } catch (error) {
    next(error)
  }
})

router.post('/:id/submit', async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params['id'])
    const [report] = await db.select().from(reports).where(eq(reports.id, id))
    if (!report) return res.status(404).json({ error: 'Report not found' })

    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur || report.entrepreneurId !== entrepreneur.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const [updated] = await db
      .update(reports)
      .set({ status: 'submitted', submittedAt: new Date().toISOString() })
      .where(eq(reports.id, id))
      .returning()

    res.json(updated)
  } catch (error) {
    next(error)
  }
})

router.get('/book', async (req: AuthRequest, res, next) => {
  try {
    const period = String(req.query['period'] ?? '')
    if (!period.match(/^Q[1-4]-\d{4}$/)) {
      return res.status(400).json({ error: 'Invalid period format. Use Q1-2026' })
    }

    const [entrepreneur] = await db.select().from(entrepreneurs)
      .where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.status(404).json({ error: 'Entrepreneur not found' })

    const [q, y] = period.split('-')
    const quarter = parseInt(q!.replace('Q', '')) as 1 | 2 | 3 | 4
    const year = parseInt(y!)
    const { start, end } = getQuarterBounds(year, quarter)

    const accounts = await db.select().from(bankAccounts)
      .where(eq(bankAccounts.entrepreneurId, entrepreneur.id))
    const accountIds = accounts.map(a => a.id)

    const txList = accountIds.length
      ? await db.select().from(transactions)
        .where(and(
          inArray(transactions.accountId, accountIds),
          gte(transactions.date, start),
          lte(transactions.date, end),
        ))
      : []

    const pdfBuffer = await generateIncomeBookPdf(
      txList,
      entrepreneur.fullName || 'ФОП',
      entrepreneur.taxId || '',
      period,
    )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="book-${period}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
})

router.get('/pdf', async (req: AuthRequest, res, next) => {
  try {
    const period = String(req.query['period'] ?? '')
    if (!period.match(/^Q[1-4]-\d{4}$/)) {
      return res.status(400).json({ error: 'Invalid period format. Use Q1-2026' })
    }

    const [entrepreneur] = await db.select().from(entrepreneurs)
      .where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.status(404).json({ error: 'Entrepreneur not found' })

    const [q, y] = period.split('-')
    const quarter = parseInt(q!.replace('Q', '')) as 1 | 2 | 3 | 4
    const year = parseInt(y!)
    const { start, end } = getQuarterBounds(year, quarter)

    const accounts = await db.select().from(bankAccounts)
      .where(eq(bankAccounts.entrepreneurId, entrepreneur.id))
    const accountIds = accounts.map((a) => a.id)

    const txList = accountIds.length
      ? await db.select().from(transactions)
        .where(and(
          inArray(transactions.accountId, accountIds),
          gte(transactions.date, start),
          lte(transactions.date, end),
        ))
      : []

    const pdfBuffer = await generateQuarterReportPdf(txList, entrepreneur.fullName || 'ФОП', period)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="report-${period}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
})

export default router
