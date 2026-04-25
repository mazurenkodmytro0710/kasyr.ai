type QuotaResult = {
  allowed: boolean
  limit: number
  used: number
  remaining: number
}

type UsageEntry = {
  used: number
  updatedAt: number
}

// In-memory per-user daily quota for paid AI calls (Grok).
// This is intentionally simple for MVP; if you need persistence, move to SQLite.
const usageByUserDay = new Map<string, UsageEntry>()

function todayKey(): string {
  // UTC day key keeps behavior stable across deployments.
  return new Date().toISOString().slice(0, 10)
}

function mapKey(userId: number, day: string): string {
  return `${userId}:${day}`
}

function readDailyLimit(): number {
  const raw = process.env.AI_DAILY_LIMIT
  const parsed = raw == null ? NaN : Number(raw)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) return 20
  return Math.min(parsed, 500)
}

function pruneOldEntries() {
  const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000
  for (const [key, entry] of usageByUserDay) {
    if (entry.updatedAt < cutoff) usageByUserDay.delete(key)
  }
}

export function consumeAiQuota(userId: number, cost = 1): QuotaResult {
  pruneOldEntries()

  const limit = readDailyLimit()
  const day = todayKey()
  const key = mapKey(userId, day)
  const current = usageByUserDay.get(key) ?? { used: 0, updatedAt: Date.now() }
  const nextUsed = current.used + Math.max(1, cost)

  if (nextUsed > limit) {
    const remaining = Math.max(0, limit - current.used)
    return { allowed: false, limit, used: current.used, remaining }
  }

  usageByUserDay.set(key, { used: nextUsed, updatedAt: Date.now() })
  return { allowed: true, limit, used: nextUsed, remaining: Math.max(0, limit - nextUsed) }
}

export function getAiQuotaStatus(userId: number): QuotaResult {
  pruneOldEntries()
  const limit = readDailyLimit()
  const day = todayKey()
  const key = mapKey(userId, day)
  const current = usageByUserDay.get(key) ?? { used: 0, updatedAt: Date.now() }
  return {
    allowed: current.used < limit,
    limit,
    used: current.used,
    remaining: Math.max(0, limit - current.used),
  }
}

