import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Eye, EyeOff, Check } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import type { TaxGroup } from '../types'
import { saveEntrepreneur } from '../api/entrepreneur'
import { connectMonobank, syncBank } from '../api/monobank'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function StepIndicator({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32, justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, borderRadius: 2,
          width: i === current ? 24 : 12,
          background: i < current ? 'var(--indigo-500)' : i === current ? 'var(--indigo-400)' : 'var(--surface-2)',
          transition: 'all .3s',
        }} />
      ))}
    </div>
  )
}

function Step1Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 32 }}>
        <Logo size={48} wordmark={false} />
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 16px' }}>
        Бухгалтерія,<br />яка не питає<br />про папірці
      </h1>
      <p style={{ fontSize: 16, color: 'var(--text-3)', margin: '0 0 40px', lineHeight: 1.6 }}>
        Підключи Monobank — ми самі порахуємо<br />
        податки і нагадаємо про дедлайни
      </p>
      <Button variant="primary" size="lg" full trailing={<ArrowRight size={18} />} onClick={onNext}>
        Почати безкоштовно
      </Button>
    </div>
  )
}

function Step2Register({ onNext }: { onNext: () => void }) {
  const { register, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Введіть коректний email'
    if (password.length < 8) e.password = 'Мінімум 8 символів'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await register(email, password)
      onNext()
    } catch {
      setErrors({ email: 'Email вже зайнятий або сервер недоступний' })
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--text)' }}>
        Створити акаунт
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '0 0 28px' }}>
        Все зберігається на захищених серверах в Україні
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          placeholder="Мінімум 8 символів"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={errors.password}
          trailing={
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <Button variant="primary" full size="lg" type="submit" loading={isLoading}>
          Створити акаунт
        </Button>
        <div style={{ position: 'relative', textAlign: 'center', margin: '8px 0' }}>
          <div style={{ position: 'absolute', inset: '50% 0 auto', height: 1, background: 'var(--border)' }} />
          <span style={{ position: 'relative', padding: '0 12px', background: 'var(--bg)', fontSize: 12, color: 'var(--text-3)' }}>або</span>
        </div>
        <Button variant="secondary" full type="button" icon={<Building2 size={16} />}>
          Продовжити з Google (скоро)
        </Button>
      </form>
    </div>
  )
}

function Step3Group({ onNext }: { onNext: (group: TaxGroup) => void }) {
  const groups: { id: TaxGroup; label: string; desc: string }[] = [
    { id: 1, label: '1 група', desc: 'До 1 336 500 грн/рік, фізичні продажі' },
    { id: 2, label: '2 група', desc: 'До 6 672 000 грн/рік, послуги та торгівля' },
    { id: 3, label: '3 група', desc: 'До 8 285 700 грн/рік, IT, фріланс, будь-яка діяльність' },
  ]
  const [selected, setSelected] = useState<TaxGroup | null>(null)

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--text)' }}>
        Твоя група ЄП
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '0 0 24px' }}>
        Від цього залежать ставки та ліміти доходу
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => setSelected(g.id)}
            style={{
              padding: '16px 18px',
              background: selected === g.id ? 'var(--indigo-glow)' : 'var(--surface-2)',
              border: `1px solid ${selected === g.id ? 'rgba(129,140,248,0.4)' : 'var(--border)'}`,
              borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              fontFamily: 'inherit', transition: 'all .14s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: selected === g.id ? 'var(--indigo-300)' : 'var(--text)' }}>
                {g.label}
              </div>
              {selected === g.id && <Check size={16} color="var(--indigo-400)" />}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{g.desc}</div>
          </button>
        ))}
      </div>
      <Button variant="primary" full size="lg" disabled={!selected} onClick={() => selected && onNext(selected)}>
        Продовжити →
      </Button>
    </div>
  )
}

