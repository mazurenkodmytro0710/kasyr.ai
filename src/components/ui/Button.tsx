import { type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'plain' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: Variant
  size?: Size
  children?: ReactNode
  icon?: ReactNode
  trailing?: ReactNode
  full?: boolean
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  style?: React.CSSProperties
}

const sizeMap: Record<Size, React.CSSProperties> = {
  sm: { height: 32, padding: '0 12px', fontSize: 13 },
  md: { height: 40, padding: '0 16px', fontSize: 14 },
  lg: { height: 48, padding: '0 20px', fontSize: 15 },
}

const variantMap: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--indigo-500)', color: 'white', boxShadow: 'var(--shadow-indigo-2)', border: 'none' },
  secondary: { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' },
  ghost:     { background: 'transparent', color: 'var(--indigo-400)', border: '1px solid var(--border)' },
  plain:     { background: 'transparent', color: 'var(--text-2)', border: 'none' },
  danger:    { background: 'transparent', color: 'var(--danger)', border: '1px solid transparent' },
}

export function Button({
  variant = 'primary', size = 'md', children, icon, trailing, full, onClick, disabled, loading, type = 'button', style,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        letterSpacing: '-0.005em',
        borderRadius: 10,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all .14s',
        width: full ? '100%' : 'auto',
        opacity: disabled ? 0.4 : 1,
        whiteSpace: 'nowrap',
        ...sizeMap[size],
        ...variantMap[variant],
        ...style,
      }}
    >
      {loading ? <span className="spinner" /> : icon}
      {children}
      {trailing}
    </button>
  )
}
