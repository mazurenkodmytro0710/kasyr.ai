import { Router } from 'express'
import { db } from '../db'
import { transactions, bankAccounts, entrepreneurs } from '../db/schema'
import { eq, and, desc, like, sql, inArray, or } from 'drizzle-orm'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { classifyWithAI } from '../services/aiClassifier'

const router = Router()
router.use(authMiddleware)

async function getAccountIds(userId: number): Promise<number[]> {
  const [ent] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, userId))
  if (!ent) return []

  const accounts = await db.select({ id: bankAccounts.id }).from(bankAccounts)
    .where(eq(bankAccounts.entrepreneurId, ent.id))
  return accounts.map(account => account.id)
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { page = '1', limit = '20', category, search } = req.query as Record<string, string>
    const pageNum = parseInt(page, 10)
    const limitNum = Math.min(parseInt(limit, 10), 100)
    const offset = (pageNum - 1) * limitNum

    const accountIds = await getAccountIds(req.userId!)
    if (!accountIds.length) return res.json({ data: [], total: 0, page: pageNum, limit: limitNum })

    const conditions = [inArray(transactions.accountId, accountIds)]
    if (category) conditions.push(eq(transactions.category, category))
    if (search) {
      conditions.push(or(
        like(transactions.description, `%${search}%`),
        sql`cast(${transactions.amount} as text) like ${`%${search}%`}`,
      )!)
    }

    const where = and(...conditions)
    const data = await db.select().from(transactions).where(where)
      .orderBy(desc(transactions.date)).limit(limitNum).offset(offset)
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(transactions).where(where)

    res.json({ data, total: count, page: pageNum, limit: limitNum })
  } catch (err) { next(err) }
})

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const accountIds = await getAccountIds(req.userId!)
    if (!accountIds.length) return res.status(404).json({ error: 'Not found' })

    const [tx] = await db.select().from(transactions).where(eq(transactions.id, parseInt(req.params['id'] ?? '0', 10)))
    if (!tx || !accountIds.includes(tx.accountId)) return res.status(404).json({ error: 'Not found' })
    res.json(tx)
  } catch (err) { next(err) }
})

router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10)
    const accountIds = await getAccountIds(req.userId!)
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id))
    if (!tx || !accountIds.includes(tx.accountId)) return res.status(404).json({ error: 'Not found' })

    const { category, clientId, comment } = req.body as { category?: string; clientId?: number | null; comment?: string | null }
    const updates: Record<string, unknown> = {}
    if (category !== undefined) updates['category'] = category
    if (clientId !== undefined) updates['clientId'] = clientId
    if (comment !== undefined) updates['comment'] = comment
    const [updated] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning()
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err) { next(err) }
})

router.post('/classify', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.body as { id: number }
    const accountIds = await getAccountIds(req.userId!)
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id))
    if (!tx || !accountIds.includes(tx.accountId)) return res.status(404).json({ error: 'Not found' })
    const result = await classifyWithAI(tx.description, tx.amount, tx.currency)
    await db.update(transactions).set({ category: result.category }).where(eq(transactions.id, id))
    res.json(result)
  } catch (err) { next(err) }
})

export default router
