import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Copy, CreditCard, Landmark, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { useUserStore } from '../store/userStore'
import { HintBanner } from '../components/ui/HintBanner'
import type { IncomePeriodData, Transaction } from '../types'
import { getCurrentQuarter, getCurrentYear, getQuarterLabel } from '../utils/dates'
import { formatNumber } from '../utils/formatCurrency'

const deadlineTypeLabels: Record<string, string> = {
  ep_declaration: 'Декларація ЄП',
  ep_payment: 'Сплата ЄП',
  esv: 'ЄСВ',
  vz: 'Військовий збір',
  combined_report: 'Податковий розрахунок',
}

function SummaryCard({
  label,
  value,
  hint,
  action,
  className,
}: {
  label: string
  value: ReactNode
  hint?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        height: '100%',
        minHeight: 148,
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
  taxGroup,
  vatPayer,
  periodLabel,
}: {
  open: boolean
  onClose: () => void
  totalDue: { ep: number; esv: number; vz: number; total: number }
  taxGroup: 1 | 2 | 3
  vatPayer?: boolean
  periodLabel: string
}) {
  const paymentRows = [
    {
      title: 'ЄП (Єдиний податок)',
      amount: totalDue.ep,
      recipient: 'ДПС України',
      purpose: `Єдиний податок, ${taxGroup} група, ${periodLabel}`,
      note:
        taxGroup === 1 || taxGroup === 2
          ? 'Точна ставка для 1-2 груп залежить від рішення місцевої ради. У застосунку використано граничну ставку. IBAN уточнюй в Е-кабінеті платника.'
          : 'IBAN уточнюй в Е-кабінеті платника на cabinet.tax.gov.ua за своєю громадою.',
    },
    {
      title: 'ЄСВ (Єдиний соціальний внесок)',
      amount: totalDue.esv,
      recipient: 'ДПС України',
      purpose: `ЄСВ, ФОП, ${periodLabel}`,
      note: 'IBAN рахунку ЄСВ уточнюй в Е-кабінеті платника.',
    },
    {
      title: 'ВЗ (Військовий збір)',
      amount: totalDue.vz,
      recipient: 'ДПС України',
      purpose: `Військовий збір, ФОП, ${periodLabel}`,
      note: 'IBAN уточнюй в Е-кабінеті платника за своєю громадою.',
    },
  ]

  const handleCopy = async () => {
    try {
      const text = paymentRows
        .filter((row) => row.amount > 0)
        .map(
          (row) =>
            `${row.title}: ${formatNumber(row.amount)} грн\nОтримувач: ${row.recipient}\nПризначення платежу: ${row.purpose}`,
        )
        .join('\n\n')
      await navigator.clipboard.writeText(text)
      toast('Реквізити скопійовано ✓')
    } catch {
      toast('Не вдалося скопіювати реквізити', 'error')
    }
  }

  if (!open) return null

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ padding: '0 20px 12px' }}>
        <div className="label" style={{ color: 'var(--indigo-400)' }}>
          Оплата податків
        </div>
        <h2
          style={{ margin: '8px 0 18px', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}
        >
          Варіанти сплати
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
            marginBottom: 18,
          }}
        >
          <Button
            variant="primary"
            size="sm"
            icon={<CreditCard size={16} />}
            onClick={() => window.open('https://api.monobank.ua', '_blank', 'noopener,noreferrer')}
          >
            Monobank
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Landmark size={16} />}
            onClick={() =>
              window.open('https://cabinet.tax.gov.ua', '_blank', 'noopener,noreferrer')
            }
          >
            Реквізити
          </Button>
          <Button variant="ghost" size="sm" icon={<Copy size={16} />} onClick={handleCopy}>
            Скопіювати реквізити
          </Button>
        </div>

        {taxGroup === 3 && vatPayer && (
          <div
            style={{
              marginBottom: 18,
              padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.18)',
              fontSize: 12,
              color: 'var(--text-2)',
              lineHeight: 1.6,
            }}
          >
            У цьому блоці показані лише ЄП, ЄСВ і військовий збір. ПДВ-зобов’язання для платника ПДВ
            треба звіряти окремо за даними податкових накладних та Е-кабінету.
          </div>
        )}

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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                  {row.title}
                </div>
                <div
                  className="tnum"
                  style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}
                >
                  {formatNumber(row.amount)} ₴
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
                Отримувач: {row.recipient}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
                Призначення: {row.purpose}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>
                {row.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { dashboard, deadlines, fetchDashboard, fetchDeadlines, isLoading } = useUserStore()
  const { entrepreneur } = useAuthStore()
  const { openAddTransaction } = useUiStore()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [incomeData, setIncomeData] = useState<IncomePeriodData | null>(null)

  const currentYear = getCurrentYear()
  const currentQuarter = getCurrentQuarter()
  const defaultPeriod = `Q${currentQuarter}-${currentYear}`
  const [activePeriod, setActivePeriod] = useState(defaultPeriod)

  const periodOptions = useMemo(
    () => [
      { label: 'Q1', value: `Q1-${currentYear}` },
      { label: 'Q2', value: `Q2-${currentYear}` },
      { label: 'Q3', value: `Q3-${currentYear}` },
      { label: 'Q4', value: `Q4-${currentYear}` },
      { label: 'Рік', value: `Y-${currentYear}` },
    ],
    [currentYear],
  )

  useEffect(() => {
    fetchDashboard()
    fetchDeadlines(currentYear)
  }, [fetchDashboard, fetchDeadlines, currentYear])

  useEffect(() => {
    client
      .get<IncomePeriodData>('/api/dashboard/income', { params: { period: activePeriod } })
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
  const isVatMode = entrepreneur?.group === 3 && entrepreneur?.vatPayer
  const hasTransactions = dashboard.totalTransactionCount > 0
  const hasUnclassifiedTransactions = dashboard.bookStatus.pendingCount > 0
  const upcomingDeadlines = deadlines
    .filter((deadline) => deadline.status === 'pending')
    .slice(0, 3)
  const nextDeadlineHint = dashboard.nextDeadline
    ? `${deadlineTypeLabels[dashboard.nextDeadline.type] ?? dashboard.nextDeadline.type} через ${dashboard.nextDeadline.daysLeft} днів`
    : 'Найближчих дедлайнів поки немає'

  return (
    <div
      className="px-4 pt-5 pb-[112px] md:px-5 md:pt-6"
      style={{ flex: 1, overflowY: 'auto', maxWidth: 1280 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="label" style={{ color: 'var(--indigo-400)' }}>
            {getQuarterLabel(currentQuarter, currentYear)} · Огляд
          </div>
          <h1
            style={{
              margin: '6px 0 8px',
              fontSize: 'clamp(24px, 7vw, 30px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text)',
            }}
          >
            Дашборд Kasyr.ai
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)' }}>{nextDeadlineHint}</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openAddTransaction}>
          Додати транзакцію
        </Button>
      </div>

      {!hasTransactions && (
        <div style={{ marginBottom: 18 }}>
          <HintBanner
            id="dashboard_first_steps"
            title="Порада"
            action={
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/settings?tab=banks')}
                >
                  Підключити банк
                </Button>
                <Button variant="ghost" size="sm" onClick={openAddTransaction}>
                  Додати вручну
                </Button>
              </div>
            }
          >
            Поки що немає транзакцій. Підключи Monobank або додай першу операцію вручну, щоб Kasyr.ai
            порахував податки та сформував книгу обліку.
          </HintBanner>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3" style={{ marginBottom: 18 }}>
        <SummaryCard
          className={hasTransactions ? '' : 'hidden md:block'}
          label={isVatMode ? 'Орієнтовно до сплати' : 'До сплати'}
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                className="tnum"
                style={{
                  fontSize: 'clamp(30px, 9vw, 38px)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatNumber(dashboard.totalDue.total)}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>₴</span>
            </div>
          }
          hint={
            hasTransactions
              ? isVatMode
                ? 'ЄП, ЄСВ і ВЗ без ПДВ-зобов’язань'
                : dashboard.nextDeadline
                  ? `${deadlineTypeLabels[dashboard.nextDeadline.type] ?? dashboard.nextDeadline.type} · до ${dashboard.nextDeadline.date}`
                  : 'Суми оновлюються автоматично'
              : 'Додай транзакції, щоб розрахувати точну суму. Поки показуємо орієнтовний платіж за поточними правилами.'
          }
          action={
            <Button variant="secondary" size="sm" onClick={() => setBreakdownOpen(true)}>
              Сплатити
            </Button>
          }
        />
        <SummaryCard
          label="Доходи"
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                className="tnum"
                style={{
                  fontSize: 'clamp(30px, 9vw, 38px)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatNumber(chartUah)}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>₴</span>
            </div>
          }
          hint={`${incomeData?.txCount ?? dashboard.recentTransactions.length} транзакцій доходу за період ${chartTitle}`}
        />
        <SummaryCard
          className={hasUnclassifiedTransactions ? '' : 'hidden md:block'}
          label="Книга обліку"
          value={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {hasUnclassifiedTransactions ? (
                <Badge tone="warn" dot>
                  Потребує уваги
                </Badge>
              ) : (
                <Badge tone="income" dot>
                  Усе рознесено
                </Badge>
              )}
            </div>
          }
          hint={
            hasUnclassifiedTransactions
              ? `${dashboard.bookStatus.pendingCount} транзакцій треба класифікувати`
              : 'Немає транзакцій, які потрібно додатково класифікувати'
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]" style={{ marginBottom: 18 }}>
        <div>
          <div className="md:hidden">
            <IncomeChart
              mobile
              uah={chartUah}
              usd={chartUsd}
              months={chartMonths}
              quarter={chartTitle}
              delta={dashboard.quarterIncome.uah > 0 ? 12 : 0}
              periodOptions={periodOptions}
              activePeriod={activePeriod}
              onPeriodChange={setActivePeriod}
            />
          </div>
          <div className="hidden md:block">
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
          </div>
          {dashboard.incomeLimit &&
            (() => {
              const limitPercent = Math.min(dashboard.incomeLimit.usagePercent, 100)
              return (
                <div
                  style={{
                    marginTop: 10,
                    padding: '12px 16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      Річний ліміт ({entrepreneur?.group} гр.) {dashboard.incomeLimit.year}
                    </span>
                    <span
                      className="tnum"
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}
                    >
                      {formatNumber(dashboard.incomeLimit.used)} /{' '}
                      {formatNumber(dashboard.incomeLimit.amount)} ₴
                    </span>
                  </div>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 3,
                      background: 'var(--surface-2)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 3,
                        width: `${limitPercent}%`,
                        background: limitPercent > 80 ? 'var(--warn)' : 'var(--indigo-500)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  {limitPercent > 80 && (
                    <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 5 }}>
                      ⚠️ Використано {limitPercent.toFixed(1)}% ліміту — розглянь перехід на іншу
                      групу
                    </div>
                  )}
                </div>
              )
            })()}
          {dashboard.legalNotes && dashboard.legalNotes.length > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: '16px 18px',
                borderRadius: 14,
                background: 'rgba(245,158,11,0.09)',
                border: '1px solid rgba(245,158,11,0.22)',
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    color: 'var(--warn)',
                    textTransform: 'uppercase',
                  }}
                >
                  Важливо знати
                </span>
              </div>
              {dashboard.legalNotes.map((note) => (
                <div
                  key={note}
                  style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, paddingLeft: 4 }}
                >
                  • {note}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              padding: 20,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <div className="label">Найближчі дедлайни</div>
              <Button variant="plain" size="sm" onClick={() => fetchDeadlines(currentYear)}>
                Оновити
              </Button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {upcomingDeadlines.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  Поки немає нових дедлайнів.
                </div>
              )}
              {upcomingDeadlines.map((deadline) => (
                <DeadlineCard key={deadline.id} deadline={deadline} />
              ))}
            </div>
          </div>

          <CurrencyRates />
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            padding: '18px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
              Останні транзакції
            </h2>
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
      <BreakdownSheet
        open={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
        totalDue={dashboard.totalDue}
        taxGroup={entrepreneur?.group ?? 3}
        vatPayer={entrepreneur?.vatPayer}
        periodLabel={getQuarterLabel(currentQuarter, currentYear)}
      />
    </div>
  )
}
