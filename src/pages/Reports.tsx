import { useState } from 'react'
import { FileText, Download, Check } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { mockReports } from '../mocks'

const periodLabels: Record<string, string> = {
  'Q4-2025': 'Q4 2025',
  'Q1-2026': 'Q1 2026',
  'Q2-2026': 'Q2 2026',
}

const deadlineDates: Record<string, string> = {
  'Q4-2025': '9 лютого 2026',
  'Q1-2026': '9 травня 2026',
  'Q2-2026': '9 серпня 2026',
}

const submittedDates: Record<string, string> = {
  'Q4-2025': '9 лютого 2026',
}

function WizardStep({ step, active, completed, label }: { step: number; active: boolean; completed: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: completed ? 'var(--success)' : active ? 'var(--indigo-500)' : 'var(--surface-2)',
        color: completed || active ? 'white' : 'var(--text-3)',
        fontSize: 13, fontWeight: 700, flexShrink: 0,
        border: active ? '2px solid var(--indigo-400)' : 'none',
      }}>
        {completed ? <Check size={16} /> : step}
      </div>
      <span style={{ fontSize: 14, fontWeight: 500, color: active ? 'var(--text)' : completed ? 'var(--text-2)' : 'var(--text-3)' }}>
        {label}
      </span>
    </div>
  )
}

function ReportWizard({ period, onClose }: { period: string; onClose: () => void }) {
  const [step, setStep] = useState(1)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
        padding: 28, width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ marginBottom: 24 }}>
          <div className="label" style={{ color: 'var(--indigo-400)' }}>ДЕКЛАРАЦІЯ ЄП</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '6px 0 0', letterSpacing: '-0.02em' }}>
            {periodLabels[period] ?? period}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
          <WizardStep step={1} active={step === 1} completed={step > 1} label="Перевір дані" />
          <WizardStep step={2} active={step === 2} completed={step > 2} label="Підпиши КЕП" />
          <WizardStep step={3} active={step === 3} completed={step > 3} label="Надіслати до ДПС" />
        </div>

        {step === 1 && (
          <div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Дохід за {periodLabels[period]}</div>
              <div className="tnum" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>256 680 ₴</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>з урахуванням 42 транзакцій</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" full onClick={onClose}>Скасувати</Button>
              <Button variant="primary" full onClick={() => setStep(2)}>Підтвердити дані →</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {['Дія.Підпис', 'monoКЕП', 'Файловий ключ'].map(method => (
                <button key={method} style={{
                  padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 10,
                  border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', color: 'var(--text)', fontSize: 14, fontWeight: 500,
                }}>{method} <span style={{ color: 'var(--text-3)', fontSize: 12, marginLeft: 8 }}>(скоро)</span></button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" full onClick={() => setStep(1)}>← Назад</Button>
              <Button variant="primary" full onClick={() => setStep(3)}>Продовжити →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{
              padding: 24, background: 'var(--success-10)', borderRadius: 12, textAlign: 'center', marginBottom: 16,
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--success)' }}>Успішно надіслано</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Декларацію прийнято ДПС</div>
            </div>
            <Button variant="primary" full onClick={onClose}>Закрити</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Reports() {
  const [wizardPeriod, setWizardPeriod] = useState<string | null>(null)

  const allPeriods = ['Q4-2025', 'Q1-2026', 'Q2-2026']

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: 'var(--text)' }}>
          Звіти
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>
          Декларації та звітність до ДПС
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {allPeriods.map(period => {
          const report = mockReports.find(r => r.period === period)
          const isSubmitted = report?.status === 'submitted'
          const deadline = deadlineDates[period]

          return (
            <div key={period} style={{
              padding: '18px 20px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: isSubmitted ? 'var(--success-10)' : 'var(--indigo-glow)',
                color: isSubmitted ? 'var(--success)' : 'var(--indigo-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                    {periodLabels[period]} · Декларація ЄП
                  </span>
                  {isSubmitted
                    ? <Badge tone="income" dot>Подано</Badge>
                    : <Badge tone="neutral">Не подано</Badge>
                  }
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {isSubmitted
                    ? `Подано ${submittedDates[period]}`
                    : `Дедлайн: ${deadline}`
                  }
                </div>
              </div>
              {isSubmitted ? (
                <Button variant="secondary" size="sm" icon={<Download size={14} />}>
                  PDF
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setWizardPeriod(period)}>
                  Підготувати →
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {wizardPeriod && (
        <ReportWizard period={wizardPeriod} onClose={() => setWizardPeriod(null)} />
      )}
    </div>
  )
}
