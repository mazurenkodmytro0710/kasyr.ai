import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import cron from 'node-cron'
import passport from 'passport'
import { and, eq, gte, lte } from 'drizzle-orm'
import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import deadlinesRoutes from './routes/deadlines'
import entrepreneurRoutes from './routes/entrepreneur'
import exportsRoutes from './routes/exports'
import feedbackRoutes from './routes/feedback'
import helpRoutes from './routes/help'
import bankRoutes from './routes/monobank'
import reportsRoutes from './routes/reports'
import subscriptionRoutes from './routes/subscription'
import telegramRoutes from './routes/telegram'
import transactionRoutes from './routes/transactions'
import { initDb } from './db'
import { db } from './db'
import { errorHandler } from './middleware/errorHandler'
import { getNbuRate } from './services/nbuRateService'
import { getMonobankRates } from './services/monobankRateService'
import { syncMonobank } from './services/monobankService'
import { sendDeadlineReminder, sendSubscriptionExpiryWarning } from './services/emailService'
import { sendTelegramReminder } from './services/telegramService'
import { decryptToken } from './utils/crypto'
import { getRequestMeta, logSecurityEvent } from './utils/securityLog'
import { bankAccounts, deadlines, entrepreneurs, users } from './db/schema'

const app = express()
const port = Number(process.env.PORT ?? 3001)
const clientOrigin =
  process.env.VITE_CLIENT_ORIGIN ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

function buildLimiter(windowMs: number, max: number, scope: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logSecurityEvent('rate_limit', { scope, ...getRequestMeta(req) })
      res.status(429).json({ error: 'Too many requests, try again later' })
    },
  })
}

const authLimiter = buildLimiter(15 * 60 * 1000, 100, 'auth')
const bankLimiter = buildLimiter(60 * 1000, 10, 'bank')

initDb()

app.use(helmet())
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === clientOrigin) {
        return callback(null, true)
      }
      logSecurityEvent('cors_blocked', { origin })
      return callback(new Error('Origin not allowed'))
    },
    credentials: true,
  }),
)
app.use(cookieParser(process.env.COOKIE_SECRET ?? 'dev-cookie-secret'))
app.use(express.json({ limit: '1mb' }))
app.use(passport.initialize())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Kasyr.ai API' })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/bank/connect', bankLimiter)
app.use('/api/bank/sync', bankLimiter)
app.use('/api/monobank/connect', bankLimiter)
app.use('/api/monobank/sync', bankLimiter)
app.use('/api/entrepreneur', entrepreneurRoutes)
app.use('/api/exports', exportsRoutes)
app.use('/api/bank', bankRoutes)
app.use('/api/monobank', bankRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/deadlines', deadlinesRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/help', helpRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/subscription', subscriptionRoutes)
app.use('/api/telegram', telegramRoutes)
app.use('/api/transactions', transactionRoutes)

app.get('/api/monobank/currency', async (_req, res, next) => {
  try {
    const rates = await getMonobankRates()
    res.json(rates)
  } catch (error) {
    next(error)
  }
})

app.get('/api/nbu/rate', async (req, res, next) => {
  try {
    const currency = String(req.query['currency'] ?? 'USD')
    const date = String(req.query['date'] ?? new Date().toISOString().slice(0, 10))
    const rate = await getNbuRate(currency, date)
    res.json({ currency: currency.toUpperCase(), date, rate })
  } catch (error) {
    next(error)
  }
})

app.use(errorHandler)

// Serve built frontend in production
import path from 'path'
import { fileURLToPath } from 'url'
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'))
    }
  })
}

app.listen(port, () => {
  console.log(`Kasyr.ai API listening on http://localhost:${port}`)
})

