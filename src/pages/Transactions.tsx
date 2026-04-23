import { useEffect, useMemo, useState } from 'react'
import { Download, Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTransactionStore } from '../store/transactionStore'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { TransactionRow } from '../components/dashboard/TransactionRow'
import { TransactionDetail } from '../components/transactions/TransactionDetail'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import type { Transaction, TransactionCategory } from '../types'
import { formatNumber } from '../utils/formatCurrency'

const categoryButtons = [
  { value: 'all', label: 'Всі' },
  { value: 'income', label: 'Дохід' },
  { value: 'expense', label: 'Витрати' },
  { value: 'transfer', label: 'Перекази' },
  { value: 'unclassified', label: 'Без класифікації' },
]

const tabs = [
  { key: 'transactions', label: 'Транзакції' },
  { key: 'book', label: 'Книга обліку' },
]

async function downloadBookPdf(period: string) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const response = await fetch(`${apiUrl}/api/reports/book?period=${period}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('PDF generation failed')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `book-${period}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}

function categoryLabel(category: TransactionCategory): string {
  if (category === 'income') return 'Дохід'
  if (['expense', 'fee', 'return'].includes(category)) return 'Витрата'
  if (['transfer', 'own_transfer'].includes(category)) return 'Переказ'
  return 'Без класифікації'
}

function normalizeCategory(category: string): TransactionCategory {
  if (category === 'fee' || category === 'return') return 'expense'
  if (category === 'own_transfer') return 'transfer'
  return category as TransactionCategory
}

