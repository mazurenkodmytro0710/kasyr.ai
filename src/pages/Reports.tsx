import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, Send } from 'lucide-react'
import client from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import { useUserStore } from '../store/userStore'
import type { IncomePeriodData, Report } from '../types'
import { formatNumber } from '../utils/formatCurrency'

function statusLabel(report: Report | undefined, hasData: boolean) {
  if (report?.status === 'submitted') return { text: 'Надісланий', tone: 'income' as const }
  if (report) return { text: 'Готовий', tone: 'neutral' as const }
  if (hasData) return { text: 'Чернетка', tone: 'warn' as const }
  return { text: 'Чернетка', tone: 'neutral' as const }
}

async function downloadPdf(period: string) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const response = await fetch(`${apiUrl}/api/reports/pdf?period=${period}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('PDF download failed')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `report-${period}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function Reports() {
  const { reports, fetchReports, submitReport } = useUserStore()
  const [incomeData, setIncomeData] = useState<IncomePeriodData | null>(null)
  const [loadingPeriod, setLoadingPeriod] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const periods = useMemo(() => (
    Array.from({ length: currentQuarter }, (_, index) => `Q${index + 1}-${currentYear}`)
  ), [currentQuarter, currentYear])
  const [selectedPeriod, setSelectedPeriod] = useState(periods.at(-1) ?? `Q1-${currentYear}`)

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    setLoadingPeriod(true)
    client.get<IncomePeriodData>('/api/dashboard/income', { params: { period: selectedPeriod } })
      .then((response) => setIncomeData(response.data))
      .catch(() => setIncomeData(null))
      .finally(() => setLoadingPeriod(false))
  }, [selectedPeriod])

  const activeReport = reports.find((report) => report.period === selectedPeriod)
  const activeStatus = statusLabel(activeReport, Boolean(incomeData?.txCount))

  const handlePrepare = async () => {
    setPreparing(true)
    try {
      if (!activeReport) {
        await client.post('/api/reports/generate', { period: selectedPeriod, type: 'ep_declaration' })
      }
      await fetchReports()
      toast('Звіт підготовлено ✓')
    } catch {
      toast('Не вдалося підготувати звіт', 'error')
    } finally {
      setPreparing(false)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 96px', maxWidth: 980 }}>
      <div style={{ marginBottom: 26 }}>
        <div className="label" style={{ color: 'var(--indigo-400)' }}>Звіти</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: '6px 0 10px', color: 'var(--text)' }}>
          Квартальна звітність
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>
          Обирай квартал, перевіряй реальні дані з бази і формуй PDF-звіт для податкової.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            style={{
              padding: '7px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              background: selectedPeriod === period ? 'var(--indigo-glow)' : 'var(--surface-2)',
              color: selectedPeriod === period ? 'var(--indigo-300)' : 'var(--text-2)',
              border: selectedPeriod === period ? '1px solid rgba(129,140,248,0.3)' : '1px solid var(--border)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {period.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3" style={{ marginBottom: 18 }}>
        <div style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
          <div className="label">Статус</div>
          <div style={{ marginTop: 12 }}>
            <Badge tone={activeStatus.tone} dot>{activeStatus.text}</Badge>
          </div>
        </div>
        <div style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
          <div className="label">Дохід за квартал</div>
          <div className="tnum" style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
            {loadingPeriod ? '...' : `${formatNumber(incomeData?.uah ?? 0)} ₴`}
          </div>
        </div>
        <div style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
          <div className="label">Транзакції</div>
          <div className="tnum" style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
            {loadingPeriod ? '...' : incomeData?.txCount ?? 0}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div className="label">Вибраний квартал</div>
            <h2 style={{ margin: '8px 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
              {selectedPeriod.replace('-', ' ')}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Дані беруться з транзакцій, які вже синхронізовані або додані вручну.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="secondary" icon={<FileText size={16} />} loading={preparing} onClick={handlePrepare}>
              Підготувати
            </Button>
            <Button
              variant="primary"
              icon={<Download size={16} />}
              onClick={async () => {
                try {
                  await downloadPdf(selectedPeriod)
                  toast('PDF завантажено ✓')
                } catch {
                  toast('Не вдалося завантажити PDF', 'error')
                }
              }}
            >
              Завантажити PDF
            </Button>
            {activeReport && activeReport.status !== 'submitted' && (
              <Button
                variant="ghost"
                icon={<Send size={16} />}
                onClick={async () => {
                  try {
                    await submitReport(activeReport.id)
                    toast('Звіт позначено як надісланий ✓')
                  } catch {
                    toast('Не вдалося змінити статус звіту', 'error')
                  }
                }}
              >
                Позначити як надісланий
              </Button>
            )}
          </div>
        </div>

        <div style={{ padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Звіт по декларації ЄП</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                Станом на зараз статус цього кварталу: {activeStatus.text.toLowerCase()}.
              </div>
            </div>
            <Badge tone={activeStatus.tone} dot>{activeStatus.text}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2" style={{ marginTop: 18 }}>
            <div>
              <div className="label">Оборот</div>
              <div className="tnum" style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                {formatNumber(incomeData?.uah ?? 0)} ₴
              </div>
            </div>
            <div>
              <div className="label">Записів у базі</div>
              <div className="tnum" style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                {incomeData?.txCount ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
