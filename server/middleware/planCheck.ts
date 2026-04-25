import { eq } from 'drizzle-orm'
import type { Response, NextFunction } from 'express'
import { db } from '../db'
import { entrepreneurs } from '../db/schema'
import type { AuthRequest } from './auth'
import { TIER_ORDER, type PlanTier } from '../config/plans'

export function requirePlan(minTier: PlanTier) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [ent] = await db.select({
        subscriptionTier: entrepreneurs.subscriptionTier,
        subscriptionExpiresAt: entrepreneurs.subscriptionExpiresAt,
      })
        .from(entrepreneurs)
        .where(eq(entrepreneurs.userId, req.userId!))

      if (!ent) return res.status(403).json({ error: 'Підприємець не знайдений' })

      const tier = (ent.subscriptionTier ?? 'free') as PlanTier
      if ((TIER_ORDER[tier] ?? 0) < TIER_ORDER[minTier]) {
        return res.status(403).json({
          error: 'Потрібна вища підписка',
          requiredTier: minTier,
          upgradeUrl: '/settings#subscription',
        })
      }

      if (ent.subscriptionExpiresAt && new Date(ent.subscriptionExpiresAt) < new Date()) {
        return res.status(403).json({
          error: 'Підписка прострочена',
          upgradeUrl: '/settings#subscription',
        })
      }

      next()
    } catch (err) { next(err) }
  }
}
