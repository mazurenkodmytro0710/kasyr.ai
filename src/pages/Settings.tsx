import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Building2,
  CreditCard,
  ExternalLink,
  LogOut,
  MessageCircle,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { connectMonobank, disconnectBank, getBankAccounts, syncBank } from '../api/monobank'
import {
  disconnectTelegram,
  getTelegramLink,
  updatePreferences,
  updateTaxProfile,
} from '../api/entrepreneur'
import { createCheckout, openWayForPay } from '../api/subscription'
import { useAuthStore } from '../store/authStore'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { HintBanner } from '../components/ui/HintBanner'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { toast } from '../components/ui/Toast'
import type { BankAccount, SubscriptionTier } from '../types'

const SHOW_SUBSCRIPTION_UI = import.meta.env.VITE_SHOW_SUBSCRIPTION_UI === 'true'

const tabs = [
  { key: 'profile', label: 'Профіль', icon: User },
  { key: 'banks', label: 'Банки', icon: Building2 },
  { key: 'notifications', label: 'Сповіщення', icon: Bell },
  ...(SHOW_SUBSCRIPTION_UI ? [{ key: 'plan', label: 'Тарифи', icon: CreditCard }] : []),
]

const allBanks = [
  { id: 'monobank', label: 'Monobank', available: true },
  { id: 'privatbank', label: 'ПриватБанк', available: false },
  { id: 'pumb', label: 'ПУМБ', available: false },
  { id: 'oshchadbank', label: 'Ощадбанк', available: false },
  { id: 'raiffeisen', label: 'Raiffeisen Bank', available: false },
  { id: 'sense', label: 'Sense Bank', available: false },
  { id: 'otp', label: 'OTP Bank', available: false },
  { id: 'abank', label: 'А-Банк', available: false },
  { id: 'ukrsib', label: 'Укрсиббанк', available: false },
  { id: 'tascom', label: 'Таскомбанк', available: false },
]

