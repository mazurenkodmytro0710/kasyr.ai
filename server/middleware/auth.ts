import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { AUTH_COOKIE_NAME, readBearerToken } from '../utils/auth'
import { getRequestMeta, logSecurityEvent } from '../utils/securityLog'

export interface AuthRequest extends Request {
  userId?: number
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const bearerToken = readBearerToken(req.headers.authorization)
  const cookieToken = req.signedCookies?.[AUTH_COOKIE_NAME] ?? req.cookies?.[AUTH_COOKIE_NAME]
  const token = bearerToken ?? cookieToken

  if (!token) {
    logSecurityEvent('auth_missing_token', getRequestMeta(req))
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret') as { userId: number }
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, payload.userId))

    if (!user) {
      logSecurityEvent('auth_unknown_user', { ...getRequestMeta(req), userId: payload.userId })
      return res.status(401).json({ error: 'Unauthorized' })
    }

    req.userId = payload.userId
    return next()
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Invalid token'
    logSecurityEvent('auth_invalid_token', { ...getRequestMeta(req), reason })
    return res.status(401).json({ error: 'Invalid token' })
  }
}
