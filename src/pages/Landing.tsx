import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle,
  Landmark,
  WalletCards,
  Waves,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'

const SHOW_SUBSCRIPTION_UI = import.meta.env.VITE_SHOW_SUBSCRIPTION_UI === 'true'

const features = [
  {
    icon: <Waves size={18} />,
    title: 'Автоматична синхронізація',
    desc: 'Підключи свій банк, транзакції завантажуються самі.',
  },
  {
    icon: <BarChart3 size={18} />,
    title: 'Розрахунок податків',
    desc: 'ЄП, ЄСВ і ВЗ для ФОП 1, 2 та 3 групи без ручних таблиць.',
  },
  {
    icon: <Bell size={18} />,
    title: 'Нагадування',
    desc: 'Email або Telegram-бот нагадають про важливі податкові дедлайни.',
  },
  {
    icon: <CheckCircle size={18} />,
    title: 'Книга обліку у PDF',
    desc: 'Готовий PDF-формат для книги обліку доходів в один клік.',
  },
  {
    icon: <Landmark size={18} />,
    title: 'Курс валют в реальному часі',
    desc: 'Актуальні USD та EUR з Monobank API прямо на дашборді.',
  },
  {
    icon: <WalletCards size={18} />,
    title: 'Допоміжні PDF-звіти',
    desc: 'Квартальні фінансові PDF-звіти для звірки, бухгалтера і підготовки до подання через Е-кабінет.',
  },
]

