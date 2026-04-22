import { type ReactNode, type InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  leading?: ReactNode
  trailing?: ReactNode
}

export function Input({ label, hint, error, leading, trailing, ...props }: InputProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-sans)' }}>
      {label && (
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}</span>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--surface-2)',
        border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '0 14px',
        height: 44,
        transition: 'all .14s',
      }}>
        {leading && <span style={{ color: 'var(--text-3)', display: 'flex' }}>{leading}</span>}
        <input
          {...props}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--text)',
            ...props.style,
          }}
        />
        {trailing && <span style={{ color: 'var(--text-3)', display: 'flex' }}>{trailing}</span>}
      </div>
      {(hint || error) && (
        <span style={{ fontSize: 11, color: error ? 'var(--danger)' : 'var(--text-3)' }}>
          {error ?? hint}
        </span>
      )}
    </label>
  )
}
