import type { Deadline } from '../../types'
import { formatNumber } from '../../utils/formatCurrency'
import { daysUntil, formatDate } from '../../utils/dates'

interface DeadlineCardProps {
  deadline: Deadline
}

const typeLabels: Record<string, string> = {
  ep_declaration: 'Декларація ЄП',
  ep_payment: 'Сплата ЄП',
  esv: 'Єдиний соц. внесок',
  vz: 'Військовий збір',
  combined_report: 'Квартальний ЄП + ЄСВ + ВЗ',
}

export function DeadlineCard({ deadline }: DeadlineCardProps) {
  const days = daysUntil(deadline.dueDate)
  const urgent = days <= 14 && days >= 0
  const overdue = days < 0 && deadline.status === 'pending'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      background: 'var(--surface-2)', borderRadius: 10,
      border: '1px solid var(--border)',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: urgent ? 'var(--warn-10)' : overdue ? 'var(--danger-10)' : 'var(--surface-3)',
        color: urgent ? 'var(--warn)' : overdue ? 'var(--danger)' : 'var(--text-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      }}>
        {deadline.status === 'paid' || deadline.status === 'submitted' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <>
            <div className="tnum" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{Math.abs(days)}</div>
            <div style={{ fontSize: 8, letterSpacing: 0.5, marginTop: 2 }}>ДНІВ</div>
          </>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          {typeLabels[deadline.type] ?? deadline.type} · {deadline.period}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          {formatDate(deadline.dueDate)}
          {overdue && ' · Прострочено'}
          {deadline.status === 'paid' && ' · Сплачено'}
          {deadline.status === 'submitted' && ' · Подано'}
        </div>
      </div>
      {deadline.amount != null && deadline.amount > 0 && (
        <div className="tnum" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
          {formatNumber(deadline.amount)} <span style={{ color: 'var(--text-muted)' }}>₴</span>
        </div>
      )}
    </div>
  )
}
