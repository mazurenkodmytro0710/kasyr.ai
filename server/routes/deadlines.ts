import { Router } from 'express'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db'
import { deadlines, entrepreneurs } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const year = String(req.query['year'] ?? new Date().getFullYear())
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.json([])

    const rows = await db
      .select()
      .from(deadlines)
      .where(eq(deadlines.entrepreneurId, entrepreneur.id))
      .orderBy(asc(deadlines.dueDate))

    res.json(rows.filter((deadline) => deadline.period.endsWith(year)))
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

    const [updated] = await db
      .update(deadlines)
      .set({ status })
      .where(eq(deadlines.id, id))
      .returning()

    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

export default router
