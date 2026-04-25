import { Router } from 'express'
import bcrypt from 'bcrypt'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { randomUUID } from 'node:crypto'
import { db } from '../db'
import { users, entrepreneurs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware, resolveAuthUserId, type AuthRequest } from '../middleware/auth'
import { clearAuthCookie, setAuthCookie, signAuthToken } from '../utils/auth'
import { getRequestMeta, logSecurityEvent } from '../utils/securityLog'
import { sanitizeEmail } from '../utils/sanitize'
import { sendVerificationEmail } from '../services/emailService'
import { getAppUrl } from '../utils/appUrl'

const router = Router()
const BCRYPT_ROUNDS = 12
const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true'

function serializeEntrepreneur(entrepreneur: typeof entrepreneurs.$inferSelect | undefined) {
  if (!entrepreneur) return null

  return {
    ...entrepreneur,
    kveds: JSON.parse(entrepreneur.kveds) as string[],
  }
}

function serializeUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  }
}

function issueAuth(res: Parameters<typeof setAuthCookie>[0], userId: number) {
  const token = signAuthToken(userId)
  setAuthCookie(res, token)
  return token
}

let googleConfigured = false
if (
  !googleConfigured &&
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = sanitizeEmail(profile.emails?.[0]?.value)
          if (!email) {
            return done(new Error('Google profile has no email'))
          }

          const [existingUser] = await db.select().from(users).where(eq(users.email, email))
          if (existingUser) {
            if (!existingUser.isVerified) {
              await db
                .update(users)
                .set({ isVerified: true, verificationToken: null })
                .where(eq(users.id, existingUser.id))
            }
            return done(null, { id: existingUser.id, email: existingUser.email })
          }

          const placeholderHash = await bcrypt.hash(randomUUID(), BCRYPT_ROUNDS)
          const [createdUser] = await db
            .insert(users)
            .values({
              email,
              passwordHash: placeholderHash,
              isVerified: true,
              verificationToken: null,
            })
            .returning()

          return done(null, createdUser ? { id: createdUser.id, email: createdUser.email } : false)
        } catch (error) {
          return done(error as Error)
        }
      },
    ),
  )
  googleConfigured = true
}

function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return 'Пароль мінімум 8 символів'
  if (password.length > 128) return 'Пароль не може перевищувати 128 символів'
  if (!/[A-Z]/.test(password)) return 'Пароль має містити хоча б одну велику літеру'
  if (!/[0-9]/.test(password)) return 'Пароль має містити хоча б одну цифру'
  return null
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string }
    const normalizedEmail = sanitizeEmail(email)
    if (!normalizedEmail) return res.status(400).json({ error: 'Email обовʼязковий' })
    const passwordError = validatePassword(password)
    if (passwordError) return res.status(400).json({ error: passwordError })

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const verificationToken = skipEmailVerification ? null : randomUUID()

    const [user] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        verificationToken,
        isVerified: skipEmailVerification,
      })
      .returning()
    if (!user) return res.status(500).json({ error: 'Failed to create user' })

    if (!skipEmailVerification && verificationToken) {
      // Send verification email (non-blocking — don't fail registration if email fails)
      const appUrl =
        process.env.VITE_CLIENT_ORIGIN ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
      const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`
      const name = normalizedEmail.split('@')[0]
      sendVerificationEmail(normalizedEmail, name, verificationUrl).catch((err) =>
        console.error('[auth] Failed to send verification email:', err),
      )
    }

    const token = issueAuth(res, user.id)
    res.json({ token, user: serializeUser(user), entrepreneur: null })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Цей email вже зареєстровано' })
    }
    next(err)
  }
})

router.get('/verify-email', async (req, res) => {
  const { token } = req.query as { token?: string }
  if (!token) return res.status(400).json({ error: 'Токен відсутній' })

  const [user] = await db.select().from(users).where(eq(users.verificationToken, token))
  if (!user) return res.status(404).json({ error: 'Невалідний або прострочений токен' })
  if (user.isVerified) return res.status(200).json({ ok: true, alreadyVerified: true })

  await db
    .update(users)
    .set({ isVerified: true, verificationToken: null })
    .where(eq(users.id, user.id))

  // Redirect to dashboard with success flag
  const appUrl =
    process.env.VITE_CLIENT_ORIGIN ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
  return res.redirect(`${appUrl}/dashboard?verified=1`)
})

router.post('/resend-verification', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!))
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.isVerified) return res.json({ ok: true, already: true })

    const verificationToken = randomUUID()
    await db.update(users).set({ verificationToken }).where(eq(users.id, user.id))

    const appUrl =
      process.env.VITE_CLIENT_ORIGIN ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`
    const name = user.email.split('@')[0]
    sendVerificationEmail(user.email, name, verificationUrl).catch((err) =>
      console.error('[auth] Failed to send verification email:', err),
    )

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string }
    const normalizedEmail = sanitizeEmail(email)
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail))
    if (!user) {
      logSecurityEvent('auth_login_failed', { ...getRequestMeta(req), email: normalizedEmail })
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      logSecurityEvent('auth_login_failed', {
        ...getRequestMeta(req),
        email: normalizedEmail,
        userId: user.id,
      })
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const [entrepreneur] = await db
      .select()
      .from(entrepreneurs)
      .where(eq(entrepreneurs.userId, user.id))
    const token = issueAuth(res, user.id)
    res.json({
      token,
      user: serializeUser(user),
      entrepreneur: serializeEntrepreneur(entrepreneur),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/me', async (req, res, next) => {
  try {
    const userId = await resolveAuthUserId(req)
    if (!userId) {
      return res.json({ user: null, entrepreneur: null })
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) return res.json({ user: null, entrepreneur: null })
    const [entrepreneur] = await db
      .select()
      .from(entrepreneurs)
      .where(eq(entrepreneurs.userId, userId))
    res.json({
      user: serializeUser(user),
      entrepreneur: serializeEntrepreneur(entrepreneur),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/logout', (_req, res) => {
  clearAuthCookie(res)
  res.json({ ok: true })
})

router.get('/google', (req, res, next) => {
  if (!googleConfigured) {
    return res.status(503).json({ error: 'Google OAuth is not configured' })
  }

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
  })(req, res, next)
})

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!googleConfigured) {
      return res.redirect(`${getAppUrl(req)}/onboarding?error=google_oauth_not_configured`)
    }

    return passport.authenticate('google', {
      session: false,
      failureRedirect: `${getAppUrl(req)}/onboarding?error=google_oauth_failed`,
    })(req, res, next)
  },
  async (req, res, next) => {
    try {
      const authUser = req.user as { id: number; email: string } | undefined
      if (!authUser) {
        return res.redirect(`${getAppUrl(req)}/onboarding?error=google_oauth_failed`)
      }

      const token = issueAuth(res, authUser.id)
      res.redirect(`${getAppUrl(req)}/onboarding?token=${encodeURIComponent(token)}`)
    } catch (error) {
      next(error)
    }
  },
)

export default router
