import { useState } from 'react'
import { Building2, Bell, CreditCard, User } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useAuthStore } from '../store/authStore'
import { mockBankAccounts } from '../mocks'

const tabs = [
  { key: 'profile', label: 'Профіль', Icon: User },
  { key: 'banks', label: 'Банки', Icon: Building2 },
  { key: 'notifications', label: 'Сповіщення', Icon: Bell },
  { key: 'plan', label: 'Тариф', Icon: CreditCard },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--indigo-500)' : 'var(--surface-2)',
        position: 'relative', transition: 'background .2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        transition: 'left .2s',
      }} />
    </button>
  )
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const { entrepreneur } = useAuthStore()
  const [emailNotif, setEmailNotif] = useState(true)
  const [telegramNotif, setTelegramNotif] = useState(false)
  const [daysBefore, setDaysBefore] = useState(7)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: 'var(--text)' }}>
          Налаштування
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface-2)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: activeTab === t.key ? 'var(--surface)' : 'transparent',
              color: activeTab === t.key ? 'var(--text)' : 'var(--text-3)',
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
              boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              transition: 'all .14s',
            }}
          >
            <t.Icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
          <Input label="Повне ПІБ" defaultValue={entrepreneur?.fullName ?? 'Коваленко Марія Олексіївна'} />
          <Input label="ІПН" defaultValue={entrepreneur?.taxId ?? '3456789012'} hint="10 цифр з довідки ДПС" />
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Група ЄП
              </label>
              <select style={{
                width: '100%', height: 44, background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, padding: '0 14px',
              }}>
                <option>3 група (5%)</option>
                <option>2 група (фіксовано)</option>
                <option>1 група (фіксовано)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <Input label="Дата реєстрації" defaultValue={entrepreneur?.regDate ?? '14.03.2022'} type="date" />
            </div>
          </div>
          <Input label="КВЕДи" defaultValue={entrepreneur?.kveds?.join(', ') ?? '62.01, 62.02'} hint="Основні коди діяльності через кому" />
          <Button variant="primary">Зберегти зміни</Button>
        </div>
      )}

      {activeTab === 'banks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mockBankAccounts.map(acc => (
            <div key={acc.id} style={{
              padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: '#0A0A0A',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, flexShrink: 0,
              }}>M</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Monobank</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  Синхронізовано {acc.lastSync ? new Date(acc.lastSync).toLocaleString('uk-UA') : 'ніколи'}
                </div>
              </div>
              <Badge tone="income" dot>Підключено</Badge>
              <Button variant="danger" size="sm">Відключити</Button>
            </div>
          ))}
          <Button variant="secondary" icon={<Building2 size={16} />}>Додати банк</Button>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 500 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Email сповіщення</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Нагадування про дедлайни на email</div>
            </div>
            <Toggle checked={emailNotif} onChange={setEmailNotif} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Telegram</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Сповіщення у Telegram бот</div>
            </div>
            <Toggle checked={telegramNotif} onChange={setTelegramNotif} />
          </div>
          {telegramNotif && (
            <Input label="Telegram handle" placeholder="@username" />
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 12 }}>Нагадувати за</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[7, 3, 1].map(d => (
                <button
                  key={d}
                  onClick={() => setDaysBefore(d)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                    background: daysBefore === d ? 'var(--indigo-glow)' : 'var(--surface-2)',
                    color: daysBefore === d ? 'var(--indigo-300)' : 'var(--text-2)',
                    fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                    border: daysBefore === d ? '1px solid rgba(129,140,248,0.3)' : '1px solid var(--border)',
                  }}
                >{d} {d === 1 ? 'день' : 'дні'}</button>
              ))}
            </div>
          </div>
          <Button variant="primary">Зберегти</Button>
        </div>
      )}

      {activeTab === 'plan' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
          <div style={{
            padding: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
          }}>
            <div className="label" style={{ marginBottom: 8 }}>FREE</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>0 ₴</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>на місяць</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {['Авто-синхронізація', 'AI класифікація (100/міс)', 'Дедлайни', 'Базові звіти'].map(f => (
                <div key={f} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--success)' }}>✓</span> {f}
                </div>
              ))}
            </div>
            <Badge tone="income" dot>Поточний план</Badge>
          </div>
          <div style={{
            padding: 24, background: 'linear-gradient(135deg, #1e1b4b 0%, #1C1C22 100%)',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16,
            boxShadow: 'var(--shadow-indigo)',
          }}>
            <div className="label" style={{ color: 'var(--indigo-300)', marginBottom: 8 }}>PRO</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 4 }}>299 ₴</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>на місяць</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {['Все з Free', 'Необмежений AI', 'КЕП підпис', 'Авто-декларації', 'Пріоритетна підтримка'].map(f => (
                <div key={f} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--indigo-400)' }}>✓</span> {f}
                </div>
              ))}
            </div>
            <Button variant="primary" full>Оновити до Pro</Button>
          </div>
        </div>
      )}
    </div>
  )
}