export function Transactions() {
  const { entrepreneur } = useAuthStore()
  const { openAddTransaction } = useUiStore()
  const { transactions, total, isLoading, fetchTransactions, updateTransaction } = useTransactionStore()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'transactions' | 'book'>('transactions')
  const navigate = useNavigate()

  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const [bookPeriod, setBookPeriod] = useState(`Q${currentQuarter}-${currentYear}`)

  useEffect(() => {
    fetchTransactions({
      category: category === 'all' ? undefined : category,
      search: search || undefined,
    })
  }, [category, search, fetchTransactions])

  const incomeRows = useMemo(() => (
    transactions.filter((transaction) => transaction.category === 'income')
  ), [transactions])

  const totalIncome = useMemo(() => (
    incomeRows.reduce((sum, transaction) => sum + transaction.amount, 0)
  ), [incomeRows])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 112px', maxWidth: 1240 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--text)' }}>
            Транзакції
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '6px 0 0' }}>
            {total} записів у стрічці операцій
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openAddTransaction}>
          Додати транзакцію
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--surface-2)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'transactions' | 'book')}
            style={{
              height: 38,
              padding: '0 14px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab.key ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text)' : 'var(--text-3)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 220px', minWidth: 0, maxWidth: 420 }}>
              <Input
                placeholder="Пошук по опису або сумі…"
                leading={<Search size={16} />}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categoryButtons.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setCategory(item.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    background: category === item.value ? 'var(--indigo-glow)' : 'var(--surface-2)',
                    color: category === item.value ? 'var(--indigo-300)' : 'var(--text-2)',
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    border: category === item.value ? '1px solid rgba(129,140,248,0.3)' : '1px solid var(--border)',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          ) : transactions.length === 0 ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: 44,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>Транзакцій поки немає</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.6 }}>
                Підключи банк у налаштуваннях або додай першу транзакцію вручну.
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={openAddTransaction}>Додати вручну</Button>
                <Button variant="secondary" onClick={() => navigate('/settings')}>Підключити банк</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden md:block" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      {['Дата', 'Опис', 'Категорія', 'Сума', ''].map((header, index) => (
                        <th
                          key={header}
                          style={{
                            textAlign: index === 3 ? 'right' : 'left',
                            padding: '10px 16px',
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: 0.06,
                            textTransform: 'uppercase',
                            color: 'var(--text-3)',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => (
                      <tr
                        key={transaction.id}
                        style={{
                          borderBottom: index < transactions.length - 1 ? '1px solid var(--surface-2)' : 'none',
                        }}
                      >
                        <td style={{ padding: '14px 16px', color: 'var(--text-3)', whiteSpace: 'nowrap' }} className="tnum">
                          {new Date(transaction.date).toLocaleDateString('uk-UA')}
                        </td>
                        <td
                          onClick={() => setSelectedTx(transaction)}
                          style={{ padding: '14px 16px', cursor: 'pointer', maxWidth: 360 }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {transaction.description}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {entrepreneur?.subscriptionTier === 'free' ? (
                            <select
                              value={normalizeCategory(transaction.category)}
                              onChange={(event) => updateTransaction(transaction.id, { category: event.target.value as TransactionCategory })}
                              style={{
                                width: 170,
                                height: 36,
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                borderRadius: 10,
                                color: 'var(--text)',
                                fontFamily: 'var(--font-sans)',
                                fontSize: 13,
                                padding: '0 12px',
                              }}
                            >
                              <option value="income">Дохід</option>
                              <option value="expense">Витрата</option>
                              <option value="transfer">Переказ</option>
                              <option value="unclassified">Без класифікації</option>
                            </select>
                          ) : (
                            <Badge tone={transaction.category === 'income' ? 'income' : transaction.category === 'unclassified' ? 'warn' : 'neutral'}>
                              {categoryLabel(transaction.category)}
                            </Badge>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }} className="tnum">
                          <div style={{ fontSize: 14, fontWeight: 700, color: transaction.category === 'income' ? 'var(--text)' : transaction.category === 'unclassified' ? 'var(--warn)' : 'var(--danger)' }}>
                            {['expense', 'fee', 'return'].includes(transaction.category) ? '−' : '+'}
                            {Math.abs(transaction.amount).toLocaleString('uk-UA')}
                            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>₴</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', width: 36 }}>
                          <button
                            onClick={() => setSelectedTx(transaction)}
                            style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18 }}
                          >
                            ⋯
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {transactions.map((transaction, index) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    first={index === 0}
                    onTap={() => setSelectedTx(transaction)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'book' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>Книга обліку</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
                PDF-готовий вигляд для експорту та перевірки доходів
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={bookPeriod}
                onChange={(event) => setBookPeriod(event.target.value)}
                style={{
                  height: 40,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  padding: '0 14px',
                }}
              >
                <option value={`Q1-${currentYear}`}>Q1 {currentYear}</option>
                <option value={`Q2-${currentYear}`}>Q2 {currentYear}</option>
                <option value={`Q3-${currentYear}`}>Q3 {currentYear}</option>
                <option value={`Q4-${currentYear}`}>Q4 {currentYear}</option>
              </select>
              <Button
                variant="primary"
                icon={<Download size={16} />}
                onClick={async () => {
                  try {
                    await downloadBookPdf(bookPeriod)
                    toast('PDF книги обліку завантажено ✓')
                  } catch {
                    toast('Не вдалося завантажити PDF', 'error')
                  }
                }}
              >
                Завантажити PDF
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
              <div className="label">Доходи</div>
              <div className="tnum" style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
                {formatNumber(totalIncome)} ₴
              </div>
            </div>
            <div style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
              <div className="label">Записів доходу</div>
              <div className="tnum" style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
                {incomeRows.length}
              </div>
            </div>
            <div style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
              <div className="label">Статус</div>
              <div style={{ marginTop: 10 }}>
                <Badge tone={incomeRows.length > 0 ? 'income' : 'neutral'} dot>
                  {incomeRows.length > 0 ? 'Готово до експорту' : 'Очікує дані'}
                </Badge>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div className="label">PDF preview</div>
            </div>
            {incomeRows.length === 0 ? (
              <div style={{ padding: 28, fontSize: 14, color: 'var(--text-3)' }}>
                Додай або синхронізуй доходи, щоб сформувати книгу обліку.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      {['№', 'Дата', 'Опис', 'Сума', 'Валюта'].map((header) => (
                        <th key={header} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incomeRows.map((transaction, index) => (
                      <tr key={transaction.id} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)' }}>{index + 1}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)' }}>{new Date(transaction.date).toLocaleDateString('uk-UA')}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)' }}>{transaction.description}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)', fontWeight: 600 }} className="tnum">
                          {formatNumber(transaction.amount)} ₴
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)' }}>{transaction.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <TransactionDetail transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