// Auto-sync Monobank every 4 hours
cron.schedule('0 */4 * * *', async () => {
  console.log('[cron] Starting auto-sync for all Monobank accounts...')
  try {
    const allAccounts = await db
      .select({ account: bankAccounts })
      .from(bankAccounts)
      .innerJoin(entrepreneurs, eq(bankAccounts.entrepreneurId, entrepreneurs.id))
      .where(eq(bankAccounts.provider, 'monobank'))
      .then((rows) => rows.map((r) => r.account))

    let total = 0
    for (const account of allAccounts) {
      if (!account.tokenEncrypted) continue
      try {
        const token = decryptToken(account.tokenEncrypted)
        // Cron sync should never spend paid AI credits. Classification can be triggered by the user later.
        const inserted = await syncMonobank(token, account.id, account.lastSync, { allowAi: false })
        if (inserted > 0) {
          await db
            .update(bankAccounts)
            .set({ lastSync: new Date().toISOString() })
            .where(eq(bankAccounts.id, account.id))
          total += inserted
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[cron] Sync failed for account ${account.id}:`, msg)
      }
    }
    console.log(`[cron] Auto-sync done. Inserted: ${total}`)
  } catch (err) {
    console.error('[cron] Auto-sync error:', err)
  }
})
console.log('[cron] Auto-sync scheduled every 4 hours')

// Daily deadline reminders at 9:00
cron.schedule('0 9 * * *', async () => {
  console.log('[cron] Checking deadlines for reminders...')
  try {
    const today = new Date().toISOString().slice(0, 10)
    const in7days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    const upcoming = await db
      .select({
        deadline: deadlines,
        entrepreneur: entrepreneurs,
        user: users,
      })
      .from(deadlines)
      .innerJoin(entrepreneurs, eq(deadlines.entrepreneurId, entrepreneurs.id))
      .innerJoin(users, eq(entrepreneurs.userId, users.id))
      .where(
        and(
          eq(deadlines.status, 'pending'),
          gte(deadlines.dueDate, today),
          lte(deadlines.dueDate, in7days),
        ),
      )

    for (const row of upcoming) {
      const daysLeft = Math.ceil((new Date(row.deadline.dueDate).getTime() - Date.now()) / 86400000)
      if ([7, 3, 1, 0].includes(daysLeft)) {
        if (row.entrepreneur.emailNotifications) {
          await sendDeadlineReminder(
            row.user.email,
            row.entrepreneur.fullName || 'ФОП',
            row.deadline.type,
            row.deadline.period,
            row.deadline.dueDate,
            row.deadline.amount,
            daysLeft,
          )
        }

        if (row.entrepreneur.telegramChatId && row.entrepreneur.telegramNotifications) {
          await sendTelegramReminder(
            row.entrepreneur.telegramChatId,
            `⏰ *Нагадування Kasyr.ai*\n\nДедлайн: *${row.deadline.type}*\nСтрок: ${row.deadline.dueDate}\nСума: ${row.deadline.amount ?? 0} ₴\nЗалишилось: ${daysLeft} днів`,
          )
        }
      }
    }
    console.log(`[cron] Deadline reminders processed for ${upcoming.length} entries`)
  } catch (err) {
    console.error('[cron] Reminder error:', err)
  }
})

// Subscription expiry warnings at 11:00 daily
cron.schedule('0 11 * * *', async () => {
  console.log('[cron] Checking subscription expiries...')
  try {
    const today = new Date()
    const warnings = [7, 3, 1] // days before expiry to warn

    for (const daysLeft of warnings) {
      const targetDate = new Date(today.getTime() + daysLeft * 86400000).toISOString().slice(0, 10)

      const expiring = await db
        .select({ user: users, entrepreneur: entrepreneurs })
        .from(entrepreneurs)
        .innerJoin(users, eq(entrepreneurs.userId, users.id))
        .where(
          and(
            gte(entrepreneurs.subscriptionExpiresAt, `${targetDate}T00:00:00.000Z`),
            lte(entrepreneurs.subscriptionExpiresAt, `${targetDate}T23:59:59.999Z`),
          ),
        )

      for (const row of expiring) {
        if (!row.entrepreneur.emailNotifications) continue
        const tier = row.entrepreneur.subscriptionTier
        if (tier === 'free') continue // free never expires
        const planName = tier === 'pro' ? 'Pro' : 'Business'
        await sendSubscriptionExpiryWarning(
          row.user.email,
          row.entrepreneur.fullName || 'ФОП',
          planName,
          row.entrepreneur.subscriptionExpiresAt ?? '',
          daysLeft,
        )
      }
    }
    console.log('[cron] Subscription expiry check done')
  } catch (err) {
    console.error('[cron] Subscription expiry error:', err)
  }
})
