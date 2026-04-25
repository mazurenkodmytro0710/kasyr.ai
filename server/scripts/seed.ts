/**
 * Seed script for Kasyr.ai
 * Run: npx tsx server/scripts/seed.ts
 */
import 'dotenv/config'
import bcrypt from 'bcrypt'
import { db } from '../db'
import { initDb } from '../db'
import {
  users,
  entrepreneurs,
  bankAccounts,
  transactions,
  deadlines,
  reports,
  clients,
} from '../db/schema'
import { generateDeadlinesForYears, getTaxProfile, type TaxGroup } from '../services/taxService'
import { eq } from 'drizzle-orm'

initDb()

const BCRYPT_ROUNDS = 12
const PASSWORD = 'Demo1234!'
const FRESH_SEED = process.env.SEED_FRESH === 'true'

const DEMO_USERS = [
  {
    email: 'demo1@kasyr.ai',
    fullName: 'Коваленко Олег Іванович',
    taxId: '1234567890',
    group: 3 as TaxGroup,
    vatPayer: false,
    localEpRatePercent: null,
    regDate: '2022-03-14',
    kveds: ['62.01', '62.02'],
    tier: 'free',
  },
  {
    email: 'demo2@kasyr.ai',
    fullName: 'Мельник Ірина Олексіївна',
    taxId: '2345678901',
    group: 3 as TaxGroup,
    vatPayer: true,
    localEpRatePercent: null,
    regDate: '2021-06-20',
    kveds: ['62.01', '74.90'],
    tier: 'pro',
  },
  {
    email: 'demo3@kasyr.ai',
    fullName: 'Бойко Андрій Петрович',
    taxId: '3456789012',
    group: 2 as TaxGroup,
    vatPayer: false,
    localEpRatePercent: 18,
    regDate: '2020-01-15',
    kveds: ['47.91', '62.01'],
    tier: 'business',
  },
]

const INCOME_DESCRIPTIONS = [
  'Llera Software Inc.',
  'Pavlo K. consulting',
  'Invoice #2041 · April consulting',
  'Stripe Payout · 37 transactions',
  'Toptal payment · March',
  'Upwork payout · April',
  'DataArt payment',
  'SoftServe invoice',
  'Remote team · monthly',
  'Freelance project #12',
]

const UNCLASSIFIED_DESCRIPTIONS = [
  'Переказ від родичів',
  'Iwan Petrenko',
  'Maria V.',
  'Online payment',
]

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function dateInQuarter(year: number, quarter: 1 | 2 | 3 | 4, dayOffset = 0): string {
  const startMonth = (quarter - 1) * 3
  const day = randomBetween(1, 25) + dayOffset
  const d = new Date(Date.UTC(year, startMonth + Math.floor(Math.random() * 3), Math.min(day, 28)))
  return d.toISOString()
}

