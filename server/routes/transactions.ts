import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { db } from '../db'
import { transactions, bankAccounts, entrepreneurs } from '../db/schema'
import { eq, and, desc, like, sql, inArray, or, gte, lte } from 'drizzle-orm'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { classifyByRules, classifyWithAI } from '../services/aiClassifier'
import { consumeAiQuota } from '../services/aiQuotaService'
import { sanitizeText } from '../utils/sanitize'

const router = Router()
router.use(authMiddleware)

async function getAccountIds(userId: number): Promise<number[]> {
  const [ent] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, userId))
  if (!ent) return []

  const accounts = await db
    .select({ id: bankAccounts.id })
    .from(bankAccounts)
    .where(eq(bankAccounts.entrepreneurId, ent.id))
  return accounts.map((account) => account.id)
}

async function getEntrepreneurByUserId(userId: number) {
  const [entrepreneur] = await db
    .select()
    .from(entrepreneurs)
    .where(eq(entrepreneurs.userId, userId))
  return entrepreneur
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      search,
      from,
      to,
    } = req.query as Record<string, string>
    const pageNum = parseInt(page, 10)
    const limitNum = Math.min(parseInt(limit, 10), 100)
    const offset = (pageNum - 1) * limitNum

    const accountIds = await getAccountIds(req.userId!)
    if (!accountIds.length) return res.json({ data: [], total: 0, page: pageNum, limit: limitNum })

    const conditions = [inArray(transactions.accountId, accountIds)]
    if (category === 'expense') {
      conditions.push(inArray(transactions.category, ['expense', 'fee', 'return']))
    } else if (category === 'transfer') {
      conditions.push(inArray(transactions.category, ['transfer', 'own_transfer']))
    } else if (category) {
      conditions.push(eq(transactions.category, category))
    }
    if (search) {
      conditions.push(
        or(
          like(transactions.description, `%${search}%`),
          sql`cast(${transactions.amount} as text) like ${`%${search}%`}`,
        )!,
      )
    }
    if (from) conditions.push(gte(transactions.date, from))
    if (to) conditions.push(lte(transactions.date, `${to}T23:59:59.999Z`))

    const where = and(...conditions)
    const data = await db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(desc(transactions.date))
      .limit(limitNum)
      .offset(offset)
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(where)

    res.json({ data, total: count, page: pageNum, limit: limitNum })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const entrepreneur = await getEntrepreneurByUserId(req.userId!)
    if (!entrepreneur) {
      return res.status(400).json({ error: 'Complete entrepreneur setup first' })
    }

    const amount = Math.round(Math.abs(Number(req.body['amount'] ?? 0)))
    const date = sanitizeText(req.body['date'], 64)
    const description = sanitizeText(req.body['description'], 255)
    const categoryInput = sanitizeText(req.body['category'], 32).toLowerCase()
    const categories = ['income', 'expense', 'transfer', 'unclassified']
    const manualCategory = categories.includes(categoryInput) ? categoryInput : 'unclassified'

    if (!amount || !date || !description) {
      return res.status(400).json({ error: 'Amount, date and description are required' })
    }

    let [manualAccount] = await db
      .select()
      .from(bankAccounts)
      .where(
        and(eq(bankAccounts.entrepreneurId, entrepreneur.id), eq(bankAccounts.provider, 'manual')),
      )

    if (!manualAccount) {
      const inserted = await db
        .insert(bankAccounts)
        .values({
          entrepreneurId: entrepreneur.id,
          provider: 'manual',
          accountId: `manual-${entrepreneur.id}`,
          currency: 'UAH',
          tokenEncrypted: null,
          lastSync: new Date().toISOString(),
        })
        .returning()
      manualAccount = inserted[0]
    }

    let category = manualCategory
    if (entrepreneur.subscriptionTier !== 'free' && manualCategory === 'unclassified') {
      const quota = consumeAiQuota(req.userId!, 1)
      category = quota.allowed
        ? (await classifyWithAI(description, amount, 'UAH')).category
        : classifyByRules(description, amount).category
    }

    const [created] = await db
      .insert(transactions)
      .values({
        accountId: manualAccount.id,
        externalId: `manual-${randomUUID()}`,
        date: date.includes('T') ? date : `${date}T12:00:00.000Z`,
        description,
        amount,
        currency: 'UAH',
        exchangeRate: null,
        category,
        clientId: req.body['clientId'] ? Number(req.body['clientId']) : null,
        comment: sanitizeText(req.body['comment'], 500) || null,
        rawData: JSON.stringify({ source: 'manual' }),
      })
      .returning()

    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const accountIds = await getAccountIds(req.userId!)
    if (!accountIds.length) return res.status(404).json({ error: 'Not found' })

    const [tx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, parseInt(req.params['id'] ?? '0', 10)))
    if (!tx || !accountIds.includes(tx.accountId))
      return res.status(404).json({ error: 'Not found' })
    res.json(tx)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10)
    const accountIds = await getAccountIds(req.userId!)
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id))
    if (!tx || !accountIds.includes(tx.accountId))
      return res.status(404).json({ error: 'Not found' })

    const { category, clientId, comment } = req.body as {
      category?: string
      clientId?: number | null
      comment?: string | null
    }
    const updates: Record<string, unknown> = {}
    if (category !== undefined) updates['category'] = category
    if (clientId !== undefined) updates['clientId'] = clientId
    if (comment !== undefined) updates['comment'] = comment
    const [updated] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning()
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/classify', async (req: AuthRequest, res, next) => {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10)
    const accountIds = await getAccountIds(req.userId!)
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id))
    if (!tx || !accountIds.includes(tx.accountId))
      return res.status(404).json({ error: 'Not found' })

    const quota = consumeAiQuota(req.userId!, 1)
    const result = quota.allowed
      ? await classifyWithAI(tx.description, tx.amount, tx.currency)
      : classifyByRules(tx.description, tx.amount)
    const [updated] = await db
      .update(transactions)
      .set({ category: result.category })
      .where(eq(transactions.id, id))
      .returning()
    res.json({ category: result.category, reason: result.reason, transaction: updated })
  } catch (err) {
    next(err)
  }
})

router.post('/classify', async (req: AuthRequest, res, next) => {
  try {
    const entrepreneur = await getEntrepreneurByUserId(req.userId!)
    if (!entrepreneur) return res.status(404).json({ error: 'Entrepreneur not found' })
    const betaFullAccess = true
    if (!betaFullAccess && entrepreneur.subscriptionTier === 'free') {
      return res.status(403).json({ error: 'AI-класифікація зараз недоступна для цього акаунта' })
    }

    const { id } = req.body as { id: number }
    const accountIds = await getAccountIds(req.userId!)
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id))
    if (!tx || !accountIds.includes(tx.accountId))
      return res.status(404).json({ error: 'Not found' })
    const quota = consumeAiQuota(req.userId!, 1)
    const result = quota.allowed
      ? await classifyWithAI(tx.description, tx.amount, tx.currency)
      : classifyByRules(tx.description, tx.amount)
    await db.update(transactions).set({ category: result.category }).where(eq(transactions.id, id))
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
