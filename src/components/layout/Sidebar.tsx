import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, FileText,
  Calendar, Settings, HelpCircle, LogOut, MessageSquare,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '../ui/Logo'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  key: string
  label: string
  path: string
  Icon: LucideIcon
  badge?: string
  badgeTone?: 'warn' | 'neutral'
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: 'ГОЛОВНЕ',
    items: [
      { key: 'home', label: 'Огляд', path: '/dashboard', Icon: LayoutDashboard },
      { key: 'tx', label: 'Транзакції', path: '/transactions', Icon: ArrowLeftRight },
      { key: 'reports', label: 'Звіти', path: '/reports', Icon: FileText },
      { key: 'feedback', label: 'Зворотній зв\'язок', path: '/feedback', Icon: MessageSquare },
    ],
  },
  {
    title: 'ФІНАНСИ',
    items: [
      { key: 'deadlines', label: 'Дедлайни', path: '/deadlines', Icon: Calendar, badge: '19д', badgeTone: 'warn' },
    ],
  },
]

function NavItemBtn({ item, active }: { item: NavItem; active: boolean }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(item.path)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        background: active ? 'var(--indigo-glow)' : 'transparent',
        color: active ? 'var(--indigo-300)' : 'var(--text-2)',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'inherit',
        marginBottom: 2,
        textAlign: 'left',
        transition: 'all .14s',
      }}
    >
      <item.Icon size={16} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: 4,
          background: item.badgeTone === 'warn' ? 'var(--warn-10)' : 'var(--surface-2)',
          color: item.badgeTone === 'warn' ? 'var(--warn)' : 'var(--text-3)',
        }}>{item.badge}</span>
      )}
    </button>
  )
}

function Avatar({ text, size = 36 }: { text: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--indigo-glow)',
      color: 'var(--indigo-400)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
      border: '1px solid rgba(129,140,248,0.25)',
    }}>{text}</div>
  )
}

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { entrepreneur, logout } = useAuthStore()

  const initials = entrepreneur?.fullName
    ? entrepreneur.fullName.split(' ').map(w => w[0]).slice(0, 2).join('')
    : 'МК'

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      <div style={{ padding: '20px 20px 28px' }}>
        <Logo size={28} />
      </div>

      <div style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
        {sections.map(s => (
          <div key={s.title} style={{ marginBottom: 20 }}>
            <div className="label" style={{ padding: '0 8px 8px' }}>{s.title}</div>
            {s.items.map(item => (
              <NavItemBtn
                key={item.key}
                item={item}
                active={location.pathname === item.path}
              />
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 12px 12px', borderTop: '1px solid var(--border)' }}>
        <NavItemBtn item={{ key: 'settings', label: 'Налаштування', path: '/settings', Icon: Settings }} active={location.pathname === '/settings'} />
        <button
          onClick={() => navigate('/help')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--text-2)',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
        >
          <HelpCircle size={16} />
          <span>Допомога</span>
        </button>
      </div>

      <div style={{
        padding: 14,
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <Avatar text={initials} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entrepreneur?.fullName.split(' ').slice(0, 2).join(' ') ?? 'Мій акаунт'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            ФОП · {entrepreneur?.group ?? 3} гр.
          </div>
        </div>
        <button
          onClick={async () => { await logout(); navigate('/') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
