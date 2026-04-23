import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Copy, CreditCard, Landmark, Plus } from 'lucide-react'
import client from '../api/client'
import { CurrencyRates } from '../components/dashboard/CurrencyRates'
import { DeadlineCard } from '../components/dashboard/DeadlineCard'
import { IncomeChart } from '../components/dashboard/IncomeChart'
import { TransactionRow } from '../components/dashboard/TransactionRow'
import { TransactionDetail } from '../components/transactions/TransactionDetail'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Sheet } from '../components/ui/Modal'
import { toast } from '../components/ui/Toast'
import { useUiStore } from '../store/uiStore'
import { useUserStore } from '../store/userStore'
import type { IncomePeriodData, Transaction } from '../types'
import { getCurrentQuarter, getCurrentYear, getQuarterLabel } from '../utils/dates'
import { formatNumber } from '../utils/formatCurrency'

function SummaryCard({
  label,
  value,
  hint,
  action,
}: {
  label: string
  value: ReactNode
  hint?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        padding: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div className="label">{label}</div>
      <div>{value}</div>
      {hint && <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>{hint}</div>}
      {action}
    </div>
  )
}

function BreakdownSheet({
  open,
  onClose,
  totalDue,
}: {
  open: boolean
  onClose: () => void
  totalDue: { ep: number; esv: number; vz: number; total: number }
}) {
  const paymentRows = [
    {
      title: 'ЄП',
      amount: totalDue.ep,
      recipient: 'ДПС України',
      iban: 'Уточни IBAN в Е-кабінеті платника за своєю громадою.',
    },
    {
      title: 'ЄСВ',
      amount: totalDue.esv,
      recipient: 'Пенсійний фонд / ДПС',
      iban: 'Уточни актуальний рахунок ЄСВ в Е-кабінеті платника.',
    },
    {
      title: 'ВЗ',
      amount: totalDue.vz,
      recipient: 'ДПС України',
      iban: 'Військовий збір також залежить від актуальних бюджетних рахунків.',
    },
  ]

  const handleCopy = async () => {
    const text = paymentRows
      .map((row) => `${row.title}: ${row.amount} грн\nОтримувач: ${row.recipient}\n${row.iban}`)
      .join('\n\n')
    await navigator.clipboard.writeText(text)
    toast('Реквізити скопійовано')
  }

  if (!open) return null

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ padding: '0 20px 12px' }}>
        <div className="label" style={{ color: 'var(--indigo-400)' }}>Оплата податків</div>
        <h2 style={{ margin: '8px 0 18px', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>
          Варіанти сплати
        </h2>

        <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
          <Button variant="primary" full icon={<CreditCard size={16} />} onClick={() => toast('Підготовка Monobank-платежів буде в наступному кроці')}>
            Monobank
          </Button>
          <Button variant="secondary" full icon={<Landmark size={16} />}>
            Через банк (реквізити)
          </Button>
          <Button variant="ghost" full icon={<Copy size={16} />} onClick={handleCopy}>
            Скопіювати реквізити
          </Button>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {paymentRows.map((row) => (
            <div
              key={row.title}
              style={{
                padding: '14px 16px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{row.title}</div>
                <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  {formatNumber(row.amount)} ₴
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>Отримувач: {row.recipient}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>{row.iban}</div>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

export function Dashboard() {
  const { dashboard, deadlines, fetchDashboard, fetchDeadlines, isLoading } = useUserStore()
  const { openAddTransaction } = useUiStore()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [incomeData, setIncomeData] = useState<IncomePeriodData | null>(null)

  const currentYear = getCurrentYear()
  const currentQuarter = getCurrentQuarter()
  const defaultPeriod = `Q${currentQuarter}-${currentYear}`
  const [activePeriod, setActivePeriod] = useState(defaultPeriod)

  const periodOptions = useMemo(() => ([
    { label: 'Q1', value: `Q1-${currentYear}` },
    { label: 'Q2', value: `Q2-${currentYear}` },
    { label: 'Q3', value: `Q3-${currentYear}` },
    { label: 'Q4', value: `Q4-${currentYear}` },
    { label: 'Рік', value: `Y-${currentYear}` },
  ]), [currentYear])

  useEffect(() => {
    fetchDashboard()
    fetchDeadlines(currentYear)
  }, [fetchDashboard, fetchDeadlines, currentYear])

  useEffect(() => {
    client.get<IncomePeriodData>('/api/dashboard/income', { params: { period: activePeriod } })
      .then((response) => setIncomeData(response.data))
      .catch(() => setIncomeData(null))
  }, [activePeriod])

  if (isLoading || !dashboard) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    )
  }

  const chartTitle = activePeriod.startsWith('Y-')
    ? activePeriod.replace('Y-', '')
    : activePeriod.replace('-', ' ')
  const chartMonths = incomeData?.monthlyChart ?? dashboard.monthlyChart
  const chartUah = incomeData?.uah ?? dashboard.quarterIncome.uah
  const chartUsd = incomeData?.usd ?? dashboard.quarterIncome.usd
  const upcomingDeadlines = deadlines.filter((deadline) => deadline.status === 'pending').slice(0, 3)
  const nextDeadlineHint = dashboard.nextDeadline
    ? `Найближчий дедлайн через ${dashboard.nextDeadline.daysLeft} днів`
    : 'Найближчих дедлайнів поки немає'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 112px', maxWidth: 1280 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div className="label" style={{ color: 'var(--indigo-400)' }}>
            {getQuarterLabel(currentQuarter, currentYear)} · Огляд
          </div>
          <h1 style={{ margin: '6px 0 8px', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            Дашборд Kasyr.ai
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)' }}>
            {nextDeadlineHint}
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openAddTransaction}>
          Додати транзакцію
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3" style={{ marginBottom: 18 }}>
        <SummaryCard
          label="До сплати"
          value={(
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="tnum" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' }}>
                {formatNumber(dashboard.totalDue.total)}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>₴</span>
            </div>
          )}
          hint={dashboard.nextDeadline ? `${dashboard.nextDeadline.type} · до ${dashboard.nextDeadline.date}` : 'Суми оновлюються автоматично'}
          action={(
            <Button variant="secondary" size="sm" onClick={() => setBreakdownOpen(true)}>
              Сплатити
            </Button>
          )}
        />
        <SummaryCard
          label="Доходи"
          value={(
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="tnum" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' }}>
                {formatNumber(chartUah)}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>₴</span>
            </div>
          )}
          hint={`${incomeData?.txCount ?? dashboard.recentTransactions.length} транзакцій доходу за період ${chartTitle}`}
        />
        <SummaryCard
          label="Книга обліку"
          value={(
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge tone={dashboard.bookStatus.pendingCount > 0 ? 'warn' : 'income'} dot>
                {dashboard.bookStatus.pendingCount > 0 ? 'Потребує уваги' : 'Актуальна'}
              </Badge>
            </div>
          )}
          hint={dashboard.bookStatus.pendingCount > 0
            ? `${dashboard.bookStatus.pendingCount} транзакцій ще треба класифікувати`
            : 'Усі транзакції рознесені по категоріях'
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]" style={{ marginBottom: 18 }}>
        <IncomeChart
          uah={chartUah}
          usd={chartUsd}
          months={chartMonths}
          quarter={chartTitle}
          delta={dashboard.quarterIncome.uah > 0 ? 12 : 0}
          periodOptions={periodOptions}
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
        />

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div className="label">Найближчі дедлайни</div>
              <Button variant="plain" size="sm" onClick={() => fetchDeadlines(currentYear)}>
                Оновити
              </Button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {upcomingDeadlines.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Поки немає нових дедлайнів.</div>
              )}
              {upcomingDeadlines.map((deadline) => (
                <DeadlineCard key={deadline.id} deadline={deadline} />
              ))}
            </div>
          </div>

          <CurrencyRates />
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Останні транзакції</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
              Останні імпортовані або додані вручну операції
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={openAddTransaction}>
            Додати
          </Button>
        </div>

        {dashboard.recentTransactions.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', fontSize: 14, color: 'var(--text-3)' }}>
            Ще немає транзакцій. Підключи банк або додай першу вручну.
          </div>
        ) : (
          <div>
            {dashboard.recentTransactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                first={index === 0}
                onTap={() => setSelectedTx(transaction)}
              />
            ))}
          </div>
        )}
      </div>

      <TransactionDetail transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      <BreakdownSheet open={breakdownOpen} onClose={() => setBreakdownOpen(false)} totalDue={dashboard.totalDue} />
    </div>
  )
}
