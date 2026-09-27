interface LogoProps {
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ onClick, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { fontSize: 11, lineHeight: 1.05, letterSpacing: '0.04em' },
    md: { fontSize: 15, lineHeight: 1.05, letterSpacing: '0.04em' },
    lg: { fontSize: 28, lineHeight: 1.0, letterSpacing: '0.02em' },
  }

  const s = sizes[size]

  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default', padding: 0, textAlign: 'left' }}
      aria-label="Makers by intime — go to homepage"
    >
      <div
        className="font-archivo"
        style={{
          fontSize: s.fontSize,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
          fontWeight: 900,
          color: 'var(--c-text)',
          textTransform: 'uppercase',
        }}
      >
        <div>MAKERS</div>
        <div>FILMMAKERS</div>
        <div>CREATORS</div>
      </div>
    </button>
  )
}
