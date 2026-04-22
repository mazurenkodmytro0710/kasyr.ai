interface LogoProps {
  size?: number
  wordmark?: boolean
}

export function Logo({ size = 28, wordmark = true }: LogoProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block', flexShrink: 0 }}>
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#818CF8" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#logo-grad)" />
        <path d="M10 9 L10 23 M10 16 L18 9 M10 16 L20 23"
          stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="23" cy="9.6" r="1.7" fill="white" />
      </svg>
      {wordmark && (
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: size * 0.66,
          letterSpacing: '-0.03em',
          color: 'var(--text)',
        }}>
          kasyr<span style={{ color: 'var(--indigo-400)' }}>.ai</span>
        </span>
      )}
    </div>
  )
}
