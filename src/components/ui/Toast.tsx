import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let addToastFn: ((message: string, type?: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  addToastFn?.(message, type)
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToastFn = (message, type = 'success') => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }
    return () => { addToastFn = null }
  }, [])

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 12, minWidth: 260, maxWidth: 360,
          background: t.type === 'error' ? 'rgba(239,68,68,0.12)' : t.type === 'info' ? 'rgba(56,189,248,0.12)' : 'rgba(16,185,129,0.12)',
          border: `1px solid ${t.type === 'error' ? 'rgba(239,68,68,0.3)' : t.type === 'info' ? 'rgba(56,189,248,0.3)' : 'rgba(16,185,129,0.3)'}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
        }}>
          {t.type === 'error'
            ? <XCircle size={16} color="var(--danger)" />
            : <CheckCircle size={16} color={t.type === 'info' ? 'var(--info)' : 'var(--success)'} />
          }
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{t.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
