import { Bell, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

function Avatar({ text }: { text: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'var(--indigo-glow)',
      color: 'var(--indigo-400)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600,
      border: '1px solid rgba(129,140,248,0.25)',
    }}>{text}</div>
  )
}

function IconBtn({ children, dot, onClick }: { children: React.ReactNode; dot?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border)',
        background: 'var(--surface)', color: 'var(--text-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', cursor: 'pointer',
      }}
    >
      {children}
      {dot && (
        <span style={{
          position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%',
          background: 'var(--indigo-500)', boxShadow: '0 0 0 2px var(--surface)',
        }} />
      )}
    </button>
  )
}

export function Header() {
  const navigate = useNavigate()
  const { entrepreneur } = useAuthStore()
  const firstName = entrepreneur?.fullName?.split(' ')[1] ?? 'Маріє'
  const initials = entrepreneur?.fullName
    ? entrepreneur.fullName.split(' ').map(w => w[0]).slice(0, 2).join('')
    : 'МК'

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px 16px',
      height: 68,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar text={initials} />
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, letterSpacing: 0.1 }}>
            ФОП · {entrepreneur?.group ?? 3} гр.
          </div>
          <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, letterSpacing: '-0.01em', marginTop: 1 }}>
            Привіт, {firstName} 👋
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <IconBtn dot><Bell size={18} /></IconBtn>
        <IconBtn onClick={() => navigate('/settings')}><Settings size={18} /></IconBtn>
      </div>
    </header>
  )
}
