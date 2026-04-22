import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useTransactionStore } from '../store/transactionStore'
import { TransactionRow } from '../components/dashboard/TransactionRow'
import { TransactionDetail } from '../components/transactions/TransactionDetail'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import type { Transaction } from '../types'

const categories = [
  { value: 'all', label: 'Всі' },
  { value: 'income', label: 'Дохід' },
  { value: 'unclassified', label: 'Некласифіковано' },
  { value: 'return', label: 'Повернення' },
  { value: 'own_transfer', label: 'Переказ' },
]

export function Transactions() {
  const { transactions, total, isLoading, fetchTransactions } = useTransactionStore()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTransactions({ category: category === 'all' ? undefined : category, search: search || undefined })
  }, [category, search, fetchTransactions])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: 'var(--text)' }}>
            Транзакції
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>
            {total} транзакцій
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 200px', minWidth: 0, maxWidth: 400 }}>
          <Input
            placeholder="Пошук по опису або сумі…"
            leading={<Search size={16} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              style={{
                padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                background: category === c.value ? 'var(--indigo-glow)' : 'var(--surface-2)',
                color: category === c.value ? 'var(--indigo-300)' : 'var(--text-2)',
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                border: category === c.value ? '1px solid rgba(129,140,248,0.3)' : '1px solid var(--border)',
              }}
            >{c.label}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : transactions.length === 0 ? (
        <div style={{
          padding: 64, textAlign: 'center',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>
            Немає транзакцій
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>
            Підключи Monobank у налаштуваннях щоб почати
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block" style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  {['', 'Дата', 'Опис', 'Статус', 'Сума', ''].map((h, i) => (
                    <th key={i} style={{
                      textAlign: i === 4 ? 'right' : 'left', padding: '10px 16px',
                      fontSize: 11, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase',
                      color: 'var(--text-3)', borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTx(t)}
                    style={{
                      borderBottom: i < transactions.length - 1 ? '1px solid var(--surface-2)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: '14px 16px', width: 36 }}>
                      <input type="checkbox" onClick={e => e.stopPropagation()} />
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-3)', whiteSpace: 'nowrap' }} className="tnum">
                      {new Date(t.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text)', fontWeight: 500, maxWidth: 300 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {t.category === 'income' && <Badge tone="income" dot>Дохід</Badge>}
                      {t.category === 'unclassified' && <Badge tone="warn" dashed>Перевірити</Badge>}
                      {t.category === 'return' && <Badge tone="danger">Повернення</Badge>}
                      {t.category === 'own_transfer' && <Badge tone="neutral">Переказ</Badge>}
                      {t.category === 'fee' && <Badge tone="neutral">Комісія</Badge>}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }} className="tnum">
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: t.amount < 0 ? 'var(--danger)' : t.category === 'unclassified' ? 'var(--warn)' : 'var(--text)',
                      }}>
                        {t.amount > 0 ? '+' : '−'}{Math.abs(t.amount).toLocaleString('uk-UA')}
                        <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontWeight: 500 }}>₴</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', width: 36 }}>
                      <span style={{ color: 'var(--text-3)', fontSize: 18 }}>⋯</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden" style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden',
          }}>
            {transactions.map((t, i) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                first={i === 0}
                onTap={() => setSelectedTx(t)}
              />
            ))}
          </div>
        </>
      )}

      <TransactionDetail transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
