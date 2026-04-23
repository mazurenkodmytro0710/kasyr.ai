import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Plus, FileText, User } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'

const tabs = [
  { key: 'home', label: 'Огляд', path: '/dashboard', Icon: LayoutDashboard },
  { key: 'tx', label: 'Транзакції', path: '/transactions', Icon: ArrowLeftRight },
  { key: 'add', label: '', path: '', Icon: Plus, primary: true },
  { key: 'reports', label: 'Звіти', path: '/reports', Icon: FileText },
  { key: 'me', label: 'Профіль', path: '/settings', Icon: User },
]

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { openAddTransaction } = useUiStore()

  return (
    <nav style={{
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(12,12,15,0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      paddingTop: 10,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 40,
    }}>
      {tabs.map((t) =>
        t.primary ? (
          <button
            key={t.key}
            onClick={openAddTransaction}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--indigo-500)', color: 'white', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginTop: -14,
              boxShadow: '0 10px 24px -6px rgba(99,102,241,0.6), 0 0 0 4px var(--bg)',
            }}
          >
            <t.Icon size={22} />
          </button>
        ) : (
          <button
            key={t.key}
            onClick={() => navigate(t.path)}
            style={{
              flex: 1, padding: '4px 0', border: 'none', background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              cursor: 'pointer',
              color: location.pathname === t.path ? 'var(--indigo-400)' : 'var(--text-muted)',
            }}
          >
            <t.Icon size={20} />
            {t.label && <span style={{ fontSize: 10, fontWeight: 500, fontFamily: 'var(--font-sans)' }}>{t.label}</span>}
          </button>
        )
      )}
    </nav>
  )
}
