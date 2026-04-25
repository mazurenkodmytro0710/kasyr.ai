import { Router } from 'express'
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { bankAccounts, entrepreneurs, transactions } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import {
  calculateTaxes,
  currentQuarter,
  getIncomeLimit,
  getLegalNotes,
  getQuarterBounds,
  getTaxProfile,
} from '../services/taxService'
import { syncDeadlinesForEntrepreneur } from '../services/deadlinesService'
import { getNbuRate } from '../services/nbuRateService'

const router = Router()
router.use(authMiddleware)

function monthLabel(monthIndex: number): string {
  const months = [
    'Січ',
    'Лют',
    'Бер',
    'Кві',
    'Тра',
    'Чер',
    'Лип',
    'Сер',
    'Вер',
    'Жов',
    'Лис',
    'Гру',
  ]
  return months[monthIndex] ?? ''
}

function daysLeft(date: string): number {
  const today = new Date(new Date().toISOString().slice(0, 10))
  const due = new Date(`${date}T23:59:59.999`)
  const diff = due.getTime() - today.getTime()
  return Math.ceil(diff / 86_400_000)
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const [entrepreneur] = await db
      .select()
      .from(entrepreneurs)
      .where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) {
      return res.json({
        totalDue: { ep: 0, esv: 0, vz: 0, total: 0 },
        nextDeadline: null,
        quarterIncome: { uah: 0, usd: 0 },
        monthlyChart: [],
        recentTransactions: [],
        totalTransactionCount: 0,
        bookStatus: { isUpToDate: true, pendingCount: 0, lastSyncAt: null },
        incomeLimit: null,
        legalNotes: [],
      })
    }

    const taxProfile = getTaxProfile(entrepreneur)
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
          .where(
            and(
              inArray(transactions.accountId, accountIds),
              gte(transactions.date, start),
              lte(transactions.date, end),
            ),
          )
      : []

    const quarterIncome = quarterTransactions
      .filter((transaction) => transaction.category === 'income' && transaction.amount > 0)
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    const chartMonths = [0, 1, 2].map((offset) => {
      const monthIndex = (quarter - 1) * 3 + offset
      const amount = quarterTransactions
        .filter((transaction) => {
          const date = new Date(transaction.date)
          return (
            date.getUTCMonth() === monthIndex &&
            transaction.category === 'income' &&
            transaction.amount > 0
          )
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

    const [{ totalTransactionCount }] = accountIds.length
      ? await db
          .select({ totalTransactionCount: sql<number>`count(*)` })
          .from(transactions)
          .where(inArray(transactions.accountId, accountIds))
      : [{ totalTransactionCount: 0 }]

    const deadlineRows = await syncDeadlinesForEntrepreneur(entrepreneur.id, taxProfile, [
      now.getFullYear(),
      now.getFullYear() + 1,
    ])
    const [nextDeadline] = deadlineRows
      .filter(
        (deadline) =>
          deadline.status === 'pending' && deadline.dueDate >= now.toISOString().slice(0, 10),
      )
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))

    const [{ pendingCount }] = accountIds.length
      ? await db
          .select({ pendingCount: sql<number>`count(*)` })
          .from(transactions)
          .where(
            and(
              inArray(transactions.accountId, accountIds),
              eq(transactions.category, 'unclassified'),
            ),
          )
      : [{ pendingCount: 0 }]

    const lastSyncAt =
      accounts
        .map((account) => account.lastSync)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null

    const taxes = calculateTaxes(taxProfile, quarterIncome, now.getFullYear())
    const yearBounds = {
      start: new Date(Date.UTC(now.getFullYear(), 0, 1)).toISOString(),
      end: new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999)).toISOString(),
    }
    const yearIncome = accountIds.length
      ? await db
          .select({ amount: transactions.amount, category: transactions.category })
          .from(transactions)
          .where(
            and(
              inArray(transactions.accountId, accountIds),
              gte(transactions.date, yearBounds.start),
              lte(transactions.date, yearBounds.end),
            ),
          )
          .then((rows) =>
            rows
              .filter((row) => row.category === 'income' && row.amount > 0)
              .reduce((sum, row) => sum + row.amount, 0),
          )
      : 0
    const incomeLimit = getIncomeLimit(taxProfile.group, now.getFullYear())
    const usagePercent = incomeLimit > 0 ? Math.round((yearIncome / incomeLimit) * 10_000) / 100 : 0
    const todayStr = now.toISOString().slice(0, 10)
    const usdRate = await getNbuRate('USD', todayStr).catch(() => 41.4)

    res.json({
      totalDue: {
        ep: taxes.ep,
        esv: taxes.esv,
        vz: taxes.vz,
        total: taxes.total,
      },
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
        usd: Math.round(quarterIncome / usdRate),
      },
      monthlyChart: chartMonths,
      recentTransactions,
      totalTransactionCount,
      bookStatus: {
        isUpToDate: pendingCount === 0,
        pendingCount,
        lastSyncAt,
      },
      incomeLimit: {
        year: now.getFullYear(),
        amount: incomeLimit,
        used: yearIncome,
        usagePercent,
        isNearLimit: usagePercent >= 80,
      },
      legalNotes: getLegalNotes(taxProfile, now.getFullYear()),
    })
  } catch (error) {
    next(error)
  }
})

