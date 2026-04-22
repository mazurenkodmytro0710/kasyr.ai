import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Dot } from 'lucide-react'
import { HeroCard } from '../components/dashboard/HeroCard'
import { IncomeChart } from '../components/dashboard/IncomeChart'
import { TransactionRow } from '../components/dashboard/TransactionRow'
import { DeadlineCard } from '../components/dashboard/DeadlineCard'
import { TransactionDetail } from '../components/transactions/TransactionDetail'
import { useUserStore } from '../store/userStore'
import { formatNumber } from '../utils/formatCurrency'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { mockDeadlines } from '../mocks'
import type { Transaction } from '../types'
import { getQuarterLabel, getCurrentQuarter, getCurrentYear } from '../utils/dates'

function BreakdownSheet({ taxes, quarter, open, onClose }: {
  taxes: { ep: number; esv: number; vz: number; total: number }
  quarter: string
  open: boolean
  onClose: () => void
}) {
  if (!open) return null
  const rows = [
    { k: 'Єдиний податок (5%)', v: taxes.ep, hint: '5% від доходу кварталу' },
    { k: 'Єдиний соц. внесок', v: taxes.esv, hint: 'Мінімум за квартал · фіксовано' },
    { k: 'Військовий збір (1.5%)', v: taxes.vz, hint: '1.5% від обороту кварталу' },
  ]
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-content" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ padding: '0 20px' }}>
          <div className="label" style={{ color: 'var(--indigo-400)' }}>РОЗБИВКА · {quarter}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '6px 0 18px', letterSpacing: '-0.02em' }}>
            Звідки взялась ця сума
          </h2>
          <div style={{ background: 'var(--surface-2)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {rows.map((r, i) => (
              <div key={r.k} style={{
                padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', gap: 12,
                borderTop: i ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{r.k}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{r.hint}</div>
                </div>
                <div className="tnum" style={{ fontSize: 15, fontWeight: 600 }}>
                  {formatNumber(r.v)} <span style={{ color: 'var(--text-muted)' }}>₴</span>
                </div>
              </div>
            ))}
            <div style={{
              padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
              borderTop: '1px solid var(--border)', background: 'var(--indigo-glow)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--indigo-300)' }}>Разом</span>
              <span className="tnum" style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                {formatNumber(taxes.total)} <span style={{ color: 'var(--indigo-300)' }}>₴</span>
              </span>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.55 }}>
            ПКУ ст. 293, 295. Три окремі платіжки будуть створені в Monobank автоматично.
          </div>
          <div style={{ marginTop: 14 }}>
            <Button variant="primary" full size="lg" icon={<Zap size={18} />}>
              Сплатити через Monobank
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileDashboard() {
  const navigate = useNavigate()
  const { dashboard } = useUserStore()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [breakdown, setBreakdown] = useState(false)
  const q = getQuarterLabel(getCurrentQuarter(), getCurrentYear())

  if (!dashboard) return null

  return (
    <div style={{ paddingBottom: 96 }}>
      <HeroCard
        taxes={dashboard.totalDue}
        quarter={q}
        daysLeft={dashboard.nextDeadline?.daysLeft ?? 19}
        onDetails={() => setBreakdown(true)}
        onPay={() => setBreakdown(true)}
      />

      <IncomeChart
        uah={dashboard.quarterIncome.uah}
        usd={dashboard.quarterIncome.usd}
        months={dashboard.monthlyChart}
        delta={12}
        quarter={q}
        mobile
      />

      {/* Book status */}
      <button
        onClick={() => navigate('/transactions')}
        style={{
          margin: '0 16px 20px', width: 'calc(100% - 32px)', padding: '14px 16px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', textAlign: 'left',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: dashboard.bookStatus.pendingCount > 0 ? 'var(--warn-10)' : 'var(--success-10)',
          color: dashboard.bookStatus.pendingCount > 0 ? 'var(--warn)' : 'var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Dot size={14} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
            {dashboard.bookStatus.pendingCount > 0
              ? `${dashboard.bookStatus.pendingCount} транзакції потребують уваги`
              : 'Книга обліку актуальна'
            }
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            Книга обліку · синхронізовано 2 хв тому
          </div>
        </div>
        <ArrowRight size={18} color="var(--text-3)" />
      </button>

      {/* Recent transactions */}
      <div style={{ margin: '0 16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="label">ОСТАННІ ТРАНЗАКЦІЇ</div>
          <button
            onClick={() => navigate('/transactions')}
            style={{ fontSize: 13, color: 'var(--indigo-400)', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Всі <ArrowRight size={12} />
          </button>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {dashboard.recentTransactions.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Немає транзакцій</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Підключи Monobank щоб почати</div>
            </div>
          ) : (
            dashboard.recentTransactions.map((t, i) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                first={i === 0}
                onTap={() => setSelectedTx(t)}
              />
            ))
          )}
        </div>
      </div>

      <TransactionDetail
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
      <BreakdownSheet
        taxes={dashboard.totalDue}
        quarter={q}
        open={breakdown}
        onClose={() => setBreakdown(false)}
      />
    </div>
  )
}

function SummaryCard({ label, children, action, tone }: {
  label: string; children: React.ReactNode; action?: React.ReactNode; tone?: string
}) {
  return (
    <div style={{
      padding: 20, background: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 16,
      display: 'flex', flexDirection: 'column', gap: 12, minHeight: 152,
      position: 'relative', overflow: 'hidden',
    }}>
      {tone === 'indigo' && (
        <div style={{
          position: 'absolute', top: -60, right: -40, width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(99,102,241,0.28), transparent 70%)',
          pointerEvents: 'none',
        }} />
      )}
      <div className="label" style={{ position: 'relative' }}>{label}</div>
      <div style={{ flex: 1, position: 'relative' }}>{children}</div>
      {action && <div style={{ position: 'relative' }}>{action}</div>}
    </div>
  )
}

function DesktopDashboard() {
  const navigate = useNavigate()
  const { dashboard } = useUserStore()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [breakdown, setBreakdown] = useState(false)
  const q = getQuarterLabel(getCurrentQuarter(), getCurrentYear())

  if (!dashboard) return null

  const upcomingDeadlines = mockDeadlines.filter(d => d.status === 'pending').slice(0, 3)

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div className="label">{q} · Огляд</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', margin: '6px 0 0', color: 'var(--text)' }}>
            Доброго дня 👋
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon={<Dot size={16} />}>{q}</Button>
          <Button variant="primary" icon={<ArrowRight size={16} />}>Додати транзакцію</Button>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <SummaryCard label="ДО СПЛАТИ · Q2 2026" tone="indigo" action={
          <Button variant="primary" size="sm" icon={<Zap size={14} />} onClick={() => setBreakdown(true)}>
            Сплатити
          </Button>
        }>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tnum" style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: 'white', lineHeight: 1 }}>
              {formatNumber(dashboard.totalDue.total)}
            </span>
            <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>₴</span>
          </div>
          {dashboard.nextDeadline && (
            <div style={{ fontSize: 12, color: 'var(--warn)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Dot size={8} /> до {dashboard.nextDeadline.date.slice(5).split('-').reverse().join('.')} · {dashboard.nextDeadline.daysLeft} днів
            </div>
          )}
        </SummaryCard>

        <SummaryCard label="ДОХІД КВАРТАЛУ" action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: 12, fontWeight: 500 }}>
            +12% до Q1 · ${formatNumber(dashboard.quarterIncome.usd)}
          </div>
        }>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="tnum" style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1 }}>
              {formatNumber(dashboard.quarterIncome.uah)}
            </span>
            <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>₴</span>
          </div>
        </SummaryCard>

        <SummaryCard label="СТАТУС КНИГИ" action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>Переглянути {dashboard.bookStatus.pendingCount} →</Button>
        }>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: dashboard.bookStatus.pendingCount > 0 ? 'var(--warn)' : 'var(--success)',
              animation: dashboard.bookStatus.pendingCount > 0 ? 'pulse 1.8s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {dashboard.bookStatus.pendingCount > 0 ? `${dashboard.bookStatus.pendingCount} непідтверджені` : 'Актуальна'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>оновлено щойно</div>
        </SummaryCard>
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginBottom: 20 }}>
        <IncomeChart
          uah={dashboard.quarterIncome.uah}
          usd={dashboard.quarterIncome.usd}
          months={dashboard.monthlyChart}
          delta={12}
          quarter={q}
        />
        <div style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="label">НАЙБЛИЖЧІ ДЕДЛАЙНИ</div>
            <button onClick={() => navigate('/deadlines')} style={{ fontSize: 12, color: 'var(--indigo-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              Календар →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingDeadlines.map(d => <DeadlineCard key={d.id} deadline={d} />)}
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em', color: 'var(--text)' }}>Усі транзакції</h3>
            <Badge tone="neutral">{dashboard.recentTransactions.length}</Badge>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/transactions')}>
            Переглянути всі →
          </Button>
        </div>
        <div>
          {dashboard.recentTransactions.map((t, i) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              first={i === 0}
              onTap={() => setSelectedTx(t)}
            />
          ))}
        </div>
      </div>

      <TransactionDetail transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      <BreakdownSheet taxes={dashboard.totalDue} quarter={q} open={breakdown} onClose={() => setBreakdown(false)} />
    </main>
  )
}

export function Dashboard() {
  const { fetchDashboard, isLoading } = useUserStore()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    )
  }

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileDashboard />
      </div>
      {/* Desktop */}
      <div className="hidden md:flex" style={{ flex: 1, overflow: 'hidden' }}>
        <DesktopDashboard />
      </div>
    </>
  )
}
