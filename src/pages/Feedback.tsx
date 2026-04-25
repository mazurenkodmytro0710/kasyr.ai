import { useState } from 'react'
import { CheckCircle, ChevronDown } from 'lucide-react'
import client from '../api/client'
import { Button } from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import { useAuthStore } from '../store/authStore'

const SUBJECTS = ['Баг', 'Пропозиція', 'Питання', 'Інше'] as const
type Subject = (typeof SUBJECTS)[number]

export function Feedback() {
  const { entrepreneur, user } = useAuthStore()
  const [subject, setSubject] = useState<Subject>('Питання')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [subjectOpen, setSubjectOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim().length < 20) {
      toast('Повідомлення повинно містити мінімум 20 символів', 'error')
      return
    }
    setIsLoading(true)
    try {
      await client.post('/api/feedback', { subject, message: message.trim() })
      setDone(true)
      setMessage('')
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast(msg ?? 'Не вдалося надіслати повідомлення', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 104px', maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <div className="label" style={{ color: 'var(--indigo-400)' }}>Зв'язок</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', margin: '6px 0 10px', color: 'var(--text)' }}>
          Зворотній зв'язок
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
          Знайшов баг або маєш ідею? Напиши нам — відповімо протягом 24 годин.
        </p>
      </div>

      {done ? (
        <div style={{
          padding: '32px 28px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          textAlign: 'center',
        }}>
          <CheckCircle size={48} color="var(--success)" strokeWidth={1.5} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              Дякуємо!
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Ми відповімо протягом 24 годин на{' '}
              <strong style={{ color: 'var(--text-2)' }}>{(user as { email?: string } | null)?.email ?? 'твій email'}</strong>.
            </div>
          </div>
          <Button variant="secondary" onClick={() => setDone(false)}>
            Надіслати ще
          </Button>
        </div>
      ) : (
        <div style={{
          padding: '24px 22px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* From info (read-only) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Ім'я</div>
                <div style={{
                  height: 44,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 14,
                  color: 'var(--text-3)',
                }}>
                  {entrepreneur?.fullName?.split(' ').slice(0, 2).join(' ') ?? '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Email</div>
                <div style={{
                  height: 44,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 14,
                  color: 'var(--text-3)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {(user as { email?: string } | null)?.email ?? '—'}
                </div>
              </div>
            </div>

            {/* Subject dropdown */}
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Тема</div>
              <button
                type="button"
                onClick={() => setSubjectOpen(o => !o)}
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 14px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                <span>{subject}</span>
                <ChevronDown
                  size={16}
                  color="var(--text-3)"
                  style={{ transform: subjectOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
                />
              </button>
              {subjectOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 6,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}>
                  {SUBJECTS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSubject(s); setSubjectOpen(false) }}
                      style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 8,
                        border: 'none',
                        background: subject === s ? 'rgba(99,102,241,0.14)' : 'transparent',
                        color: subject === s ? 'var(--indigo-300)' : 'var(--text)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 14,
                        fontWeight: subject === s ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: '0 12px',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                Повідомлення
                <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 6 }}>
                  (мін. 20 символів)
                </span>
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={
                  subject === 'Баг'
                    ? 'Опиши баг: що відбулось, що очікував, кроки для відтворення...'
                    : subject === 'Пропозиція'
                    ? 'Розкажи свою ідею для покращення Kasyr.ai...'
                    : 'Напиши своє питання або повідомлення...'
                }
                rows={6}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  padding: '12px 14px',
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ marginTop: 4, fontSize: 11, color: message.length >= 20 ? 'var(--success)' : 'var(--text-3)', textAlign: 'right' }}>
                {message.length} символів{message.length < 20 ? ` (ще ${20 - message.length})` : ' ✓'}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              full
              size="lg"
              loading={isLoading}
            >
              Надіслати
            </Button>
          </form>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
        Також можна написати напряму:{' '}
        <a href="mailto:kasyr.ai.help@gmail.com" style={{ color: 'var(--indigo-400)' }}>
          kasyr.ai.help@gmail.com
        </a>
      </div>
    </div>
  )
}