function Step4IPN({ error, loading, onNext }: {
  error?: string
  loading?: boolean
  onNext: (data: { taxId: string; regDate: string }) => Promise<void>
}) {
  const [ipn, setIpn] = useState('')
  const [regDate, setRegDate] = useState('')
  const [checked, setChecked] = useState(false)

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--text)' }}>
        Твої дані ФОП
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '0 0 24px' }}>
        Потрібні для правильного розрахунку податків
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <Input
          label="ІПН"
          placeholder="3456789012"
          value={ipn}
          onChange={e => setIpn(e.target.value.replace(/\D/g, '').slice(0, 10))}
          hint="10 цифр з довідки ДПС"
        />
        <Input
          label="Дата реєстрації ФОП"
          type="date"
          value={regDate}
          onChange={e => setRegDate(e.target.value)}
        />
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
            Я перебуваю у реєстрі платників єдиного податку
          </span>
        </label>
        {error && (
          <div style={{ padding: 12, borderRadius: 10, background: 'var(--danger-10)', color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>
      <Button
        variant="primary"
        full
        size="lg"
        loading={loading}
        onClick={() => onNext({ taxId: ipn, regDate })}
        disabled={ipn.length !== 10 || !regDate || !checked}
      >
        Далі →
      </Button>
    </div>
  )
}

function Step5Bank({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    try {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 800))
      } else {
        await connectMonobank(token)
        await syncBank()
      }
      setConnected(true)
    } catch {
      setError('Не вдалося перевірити токен. Для локального демо можна ввести demo-token.')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--text)' }}>
        Підключи банк
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '0 0 24px' }}>
        Ми автоматично завантажимо транзакції і порахуємо податки
      </p>

      {!selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[
            { id: 'monobank', label: 'Monobank', bg: '#0A0A0A', fg: '#fff', letter: 'M' },
            { id: 'privat', label: 'Приват24', bg: '#00A859', fg: '#fff', letter: 'П' },
          ].map(b => (
            <button
              key={b.id}
              onClick={() => setSelected(b.id)}
              style={{
                padding: '16px 18px', background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: b.bg, color: b.fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700,
              }}>{b.letter}</div>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{b.label}</span>
            </button>
          ))}
          <button
            onClick={onNext}
            style={{
              padding: '14px 18px', background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: 'var(--text-3)',
            }}
          >
            Пропустити, додам пізніше →
          </button>
        </div>
      )}

      {selected === 'monobank' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div className="label" style={{ marginBottom: 10 }}>ЯК ОТРИМАТИ ТОКЕН</div>
            <ol style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              <li>Відкрий додаток <strong style={{ color: 'var(--text)' }}>Monobank</strong></li>
              <li>Профіль → <strong style={{ color: 'var(--text)' }}>Для розробників</strong></li>
              <li>Скопіюй токен і вставте нижче</li>
            </ol>
          </div>
          <Input
            label="Monobank токен"
            placeholder="demo-token або u_..."
            value={token}
            onChange={e => setToken(e.target.value)}
          />
          {error && (
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--danger-10)', color: 'var(--danger)', fontSize: 13 }}>
              {error}
            </div>
          )}
          {connected ? (
            <div style={{ padding: 14, background: 'var(--success-10)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Check size={16} color="var(--success)" />
              <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>Підключено успішно!</span>
            </div>
          ) : (
            <Button variant="secondary" full loading={connecting} onClick={handleConnect} disabled={!token}>
              Перевірити підключення
            </Button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" full onClick={() => setSelected(null)}>← Назад</Button>
            <Button variant="primary" full onClick={onNext} disabled={!connected}>Продовжити →</Button>
          </div>
        </div>
      )}

      {selected === 'privat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div className="label" style={{ marginBottom: 8 }}>ПРИВАТ24</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
              Інтеграція з Приват24 буде доступна в Pro. Для MVP можна продовжити без банку або підключити Monobank.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" full onClick={() => setSelected(null)}>← Назад</Button>
            <Button variant="primary" full onClick={onNext}>Продовжити →</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Step6Success() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/dashboard'), 2500)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--success-10)',
        border: '2px solid rgba(16,185,129,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        animation: 'scaleIn 0.4s cubic-bezier(.2,.8,.3,1)',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 100, animation: 'checkDraw 0.5s .3s ease forwards', strokeDashoffset: 100 }} />
        </svg>
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: '0 0 12px' }}>
        Все готово!
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-3)', margin: '0 0 32px', lineHeight: 1.6 }}>
        Завантажуємо твої транзакції<br />і рахуємо податки…
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        <div className="spinner" style={{ color: 'var(--indigo-400)' }} />
        Перехід на дашборд…
      </div>
    </div>
  )
}

export function Onboarding() {
  const navigate = useNavigate()
  const { entrepreneur, setEntrepreneur, token } = useAuthStore()
  const [step, setStep] = useState(0)
  const [taxGroup, setTaxGroup] = useState<TaxGroup>(3)
  const [setupError, setSetupError] = useState('')
  const [savingSetup, setSavingSetup] = useState(false)

  useEffect(() => {
    if (step === 0 && token && entrepreneur) {
      navigate('/dashboard', { replace: true })
    }
  }, [entrepreneur, navigate, step, token])

  const saveSetup = async (data: { taxId: string; regDate: string }) => {
    setSavingSetup(true)
    setSetupError('')
    try {
      if (USE_MOCK) {
        setEntrepreneur({
          id: 1,
          userId: 1,
          fullName: 'Коваленко Марія Олексіївна',
          taxId: data.taxId,
          group: taxGroup,
          regDate: data.regDate,
          kveds: ['62.01', '62.02'],
        })
      } else {
        const saved = await saveEntrepreneur({
          fullName: 'Коваленко Марія Олексіївна',
          taxId: data.taxId,
          group: taxGroup,
          regDate: data.regDate,
          kveds: ['62.01', '62.02'],
        })
        setEntrepreneur(saved)
      }
      setStep(4)
    } catch {
      setSetupError('Не вдалося зберегти дані ФОП. Перевір ІПН і спробуй ще раз.')
    } finally {
      setSavingSetup(false)
    }
  }

  const steps = [
    <Step1Welcome key={0} onNext={() => setStep(1)} />,
    <Step2Register key={1} onNext={() => setStep(2)} />,
    <Step3Group key={2} onNext={(group) => { setTaxGroup(group); setStep(3) }} />,
    <Step4IPN key={3} error={setupError} loading={savingSetup} onNext={saveSetup} />,
    <Step5Bank key={4} onNext={() => setStep(5)} />,
    <Step6Success key={5} />,
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <Logo size={32} />
        </div>

        {step > 0 && step < 5 && (
          <StepIndicator total={5} current={step - 1} />
        )}

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: step === 0 ? '48px 32px' : '32px',
          boxShadow: 'var(--shadow-md)',
          animation: 'fade 0.25s ease',
        }}>
          {steps[step]}
        </div>

        {step > 0 && step < 5 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              display: 'block', margin: '16px auto 0', background: 'none', border: 'none',
              color: 'var(--text-3)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ← Назад
          </button>
        )}
      </div>
    </div>
  )
}