const plans: Array<{
  tier: SubscriptionTier
  title: string
  price: string
  oldPrice?: string
  badge?: string
  description: string[]
  highlight?: boolean
}> = [
  {
    tier: 'free',
    title: 'Free',
    price: 'Безкоштовно',
    description: ['Ручне додавання транзакцій', 'Дедлайни та нагадування', 'Базова книга обліку'],
  },
  {
    tier: 'pro',
    title: 'Pro ⭐',
    price: '299 ₴/міс',
    oldPrice: '499 ₴',
    badge: 'Популярний',
    highlight: true,
    description: [
      'Автоімпорт з банку',
      'AI-класифікація транзакцій',
      'Квартальні PDF-звіти',
      'Telegram-нагадування',
      'Експорт для бухгалтера (Excel)',
    ],
  },
  {
    tier: 'business',
    title: 'Business 🚀',
    price: '699 ₴/міс',
    oldPrice: '999 ₴',
    description: ['Все що в Pro', 'Пріоритетна підтримка', 'Ранній доступ до нових функцій'],
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
  const navigate = useNavigate()
  const { entrepreneur, setEntrepreneur, logout } = useAuthStore()
  const supportUrl = import.meta.env.VITE_SUPPORT_TELEGRAM_URL || 'https://t.me/kasyr_support'
  const [searchParams, setSearchParams] = useSearchParams()
  const allowedTabs = tabs.map((t) => t.key)
  const tabFromUrl = searchParams.get('tab') ?? ''
  const initialTab = allowedTabs.includes(tabFromUrl) ? tabFromUrl : 'profile'
  const [activeTab, setActiveTab] = useState<'profile' | 'banks' | 'notifications' | 'plan'>(
    initialTab as typeof allowedTabs[number] as 'profile' | 'banks' | 'notifications' | 'plan',
  )
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [bankToken, setBankToken] = useState('')
  const [bankLoading, setBankLoading] = useState(false)
  const [bankError, setBankError] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(
    entrepreneur?.emailNotifications ?? true,
  )
  const [telegramNotifications, setTelegramNotifications] = useState(
    entrepreneur?.telegramNotifications ?? false,
  )
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savingTaxProfile, setSavingTaxProfile] = useState(false)
  const [vatPayer, setVatPayer] = useState(entrepreneur?.vatPayer ?? false)
  const [localEpRatePercent, setLocalEpRatePercent] = useState(
    entrepreneur?.localEpRatePercent != null ? String(entrepreneur.localEpRatePercent) : '',
  )
  const [telegramLink, setTelegramLink] = useState<{
    botUrl: string | null
    connected: boolean
  } | null>(null)

  useEffect(() => {
    if (!entrepreneur) return
    setEmailNotifications(entrepreneur.emailNotifications)
    setTelegramNotifications(entrepreneur.telegramNotifications)
    setVatPayer(entrepreneur.vatPayer)
    setLocalEpRatePercent(
      entrepreneur.localEpRatePercent != null ? String(entrepreneur.localEpRatePercent) : '',
    )
  }, [entrepreneur])

  useEffect(() => {
    const next = searchParams.get('tab') ?? ''
    if (allowedTabs.includes(next) && next !== activeTab) {
      setActiveTab(next as typeof activeTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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

  const profileRows = useMemo(
    () => [
      { label: 'ПІБ', value: entrepreneur?.fullName || 'Не вказано' },
      { label: 'ІПН', value: entrepreneur?.taxId || 'Не вказано' },
      { label: 'Група ЄП', value: entrepreneur ? `${entrepreneur.group} група` : 'Не вказано' },
      {
        label: entrepreneur?.group === 3 ? 'Режим ЄП' : 'Ставка ЄП',
        value:
          entrepreneur?.group === 3
            ? entrepreneur.vatPayer
              ? '3% + ПДВ'
              : '5% без ПДВ'
            : entrepreneur?.localEpRatePercent != null
              ? `${entrepreneur.localEpRatePercent}%`
              : 'Не уточнено',
      },
      {
        label: 'Дата реєстрації',
        value: entrepreneur?.regDate
          ? new Date(entrepreneur.regDate).toLocaleDateString('uk-UA')
          : 'Не вказано',
      },
    ],
    [entrepreneur],
  )

  const refreshBanks = async () => {
    const data = await getBankAccounts()
    setBankAccounts(data)
  }

  const handleConnectBank = async () => {
    setBankLoading(true)
    setBankError('')
    try {
      const result = await connectMonobank(bankToken.replace(/\s+/g, ''))
      await syncBank()
      await refreshBanks()
      setIsBankModalOpen(false)
      setBankToken('')
      const warning = (result as { warning?: string })?.warning
      if (warning) {
        toast(warning, 'warn')
      } else {
        toast('Банк підключено ✓')
      }
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
      setBankError(message ?? 'Не вдалося підключити банк')
    } finally {
      setBankLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!entrepreneur) return
    setSavingPrefs(true)
    try {
      const updated = await updatePreferences({
        emailNotifications,
        telegramNotifications,
      })
      setEntrepreneur(updated)
      toast('Налаштування збережено ✓')
    } catch {
      toast('Не вдалося зберегти налаштування', 'error')
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleSaveTaxProfile = async () => {
    if (!entrepreneur) return

    const minRate = entrepreneur.group === 1 || entrepreneur.group === 2 ? 0 : null
    const parsedLocalRate =
      entrepreneur.group === 1 || entrepreneur.group === 2
        ? localEpRatePercent.trim() === ''
          ? null
          : Number(localEpRatePercent)
        : null
    const maxRate = entrepreneur.group === 1 ? 10 : entrepreneur.group === 2 ? 20 : null

    if (
      (entrepreneur.group === 1 || entrepreneur.group === 2) &&
      parsedLocalRate != null &&
      (Number.isNaN(parsedLocalRate) ||
        !Number.isInteger(parsedLocalRate) ||
        parsedLocalRate < (minRate ?? 0) ||
        parsedLocalRate > (maxRate ?? 0))
    ) {
      toast(`Вкажи цілу ставку ЄП від ${minRate} до ${maxRate}%`, 'error')
      return
    }

    setSavingTaxProfile(true)
    try {
      const updated = await updateTaxProfile({
        vatPayer: entrepreneur.group === 3 ? vatPayer : false,
        localEpRatePercent:
          entrepreneur.group === 1 || entrepreneur.group === 2 ? parsedLocalRate : null,
      })
      setEntrepreneur(updated)
      toast('Податковий профіль оновлено ✓')
    } catch {
      toast('Не вдалося оновити податковий профіль', 'error')
    } finally {
      setSavingTaxProfile(false)
    }
  }

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'free') return
    setSavingPrefs(true)
    try {
      const checkout = await createCheckout(tier)
      openWayForPay(checkout)
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast(message ?? 'Не вдалося відкрити платіжну форму', 'error')
      setSavingPrefs(false)
    }
  }

  const handleDisconnectTelegram = async () => {
    try {
      const updated = await disconnectTelegram()
      setEntrepreneur(updated)
      setTelegramLink((current) => (current ? { ...current, connected: false } : current))
      setTelegramNotifications(false)
      toast('Telegram відключено')
    } catch {
      toast('Не вдалося відключити Telegram', 'error')
    }
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '24px 20px 104px',
        maxWidth: 980,
      }}
    >
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h1
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            margin: 0,
            color: 'var(--text)',
          }}
        >
          Налаштування
        </h1>
        <Button
          variant="plain"
          size="sm"
          icon={<LogOut size={16} />}
          onClick={async () => {
            await logout()
            navigate('/', { replace: true })
          }}
        >
          Вийти
        </Button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 24,
          background: 'var(--surface-2)',
          padding: 4,
          borderRadius: 12,
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as typeof activeTab)
                setSearchParams(
                  (prev) => {
                    const p = new URLSearchParams(prev)
                    p.set('tab', tab.key)
                    return p
                  },
                  { replace: true },
                )
              }}
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
          <div
            style={{
              padding: 22,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
            }}
          >
            <div className="label" style={{ color: 'var(--indigo-400)', marginBottom: 14 }}>
              Профіль
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {profileRows.map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--surface-2)',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{row.label}</span>
                  <span style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 22,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                  Змінити дані профілю
                </div>
                <div
                  style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}
                >
                  ПІБ, ІПН, група та дата реєстрації фіксуються під час onboarding. Якщо щось
                  змінилось, напиши в підтримку.
                </div>
              </div>
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--indigo-400)',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <MessageCircle size={16} />
                Написати в підтримку Telegram
              </a>
            </div>
          </div>

          {entrepreneur && (
            <div
              style={{
                padding: 22,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 18,
              }}
            >
              <div className="label" style={{ color: 'var(--indigo-400)', marginBottom: 12 }}>
                Податковий профіль
              </div>
              <div
                style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 16 }}
              >
                Ці параметри впливають на розрахунок ЄП, лімітів і на формування допоміжних
                PDF-документів.
              </div>

              {entrepreneur.group === 3 ? (
                <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                  {[
                    {
                      title: '5% без ПДВ',
                      desc: 'Для ФОП 3 групи без реєстрації платником ПДВ.',
                      active: !vatPayer,
                      onClick: () => setVatPayer(false),
                    },
                    {
                      title: '3% + ПДВ',
                      desc: 'Для ФОП 3 групи, зареєстрованого платником ПДВ.',
                      active: vatPayer,
                      onClick: () => setVatPayer(true),
                    },
                  ].map((option) => (
                    <button
                      key={option.title}
                      type="button"
                      onClick={option.onClick}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: 14,
                        border: `1px solid ${option.active ? 'rgba(129,140,248,0.45)' : 'var(--border)'}`,
                        background: option.active ? 'rgba(99,102,241,0.14)' : 'var(--surface-2)',
                        color: 'var(--text)',
                        fontFamily: 'var(--font-sans)',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{option.title}</div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: 'var(--text-3)',
                          lineHeight: 1.6,
                        }}
                      >
                        {option.desc}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <Input
                    label={`Ставка ЄП для ${entrepreneur.group} групи, %`}
                    type="number"
                    min="0"
                    max={entrepreneur.group === 1 ? '10' : '20'}
                    step="1"
                    value={localEpRatePercent}
                    onChange={(event) => setLocalEpRatePercent(event.target.value)}
                    hint={`Вкажи цілу ставку зі своєї громади. Діапазон для ${entrepreneur.group} групи — від 0% до ${entrepreneur.group === 1 ? '10' : '20'}%.`}
                  />
                </div>
              )}

              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.18)',
                  fontSize: 12,
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                Kasyr.ai не визначає ці параметри автоматично. Перед збереженням звір дані зі своїм
                витягом, рішенням місцевої ради або інформацією з cabinet.tax.gov.ua.
              </div>

              <Button
                variant="secondary"
                size="sm"
                loading={savingTaxProfile}
                onClick={handleSaveTaxProfile}
              >
                Зберегти податковий профіль
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'banks' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {bankAccounts.length === 0 && (
            <HintBanner
              id="settings_connect_bank"
              title="Порада"
              action={
                <Button variant="secondary" size="sm" onClick={() => setIsBankModalOpen(true)}>
                  Підключити Monobank
                </Button>
              }
            >
              Підключи банк, щоб транзакції імпортувались автоматично і розрахунки стали точнішими.
            </HintBanner>
          )}
          {bankAccounts.length === 0 ? (
            <div
              style={{
                padding: 28,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                textAlign: 'center',
                color: 'var(--text-3)',
              }}
            >
              Поки не підключено жодного банку.
            </div>
          ) : (
            bankAccounts.map((account) => (
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
                    <Badge tone="income" dot>
                      Підключено
                    </Badge>
                  </div>
                  <div
                    style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}
                  >
                    Остання синхронізація:{' '}
                    {account.lastSync
                      ? new Date(account.lastSync).toLocaleString('uk-UA')
                      : 'ще не виконувалась'}
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
            ))
          )}

          {(() => {
            // Beta: do not expose plan limits in UI.
            const betaFullAccess = true
            const maxBanks = betaFullAccess ? 999 : 1
            const atLimit = bankAccounts.length >= maxBanks

            return (
              <div
                style={{
                  padding: 22,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                    flexWrap: 'wrap',
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <div className="label" style={{ color: 'var(--indigo-400)' }}>
                      Підключити банк
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 14,
                        color: 'var(--text-3)',
                        lineHeight: 1.6,
                      }}
                    >
                      Monobank уже працює. Інші банки ми показуємо, щоб було видно дорожню карту
                      інтеграцій.
                    </div>
                  </div>
                  {atLimit && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(129,140,248,0.2)',
                        fontSize: 12,
                        color: 'var(--text-2)',
                        lineHeight: 1.5,
                      }}
                    >
                      Досягнуто ліміту підключених банків для цього акаунта.
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {allBanks.map((bank) => {
                    const connected =
                      bank.id === 'monobank' &&
                      bankAccounts.some((account) => account.provider === 'monobank')
                    const canConnect = bank.available && !connected && !atLimit

                    return (
                      <div
                        key={bank.id}
                        style={{
                          padding: '16px 18px',
                          borderRadius: 16,
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            {bank.label}
                          </div>
                          {connected ? (
                            <Badge tone="income" dot>
                              Підключено
                            </Badge>
                          ) : bank.available ? (
                            <Badge tone="neutral">Доступно</Badge>
                          ) : (
                            <Badge tone="warn">Скоро</Badge>
                          )}
                        </div>

                        <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                          {bank.available
                            ? 'Підключення через токен Monobank і синхронізацію транзакцій.'
                            : 'Інтеграція ще в роботі. У цьому релізі банк показаний як майбутній конектор.'}
                        </div>

                        <div>
                          <Button
                            variant={canConnect ? 'secondary' : 'plain'}
                            size="sm"
                            onClick={() => {
                              if (canConnect) {
                                setIsBankModalOpen(true)
                              }
                            }}
                            disabled={!canConnect}
                          >
                            {connected ? 'Підключено' : bank.available ? 'Підключити' : 'Скоро'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {atLimit && (
                  <div
                    style={{ marginTop: 16, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}
                  >
                    Досягнуто ліміту підключених банків для цього акаунта.
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <HintBanner id="settings_notifications" title="Порада">
            Увімкни Email або Telegram, щоб не пропускати дедлайни. Налаштування працюють одразу
            після збереження.
          </HintBanner>
          <div
            style={{
              padding: 22,
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
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                  Email нагадування
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)' }}>
                  Отримуй дедлайни на email заздалегідь.
                </div>
              </div>
              <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
            </div>
          </div>

          <div
            style={{
              padding: 22,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                  Telegram-бот
                </div>
                <div
                  style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}
                >
                  Привʼяжи бота через унікальне посилання і отримуй нагадування в Telegram.
                </div>
              </div>
              {telegramLink?.connected ? (
                <Badge tone="income" dot>
                  Telegram підключено
                </Badge>
              ) : (
                <Badge tone="warn">Ще не підключено</Badge>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  Нагадування в Telegram
                </div>
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

      {SHOW_SUBSCRIPTION_UI && activeTab === 'plan' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 6px',
                color: 'var(--text)',
              }}
            >
              Тарифні плани
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
              Бета-ціни діють до кінця місяця. Потім — тільки для поточних підписників.
            </p>
          </div>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(129,140,248,0.25)',
              marginBottom: 20,
              fontSize: 13,
              color: 'var(--indigo-300)',
              lineHeight: 1.6,
            }}
          >
            🎉 <strong>Бета-тестування:</strong> зараз усі акаунти мають максимальні права. Залишай
            відгуки — вони вплинуть на фінальний продукт.
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = entrepreneur?.subscriptionTier === plan.tier

              return (
                <div
                  key={plan.tier}
                  style={{
                    padding: 22,
                    borderRadius: 18,
                    background: plan.highlight
                      ? 'linear-gradient(180deg, rgba(99,102,241,0.18), rgba(20,20,24,0.98))'
                      : isCurrent
                        ? 'linear-gradient(180deg, rgba(99,102,241,0.12), rgba(20,20,24,0.98))'
                        : 'var(--surface)',
                    border: plan.highlight
                      ? '1px solid rgba(129,140,248,0.45)'
                      : isCurrent
                        ? '1px solid rgba(129,140,248,0.25)'
                        : '1px solid var(--border)',
                    position: 'relative',
                  }}
                >
                  {plan.badge && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--indigo-500)',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 12px',
                        borderRadius: 99,
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}
                  <div
                    className="label"
                    style={{
                      color: plan.highlight ? 'var(--indigo-300)' : 'var(--text-3)',
                      marginBottom: 10,
                    }}
                  >
                    {plan.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        color: 'var(--text)',
                      }}
                    >
                      {plan.price}
                    </span>
                  </div>
                  {plan.oldPrice && (
                    <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>
                      замість{' '}
                      <span style={{ textDecoration: 'line-through' }}>{plan.oldPrice}</span>
                      <span style={{ color: 'var(--success)', marginLeft: 6, fontWeight: 600 }}>
                        бета-ціна
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: 8, margin: '18px 0 22px' }}>
                    {plan.description.map((item) => (
                      <div
                        key={item}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          fontSize: 13,
                          color: 'var(--text-2)',
                          lineHeight: 1.5,
                        }}
                      >
                        <ShieldCheck
                          size={14}
                          color="var(--success)"
                          style={{ flexShrink: 0, marginTop: 1 }}
                        />
                        {item}
                      </div>
                    ))}
                  </div>

                  {isCurrent ? (
                    <Badge tone="income" dot>
                      Поточний план
                    </Badge>
                  ) : plan.tier === 'free' ? (
                    <Button variant="secondary" full disabled>
                      Базовий план
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      full
                      loading={savingPrefs}
                      onClick={() => handleUpgrade(plan.tier)}
                    >
                      Перейти на {plan.title}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 24,
          padding: '14px 18px',
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: 14,
          fontSize: 12,
          color: 'var(--text-3)',
          lineHeight: 1.7,
        }}
      >
        ⚠️ Kasyr.ai — інформаційний інструмент, не є офіційним податковим консультантом. Суми
        розраховуються автоматично. Перед сплатою звір дані з{' '}
        <a
          href="https://cabinet.tax.gov.ua"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--indigo-400)' }}
        >
          cabinet.tax.gov.ua
        </a>
        . Реквізити для сплати залежать від вашої громади — на{' '}
        <a
          href="https://tax.gov.ua"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--indigo-400)' }}
        >
          tax.gov.ua
        </a>
        .
      </div>

      <Modal
        open={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        title="Підключити Monobank"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(129,140,248,0.18)',
              fontSize: 13,
              color: 'var(--text-2)',
              lineHeight: 1.6,
            }}
          >
            Токен отримай на api.monobank.ua → Personal token. Після введення підтвердь доступ у
            застосунку Monobank.
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
