import client from './client'
import type { BankAccount } from '../types'

export interface CurrencyRate {
  currencyA: string
  currencyB: string
  rateSell: number | null
  rateBuy: number | null
  rateCross: number | null
  updatedAt: string
}

export async function getCurrencyRates(): Promise<CurrencyRate[]> {
  const res = await client.get<CurrencyRate[]>('/api/monobank/currency')
  return res.data
}

export async function connectMonobank(token: string): Promise<BankAccount> {
  const res = await client.post<BankAccount>('/api/bank/connect', { provider: 'monobank', token })
  return res.data
}

export async function getBankAccounts(): Promise<BankAccount[]> {
  const res = await client.get<BankAccount[]>('/api/bank/accounts')
  return res.data
}

export async function disconnectBank(id: number): Promise<void> {
  await client.delete(`/api/bank/${id}`)
}

export async function syncBank(): Promise<{ synced: number }> {
  const res = await client.post<{ synced: number }>('/api/bank/sync')
  return res.data
}
