import { ArrowRight, BarChart3, Bell, CheckCircle, Landmark, WalletCards, Waves } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'

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
    title: 'Звіти для податкової',
    desc: 'Квартальні PDF-звіти зі статусом підготовки і відправлення.',
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
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
            background: 'radial-gradient(circle at top, rgba(99,102,241,0.18), transparent 42%), radial-gradient(circle at 20% 80%, rgba(16,185,129,0.08), transparent 26%)',
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
              Підключи свій банк, отримай квартальний розрахунок ЄП, ЄСВ і ВЗ, книгу обліку у PDF та нагадування в Email або Telegram.
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
                <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
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
    </div>
  )
}
