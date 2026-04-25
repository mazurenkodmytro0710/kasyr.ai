import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { entrepreneurs } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { getTelegramBotUrl } from '../services/telegramService'

const router = Router()
router.use(authMiddleware)

router.get('/link-token', async (req: AuthRequest, res, next) => {
  try {
    const [ent] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!ent) return res.status(404).json({ error: 'Entrepreneur not found' })

    let { telegramLinkToken } = ent
    if (!telegramLinkToken) {
      telegramLinkToken = randomUUID()
      await db.update(entrepreneurs)
        .set({ telegramLinkToken })
        .where(eq(entrepreneurs.id, ent.id))
    }

    res.json({
      linkToken: telegramLinkToken,
      botUsername: process.env.TELEGRAM_BOT_USERNAME ?? null,
      botUrl: getTelegramBotUrl(telegramLinkToken),
      connected: Boolean(ent.telegramChatId),
      chatId: ent.telegramChatId,
    })
  } catch (err) { next(err) }
})

router.delete('/disconnect', async (req: AuthRequest, res, next) => {
  try {
    const [ent] = await db.select({ id: entrepreneurs.id }).from(entrepreneurs)
      .where(eq(entrepreneurs.userId, req.userId!))
    if (!ent) return res.status(404).json({ error: 'Entrepreneur not found' })

    await db.update(entrepreneurs)
      .set({ telegramChatId: null, telegramNotifications: false, telegramLinkToken: null })
      .where(eq(entrepreneurs.id, ent.id))

    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
