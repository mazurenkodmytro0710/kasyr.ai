import { type ReactNode } from 'react'

type Tone = 'neutral' | 'income' | 'warn' | 'danger' | 'indigo' | 'info'

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  dot?: boolean
  dashed?: boolean
}

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: 'var(--surface-2)',  fg: 'var(--text-2)' },
  income:  { bg: 'var(--success-10)', fg: 'var(--success)' },
  warn:    { bg: 'var(--warn-10)',    fg: 'var(--warn)' },
  danger:  { bg: 'var(--danger-10)',  fg: 'var(--danger)' },
  indigo:  { bg: 'var(--indigo-glow)',fg: 'var(--indigo-400)' },
  info:    { bg: 'var(--info-10)',    fg: 'var(--info)' },
}

export function Badge({ tone = 'neutral', children, dot, dashed }: BadgeProps) {
  const t = toneMap[tone]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: t.bg,
      color: t.fg,
      padding: '3px 8px',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: 0.1,
      borderRadius: 6,
      lineHeight: 1.4,
      border: dashed ? `1px dashed ${t.fg}` : 'none',
      whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />}
      {children}
    </span>
  )
}
