import { Badge } from '../ui/Badge'
import { formatNumber } from '../../utils/formatCurrency'
import { formatShortDate } from '../../utils/dates'
import type { Transaction } from '../../types'

function BankAvatar({ provider, size = 36 }: { provider: string; size?: number }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    monobank: { bg: '#0A0A0A', fg: '#fff', label: 'M' },
    wise:     { bg: '#9FE870', fg: '#163300', label: 'W' },
    privat:   { bg: '#00A859', fg: '#fff', label: 'П' },
  }
  const m = map[provider] ?? { bg: 'var(--surface-2)', fg: 'var(--text-3)', label: '?' }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: m.bg, color: m.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      fontFamily: 'var(--font-sans)',
    }}>{m.label}</div>
  )
}

function UnclassifiedAvatar({ size = 36 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--surface-2)', color: 'var(--text-3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700,
      border: '1px solid var(--border)',
    }}>?</div>
  )
}

interface TransactionRowProps {
  transaction: Transaction
  first?: boolean
  onTap?: () => void
  bankProvider?: string
}

export function TransactionRow({ transaction: t, first, onTap, bankProvider = 'monobank' }: TransactionRowProps) {
  const isUnclassified = t.category === 'unclassified'
  const isReturn = t.category === 'return'
  const isIncome = t.category === 'income'

  return (
    <button
      onClick={onTap}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', border: 'none', background: 'transparent',
        cursor: 'pointer', textAlign: 'left', color: 'inherit',
        borderTop: first ? 'none' : '1px solid var(--surface-2)',
      }}
    >
      {isUnclassified
        ? <UnclassifiedAvatar />
        : <BankAvatar provider={bankProvider} />
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500, color: 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{t.description}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>{formatShortDate(t.date)} · {bankProvider === 'monobank' ? 'Monobank' : bankProvider}</span>
          {isUnclassified && <Badge tone="warn" dashed>Не класифіковано</Badge>}
          {isReturn && <Badge tone="danger">Повернення</Badge>}
          {isIncome && <Badge tone="income">Дохід</Badge>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="tnum" style={{
          fontSize: 15, fontWeight: 600,
          color: isReturn ? 'var(--danger)' : isUnclassified ? 'var(--warn)' : 'var(--text)',
          letterSpacing: '-0.01em',
        }}>
          {isReturn ? '−' : '+'}{formatNumber(t.amount)}
          <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontWeight: 500 }}>₴</span>
        </div>
        {t.exchangeRate && t.exchangeRate > 0 && (
          <div className="tnum" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            ${formatNumber(Math.round(Math.abs(t.amount) / t.exchangeRate))}
          </div>
        )}
      </div>
    </button>
  )
}

export { BankAvatar, UnclassifiedAvatar }