export function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px clamp(16px, 4vw, 32px)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          backdropFilter: 'blur(14px)',
          background: 'rgba(12,12,15,0.82)',
          zIndex: 10,
        }}
      >
        <Logo />
        <div
          className="hidden md:flex"
          style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}
        >
          <Button variant="ghost" onClick={() => navigate('/onboarding')}>
            Увійти
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/onboarding')}
            style={{ fontSize: 15, padding: '12px 20px', height: 46 }}
          >
            Спробувати безкоштовно
          </Button>
        </div>
      </nav>

      <section
        style={{
          position: 'relative',
          padding: '64px 20px 48px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top, rgba(99,102,241,0.18), transparent 42%), radial-gradient(circle at 20% 80%, rgba(16,185,129,0.08), transparent 26%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', width: '100%', maxWidth: 1080 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(129,140,248,0.3)',
              borderRadius: 999,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--indigo-300)',
              marginBottom: 22,
            }}
          >
            BETA
          </div>

          <div style={{ maxWidth: 760 }}>
            <h1
              style={{
                margin: '0 0 16px',
                fontSize: 'clamp(28px, 6vw, 52px)',
                lineHeight: 1.02,
                letterSpacing: '-0.04em',
                color: 'var(--text)',
              }}
            >
              Облік ФОП, який сам синхронізує банк, рахує податки і тримає дедлайни під контролем.
            </h1>
            <p
              style={{
                margin: '0 0 28px',
                maxWidth: 620,
                fontSize: 17,
                lineHeight: 1.7,
                color: 'var(--text-2)',
              }}
            >
              Підключи свій банк, отримай розрахунок ЄП, ЄСВ і ВЗ, PDF для звірки та нагадування в
              Email або Telegram.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/onboarding')}
                trailing={<ArrowRight size={16} />}
                style={{ fontSize: 15, padding: '12px 20px', height: 48 }}
              >
                Спробувати безкоштовно
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/onboarding')}>
                Увійти
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '12px 20px 72px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1080 }}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                style={{
                  background: 'linear-gradient(180deg, rgba(20,20,24,0.96), rgba(20,20,24,0.88))',
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                  padding: 16,
                  minHeight: 170,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(99,102,241,0.12)',
                    color: 'var(--indigo-300)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  {feature.icon}
                </div>
                <h2
                  style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}
                >
                  {feature.title}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      {SHOW_SUBSCRIPTION_UI && (
        <section style={{ padding: '0 20px 80px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 1080 }}>
            <h2
              style={{
                fontSize: 'clamp(22px,4vw,36px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text)',
                margin: '0 0 8px',
                textAlign: 'center',
              }}
            >
              Прозорі тарифи
            </h2>
            <p
              style={{
                fontSize: 15,
                color: 'var(--text-3)',
                textAlign: 'center',
                margin: '0 0 40px',
              }}
            >
              Без прихованих платежів. Скасувати будь-коли.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {[
                {
                  name: 'Free',
                  price: '0 ₴',
                  subtitle: 'назавжди',
                  badge: null,
                  features: [
                    'Ручне додавання транзакцій',
                    '1 підключений банк',
                    'Дедлайни та нагадування',
                    'Базова книга обліку',
                  ],
                  cta: 'Почати безкоштовно',
                  primary: false,
                },
                {
                  name: 'Pro ⭐',
                  price: '299 ₴',
                  oldPrice: '499 ₴',
                  subtitle: '/місяць',
                  badge: 'Популярний',
                  features: [
                    'Автоімпорт з банку (до 3)',
                    'AI-класифікація транзакцій',
                    'Квартальні PDF-звіти',
                    'Telegram-нагадування',
                    'Експорт для бухгалтера',
                  ],
                  cta: 'Спробувати Pro',
                  primary: true,
                },
                {
                  name: 'Business 🚀',
                  price: '699 ₴',
                  oldPrice: '999 ₴',
                  subtitle: '/місяць',
                  badge: null,
                  features: [
                    'Все що в Pro',
                    'Необмежена кількість банків',
                    'Пріоритетна підтримка',
                    'Ранній доступ до нових функцій',
                  ],
                  cta: 'Спробувати Business',
                  primary: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  style={{
                    background: plan.primary
                      ? 'linear-gradient(135deg, #1e1b4b, #1C1C22)'
                      : 'var(--surface)',
                    border: plan.primary
                      ? '1px solid rgba(99,102,241,0.4)'
                      : '1px solid var(--border)',
                    borderRadius: 20,
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    boxShadow: plan.primary ? '0 0 40px rgba(99,102,241,0.15)' : 'none',
                    position: 'relative',
                  }}
                >
                  {plan.badge && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--indigo-500)',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 12px',
                        borderRadius: 100,
                        letterSpacing: '.04em',
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '.08em',
                        color: plan.primary ? 'var(--indigo-300)' : 'var(--text-3)',
                        marginBottom: 8,
                      }}
                    >
                      {plan.name.toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      {plan.oldPrice && (
                        <span
                          style={{
                            fontSize: 16,
                            color: 'var(--text-muted)',
                            textDecoration: 'line-through',
                          }}
                        >
                          {plan.oldPrice}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 36,
                          fontWeight: 800,
                          letterSpacing: '-0.03em',
                          color: 'var(--text)',
                        }}
                      >
                        {plan.price}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{plan.subtitle}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {plan.features.map((f) => (
                      <div
                        key={f}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          color: 'var(--text-2)',
                        }}
                      >
                        <span
                          style={{
                            color: plan.primary ? 'var(--indigo-400)' : 'var(--success)',
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </span>{' '}
                        {f}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/onboarding')}
                    style={{
                      width: '100%',
                      padding: '12px 0',
                      borderRadius: 12,
                      border: 'none',
                      cursor: 'pointer',
                      background: plan.primary ? 'var(--indigo-500)' : 'var(--surface-2)',
                      color: plan.primary ? 'white' : 'var(--text)',
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  >
                    {plan.cta}
                  </button>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                    }}
                  >
                    Підписка автоматично поновлюється. Скасувати будь-коли.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section style={{ padding: '0 20px 40px', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 1080,
            padding: 18,
            borderRadius: 18,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.18)',
            color: 'var(--text-2)',
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: 'var(--text)' }}>Увага.</strong> Kasyr.ai надає інформаційну
          допомогу і формує допоміжні документи, але не є офіційним податковим консультантом і не
          подає звітність до ДПС автоматично. Перед сплатою податків і поданням звітності звір дані
          з cabinet.tax.gov.ua та tax.gov.ua.
        </div>
      </section>
    </div>
  )
}
