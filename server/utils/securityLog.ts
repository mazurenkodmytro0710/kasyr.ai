import fs from 'node:fs'
import path from 'node:path'
import type { Request } from 'express'

const logDir = path.resolve(process.cwd(), 'server/logs')

interface SecurityDetails {
  [key: string]: unknown
}

function ensureLogDir() {
  fs.mkdirSync(logDir, { recursive: true })
}

export function getRequestMeta(req: Request): SecurityDetails {
  return {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
    origin: req.headers.origin ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  }
}

export function logSecurityEvent(event: string, details: SecurityDetails = {}) {
  ensureLogDir()
  const filePath = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`)
  const payload = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  }
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, 'utf8')
}
