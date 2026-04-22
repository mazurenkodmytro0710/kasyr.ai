import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { users, entrepreneurs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware, type AuthRequest } from '../middleware/auth'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string }
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Email and password (min 8 chars) required' })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const [user] = await db.insert(users).values({ email, passwordHash }).returning()
    if (!user) return res.status(500).json({ error: 'Failed to create user' })
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
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
    const [user] = await db.select().from(users).where(eq(users.email, email))
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, user.id))
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({
      token,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      entrepreneur: entrepreneur ? {
        ...entrepreneur,
        kveds: JSON.parse(entrepreneur.kveds) as string[],
      } : null,
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
      entrepreneur: entrepreneur ? {
        ...entrepreneur,
        kveds: JSON.parse(entrepreneur.kveds) as string[],
      } : null,
    })
  } catch (err) { next(err) }
})

export default router
