import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  style?: React.CSSProperties
  onClick?: () => void
  hoverable?: boolean
}

export function Card({ children, style, onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        cursor: onClick || hoverable ? 'pointer' : undefined,
        transition: 'border-color .14s',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
