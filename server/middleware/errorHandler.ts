import type { Request, Response, NextFunction } from 'express'
import { getRequestMeta, logSecurityEvent } from '../utils/securityLog'

interface HttpError extends Error {
  status?: number
  statusCode?: number
}

export function errorHandler(err: HttpError, req: Request, res: Response, _next: NextFunction) {
  const isProd = process.env.NODE_ENV === 'production'
  const status = err.statusCode ?? err.status ?? 500

  if (status === 401 || status === 403 || status === 429) {
    logSecurityEvent('http_error', {
      ...getRequestMeta(req),
      status,
      message: err.message,
    })
  }

  if (!isProd) {
    console.error(err)
  } else if (status >= 500) {
    // Log server errors without stack in production
    console.error(`[error] ${status} ${req.method} ${req.path}: ${err.message}`)
  }

  const message = isProd && status >= 500
    ? 'Внутрішня помилка сервера'
    : err.message || 'Помилка запиту'

  res.status(status).json({ error: message })
}
