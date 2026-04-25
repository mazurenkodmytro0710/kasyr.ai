import { useState } from 'react'
import { Mail } from 'lucide-react'
import client from '../../api/client'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { toast } from '../ui/Toast'

export function EmailVerificationGate({ email }: { email: string }) {
  const [resending, setResending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResend = async () => {
    setResending(true)
    try {
      await client.post('/api/auth/resend-verification')
      setSent(true)
      toast('Листа надіслано! Перевір пошту.')
    } catch {
      toast('Не вдалося надіслати. Спробуй пізніше.', 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <Logo size={28} />
      </div>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '36px 32px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'rgba(99,102,241,0.12)',
            color: 'var(--indigo-300)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Mail size={28} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
          Підтвердь свій email
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 6px', lineHeight: 1.65 }}>
          Ми надіслали листа на <strong style={{ color: 'var(--text)' }}>{email}</strong>.
        </p>
        <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '0 0 24px' }}>
          Натисни посилання в листі, щоб підтвердити акаунт і потрапити в дашборд.
        </p>
        {sent ? (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: 'var(--success-10)',
              color: 'var(--success)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Лист надіслано — перевір пошту
          </div>
        ) : (
          <Button full loading={resending} onClick={handleResend} variant="secondary">
            Надіслати лист ще раз
          </Button>
        )}
      </div>
    </div>
  )
}
