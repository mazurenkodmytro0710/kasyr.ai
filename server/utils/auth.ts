import type { Response } from 'express'
import jwt, { type SignOptions } from 'jsonwebtoken'

export const AUTH_COOKIE_NAME = 'kasyr_auth'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

function parseDurationToMs(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/i)
  if (!match) return 7 * 24 * 60 * 60 * 1000

  const amount = Number(match[1] ?? 7)
  const unit = (match[2] ?? 'd').toLowerCase()
  const multiplierMap: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return amount * (multiplierMap[unit] ?? multiplierMap['d'])
}

function cookieBaseOptions() {
  return {
    httpOnly: true,
    signed: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: parseDurationToMs(JWT_EXPIRES_IN),
    path: '/',
  }
}

export function signAuthToken(userId: number): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] },
  )
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, cookieBaseOptions())
}

export function clearAuthCookie(res: Response) {
  const { maxAge, ...clearOptions } = cookieBaseOptions()
  void maxAge
  res.clearCookie(AUTH_COOKIE_NAME, clearOptions)
}

export function readBearerToken(header?: string | null): string | null {
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7)
}
