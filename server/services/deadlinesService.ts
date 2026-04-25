import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { deadlines } from '../db/schema'
import {
  calculateDeadlineStatus,
  generateDeadlinesForYears,
  periodYear,
  type DeadlineStatus,
  type GeneratedDeadline,
  type TaxProfile,
} from './taxService'

type DeadlineRow = typeof deadlines.$inferSelect

function signature(
  deadline:
    | Pick<GeneratedDeadline, 'type' | 'period' | 'dueDate'>
    | Pick<DeadlineRow, 'type' | 'period' | 'dueDate'>,
): string {
  return `${deadline.type}|${deadline.period}|${deadline.dueDate}`
}

function isFinalStatus(status: DeadlineStatus): boolean {
  return status === 'paid' || status === 'submitted'
}

export async function syncDeadlinesForEntrepreneur(
  entrepreneurId: number,
  profile: TaxProfile,
  years: number[],
): Promise<DeadlineRow[]> {
  const yearSet = new Set(years)
  let rows = await db.select().from(deadlines).where(eq(deadlines.entrepreneurId, entrepreneurId))

  const targetRows = rows.filter((row) => yearSet.has(periodYear(row.period)))
  const generated = generateDeadlinesForYears(entrepreneurId, profile, years)
  const generatedBySignature = new Map(generated.map((row) => [signature(row), row]))
  const generatedSignatures = new Set(generatedBySignature.keys())

  const obsoleteIds = targetRows
    .filter(
      (row) =>
        !generatedSignatures.has(signature(row)) && !isFinalStatus(row.status as DeadlineStatus),
    )
    .map((row) => row.id)

  if (obsoleteIds.length > 0) {
    await db
      .delete(deadlines)
      .where(and(eq(deadlines.entrepreneurId, entrepreneurId), inArray(deadlines.id, obsoleteIds)))
    rows = rows.filter((row) => !obsoleteIds.includes(row.id))
  }

  const existingSignatures = new Set(rows.map((row) => signature(row)))
  const missing = generated.filter((row) => !existingSignatures.has(signature(row)))
  if (missing.length > 0) {
    const today = new Date().toISOString().slice(0, 10)
    const missingWithCorrectStatus = missing.map((deadline) => ({
      ...deadline,
      status: deadline.dueDate < today ? 'paid' : deadline.status,
    }))
    await db.insert(deadlines).values(missingWithCorrectStatus)
  }

  rows = await db.select().from(deadlines).where(eq(deadlines.entrepreneurId, entrepreneurId))

  const updates = rows
    .filter((row) => yearSet.has(periodYear(row.period)))
    .map((row) => {
      const generatedRow = generatedBySignature.get(signature(row))
      if (!generatedRow || isFinalStatus(row.status as DeadlineStatus)) {
        return null
      }

      const nextStatus = calculateDeadlineStatus(row.status as DeadlineStatus, generatedRow.dueDate)
      const nextAmount = generatedRow.amount
      const amountChanged = (row.amount ?? null) !== (nextAmount ?? null)
      const dueDateChanged = row.dueDate !== generatedRow.dueDate
      const statusChanged = row.status !== nextStatus

      if (!amountChanged && !dueDateChanged && !statusChanged) {
        return null
      }

      return {
        id: row.id,
        patch: {
          amount: nextAmount,
          dueDate: generatedRow.dueDate,
          status: nextStatus,
        },
      }
    })
    .filter(
      (
        value,
      ): value is {
        id: number
        patch: { amount: number | null; dueDate: string; status: DeadlineStatus }
      } => Boolean(value),
    )

  for (const update of updates) {
    await db.update(deadlines).set(update.patch).where(eq(deadlines.id, update.id))
  }

  const freshRows = await db
    .select()
    .from(deadlines)
    .where(eq(deadlines.entrepreneurId, entrepreneurId))

  return freshRows
    .filter((row) => yearSet.has(periodYear(row.period)))
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
}
