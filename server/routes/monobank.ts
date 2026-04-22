import { Router } from 'express'
import { db } from '../db'
import { bankAccounts, entrepreneurs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { MonoApiError, MonoRateLimitError, syncMonobank, verifyToken } from '../services/monobankService'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const router = Router()
router.use(authMiddleware)

function encryptToken(token: string): string {
  const key = scryptSync(process.env.JWT_SECRET ?? 'dev-secret', 'kasyr-monobank', 32)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

function decryptToken(encrypted: string): string {
  const [ivHex, tagHex, dataHex] = encrypted.split(':')
  if (!ivHex || !tagHex || !dataHex) throw new Error('Invalid encrypted token payload')

  const key = scryptSync(process.env.JWT_SECRET ?? 'dev-secret', 'kasyr-monobank', 32)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}

router.post('/connect', async (req: AuthRequest, res, next) => {
  try {
    const { provider, token } = req.body as { provider: string; token: string }
    const [ent] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!ent) return res.status(400).json({ error: 'Complete entrepreneur setup first' })

    if (provider === 'monobank') {
      const clientInfo = await verifyToken(token)
      const primaryAccount = clientInfo.accounts.find(account => account.currencyCode === 980) ?? clientInfo.accounts[0]
      if (!primaryAccount) return res.status(400).json({ error: 'No Monobank accounts found' })

      const encrypted = encryptToken(token)
      const [account] = await db.insert(bankAccounts).values({
        entrepreneurId: ent.id,
        provider: 'monobank',
        tokenEncrypted: encrypted,
        accountId: primaryAccount.id,
        currency: primaryAccount.currencyCode === 980 ? 'UAH' : String(primaryAccount.currencyCode),
        lastSync: null,
      }).returning()
      return res.json(account)
    }

    res.status(400).json({ error: 'Unsupported provider' })
  } catch (err) {
    if (err instanceof MonoRateLimitError) {
      return res.status(429).json({ error: 'Monobank дозволяє один запит на 60 секунд. Спробуй трохи пізніше.' })
    }
    if (err instanceof MonoApiError) {
      const message = err.status === 403
        ? 'Monobank відхилив токен. Перевір, що він скопійований повністю, або використай demo-token для локального MVP.'
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
    await db.delete(bankAccounts).where(eq(bankAccounts.id, parseInt(req.params['id'] ?? '0', 10)))
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
          const synced = await syncMonobank(token, acc.id, acc.lastSync)
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
