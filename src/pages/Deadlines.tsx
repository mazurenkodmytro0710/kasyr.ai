import { useState } from 'react'
import { Check } from 'lucide-react'
import { mockDeadlines } from '../mocks'
import { formatDate, daysUntil } from '../utils/dates'
import { formatNumber } from '../utils/formatCurrency'
import { Badge } from '../components/ui/Badge'
import type { DeadlineStatus } from '../types'

const typeLabels: Record<string, string> = {
  ep_declaration: 'Декларація ЄП',
  ep_payment: 'Сплата ЄП',
  esv: 'Єдиний соц. внесок',
  vz: 'Військовий збір',
  combined_report: 'Квартальний ЄП + ЄСВ + ВЗ',
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
  const [activeFilter, setActiveFilter] = useState('Всі')

  const filtered = mockDeadlines.filter(d => {
    const days = daysUntil(d.dueDate)
    if (activeFilter === 'Майбутні') return d.status === 'pending' && days >= 0
    if (activeFilter === 'Прострочені') return d.status === 'pending' && days < 0
    if (activeFilter === 'Сплачені') return d.status === 'paid' || d.status === 'submitted'
    return true
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: 'var(--text)' }}>
          Дедлайни
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>
          Календар податкових зобов'язань 2026
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              background: activeFilter === f ? 'var(--indigo-glow)' : 'var(--surface-2)',
              color: activeFilter === f ? 'var(--indigo-300)' : 'var(--text-2)',
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
              border: activeFilter === f ? '1px solid rgba(129,140,248,0.3)' : '1px solid var(--border)',
            }}
          >{f}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(d => {
          const days = daysUntil(d.dueDate)
          const done = d.status === 'paid' || d.status === 'submitted'
          const urgent = !done && days >= 0 && days <= 14

          return (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              background: 'var(--surface)',
              border: `1px solid ${urgent ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
              borderRadius: 12,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${done ? 'var(--success)' : urgent ? 'var(--warn)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--success-10)' : 'transparent',
              }}>
                {done && <Check size={12} color="var(--success)" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                  {typeLabels[d.type] ?? d.type}
                  <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>· {d.period}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {formatDate(d.dueDate)}
                </div>
              </div>

              {d.amount != null && d.amount > 0 && (
                <div className="tnum" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
                  {formatNumber(d.amount)} ₴
                </div>
              )}

              <div style={{ flexShrink: 0 }}>
                <StatusBadge status={d.status} daysLeft={days} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
