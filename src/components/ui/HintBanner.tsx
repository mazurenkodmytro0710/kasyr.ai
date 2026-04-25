import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const SHOW_HINTS = import.meta.env.VITE_SHOW_HINTS !== 'false'

export function HintBanner({
  id,
  title = 'Підказка',
  children,
  action,
}: {
  id: string
  title?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (!SHOW_HINTS) {
      setHidden(true)
      return
    }
    try {
      const dismissed = window.localStorage.getItem(`kasyr_hint_${id}`) === '1'
      setHidden(dismissed)
    } catch {
      setHidden(false)
    }
  }, [id])

  if (!SHOW_HINTS || hidden) return null

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 16,
        background: 'rgba(99,102,241,0.10)',
        border: '1px solid rgba(129,140,248,0.25)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--indigo-300)' }}>
          {title.toUpperCase()}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
          {children}
        </div>
        {action && <div style={{ marginTop: 12 }}>{action}</div>}
      </div>

      <button
        type="button"
        onClick={() => {
          try {
            window.localStorage.setItem(`kasyr_hint_${id}`, '1')
          } catch {
            // ignore
          }
          setHidden(true)
        }}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: '1px solid rgba(129,140,248,0.25)',
          background: 'rgba(12,12,15,0.55)',
          color: 'var(--text-2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-label="Закрити підказку"
      >
        <X size={16} />
      </button>
    </div>
  )
}

