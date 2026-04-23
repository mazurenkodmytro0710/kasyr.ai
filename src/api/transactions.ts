import client from './client'
import type { Transaction, PaginatedResponse, TransactionCategory } from '../types'

export interface TransactionFilters {
  page?: number
  limit?: number
  category?: string
  from?: string
  to?: string
  search?: string
}

export async function getTransactions(filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> {
  const res = await client.get<PaginatedResponse<Transaction>>('/api/transactions', { params: filters })
  return res.data
}

export async function getTransaction(id: number): Promise<Transaction> {
  const res = await client.get<Transaction>(`/api/transactions/${id}`)
  return res.data
}

export async function updateTransaction(
  id: number,
  data: { category?: TransactionCategory; clientId?: number | null; comment?: string | null }
): Promise<Transaction> {
  const res = await client.patch<Transaction>(`/api/transactions/${id}`, data)
  return res.data
}

export async function classifyTransaction(id: number): Promise<{ category: TransactionCategory; reason: string }> {
  const res = await client.post<{ category: TransactionCategory; reason: string }>('/api/transactions/classify', { id })
  return res.data
}

export async function createTransaction(data: {
  amount: number
  date: string
  description: string
  category: TransactionCategory
  clientId?: number | null
  comment?: string | null
}): Promise<Transaction> {
  const res = await client.post<Transaction>('/api/transactions', data)
  return res.data
}
