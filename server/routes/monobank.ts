import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { bankAccounts, entrepreneurs } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { MonoApiError, MonoRateLimitError, syncMonobank, verifyToken } from '../services/monobankService'
import { encryptToken, decryptToken } from '../utils/crypto'

const router = Router()
router.use(authMiddleware)

router.post('/connect', async (req: AuthRequest, res, next) => {
  try {
    const { provider, token } = req.body as { provider: string; token: string }
    const [ent] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!ent) return res.status(400).json({ error: 'Complete entrepreneur setup first' })

    if (provider === 'monobank') {
      const cleanToken = String(token ?? '').replace(/\s+/g, '').slice(0, 512)
      const clientInfo = await verifyToken(cleanToken)
      const primaryAccount = clientInfo.accounts.find(account => account.currencyCode === 980) ?? clientInfo.accounts[0]
      if (!primaryAccount) return res.status(400).json({ error: 'No Monobank accounts found' })

      // Detect if it's a personal account (not FOP)
      const clientType: string = (clientInfo as { clientId?: string; type?: string }).type ?? ''
      const isFop = clientType === 'fop'
      const warning = !isFop
        ? 'Підключено особистий рахунок. Дані відображаються, але розрахунок податків призначений для ФОП-рахунків.'
        : undefined

      const encrypted = encryptToken(cleanToken)
      const [account] = await db.insert(bankAccounts).values({
        entrepreneurId: ent.id,
        provider: 'monobank',
        tokenEncrypted: encrypted,
        accountId: primaryAccount.id,
        currency: primaryAccount.currencyCode === 980 ? 'UAH' : String(primaryAccount.currencyCode),
        lastSync: null,
      }).returning()
      return res.json({ ...account, warning })
    }

    res.status(400).json({ error: 'Unsupported provider' })
  } catch (err) {
    if (err instanceof MonoRateLimitError) {
      return res.status(429).json({ error: 'Monobank дозволяє один запит на 60 секунд. Спробуй трохи пізніше.' })
    }
    if (err instanceof MonoApiError) {
      const message =
        err.status === 400 || err.status === 403
          ? 'Monobank відхилив токен. Перевір, що він скопійований повністю і без зайвих пробілів. Особисті та FOP-токени підтримуються.'
          : 'Не вдалося підключити Monobank. Спробуй ще раз пізніше.'
      return res.status(400).json({ error: message })
    }
    next(err)
  }
})

router.get('/accounts', async (req: AuthRequest, res, next) => {
  try {
    const [ent] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!ent) return res.json([])
    const accounts = await db.select().from(bankAccounts).where(eq(bankAccounts.entrepreneurId, ent.id))
    res.json(accounts.map(a => ({ ...a, tokenEncrypted: undefined })))
  } catch (err) { next(err) }
})

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = parseInt(req.params['id'] ?? '0', 10)
    const [account] = await db
      .select({
        id: bankAccounts.id,
        entrepreneurId: bankAccounts.entrepreneurId,
      })
      .from(bankAccounts)
      .innerJoin(entrepreneurs, eq(bankAccounts.entrepreneurId, entrepreneurs.id))
      .where(and(eq(bankAccounts.id, id), eq(entrepreneurs.userId, req.userId!)))

    if (!account) return res.status(404).json({ error: 'Account not found' })

    await db.delete(bankAccounts).where(eq(bankAccounts.id, id))
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.post('/sync', async (req: AuthRequest, res, next) => {
  try {
    const [ent] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!ent) return res.status(400).json({ error: 'No entrepreneur found' })

    const accounts = await db.select().from(bankAccounts).where(eq(bankAccounts.entrepreneurId, ent.id))
    let totalSynced = 0

    for (const acc of accounts) {
      if (acc.provider === 'monobank' && acc.tokenEncrypted) {
        const token = decryptToken(acc.tokenEncrypted)
        try {
          const synced = await syncMonobank(token, acc.id, acc.lastSync, {
            userId: req.userId!,
            allowAi: true,
          })
          totalSynced += synced
        } catch (error) {
          if (!(error instanceof MonoRateLimitError)) throw error
        }
        await db.update(bankAccounts).set({ lastSync: new Date().toISOString() }).where(eq(bankAccounts.id, acc.id))
      }
    }

    res.json({ synced: totalSynced })
  } catch (err) { next(err) }
})

export default router
