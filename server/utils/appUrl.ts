import { Request } from 'express'

const DEFAULT_ORIGIN = process.env.VITE_CLIENT_ORIGIN ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
const LOCAL_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  DEFAULT_ORIGIN,
]

/**
 * Повертає публічний URL фронтенду для генерації посилань у email.
 *
 * Пріоритет:
 * 1. process.env.APP_URL (використовується в production)
 * 2. Якщо NODE_ENV === 'production' і APP_URL не задано — кидає помилку
 * 3. Якщо переданий req — пробує визначити origin з заголовків (для development)
 * 4. Fallback: DEFAULT_ORIGIN ( з VITE_CLIENT_ORIGIN/CLIENT_ORIGIN або 'http://localhost:5173' )
 */
export function getAppUrl(req?: Request): string {
  // 1. APP_URL має пріоритет (configured production URL)
  if (process.env.APP_URL) {
    return process.env.APP_URL
  }

  // 2. У production APP_URL обов'язковий
  if (process.env.NODE_ENV === 'production') {
    throw new Error('APP_URL environment variable is required in production')
  }

  // 3. Development: спробувати визначити origin з request
  if (req) {
    const origin = req.headers.origin || req.headers.referer
    if (origin) {
      const isLocal = LOCAL_ORIGINS.includes(origin)
      const isCloudflareDev = typeof origin === 'string' && origin.endsWith('.trycloudflare.com')
      if (isLocal || isCloudflareDev) {
        return origin
      }
    }
  }

  // 4. Fallback для development (локальний запуск або коли req не передано)
  return DEFAULT_ORIGIN
}

