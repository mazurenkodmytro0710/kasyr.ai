import { useEffect, useMemo, useState } from 'react'
import { Bell, Building2, CreditCard, ExternalLink, MessageCircle, ShieldCheck, User } from 'lucide-react'
import { connectMonobank, disconnectBank, getBankAccounts, syncBank } from '../api/monobank'
import { disconnectTelegram, getTelegramLink, updatePreferences } from '../api/entrepreneur'
import { useAuthStore } from '../store/authStore'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { toast } from '../components/ui/Toast'
import type { BankAccount, SubscriptionTier } from '../types'
import { sanitizeText } from '../utils/sanitize'

const tabs = [
  { key: 'profile', label: 'Профіль', icon: User },
  { key: 'banks', label: 'Банки', icon: Building2 },
  { key: 'notifications', label: 'Сповіщення', icon: Bell },
  { key: 'plan', label: 'Тарифи', icon: CreditCard },
]

const plans: Array<{
  tier: SubscriptionTier
  title: string
  price: string
  description: string[]
}> = [
  {
    tier: 'free',
    title: 'Free',
    price: 'Безкоштовно',
    description: ['1 банк', 'Ручна класифікація', 'PDF книга', 'Email нагадування'],
  },
  {
    tier: 'pro',
    title: 'Pro ⭐',
    price: '299 ₴/міс',
    description: ['3 банки', 'AI-класифікація', 'Звіти за квартал', 'Email + Telegram'],
  },
  {
    tier: 'business',
    title: 'Business 🚀',
    price: '799 ₴/міс',
    description: ['Необмежено банків', 'AI + пріоритет', 'API доступ', 'Персональна підтримка'],
  },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 46,
        height: 26,
        borderRadius: 999,
        border: 'none',
        background: checked ? 'var(--indigo-500)' : 'var(--surface-2)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background .2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'white',
          transition: 'left .2s',
        }}
      />
    </button>
  )
}

