export type TaxGroup = 1 | 2 | 3

export interface User {
  id: number
  email: string
  createdAt: string
}

export interface Entrepreneur {
  id: number
  userId: number
  fullName: string
  taxId: string
  group: TaxGroup
  regDate: string
  kveds: string[]
}

export interface BankAccount {
  id: number
  entrepreneurId: number
  provider: 'monobank' | 'privat' | 'manual'
  accountId: string
  currency: string
  lastSync: string | null
}

export type TransactionCategory =
  | 'income'
  | 'return'
  | 'own_transfer'
  | 'fee'
  | 'unclassified'

export interface Transaction {
  id: number
  accountId: number
  externalId: string
  date: string
  description: string
  amount: number
  currency: string
  exchangeRate: number | null
  category: TransactionCategory
  clientId: number | null
  comment: string | null
  createdAt: string
}

export interface Client {
  id: number
  entrepreneurId: number
  name: string
  taxId: string | null
  country: string
}

export type DeadlineType =
  | 'ep_declaration'
  | 'ep_payment'
  | 'esv'
  | 'vz'
  | 'combined_report'

export type DeadlineStatus = 'pending' | 'paid' | 'overdue' | 'submitted'

export interface Deadline {
  id: number
  entrepreneurId: number
  type: DeadlineType
  period: string
  dueDate: string
  amount: number | null
  status: DeadlineStatus
}

export interface Report {
  id: number
  entrepreneurId: number
  period: string
  type: string
  status: 'pending' | 'submitted' | 'draft'
  fileUrl: string | null
  submittedAt: string | null
  createdAt: string
}

export interface DashboardData {
  totalDue: { ep: number; esv: number; vz: number; total: number }
  nextDeadline: { date: string; daysLeft: number; type: string; amount: number } | null
  quarterIncome: { uah: number; usd: number }
  monthlyChart: { month: string; amount: number }[]
  recentTransactions: Transaction[]
  bookStatus: { isUpToDate: boolean; pendingCount: number; lastSyncAt: string | null }
}

export interface AuthState {
  token: string | null
  user: User | null
  entrepreneur: Entrepreneur | null
  isLoading: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
