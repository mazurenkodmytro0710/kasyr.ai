import { and, eq } from 'drizzle-orm'
import type { Response, NextFunction } from 'express'
import { db } from '../db'
import { bankAccounts, deadlines, entrepreneurs, transactions } from '../db/schema'
import type { AuthRequest } from './auth'

async function getEntrepreneurId(userId: number): Promise<number | null> {
  const [ent] = await db.select({ id: entrepreneurs.id })
    .from(entrepreneurs)
    .where(eq(entrepreneurs.userId, userId))
  return ent?.id ?? null
}

export async function checkBankAccountOwnership(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const accountId = parseInt(req.params['id'] ?? '0', 10)
    const entId = await getEntrepreneurId(req.userId!)
    if (!entId) return res.status(403).json({ error: 'Доступ заборонено' })

    const [acc] = await db.select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.entrepreneurId, entId)))

    if (!acc) return res.status(403).json({ error: 'Доступ заборонено' })
    next()
  } catch (err) { next(err) }
}

export async function checkTransactionOwnership(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const txId = parseInt(req.params['id'] ?? '0', 10)
    const entId = await getEntrepreneurId(req.userId!)
    if (!entId) return res.status(403).json({ error: 'Доступ заборонено' })

    const [tx] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .innerJoin(bankAccounts, eq(transactions.accountId, bankAccounts.id))
      .where(and(eq(transactions.id, txId), eq(bankAccounts.entrepreneurId, entId)))

    if (!tx) return res.status(403).json({ error: 'Доступ заборонено' })
    next()
  } catch (err) { next(err) }
}

export async function checkDeadlineOwnership(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dlId = parseInt(req.params['id'] ?? '0', 10)
    const entId = await getEntrepreneurId(req.userId!)
    if (!entId) return res.status(403).json({ error: 'Доступ заборонено' })

    const [dl] = await db.select({ id: deadlines.id })
      .from(deadlines)
      .where(and(eq(deadlines.id, dlId), eq(deadlines.entrepreneurId, entId)))

    if (!dl) return res.status(403).json({ error: 'Доступ заборонено' })
    next()
  } catch (err) { next(err) }
}
