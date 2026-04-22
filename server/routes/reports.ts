import { Router } from 'express'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { entrepreneurs, reports } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'

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

export default router
