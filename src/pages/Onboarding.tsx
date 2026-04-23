import 'react-datepicker/dist/react-datepicker.css'
import { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import { connectMonobank, syncBank } from '../api/monobank'
import { saveEntrepreneur } from '../api/entrepreneur'
import { useAuthStore } from '../store/authStore'
import type { TaxGroup } from '../types'
import { sanitizeEmailInput, sanitizeKvedList, sanitizeTaxIdInput, sanitizeText } from '../utils/sanitize'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const banks = [
  { id: 'monobank', label: 'Monobank', badge: 'Працює', available: true },
  { id: 'privatbank', label: 'PrivatBank', badge: 'Скоро', available: false },
  { id: 'pumb', label: 'ПУМБ', badge: 'Скоро', available: false },
  { id: 'oshchadbank', label: 'Ощадбанк', badge: 'Скоро', available: false },
]

function StepIndicator({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28, justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          style={{
            height: 4,
            borderRadius: 999,
            width: index + 1 === current ? 28 : 12,
            background: index + 1 < current ? 'var(--indigo-500)' : index + 1 === current ? 'var(--indigo-300)' : 'var(--surface-2)',
            transition: 'all .2s ease',
          }}
        />
      ))}
    </div>
  )
}

function AuthStep({ onDone }: { onDone: () => void }) {
  const { login, register, isLoading } = useAuthStore()
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const title = mode === 'register' ? 'Створити акаунт' : 'Увійти'
  const submitLabel = mode === 'register' ? 'Створити акаунт' : 'Увійти'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedEmail = sanitizeEmailInput(email)
    if (!normalizedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || password.length < 8) {
      setError('Перевір email і пароль (мінімум 8 символів)')
      return
    }

    setError('')
    try {
      if (mode === 'register') {
        await register(normalizedEmail, password)
      } else {
        await login(normalizedEmail, password)
      }
      onDone()
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(message ?? 'Не вдалося виконати вхід')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--surface-2)', padding: 4, borderRadius: 12 }}>
        {[
          { key: 'register', label: 'Реєстрація' },
          { key: 'login', label: 'Вхід' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setMode(item.key as 'register' | 'login')}
            style={{
              flex: 1,
              height: 38,
              border: 'none',
              borderRadius: 10,
              background: mode === item.key ? 'var(--surface)' : 'transparent',
              color: mode === item.key ? 'var(--text)' : 'var(--text-3)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px', color: 'var(--text)' }}>
        {title}
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-3)', lineHeight: 1.55 }}>
        Після входу ми перевіримо, чи вже налаштовано профіль ФОП, і проведемо тебе далі тільки по потрібних кроках.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
        <Input
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          placeholder="Мінімум 8 символів"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          trailing={(
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0 }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        />

        {error && (
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--danger-10)', color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <Button type="submit" full size="lg" loading={isLoading}>
          {submitLabel}
        </Button>

        <div style={{ position: 'relative', textAlign: 'center', margin: '6px 0' }}>
          <div style={{ position: 'absolute', inset: '50% 0 auto', height: 1, background: 'var(--border)' }} />
          <span style={{ position: 'relative', padding: '0 12px', background: 'var(--bg)', fontSize: 12, color: 'var(--text-3)' }}>
            або
          </span>
        </div>

        <a
          href="/api/auth/google"
          style={{
            height: 48,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: 'var(--text)',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'white',
              color: '#111827',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            G
          </span>
          Продовжити з Google
        </a>
      </form>
    </div>
  )
}

function GroupStep({ onDone }: { onDone: (group: TaxGroup) => void }) {
  const groups: Array<{ id: TaxGroup; label: string; desc: string }> = [
    { id: 1, label: '1 група', desc: 'Невелика торгівля та робота без найманих працівників.' },
    { id: 2, label: '2 група', desc: 'Послуги, торгівля, робота з фізособами та ФОП.' },
    { id: 3, label: '3 група', desc: 'IT, фріланс, агентські послуги, контракти з бізнесом.' },
  ]
  const [selected, setSelected] = useState<TaxGroup>(3)

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px', color: 'var(--text)' }}>
        Обери групу ЄП
      </h2>
      <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--text-3)' }}>
        Це потрібно, щоб Kasyr.ai одразу рахував правильні ставки податків і дедлайни.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelected(group.id)}
            style={{
              width: '100%',
              padding: '16px 18px',
              background: selected === group.id ? 'rgba(99,102,241,0.14)' : 'var(--surface-2)',
              border: `1px solid ${selected === group.id ? 'rgba(129,140,248,0.45)' : 'var(--border)'}`,
              borderRadius: 14,
              textAlign: 'left',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{group.label}</div>
              {selected === group.id && <Check size={16} color="var(--indigo-300)" />}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>{group.desc}</div>
          </button>
        ))}
      </div>

      <Button full size="lg" onClick={() => onDone(selected)}>
        Продовжити
      </Button>
    </div>
  )
}

