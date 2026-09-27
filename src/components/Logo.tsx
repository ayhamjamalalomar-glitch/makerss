import Link from '../lib/router'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

/** Makers wordmark from the approved design. Always links home. */
export default function Logo({ size = 'md' }: LogoProps) {
  const sizes = {
    sm: { fontSize: 11, lineHeight: 1.05, letterSpacing: '0.04em' },
    md: { fontSize: 15, lineHeight: 1.05, letterSpacing: '0.04em' },
    lg: { fontSize: 28, lineHeight: 1.0, letterSpacing: '0.02em' },
  }
  const s = sizes[size]
  return (
    <Link to="/" aria-label="Makers" className="shrink-0" style={{ textAlign: 'left', direction: 'ltr' }}>
      <div className="font-archivo" style={{ ...s, fontWeight: 900, color: 'var(--c-text)', textTransform: 'uppercase' }}>
        <div>MAKERS</div>
        <div>FILMMAKERS</div>
        <div>CREATORS</div>
      </div>
    </Link>
  )
}
