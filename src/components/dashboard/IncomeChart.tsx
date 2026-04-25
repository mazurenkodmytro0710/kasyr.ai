import { formatNumber } from '../../utils/formatCurrency'
import { Badge } from '../ui/Badge'

interface ChartData {
  month: string
  amount: number
}

interface IncomeChartProps {
  uah: number
  usd: number
  months: ChartData[]
  delta?: number
  quarter: string
  mobile?: boolean
  periodOptions?: Array<{ label: string; value: string }>
  activePeriod?: string
  onPeriodChange?: (period: string) => void
}

export function IncomeChart({
  uah,
  usd,
  months,
  delta,
  quarter,
  mobile,
  periodOptions,
  activePeriod,
  onPeriodChange,
}: IncomeChartProps) {
  const max = Math.max(...months.map(m => m.amount), 1)

  if (mobile) {
    return (
      <div
        style={{
          padding: 18,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <div className="label">ДОХІД ПО МІСЯЦЯХ · {quarter}</div>
          {delta !== undefined && (
            <Badge tone="income" dot>
              +{delta}%
            </Badge>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 500 }}>₴</span>
            <span
              className="tnum"
              style={{
                fontSize: 'clamp(28px, 9vw, 34px)',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                whiteSpace: 'nowrap',
              }}
            >
              {formatNumber(uah)}
            </span>
          </div>
          {usd > 0 && (
            <div className="tnum" style={{ fontSize: 12, color: 'var(--text-3)' }}>
              ≈ ${formatNumber(usd)}
            </div>
          )}
        </div>
        {periodOptions && onPeriodChange && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onPeriodChange(option.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: activePeriod === option.value ? 'var(--indigo-glow)' : 'var(--surface-2)',
                  color: activePeriod === option.value ? 'var(--indigo-300)' : 'var(--text-3)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <MobileBarChart months={months} max={max} />
      </div>
    )
  }

  return (
    <div style={{
      padding: 20, background: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div className="label">ДОХІД ПО МІСЯЦЯХ · {quarter}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span className="tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {formatNumber(uah)} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 14 }}>₴</span>
            </span>
            {delta !== undefined && <Badge tone="income" dot>+{delta}%</Badge>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 3, borderRadius: 8 }}>
          {(periodOptions ?? []).map((option) => (
            <button
              key={option.value}
              onClick={() => onPeriodChange?.(option.value)}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activePeriod === option.value ? 'var(--surface-3)' : 'transparent',
                color: activePeriod === option.value ? 'var(--text)' : 'var(--text-3)',
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <DesktopLineChart months={months} max={max} />
    </div>
  )
}

function MobileBarChart({ months, max }: { months: ChartData[]; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
      {months.map((mo, i) => {
        const isActive = mo.amount > 0 && i === 0
        const isProjected = mo.amount === 0
        return (
          <div key={mo.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{
              width: '100%',
              height: Math.max(6, (mo.amount / max) * 50) || 6,
              borderRadius: 6,
              background: isActive
                ? 'linear-gradient(180deg, var(--indigo-400), var(--indigo-600))'
                : 'var(--surface-2)',
              boxShadow: isActive ? '0 0 20px rgba(99,102,241,0.4)' : 'none',
              border: isProjected ? '1px dashed var(--border)' : 'none',
            }} />
            <div style={{ fontSize: 11, color: isActive ? 'var(--indigo-400)' : 'var(--text-3)', fontWeight: 500 }}>
              {mo.month}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DesktopLineChart({ months, max }: { months: ChartData[]; max: number }) {
  const W = 520, H = 180, P = 16
  const visibleMonths = months.filter((month) => month.month !== '—')
  const allMonths = visibleMonths.length > 0 ? visibleMonths : months
  const stepCount = Math.max(allMonths.length - 1, 1)
  const pts = allMonths.map((d, i) => ({
    x: P + (i * (W - P * 2) / stepCount),
    y: H - P - (d.amount / max) * (H - P * 2),
    v: d.amount,
    m: d.month,
  }))
  const realPts = pts.filter(p => p.v > 0)
  const pathD = realPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const fillD = realPts.length > 1
    ? `${pathD} L${realPts[realPts.length - 1].x},${H - P} L${realPts[0].x},${H - P} Z`
    : ''

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6366F1" stopOpacity="0.4" />
            <stop offset="1" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="strokeGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#818CF8" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map(g => (
          <line key={g} x1={P} x2={W - P}
            y1={H - P - g * (H - P * 2)} y2={H - P - g * (H - P * 2)}
            stroke="#1C1C22" strokeDasharray="2 4" />
        ))}
        {fillD && <path d={fillD} fill="url(#fillGrad)" />}
        {pathD && <path d={pathD} stroke="url(#strokeGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {realPts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#6366F1" />
            <circle cx={p.x} cy={p.y} r="7" fill="#6366F1" opacity="0.25" />
          </g>
        ))}
        {realPts.length > 1 && pts[pts.length - 1] && (
          <line
            x1={realPts[realPts.length - 1].x} y1={realPts[realPts.length - 1].y}
            x2={pts[pts.length - 1].x} y2={H - P - 60}
            stroke="#4F4F61" strokeWidth="1.5" strokeDasharray="4 4"
          />
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px 0', fontSize: 11, color: 'var(--text-3)' }}>
        {allMonths.map((d, i) => <span key={i}>{d.month}</span>)}
      </div>
    </div>
  )
}