function EntrepreneurStep({
  group,
  onDone,
}: {
  group: TaxGroup
  onDone: (payload: { fullName: string; taxId: string; regDate: string; kveds: string[]; group: TaxGroup }) => Promise<void>
}) {
  const [fullName, setFullName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [kveds, setKveds] = useState('62.01, 62.02')
  const [regDate, setRegDate] = useState<Date | null>(new Date())
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    const cleanName = sanitizeText(fullName, 120)
    const cleanTaxId = sanitizeTaxIdInput(taxId)
    const cleanKveds = sanitizeKvedList(kveds)

    if (cleanName.length < 4 || cleanTaxId.length !== 10 || !regDate) {
      setError('Перевір ПІБ, ІПН і дату реєстрації')
      return
    }

    setError('')
    setIsSaving(true)
    try {
      await onDone({
        fullName: cleanName,
        taxId: cleanTaxId,
        regDate: regDate.toISOString().slice(0, 10),
        kveds: cleanKveds,
        group,
      })
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(message ?? 'Не вдалося зберегти дані')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px', color: 'var(--text)' }}>
        Дані ФОП
      </h2>
      <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--text-3)' }}>
        Збережемо базові реквізити, щоб розраховувати податки, формувати дедлайни і звіти.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="ПІБ"
          placeholder="Іван Петренко"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <Input
          label="ІПН"
          placeholder="1234567890"
          value={taxId}
          onChange={(event) => setTaxId(sanitizeTaxIdInput(event.target.value))}
          hint="10 цифр з довідки ДПС"
        />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Дата реєстрації ФОП</span>
          <DatePicker
            selected={regDate}
            onChange={(date: Date | null) => setRegDate(date)}
            dateFormat="dd.MM.yyyy"
            placeholderText="Оберіть дату"
            className="kasyr-datepicker-input"
            calendarClassName="kasyr-datepicker"
          />
        </label>
        <Input
          label="КВЕДи"
          placeholder="62.01, 62.02"
          value={kveds}
          onChange={(event) => setKveds(event.target.value)}
          hint="Через кому, наприклад: 62.01, 62.02"
        />
      </div>

      {error && (
        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'var(--danger-10)', color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <Button full size="lg" loading={isSaving} onClick={handleSubmit} style={{ marginTop: 20 }}>
        Зберегти і далі
      </Button>
    </div>
  )
}

function BankStep({ onDone }: { onDone: () => void }) {
  const [selectedBank, setSelectedBank] = useState<'monobank' | null>(null)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)

  const handleConnect = async () => {
    const cleanToken = sanitizeText(token, 512)
    if (!cleanToken) {
      setError('Встав токен Monobank')
      return
    }

    setError('')
    setConnecting(true)
    try {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 800))
      } else {
        await connectMonobank(cleanToken)
        await syncBank()
      }
      setConnected(true)
      toast('Банк підключено, транзакції синхронізуються ✓')
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(message ?? 'Не вдалося підключити Monobank')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px', color: 'var(--text)' }}>
        Підключи свій банк
      </h2>
      <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>
        Monobank уже працює повністю. Інші банки ми вже готуємо, тому ти зможеш підключити їх трохи пізніше.
      </p>

      {!selectedBank && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {banks.map((bank) => (
            <button
              key={bank.id}
              disabled={!bank.available}
              onClick={() => bank.available && setSelectedBank('monobank')}
              style={{
                width: '100%',
                padding: '16px 18px',
                borderRadius: 14,
                border: '1px solid var(--border)',
                background: bank.available ? 'var(--surface-2)' : 'rgba(28,28,34,0.62)',
                color: bank.available ? 'var(--text)' : 'var(--text-3)',
                cursor: bank.available ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600 }}>{bank.label}</span>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: bank.available ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                  color: bank.available ? 'var(--success)' : 'var(--warn)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {bank.badge}
              </span>
            </button>
          ))}

          <Button variant="ghost" full onClick={onDone} style={{ marginTop: 6 }}>
            Пропустити поки що
          </Button>
        </div>
      )}

      {selectedBank === 'monobank' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              border: '1px solid rgba(129,140,248,0.24)',
              background: 'rgba(99,102,241,0.08)',
            }}
          >
            <div className="label" style={{ color: 'var(--indigo-400)', marginBottom: 10 }}>Monobank token</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
              Токен отримай на <strong style={{ color: 'var(--text)' }}>api.monobank.ua</strong> → Personal token.
              Після введення підтвердь доступ у застосунку Monobank через push-сповіщення.
            </p>
          </div>

          <Input
            label="Monobank token"
            placeholder="u_..."
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />

          {error && (
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--danger-10)', color: 'var(--danger)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {connected && (
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--success-10)', color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
              ✅ Monobank підключено
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" full onClick={() => setSelectedBank(null)}>
              Назад
            </Button>
            {!connected ? (
              <Button full loading={connecting} onClick={handleConnect}>
                Підключити
              </Button>
            ) : (
              <Button full onClick={onDone}>
                Продовжити
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SuccessStep() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = window.setTimeout(() => navigate('/dashboard'), 1800)
    return () => window.clearTimeout(timer)
  }, [navigate])

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'rgba(16,185,129,0.12)',
          color: 'var(--success)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
        }}
      >
        <Sparkles size={30} />
      </div>
      <h2 style={{ margin: '0 0 10px', fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
        Усе готово
      </h2>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)', lineHeight: 1.65 }}>
        Переходимо в дашборд. Там уже будуть доступні дедлайни, курс валют і перші дії для роботи з Kasyr.ai.
      </p>
    </div>
  )
}