router.get('/income', async (req: AuthRequest, res, next) => {
  try {
    const period = String(req.query['period'] ?? '')
    const isQuarter = /^Q[1-4]-\d{4}$/.test(period)
    const isYear = /^Y-\d{4}$/.test(period)
    if (!isQuarter && !isYear) {
      return res.status(400).json({ error: 'Invalid period' })
    }

    const [entrepreneur] = await db
      .select()
      .from(entrepreneurs)
      .where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.json({ uah: 0, txCount: 0 })

    const [, yearString] = period.split('-')
    const year = parseInt(yearString!)
    const quarter = isQuarter
      ? (parseInt(period.split('-')[0]!.replace('Q', '')) as 1 | 2 | 3 | 4)
      : null
    const { start, end } = quarter
      ? getQuarterBounds(year, quarter)
      : {
          start: new Date(Date.UTC(year, 0, 1)).toISOString(),
          end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)).toISOString(),
        }

    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.entrepreneurId, entrepreneur.id))
    const accountIds = accounts.map((a) => a.id)

    if (!accountIds.length) return res.json({ uah: 0, txCount: 0 })

    const txList = await db
      .select()
      .from(transactions)
      .where(
        and(
          inArray(transactions.accountId, accountIds),
          gte(transactions.date, start),
          lte(transactions.date, end),
          eq(transactions.category, 'income'),
        ),
      )

    const uah = txList.reduce((sum, t) => sum + t.amount, 0)
    const monthlyChart = quarter
      ? [0, 1, 2].map((offset) => {
          const monthIndex = (quarter - 1) * 3 + offset
          return {
            month: monthLabel(monthIndex),
            amount: txList
              .filter((transaction) => new Date(transaction.date).getUTCMonth() === monthIndex)
              .reduce((sum, transaction) => sum + transaction.amount, 0),
          }
        })
      : Array.from({ length: 12 }, (_, monthIndex) => ({
          month: monthLabel(monthIndex),
          amount: txList
            .filter((transaction) => new Date(transaction.date).getUTCMonth() === monthIndex)
            .reduce((sum, transaction) => sum + transaction.amount, 0),
        }))
    const usdRate = await getNbuRate('USD', new Date().toISOString().slice(0, 10)).catch(() => 41.4)

    res.json({
      period,
      uah,
      usd: Math.round(uah / usdRate),
      txCount: txList.length,
      monthlyChart,
    })
  } catch (error) {
    next(error)
  }
})

export default router
