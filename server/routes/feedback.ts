import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { entrepreneurs, users } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { sendFeedbackEmail } from '../services/emailService'
import { sanitizeText } from '../utils/sanitize'
import { getRequestMeta, logSecurityEvent } from '../utils/securityLog'

const router = Router()

const ALLOWED_SUBJECTS = ['Баг', 'Пропозиція', 'Питання', 'Інше'] as const
const FEEDBACK_TO = 'kasyr.ai.help@gmail.com'

// Rate-limit: max 3 submissions per hour per user (by IP as fallback)
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('rate_limit', { scope: 'feedback', ...getRequestMeta(req) })
    res.status(429).json({ error: 'Надто багато звернень. Спробуй через годину.' })
  },
})

router.use(authMiddleware)
router.use(feedbackLimiter)

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const subject = String(req.body['subject'] ?? '').trim()
    const message = sanitizeText(req.body['message'], 2000)

    if (!ALLOWED_SUBJECTS.includes(subject as (typeof ALLOWED_SUBJECTS)[number])) {
      return res.status(400).json({ error: 'Невірна тема. Оберіть одну з: ' + ALLOWED_SUBJECTS.join(', ') })
    }
    if (!message || message.length < 20) {
      return res.status(400).json({ error: 'Повідомлення повинно містити мінімум 20 символів' })
    }

    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, req.userId!))
    const [ent] = await db.select({ fullName: entrepreneurs.fullName }).from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))

    const fromName = sanitizeText(ent?.fullName ?? req.body['name'] ?? 'Користувач', 100)
    const fromEmail = user?.email ?? 'unknown'

    await sendFeedbackEmail({
      to: FEEDBACK_TO,
      fromName,
      fromEmail,
      subject,
      message,
      userId: req.userId!,
    })

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
