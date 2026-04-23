import { Router } from 'express'
import bcrypt from 'bcrypt'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { randomUUID } from 'node:crypto'
import { db } from '../db'
import { users, entrepreneurs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { clearAuthCookie, setAuthCookie, signAuthToken } from '../utils/auth'
import { getRequestMeta, logSecurityEvent } from '../utils/securityLog'
import { sanitizeEmail } from '../utils/sanitize'

const router = Router()
const clientOrigin = process.env.VITE_CLIENT_ORIGIN ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
const BCRYPT_ROUNDS = 12

function serializeEntrepreneur(entrepreneur: typeof entrepreneurs.$inferSelect | undefined) {
  if (!entrepreneur) return null

  return {
    ...entrepreneur,
    kveds: JSON.parse(entrepreneur.kveds) as string[],
  }
}

function issueAuth(res: Parameters<typeof setAuthCookie>[0], userId: number) {
  const token = signAuthToken(userId)
  setAuthCookie(res, token)
  return token
}

let googleConfigured = false
if (!googleConfigured && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(new GoogleStrategy(
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
          return done(null, { id: existingUser.id, email: existingUser.email })
        }

        const placeholderHash = await bcrypt.hash(randomUUID(), BCRYPT_ROUNDS)
        const [createdUser] = await db
          .insert(users)
          .values({ email, passwordHash: placeholderHash })
          .returning()

        return done(null, createdUser ? { id: createdUser.id, email: createdUser.email } : false)
      } catch (error) {
        return done(error as Error)
      }
    },
  ))
  googleConfigured = true
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string }
    const normalizedEmail = sanitizeEmail(email)
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Email and password (min 8 chars) required' })
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const [user] = await db.insert(users).values({ email: normalizedEmail, passwordHash }).returning()
    if (!user) return res.status(500).json({ error: 'Failed to create user' })
    const token = issueAuth(res, user.id)
    res.json({ token, user: { id: user.id, email: user.email, createdAt: user.createdAt }, entrepreneur: null })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already taken' })
    }
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
      logSecurityEvent('auth_login_failed', { ...getRequestMeta(req), email: normalizedEmail, userId: user.id })
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, user.id))
    const token = issueAuth(res, user.id)
    res.json({
      token,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      entrepreneur: serializeEntrepreneur(entrepreneur),
    })
  } catch (err) { next(err) }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!))
    if (!user) return res.status(404).json({ error: 'User not found' })
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    res.json({
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      entrepreneur: serializeEntrepreneur(entrepreneur),
    })
  } catch (err) { next(err) }
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
      return res.redirect(`${clientOrigin}/onboarding?error=google_oauth_not_configured`)
    }

    return passport.authenticate('google', {
      session: false,
      failureRedirect: `${clientOrigin}/onboarding?error=google_oauth_failed`,
    })(req, res, next)
  },
  async (req, res, next) => {
    try {
      const authUser = req.user as { id: number; email: string } | undefined
      if (!authUser) {
        return res.redirect(`${clientOrigin}/onboarding?error=google_oauth_failed`)
      }

      const token = issueAuth(res, authUser.id)
      res.redirect(`${clientOrigin}/onboarding?token=${encodeURIComponent(token)}`)
    } catch (error) {
      next(error)
    }
  },
)

export default router