export function Settings() {
  const { entrepreneur, setEntrepreneur } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'banks' | 'notifications' | 'plan'>('profile')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [bankToken, setBankToken] = useState('')
  const [bankLoading, setBankLoading] = useState(false)
  const [bankError, setBankError] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(entrepreneur?.emailNotifications ?? true)
  const [telegramNotifications, setTelegramNotifications] = useState(entrepreneur?.telegramNotifications ?? false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [telegramLink, setTelegramLink] = useState<{ botUrl: string | null; connected: boolean } | null>(null)

  useEffect(() => {
    if (!entrepreneur) return
    setEmailNotifications(entrepreneur.emailNotifications)
    setTelegramNotifications(entrepreneur.telegramNotifications)
  }, [entrepreneur])

  useEffect(() => {
    getBankAccounts()
      .then(setBankAccounts)
      .catch(() => setBankAccounts([]))
  }, [])

  useEffect(() => {
    if (activeTab !== 'notifications') return

    getTelegramLink()
      .then((data) => setTelegramLink({ botUrl: data.botUrl, connected: data.connected }))
      .catch(() => setTelegramLink(null))
  }, [activeTab])

  const profileRows = useMemo(() => ([
    { label: 'ПІБ', value: entrepreneur?.fullName || 'Не вказано' },
    { label: 'ІПН', value: entrepreneur?.taxId || 'Не вказано' },
    { label: 'Група ЄП', value: entrepreneur ? `${entrepreneur.group} група` : 'Не вказано' },
    { label: 'Дата реєстрації', value: entrepreneur?.regDate ? new Date(entrepreneur.regDate).toLocaleDateString('uk-UA') : 'Не вказано' },
  ]), [entrepreneur])

  const refreshBanks = async () => {
    const data = await getBankAccounts()
    setBankAccounts(data)
  }

  const handleConnectBank = async () => {
    setBankLoading(true)
    setBankError('')
    try {
      await connectMonobank(sanitizeText(bankToken, 512))
      await syncBank()
      await refreshBanks()
      setIsBankModalOpen(false)
      setBankToken('')
      toast('Банк підключено ✓')
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
      setBankError(message ?? 'Не вдалося підключити банк')
    } finally {
      setBankLoading(false)
    }
  }

  const handleSavePreferences = async (tier?: SubscriptionTier) => {
    if (!entrepreneur) return
    setSavingPrefs(true)
    try {
      const updated = await updatePreferences({
        emailNotifications,
        telegramNotifications,
        subscriptionTier: tier ?? entrepreneur.subscriptionTier,
      })
      setEntrepreneur(updated)
      toast('Налаштування збережено ✓')
    } catch {
      toast('Не вдалося зберегти налаштування', 'error')
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleDisconnectTelegram = async () => {
    try {
      const updated = await disconnectTelegram()
      setEntrepreneur(updated)
      setTelegramLink((current) => current ? { ...current, connected: false } : current)
      setTelegramNotifications(false)
      toast('Telegram відключено')
    } catch {
      toast('Не вдалося відключити Telegram', 'error')
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '24px 20px 104px', maxWidth: 980 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--text)' }}>
          Налаштування
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'var(--surface-2)', padding: 4, borderRadius: 12, flexWrap: 'wrap' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 40,
                padding: '0 14px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.key ? 'var(--surface)' : 'transparent',
                color: activeTab === tab.key ? 'var(--text)' : 'var(--text-3)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
            <div className="label" style={{ color: 'var(--indigo-400)', marginBottom: 14 }}>Профіль</div>
            <div style={{ display: 'grid', gap: 14 }}>
              {profileRows.map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingBottom: 12, borderBottom: '1px solid var(--surface-2)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{row.label}</span>
                  <span style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Змінити дані профілю</div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                  ПІБ, ІПН, група та дата реєстрації фіксуються під час onboarding. Якщо щось змінилось, напиши в підтримку.
                </div>
              </div>
              <a
                href="mailto:support@kasyr.ai?subject=Зміна%20даних%20ФОП"
                style={{
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Написати в підтримку
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'banks' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {bankAccounts.length === 0 ? (
            <div style={{ padding: 28, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, textAlign: 'center', color: 'var(--text-3)' }}>
              Поки не підключено жодного банку.
            </div>
          ) : bankAccounts.map((account) => (
            <div
              key={account.id}
              style={{
                padding: '18px 20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                    {account.provider === 'monobank' ? 'Monobank' : 'Ручний рахунок'}
                  </div>
                  <Badge tone="income" dot>Підключено</Badge>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                  Остання синхронізація: {account.lastSync ? new Date(account.lastSync).toLocaleString('uk-UA') : 'ще не виконувалась'}
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  try {
                    await disconnectBank(account.id)
                    await refreshBanks()
                    toast('Банк відключено')
                  } catch {
                    toast('Не вдалося відключити банк', 'error')
                  }
                }}
              >
                Відключити
              </Button>
            </div>
          ))}

          <Button variant="secondary" icon={<Building2 size={16} />} onClick={() => setIsBankModalOpen(true)}>
            Підключити новий
          </Button>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Email нагадування</div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)' }}>
                  Отримуй дедлайни на email заздалегідь.
                </div>
              </div>
              <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
            </div>
          </div>

          <div style={{ padding: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Telegram-бот</div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                  Привʼяжи бота через унікальне посилання і отримуй нагадування в Telegram.
                </div>
              </div>
              {telegramLink?.connected ? (
                <Badge tone="income" dot>Telegram підключено</Badge>
              ) : (
                <Badge tone="warn">Ще не підключено</Badge>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Нагадування в Telegram</div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}>
                  Працює після привʼязки бота.
                </div>
              </div>
              <Toggle checked={telegramNotifications} onChange={setTelegramNotifications} />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {telegramLink?.botUrl ? (
                <a
                  href={telegramLink.botUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    height: 40,
                    padding: '0 16px',
                    borderRadius: 10,
                    background: 'var(--indigo-500)',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <MessageCircle size={16} />
                  Підключити Telegram
                  <ExternalLink size={14} />
                </a>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  Додай `TELEGRAM_BOT_USERNAME`, щоб отримати робоче посилання на бота.
                </div>
              )}

              {telegramLink?.connected && (
                <Button variant="secondary" onClick={handleDisconnectTelegram}>
                  Відключити
                </Button>
              )}
            </div>
          </div>

          <Button variant="primary" loading={savingPrefs} onClick={() => handleSavePreferences()}>
            Зберегти сповіщення
          </Button>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = entrepreneur?.subscriptionTier === plan.tier

            return (
              <div
                key={plan.tier}
                style={{
                  padding: 22,
                  borderRadius: 18,
                  background: isCurrent ? 'linear-gradient(180deg, rgba(99,102,241,0.16), rgba(20,20,24,0.98))' : 'var(--surface)',
                  border: isCurrent ? '1px solid rgba(129,140,248,0.35)' : '1px solid var(--border)',
                }}
              >
                <div className="label" style={{ color: isCurrent ? 'var(--indigo-300)' : 'var(--text-3)' }}>{plan.title}</div>
                <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' }}>
                  {plan.price}
                </div>
                <div style={{ display: 'grid', gap: 8, margin: '18px 0 22px' }}>
                  {plan.description.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-2)' }}>
                      <ShieldCheck size={14} color="var(--success)" />
                      {item}
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <Badge tone="income" dot>Поточний план</Badge>
                ) : (
                  <Button variant="primary" full loading={savingPrefs} onClick={() => handleSavePreferences(plan.tier)}>
                    Обрати план
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} title="Підключити Monobank">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: 14, borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(129,140,248,0.18)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Токен отримай на api.monobank.ua → Personal token. Після введення підтвердь доступ у застосунку Monobank.
          </div>
          <Input
            label="Monobank token"
            placeholder="u_..."
            value={bankToken}
            onChange={(event) => setBankToken(event.target.value)}
          />
          {bankError && <div style={{ fontSize: 13, color: 'var(--danger)' }}>{bankError}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" full onClick={() => setIsBankModalOpen(false)}>
              Скасувати
            </Button>
            <Button full loading={bankLoading} onClick={handleConnectBank}>
              Підключити
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
