import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { transactions } from '../db/schema'
import { classifyWithAI } from './aiClassifier'

interface MonoAccount {
  id: string
  currencyCode: number
  type: string
  balance: number
}

interface MonoClientInfo {
  clientId: string
  name?: string
  accounts: MonoAccount[]
}

interface MonoStatementItem {
  id: string
  time: number
  description: string
  mcc: number
  originalMcc: number
  amount: number
  operationAmount: number
  currencyCode: number
  commissionRate: number
  cashbackAmount: number
  balance: number
  hold: boolean
  comment?: string
  receiptId?: string
  invoiceId?: string
  counterEdrpou?: string
  counterIban?: string
  counterName?: string
}

export class MonoRateLimitError extends Error {
  constructor() {
    super('Monobank rate limit: one request per 60 seconds')
  }
}

export class MonoApiError extends Error {
  constructor(
    public readonly status: number,
    message = `Monobank request failed: ${status}`,
  ) {
    super(message)
  }
}

const clientInfoCache = new Map<string, { value: MonoClientInfo; fetchedAt: number }>()
const statementCache = new Map<string, { value: MonoStatementItem[]; fetchedAt: number }>()

function isDemoToken(token: string): boolean {
  return token.startsWith('demo') || token.startsWith('mock')
}

function currencyFromCode(code: number): string {
  const map: Record<number, string> = {
    980: 'UAH',
    840: 'USD',
    978: 'EUR',
  }
  return map[code] ?? 'UAH'
}

async function monoFetch<T>(token: string, url: string): Promise<T> {
  const response = await fetch(url, { headers: { 'X-Token': token } })
  if (response.status === 429) throw new MonoRateLimitError()
  if (!response.ok) throw new MonoApiError(response.status)
  return (await response.json()) as T
}

export async function verifyToken(token: string): Promise<MonoClientInfo> {
  if (isDemoToken(token)) return demoClientInfo()

  const cached = clientInfoCache.get(token)
  if (cached && Date.now() - cached.fetchedAt < 60_000) return cached.value

  const value = await monoFetch<MonoClientInfo>(token, 'https://api.monobank.ua/personal/client-info')
  clientInfoCache.set(token, { value, fetchedAt: Date.now() })
  return value
}

export async function syncMonobank(token: string, accountId: number, lastSync: string | null): Promise<number> {
  const clientInfo = await verifyToken(token)
  const monoAccount = clientInfo.accounts.find((account) => account.currencyCode === 980) ?? clientInfo.accounts[0]
  if (!monoAccount) return 0

  const now = Math.floor(Date.now() / 1000)
  const from = lastSync
    ? Math.max(Math.floor(new Date(lastSync).getTime() / 1000) - 60, now - 31 * 24 * 60 * 60)
    : now - 90 * 24 * 60 * 60

  const statement = await getStatement(token, monoAccount.id, from, now)
  let inserted = 0

  for (const item of statement) {
    const [existing] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(eq(transactions.accountId, accountId), eq(transactions.externalId, item.id)))

    if (existing) continue

    const amount = Math.round(item.amount / 100)
    const category = (await classifyWithAI(item.description, amount, currencyFromCode(item.currencyCode))).category

    await db.insert(transactions).values({
      accountId,
      externalId: item.id,
      date: new Date(item.time * 1000).toISOString(),
      description: item.description || item.comment || 'Monobank transaction',
      amount,
      currency: currencyFromCode(item.currencyCode),
      exchangeRate: null,
      category,
      clientId: null,
      comment: item.comment ?? null,
      rawData: JSON.stringify(item),
    })
    inserted += 1
  }

  return inserted
}

async function getStatement(token: string, account: string, from: number, to: number): Promise<MonoStatementItem[]> {
  if (isDemoToken(token)) return demoStatement()

  const key = `${token}:${account}:${from}:${to}`
  const cached = statementCache.get(key)
  if (cached && Date.now() - cached.fetchedAt < 60_000) return cached.value

  const url = `https://api.monobank.ua/personal/statement/${account}/${from}/${to}`
  const value = await monoFetch<MonoStatementItem[]>(token, url)
  statementCache.set(key, { value, fetchedAt: Date.now() })
  return value
}

function demoClientInfo(): MonoClientInfo {
  return {
    clientId: 'demo-client',
    name: 'Марія Коваленко',
    accounts: [
      { id: 'demo-uah-account', currencyCode: 980, type: 'black', balance: 25668000 },
    ],
  }
}

function demoStatement(): MonoStatementItem[] {
  const base: Omit<MonoStatementItem, 'id' | 'time' | 'description' | 'amount'> = {
    mcc: 0,
    originalMcc: 0,
    operationAmount: 0,
    currencyCode: 980,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 0,
    hold: false,
  }

  return [
    { ...base, id: 'demo-1', time: Date.UTC(2026, 3, 22, 10, 30) / 1000, description: 'Llera Software Inc.', amount: 4_536_000 },
    { ...base, id: 'demo-2', time: Date.UTC(2026, 3, 20, 14, 0) / 1000, description: 'Pavlo K.', amount: 889_000 },
    { ...base, id: 'demo-3', time: Date.UTC(2026, 3, 19, 16, 45) / 1000, description: 'ПЕРЕКАЗ_МІЖ_РАХУНКАМИ', amount: 4_536_000 },
    { ...base, id: 'demo-4', time: Date.UTC(2026, 3, 17, 11, 20) / 1000, description: 'Invoice #2041 · April consulting', amount: 9_936_000 },
    { ...base, id: 'demo-5', time: Date.UTC(2026, 3, 15, 9, 15) / 1000, description: 'Stripe Payout · 37 transactions', amount: 7_534_800 },
  ]
}
