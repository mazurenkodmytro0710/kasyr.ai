import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useUserStore } from '../store/userStore'
import type { DeadlineStatus } from '../types'
import { daysUntil, formatDate } from '../utils/dates'
import { formatNumber } from '../utils/formatCurrency'

const typeLabels: Record<string, string> = {
  ep_declaration: 'Декларація ЄП',
  ep_payment: 'Сплата ЄП',
  esv: 'ЄСВ',
  vz: 'Військовий збір',
  combined_report: 'Квартальний звіт',
}

const filters = ['Всі', 'Майбутні', 'Прострочені', 'Сплачені']

function StatusBadge({ status, daysLeft }: { status: DeadlineStatus; daysLeft: number }) {
  if (status === 'paid') return <Badge tone="income" dot>Сплачено</Badge>
  if (status === 'submitted') return <Badge tone="income" dot>Подано</Badge>
  if (status === 'overdue' || (status === 'pending' && daysLeft < 0)) return <Badge tone="danger" dot>Прострочено</Badge>
  if (daysLeft <= 7) return <Badge tone="warn" dot>{daysLeft} днів</Badge>
  return <Badge tone="neutral">{daysLeft} днів</Badge>
}

export function Deadlines() {
  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear, currentYear + 1]
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [activeFilter, setActiveFilter] = useState('Всі')
  const { deadlines, isDeadlinesLoading, fetchDeadlines, updateDeadlineStatus } = useUserStore()

  useEffect(() => {
    fetchDeadlines(selectedYear)
  }, [fetchDeadlines, selectedYear])

  const filtered = useMemo(() => deadlines.filter((deadline) => {
    const days = daysUntil(deadline.dueDate)
    if (activeFilter === 'Майбутні') return deadline.status === 'pending' && days >= 0
    if (activeFilter === 'Прострочені') return deadline.status === 'pending' && days < 0
    if (activeFilter === 'Сплачені') return deadline.status === 'paid' || deadline.status === 'submitted'
    return true
  }), [deadlines, activeFilter])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 104px', maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--text)' }}>
          Дедлайни
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
          Податкові зобовʼязання на {selectedYear} рік
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {yearOptions.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              background: selectedYear === year ? 'var(--indigo-glow)' : 'var(--surface-2)',
              color: selectedYear === year ? 'var(--indigo-300)' : 'var(--text-2)',
              border: selectedYear === year ? '1px solid rgba(129,140,248,0.3)' : '1px solid var(--border)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {year}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              background: activeFilter === filter ? 'var(--indigo-glow)' : 'var(--surface-2)',
              color: activeFilter === filter ? 'var(--indigo-300)' : 'var(--text-2)',
              border: activeFilter === filter ? '1px solid rgba(129,140,248,0.3)' : '1px solid var(--border)',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {isDeadlinesLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 30, borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-3)' }}>
              Немає дедлайнів для цього фільтра.
            </div>
          )}

          {filtered.map((deadline) => {
            const days = daysUntil(deadline.dueDate)
            const done = deadline.status === 'paid' || deadline.status === 'submitted'
            const urgent = !done && days >= 0 && days <= 14

            return (
              <div
                key={deadline.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 18px',
                  background: 'var(--surface)',
                  border: `1px solid ${urgent ? 'rgba(245,158,11,0.28)' : 'var(--border)'}`,
                  borderRadius: 18,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={async () => {
                    if (done) return
                    await updateDeadlineStatus(deadline.id, 'paid')
                    await fetchDeadlines(selectedYear)
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: `2px solid ${done ? 'var(--success)' : urgent ? 'var(--warn)' : 'var(--border)'}`,
                    background: done ? 'var(--success-10)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: done ? 'default' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {done && <Check size={14} color="var(--success)" />}
                </button>

                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                      {typeLabels[deadline.type] ?? deadline.type}
                    </div>
                    <Badge tone="neutral">{deadline.period}</Badge>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)' }}>
                    {formatDate(deadline.dueDate)}
                  </div>
                </div>

                {deadline.amount != null && deadline.amount > 0 && (
                  <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {formatNumber(deadline.amount)} ₴
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 'auto' }}>
                  <StatusBadge status={deadline.status} daysLeft={days} />
                  {!done && (
                    <Button variant="secondary" size="sm" onClick={async () => {
                      await updateDeadlineStatus(deadline.id, 'paid')
                      await fetchDeadlines(selectedYear)
                    }}>
                      Сплачено
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
