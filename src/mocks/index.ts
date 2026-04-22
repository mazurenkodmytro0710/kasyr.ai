import type { DashboardData, Transaction, Deadline, Report, Entrepreneur, BankAccount } from '../types'

export const mockUser = {
  id: 1,
  email: 'maria@example.com',
  createdAt: '2024-01-15T10:00:00Z',
}

export const mockEntrepreneur: Entrepreneur = {
  id: 1,
  userId: 1,
  fullName: 'Коваленко Марія Олексіївна',
  taxId: '3456789012',
  group: 3,
  regDate: '2022-03-14',
  kveds: ['62.01', '62.02', '74.90'],
}

export const mockBankAccounts: BankAccount[] = [
  {
    id: 1,
    entrepreneurId: 1,
    provider: 'monobank',
    accountId: 'acc_mono_1',
    currency: 'UAH',
    lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
]

export const mockTransactions: Transaction[] = [
  {
    id: 1, accountId: 1, externalId: 'ext_1', date: '2026-04-22T10:30:00Z',
    description: 'Invoice #2041 · April consulting', amount: 99360, currency: 'UAH',
    exchangeRate: 41.40, category: 'income', clientId: 1, comment: null, createdAt: '2026-04-22T10:30:00Z',
  },
  {
    id: 2, accountId: 1, externalId: 'ext_2', date: '2026-04-21T14:00:00Z',
    description: 'Design audit · GlovoBiz', amount: 48000, currency: 'UAH',
    exchangeRate: null, category: 'income', clientId: 2, comment: null, createdAt: '2026-04-21T14:00:00Z',
  },
  {
    id: 3, accountId: 1, externalId: 'ext_3', date: '2026-04-20T09:15:00Z',
    description: 'Stripe Payout · 37 transactions', amount: 75348, currency: 'UAH',
    exchangeRate: 41.40, category: 'income', clientId: 3, comment: null, createdAt: '2026-04-20T09:15:00Z',
  },
  {
    id: 4, accountId: 1, externalId: 'ext_4', date: '2026-04-19T16:45:00Z',
    description: 'Переказ без коментаря', amount: 12000, currency: 'UAH',
    exchangeRate: null, category: 'unclassified', clientId: null, comment: null, createdAt: '2026-04-19T16:45:00Z',
  },
  {
    id: 5, accountId: 1, externalId: 'ext_5', date: '2026-04-17T11:20:00Z',
    description: 'Замовлення #28811 · повернення', amount: -2340, currency: 'UAH',
    exchangeRate: null, category: 'return', clientId: null, comment: null, createdAt: '2026-04-17T11:20:00Z',
  },
  {
    id: 6, accountId: 1, externalId: 'ext_6', date: '2026-04-15T08:00:00Z',
    description: 'Monthly retainer · March', amount: 124200, currency: 'UAH',
    exchangeRate: 41.40, category: 'income', clientId: 4, comment: null, createdAt: '2026-04-15T08:00:00Z',
  },
  {
    id: 7, accountId: 1, externalId: 'ext_7', date: '2026-04-10T12:00:00Z',
    description: 'Комісія Wise', amount: -320, currency: 'UAH',
    exchangeRate: null, category: 'fee', clientId: null, comment: null, createdAt: '2026-04-10T12:00:00Z',
  },
  {
    id: 8, accountId: 1, externalId: 'ext_8', date: '2026-04-08T15:30:00Z',
    description: 'Invoice #2039 · UI design', amount: 66240, currency: 'UAH',
    exchangeRate: 41.40, category: 'income', clientId: 5, comment: null, createdAt: '2026-04-08T15:30:00Z',
  },
  {
    id: 9, accountId: 1, externalId: 'ext_9', date: '2026-04-05T09:00:00Z',
    description: 'Переказ між рахунками', amount: 20000, currency: 'UAH',
    exchangeRate: null, category: 'own_transfer', clientId: null, comment: null, createdAt: '2026-04-05T09:00:00Z',
  },
  {
    id: 10, accountId: 1, externalId: 'ext_10', date: '2026-04-03T11:00:00Z',
    description: 'Consulting Q1 final payment', amount: 37260, currency: 'UAH',
    exchangeRate: 41.40, category: 'income', clientId: 1, comment: null, createdAt: '2026-04-03T11:00:00Z',
  },
]

export const mockDeadlines: Deadline[] = [
  { id: 1, entrepreneurId: 1, type: 'ep_declaration', period: 'Q4-2025', dueDate: '2026-02-09', amount: null, status: 'submitted' },
  { id: 2, entrepreneurId: 1, type: 'ep_payment', period: 'Q4-2025', dueDate: '2026-02-19', amount: 5188, status: 'paid' },
  { id: 3, entrepreneurId: 1, type: 'esv', period: 'Q4-2025', dueDate: '2026-02-19', amount: 5707, status: 'paid' },
  { id: 4, entrepreneurId: 1, type: 'vz', period: 'Q4-2025', dueDate: '2026-02-19', amount: 4114, status: 'paid' },
  { id: 5, entrepreneurId: 1, type: 'ep_declaration', period: 'Q1-2026', dueDate: '2026-05-09', amount: null, status: 'pending' },
  { id: 6, entrepreneurId: 1, type: 'ep_payment', period: 'Q1-2026', dueDate: '2026-05-20', amount: 11549, status: 'pending' },
  { id: 7, entrepreneurId: 1, type: 'esv', period: 'Q1-2026', dueDate: '2026-04-19', amount: 5707, status: 'paid' },
  { id: 8, entrepreneurId: 1, type: 'vz', period: 'Q1-2026', dueDate: '2026-05-20', amount: 4114, status: 'pending' },
  { id: 9, entrepreneurId: 1, type: 'ep_declaration', period: 'Q2-2026', dueDate: '2026-08-09', amount: null, status: 'pending' },
  { id: 10, entrepreneurId: 1, type: 'ep_payment', period: 'Q2-2026', dueDate: '2026-08-20', amount: 12800, status: 'pending' },
  { id: 11, entrepreneurId: 1, type: 'esv', period: 'Q2-2026', dueDate: '2026-07-19', amount: 5707, status: 'pending' },
  { id: 12, entrepreneurId: 1, type: 'vz', period: 'Q2-2026', dueDate: '2026-08-20', amount: 4500, status: 'pending' },
]

export const mockReports: Report[] = [
  { id: 1, entrepreneurId: 1, period: 'Q4-2025', type: 'ep_declaration', status: 'submitted', fileUrl: null, submittedAt: '2026-02-09T10:00:00Z', createdAt: '2026-02-08T09:00:00Z' },
  { id: 2, entrepreneurId: 1, period: 'Q1-2026', type: 'ep_declaration', status: 'draft', fileUrl: null, submittedAt: null, createdAt: '2026-04-01T09:00:00Z' },
]

export const mockDashboard: DashboardData = {
  totalDue: { ep: 1729, esv: 5706, vz: 4114, total: 11549 },
  nextDeadline: { date: '2026-05-09', daysLeft: 17, type: 'Декларація ЄП (Q1 2026)', amount: 0 },
  quarterIncome: { uah: 256680, usd: 6200 },
  monthlyChart: [
    { month: 'Кві', amount: 256680 },
    { month: 'Тра', amount: 0 },
    { month: 'Чер', amount: 0 },
  ],
  recentTransactions: mockTransactions.slice(0, 5),
  bookStatus: { isUpToDate: false, pendingCount: 3, lastSyncAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
}
