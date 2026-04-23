import { create } from 'zustand'
import type { Transaction, PaginatedResponse, TransactionCategory } from '../types'
import * as txApi from '../api/transactions'
import { mockTransactions } from '../mocks'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

interface TransactionStore {
  transactions: Transaction[]
  total: number
  page: number
  isLoading: boolean
  filters: { category?: string; from?: string; to?: string; search?: string }
  fetchTransactions: (filters?: { category?: string; from?: string; to?: string; search?: string; page?: number }) => Promise<void>
  updateTransaction: (id: number, data: { category?: TransactionCategory; clientId?: number | null; comment?: string | null }) => Promise<void>
  classifyTransaction: (id: number) => Promise<TransactionCategory>
  createTransaction: (data: { amount: number; date: string; description: string; category: TransactionCategory; clientId?: number | null; comment?: string | null }) => Promise<Transaction>
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  total: 0,
  page: 1,
  isLoading: false,
  filters: {},

  fetchTransactions: async (filters = {}) => {
    set({ isLoading: true, filters })
    try {
      if (USE_MOCK) {
        let filtered = [...mockTransactions]
        if (filters.category && filters.category !== 'all') {
          filtered = filtered.filter(t => t.category === filters.category)
        }
        if (filters.search) {
          const q = filters.search.toLowerCase()
          filtered = filtered.filter(t =>
            t.description.toLowerCase().includes(q) ||
            String(Math.abs(t.amount)).includes(q)
          )
        }
        set({ transactions: filtered, total: filtered.length, isLoading: false })
        return
      }
      const data: PaginatedResponse<Transaction> = await txApi.getTransactions({ ...filters, limit: 20 })
      set({ transactions: data.data, total: data.total, page: data.page })
    } finally {
      set({ isLoading: false })
    }
  },

  updateTransaction: async (id, data) => {
    if (USE_MOCK) {
      set(state => ({
        transactions: state.transactions.map(t =>
          t.id === id ? { ...t, ...data } : t
        ),
      }))
      return
    }
    const updated = await txApi.updateTransaction(id, data)
    set(state => ({
      transactions: state.transactions.map(t => t.id === id ? updated : t),
    }))
  },

  classifyTransaction: async (id) => {
    if (USE_MOCK) {
      const category: TransactionCategory = 'income'
      get().updateTransaction(id, { category })
      return category
    }
    const result = await txApi.classifyTransaction(id)
    await get().updateTransaction(id, { category: result.category })
    return result.category
  },

  createTransaction: async (data) => {
    if (USE_MOCK) {
      const created: Transaction = {
        id: Date.now(),
        accountId: 0,
        externalId: `mock-${Date.now()}`,
        date: data.date,
        description: data.description,
        amount: data.amount,
        currency: 'UAH',
        exchangeRate: null,
        category: data.category,
        clientId: data.clientId ?? null,
        comment: data.comment ?? null,
        createdAt: new Date().toISOString(),
      }
      set((state) => ({
        transactions: [created, ...state.transactions],
        total: state.total + 1,
      }))
      return created
    }

    const created = await txApi.createTransaction(data)
    await get().fetchTransactions(get().filters)
    return created
  },
}))