export function Onboarding() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, entrepreneur, setEntrepreneur, setSessionToken, init } = useAuthStore()
  const [step, setStep] = useState(1)
  const [selectedGroup, setSelectedGroup] = useState<TaxGroup>(3)

  const totalSteps = 6

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (token) {
      setSessionToken(token)
      init().finally(() => {
        setSearchParams({}, { replace: true })
        setStep(3)
      })
    }

    if (error) {
      toast('Google OAuth не завершився. Спробуй ще раз.', 'error')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, setSessionToken, init])

  useEffect(() => {
    if (isAuthenticated && entrepreneur) {
      navigate('/dashboard', { replace: true })
      return
    }

    if (isAuthenticated && !entrepreneur) {
      setStep((current) => Math.max(current, 3))
    }
  }, [isAuthenticated, entrepreneur, navigate])

  const heroCopy = useMemo(() => (
    step === 1
      ? 'Почнемо з акаунта, далі швидко налаштуємо профіль ФОП і банк.'
      : 'Kasyr.ai налаштовується в кілька кроків і не змушує тебе вручну збирати бухгалтерію по різних місцях.'
  ), [step])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        background: 'radial-gradient(circle at top, rgba(99,102,241,0.16), transparent 38%), var(--bg)',
        padding: '20px',
      }}
    >
      <div
        className="md:grid md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-12"
        style={{ width: '100%', maxWidth: 1120, margin: '0 auto' }}
      >
        <section style={{ padding: '16px 0 24px' }}>
          <div style={{ marginBottom: 26 }}>
            <Logo size={34} />
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 999,
              background: 'rgba(99,102,241,0.12)',
              color: 'var(--indigo-300)',
              border: '1px solid rgba(129,140,248,0.28)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              marginBottom: 20,
            }}
          >
            BETA
          </div>
          <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(28px, 6vw, 52px)', lineHeight: 1.02, letterSpacing: '-0.05em', color: 'var(--text)' }}>
            Бухгалтерія ФОП без зайвої рутини.
          </h1>
          <p style={{ margin: 0, maxWidth: 540, fontSize: 16, color: 'var(--text-2)', lineHeight: 1.75 }}>
            {heroCopy}
          </p>
        </section>

        <section
          style={{
            background: 'rgba(20,20,24,0.92)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: '24px clamp(18px, 3vw, 28px)',
            boxShadow: 'var(--shadow-md)',
            maxWidth: 520,
            width: '100%',
            marginLeft: 'auto',
          }}
        >
          <StepIndicator total={totalSteps} current={step} />

          {step === 1 && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'rgba(99,102,241,0.12)',
                  color: 'var(--indigo-300)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <Sparkles size={30} />
              </div>
              <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 10px', color: 'var(--text)' }}>
                Підготуємо Kasyr.ai під твій ФОП
              </h2>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-3)', lineHeight: 1.65 }}>
                Створимо акаунт, виберемо групу, збережемо дані ФОП і за бажанням одразу підключимо банк.
              </p>
              <Button full size="lg" trailing={<ArrowRight size={16} />} onClick={() => setStep(2)}>
                Почати
              </Button>
            </div>
          )}

          {step === 2 && <AuthStep onDone={() => setStep(3)} />}
          {step === 3 && <GroupStep onDone={(group) => { setSelectedGroup(group); setStep(4) }} />}
          {step === 4 && (
            <EntrepreneurStep
              group={selectedGroup}
              onDone={async (payload) => {
                const data = await saveEntrepreneur(payload)
                setEntrepreneur(data)
                setStep(5)
              }}
            />
          )}
          {step === 5 && <BankStep onDone={() => setStep(6)} />}
          {step === 6 && <SuccessStep />}
        </section>
      </div>
    </div>
  )
}
