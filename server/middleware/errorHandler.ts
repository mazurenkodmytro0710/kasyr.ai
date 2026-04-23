import type { Request, Response, NextFunction } from 'express'
import { getRequestMeta, logSecurityEvent } from '../utils/securityLog'

interface HttpError extends Error {
  status?: number
  statusCode?: number
}

export function errorHandler(err: HttpError, req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode ?? err.status ?? 500

  if (status === 401 || status === 429) {
    logSecurityEvent('http_error', {
      ...getRequestMeta(req),
      status,
      message: err.message,
    })
  }

  console.error(err)
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message || 'Request failed',
  })
}
