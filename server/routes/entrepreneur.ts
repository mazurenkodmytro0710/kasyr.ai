import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { deadlines, entrepreneurs } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { generateDeadlinesForYears, type TaxGroup } from '../services/taxService'

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
    if (!body.taxId || !/^\d{10}$/.test(body.taxId)) {
      return res.status(400).json({ error: 'Tax ID must contain 10 digits' })
    }
    if (!body.regDate) {
      return res.status(400).json({ error: 'Registration date is required' })
    }

    const [existing] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    const values = {
      userId: req.userId!,
      fullName: body.fullName?.trim() || 'Марія Коваленко',
      taxId: body.taxId,
      group,
      regDate: body.regDate,
      kveds: JSON.stringify(body.kveds ?? ['62.01', '62.02']),
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

export default router