async function seed() {
  console.log('🌱 Seeding database...')

  if (FRESH_SEED) {
    await db.delete(transactions)
    await db.delete(reports)
    await db.delete(deadlines)
    await db.delete(clients)
    await db.delete(bankAccounts)
    await db.delete(entrepreneurs)
    await db.delete(users)
    console.log('  ✓ Cleared all tables')
  } else {
    // Clear only demo accounts (keep real users)
    const DEMO_EMAILS = DEMO_USERS.map((d) => d.email)
    for (const email of DEMO_EMAILS) {
      const [existing] = await db.select().from(users).where(eq(users.email, email))
      if (existing) {
        const [ent] = await db
          .select()
          .from(entrepreneurs)
          .where(eq(entrepreneurs.userId, existing.id))
        if (ent) {
          // Delete in correct order: children first
          const accs = await db
            .select()
            .from(bankAccounts)
            .where(eq(bankAccounts.entrepreneurId, ent.id))
          for (const acc of accs) {
            await db.delete(transactions).where(eq(transactions.accountId, acc.id))
          }
          await db.delete(reports).where(eq(reports.entrepreneurId, ent.id))
          await db.delete(deadlines).where(eq(deadlines.entrepreneurId, ent.id))
          await db.delete(clients).where(eq(clients.entrepreneurId, ent.id))
          await db.delete(bankAccounts).where(eq(bankAccounts.entrepreneurId, ent.id))
          await db.delete(entrepreneurs).where(eq(entrepreneurs.id, ent.id))
        }
        await db.delete(users).where(eq(users.id, existing.id))
      }
    }
    console.log('  ✓ Cleared demo accounts')
  }

  const currentYear = new Date().getFullYear()
  const prevYear = currentYear - 1

  for (const demo of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS)

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email: demo.email,
        passwordHash,
        isVerified: true,
        verificationToken: null,
      })
      .returning()
    if (!user) throw new Error(`Failed to create user ${demo.email}`)

    // Create entrepreneur
    const [ent] = await db
      .insert(entrepreneurs)
      .values({
        userId: user.id,
        fullName: demo.fullName,
        taxId: demo.taxId,
        group: demo.group,
        vatPayer: demo.vatPayer,
        localEpRatePercent: demo.localEpRatePercent,
        regDate: demo.regDate,
        kveds: JSON.stringify(demo.kveds),
        subscriptionTier: demo.tier,
        emailNotifications: true,
        telegramNotifications: false,
      })
      .returning()
    if (!ent) throw new Error(`Failed to create entrepreneur for ${demo.email}`)

    // Create bank account
    const [acc] = await db
      .insert(bankAccounts)
      .values({
        entrepreneurId: ent.id,
        provider: 'demo',
        tokenEncrypted: null,
        accountId: 'demo-acc-1',
        currency: 'UAH',
        lastSync: new Date().toISOString(),
      })
      .returning()
    if (!acc) throw new Error(`Failed to create bank account`)

    // Generate transactions for last 4 quarters
    const txValues: (typeof transactions.$inferInsert)[] = []
    const quarters: Array<{ year: number; quarter: 1 | 2 | 3 | 4 }> = [
      { year: prevYear, quarter: 3 },
      { year: prevYear, quarter: 4 },
      { year: currentYear, quarter: 1 },
      { year: currentYear, quarter: 2 },
    ]

    for (const { year, quarter } of quarters) {
      const incomeCount = randomBetween(8, 12)
      for (let i = 0; i < incomeCount; i++) {
        const amount = randomBetween(15000, 80000)
        txValues.push({
          accountId: acc.id,
          externalId: `demo-${user.id}-${year}-Q${quarter}-income-${i}`,
          date: dateInQuarter(year, quarter),
          description: INCOME_DESCRIPTIONS[i % INCOME_DESCRIPTIONS.length]!,
          amount,
          currency: 'UAH',
          exchangeRate: null,
          category: 'income',
          comment: null,
          rawData: null,
        })
      }

      // A few unclassified
      for (let i = 0; i < 2; i++) {
        txValues.push({
          accountId: acc.id,
          externalId: `demo-${user.id}-${year}-Q${quarter}-unclass-${i}`,
          date: dateInQuarter(year, quarter),
          description: UNCLASSIFIED_DESCRIPTIONS[i % UNCLASSIFIED_DESCRIPTIONS.length]!,
          amount: randomBetween(500, 5000),
          currency: 'UAH',
          exchangeRate: null,
          category: 'unclassified',
          comment: null,
          rawData: null,
        })
      }
    }

    await db.insert(transactions).values(txValues)

    // Generate deadlines for prevYear and currentYear
    const allDeadlines = generateDeadlinesForYears(ent.id, getTaxProfile(ent), [
      prevYear,
      currentYear,
      currentYear + 1,
    ])

    // Mark some as paid (past ones)
    const today = new Date().toISOString().slice(0, 10)
    const dlValues = allDeadlines.map((d) => ({
      ...d,
      status: d.dueDate < today ? 'paid' : 'pending',
    }))

    await db.insert(deadlines).values(dlValues)

    console.log(`  ✓ ${demo.email} → ${txValues.length} transactions, ${dlValues.length} deadlines`)
  }

  console.log('🎉 Seed complete!')
  console.log('\nDemo accounts:')
  console.log('  demo1@kasyr.ai / Demo1234!  (Free, 3 гр)')
  console.log('  demo2@kasyr.ai / Demo1234!  (Pro, 3 гр)')
  console.log('  demo3@kasyr.ai / Demo1234!  (Business, 2 гр)')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
