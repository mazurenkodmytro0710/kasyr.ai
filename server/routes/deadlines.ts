import { Router } from 'express'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db'
import { deadlines, entrepreneurs } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { generateDeadlinesForYears, type TaxGroup } from '../services/taxService'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const currentYear = new Date().getFullYear()
    const allowedYears = [currentYear, currentYear + 1]
    const year = Number(req.query['year'] ?? currentYear)
    if (!allowedYears.includes(year)) {
      return res.status(400).json({ error: 'Only current year and next year are available' })
    }

    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.json([])

    let rows = await db
      .select()
      .from(deadlines)
      .where(eq(deadlines.entrepreneurId, entrepreneur.id))
      .orderBy(asc(deadlines.dueDate))

    if (rows.length === 0) {
      const generated = generateDeadlinesForYears(
        entrepreneur.id,
        entrepreneur.group as TaxGroup,
        [currentYear, currentYear + 1],
      )
      if (generated.length > 0) {
        await db.insert(deadlines).values(generated)
        rows = await db
          .select()
          .from(deadlines)
          .where(eq(deadlines.entrepreneurId, entrepreneur.id))
          .orderBy(asc(deadlines.dueDate))
      }
    }

    res.json(rows.filter((deadline) => deadline.period.endsWith(String(year))))
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params['id'])
    const status = String(req.body['status'] ?? '')
    if (!['pending', 'paid', 'overdue', 'submitted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.status(404).json({ error: 'Entrepreneur not found' })

    const [deadline] = await db
      .select()
      .from(deadlines)
      .where(and(eq(deadlines.id, id), eq(deadlines.entrepreneurId, entrepreneur.id)))

    if (!deadline) return res.status(404).json({ error: 'Not found' })

    const [updated] = await db
      .update(deadlines)
      .set({ status })
      .where(and(eq(deadlines.id, id), eq(deadlines.entrepreneurId, entrepreneur.id)))
      .returning()

    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

export default router
