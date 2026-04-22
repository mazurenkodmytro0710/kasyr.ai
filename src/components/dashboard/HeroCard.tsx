import { ChevronRight, Zap } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatNumber } from '../../utils/formatCurrency'

interface HeroCardProps {
  taxes: { ep: number; esv: number; vz: number; total: number }
  quarter: string
  daysLeft: number
  onDetails?: () => void
  onPay?: () => void
}

function TaxChip({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, letterSpacing: 0.3 }}>{label}</span>
      <span className="tnum" style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{formatNumber(value)}</span>
    </div>
  )
}

export function HeroCard({ taxes, quarter, daysLeft, onDetails, onPay }: HeroCardProps) {
  const badgeTone = daysLeft < 3 ? 'danger' : daysLeft < 14 ? 'warn' : 'neutral'

  return (
    <div style={{
      margin: '0 16px 20px',
      padding: '22px 22px 18px',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #1C1C22 55%, #0F0F1A 100%)',
      borderRadius: 20,
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(99,102,241,0.22)',
      boxShadow: 'var(--shadow-indigo)',
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(129,140,248,0.35), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div className="label" style={{ color: 'var(--indigo-300)' }}>
          ДО СПЛАТИ · {quarter}
        </div>
        <Badge tone={badgeTone} dot>{daysLeft} днів</Badge>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 12, position: 'relative' }}>
        <span style={{ fontSize: 32, color: 'var(--text-muted)', fontWeight: 500 }}>₴</span>
        <span className="tnum" style={{
          fontSize: 56, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1, color: 'white',
        }}>{formatNumber(taxes.total)}</span>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 14, position: 'relative' }}>
        <TaxChip label="ЄП" value={taxes.ep} />
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <TaxChip label="ЄСВ" value={taxes.esv} />
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <TaxChip label="ВЗ" value={taxes.vz} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18, position: 'relative' }}>
        <button
          onClick={onDetails}
          style={{
            flex: 1, height: 44, borderRadius: 10, cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)', color: 'var(--indigo-300)',
            border: '1px solid rgba(129,140,248,0.3)',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          Деталі <ChevronRight size={14} />
        </button>
        <button
          onClick={onPay}
          style={{
            flex: 1.2, height: 44, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'var(--indigo-500)', color: 'white',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 6px 24px -6px rgba(99,102,241,0.6)',
          }}
        >
          Сплатити <Zap size={14} />
        </button>
      </div>
    </div>
  )
}
