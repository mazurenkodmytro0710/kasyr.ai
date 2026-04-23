import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '../db'
import { clients, deadlines, entrepreneurs } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { generateDeadlinesForYears, type TaxGroup } from '../services/taxService'
import { getTelegramBotUrl } from '../services/telegramService'
import { sanitizeKveds, sanitizeTaxId, sanitizeText } from '../utils/sanitize'

const router = Router()
router.use(authMiddleware)

interface EntrepreneurBody {
  fullName?: string
  taxId?: string
  group?: TaxGroup
  regDate?: string
  kveds?: string[]
}

function serializeEntrepreneur(entrepreneur: typeof entrepreneurs.$inferSelect) {
  return {
    ...entrepreneur,
    kveds: JSON.parse(entrepreneur.kveds) as string[],
  }
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    res.json(entrepreneur ? serializeEntrepreneur(entrepreneur) : null)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as EntrepreneurBody
    const group = body.group ?? 3
    if (![1, 2, 3].includes(group)) {
      return res.status(400).json({ error: 'Invalid tax group' })
    }
    const taxId = sanitizeTaxId(body.taxId)
    if (!taxId || !/^\d{10}$/.test(taxId)) {
      return res.status(400).json({ error: 'Tax ID must contain 10 digits' })
    }
    const regDate = sanitizeText(body.regDate, 32)
    if (!regDate) {
      return res.status(400).json({ error: 'Registration date is required' })
    }

    const [existing] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    const values = {
      userId: req.userId!,
      fullName: sanitizeText(body.fullName || existing?.fullName || 'Марія Коваленко', 120),
      taxId,
      group,
      regDate,
      kveds: JSON.stringify(sanitizeKveds(body.kveds).length ? sanitizeKveds(body.kveds) : ['62.01', '62.02']),
    }

    const [entrepreneur] = existing
      ? await db.update(entrepreneurs).set(values).where(eq(entrepreneurs.id, existing.id)).returning()
      : await db.insert(entrepreneurs).values(values).returning()

    if (!entrepreneur) return res.status(500).json({ error: 'Failed to save entrepreneur' })

    if (!existing) {
      const year = new Date().getFullYear()
      await db.insert(deadlines).values(generateDeadlinesForYears(entrepreneur.id, group, [year, year + 1]))
    }

    res.json(serializeEntrepreneur(entrepreneur))
  } catch (error) {
    next(error)
  }
})

router.get('/clients', async (req: AuthRequest, res, next) => {
  try {
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.json([])

    const rows = await db.select().from(clients).where(eq(clients.entrepreneurId, entrepreneur.id))
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

router.patch('/preferences', async (req: AuthRequest, res, next) => {
  try {
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.status(404).json({ error: 'Entrepreneur not found' })

    const nextTier = sanitizeText(req.body['subscriptionTier'], 16).toLowerCase()
    const tier = ['free', 'pro', 'business'].includes(nextTier)
      ? nextTier
      : entrepreneur.subscriptionTier

    const [updated] = await db
      .update(entrepreneurs)
      .set({
        subscriptionTier: tier,
        emailNotifications: req.body['emailNotifications'] ?? entrepreneur.emailNotifications,
        telegramNotifications: req.body['telegramNotifications'] ?? entrepreneur.telegramNotifications,
      })
      .where(eq(entrepreneurs.id, entrepreneur.id))
      .returning()

    if (!updated) return res.status(404).json({ error: 'Entrepreneur not found' })
    res.json(serializeEntrepreneur(updated))
  } catch (error) {
    next(error)
  }
})

router.post('/telegram-link', async (req: AuthRequest, res, next) => {
  try {
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.status(404).json({ error: 'Entrepreneur not found' })

    const linkToken = entrepreneur.telegramLinkToken || randomUUID()
    if (!entrepreneur.telegramLinkToken) {
      await db
        .update(entrepreneurs)
        .set({ telegramLinkToken: linkToken })
        .where(eq(entrepreneurs.id, entrepreneur.id))
    }

    res.json({
      linkToken,
      botUrl: getTelegramBotUrl(linkToken),
      connected: Boolean(entrepreneur.telegramChatId),
    })
  } catch (error) {
    next(error)
  }
})

router.delete('/telegram-link', async (req: AuthRequest, res, next) => {
  try {
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.status(404).json({ error: 'Entrepreneur not found' })

    const [updated] = await db
      .update(entrepreneurs)
      .set({
        telegramChatId: null,
        telegramNotifications: false,
        telegramLinkToken: randomUUID(),
      })
      .where(eq(entrepreneurs.id, entrepreneur.id))
      .returning()

    res.json(serializeEntrepreneur(updated))
  } catch (error) {
    next(error)
  }
})

export default router
