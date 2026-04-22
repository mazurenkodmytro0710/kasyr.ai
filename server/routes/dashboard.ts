import { Router } from 'express'
import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { bankAccounts, deadlines, entrepreneurs, transactions } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { calculateTaxes, currentQuarter, getQuarterBounds, type TaxGroup } from '../services/taxService'

const router = Router()
router.use(authMiddleware)

function monthLabel(monthIndex: number): string {
  const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру']
  return months[monthIndex] ?? ''
}

function daysLeft(date: string): number {
  const today = new Date()
  const due = new Date(`${date}T23:59:59.999Z`)
  const diff = due.getTime() - today.getTime()
  return Math.ceil(diff / 86_400_000)
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) {
      return res.json({
        totalDue: { ep: 0, esv: 0, vz: 0, total: 0 },
        nextDeadline: null,
        quarterIncome: { uah: 0, usd: 0 },
        monthlyChart: [],
        recentTransactions: [],
        bookStatus: { isUpToDate: true, pendingCount: 0, lastSyncAt: null },
      })
    }

    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.entrepreneurId, entrepreneur.id))
    const accountIds = accounts.map((account) => account.id)

    const now = new Date()
    const quarter = currentQuarter(now)
    const { start, end } = getQuarterBounds(now.getFullYear(), quarter)

    const quarterTransactions = accountIds.length
      ? await db
        .select()
        .from(transactions)
        .where(and(
          inArray(transactions.accountId, accountIds),
          gte(transactions.date, start),
          lte(transactions.date, end),
        ))
      : []

    const quarterIncome = quarterTransactions
      .filter((transaction) => transaction.category === 'income' && transaction.amount > 0)
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    const chartMonths = [0, 1, 2].map((offset) => {
      const monthIndex = (quarter - 1) * 3 + offset
      const amount = quarterTransactions
        .filter((transaction) => {
          const date = new Date(transaction.date)
          return date.getUTCMonth() === monthIndex && transaction.category === 'income' && transaction.amount > 0
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0)
      return { month: monthLabel(monthIndex), amount }
    })

    const recentTransactions = accountIds.length
      ? await db
        .select()
        .from(transactions)
        .where(inArray(transactions.accountId, accountIds))
        .orderBy(desc(transactions.date))
        .limit(5)
      : []

    const [nextDeadline] = await db
      .select()
      .from(deadlines)
      .where(and(
        eq(deadlines.entrepreneurId, entrepreneur.id),
        eq(deadlines.status, 'pending'),
        gte(deadlines.dueDate, now.toISOString().slice(0, 10)),
      ))
      .orderBy(asc(deadlines.dueDate))
      .limit(1)

    const [{ pendingCount }] = accountIds.length
      ? await db
        .select({ pendingCount: sql<number>`count(*)` })
        .from(transactions)
        .where(and(inArray(transactions.accountId, accountIds), eq(transactions.category, 'unclassified')))
      : [{ pendingCount: 0 }]

    const lastSyncAt = accounts
      .map((account) => account.lastSync)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null

    const taxes = calculateTaxes(entrepreneur.group as TaxGroup, quarterIncome)

    res.json({
      totalDue: taxes,
      nextDeadline: nextDeadline
        ? {
          date: nextDeadline.dueDate,
          daysLeft: daysLeft(nextDeadline.dueDate),
          type: nextDeadline.type,
          amount: nextDeadline.amount ?? 0,
        }
        : null,
      quarterIncome: {
        uah: quarterIncome,
        usd: Math.round(quarterIncome / 41.4),
      },
      monthlyChart: chartMonths,
      recentTransactions,
      bookStatus: {
        isUpToDate: pendingCount === 0,
        pendingCount,
        lastSyncAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
