import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../components/ui/Logo'
import { useAuthStore } from '../store/authStore'

export function VerifyEmail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { init } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const token = params.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => {
        if (!(r.ok || r.redirected)) {
          setStatus('error')
          return
        }

        init()
          .catch(() => undefined)
          .finally(() => {
            setStatus('success')
            setTimeout(() => navigate('/dashboard'), 2500)
          })
      })
      .catch(() => setStatus('error'))
  }, [token, navigate, init])

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
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {status === 'loading' && (
          <>
            <div
              className="spinner"
              style={{ width: 36, height: 36, borderWidth: 3, margin: '0 auto 20px' }}
            />
            <p style={{ color: 'var(--text-2)', fontSize: 15 }}>Перевіряємо твій email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
              Email підтверджено!
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>
              Переходимо на дашборд…
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
              Невалідне посилання
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 24px' }}>
              Посилання застаріло або вже було використано.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'var(--indigo-500)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '11px 24px',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              На дашборд
            </button>
          </>
        )}
      </div>
    </div>
  )
}
