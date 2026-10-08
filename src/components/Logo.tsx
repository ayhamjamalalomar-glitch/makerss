import Link from '../lib/router'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  /** Which edge the three lines line up on. */
  align?: 'left' | 'right'
  /** Show the film strip symbol beside the wordmark. */
  symbol?: boolean
}

/** The Makers symbol: three bars at the word lengths of MAKERS, FILMMAKERS, CREATORS between film perforations.
 *  Cropped to the bars so each bar lines up with one line of the wordmark. */
export function MakersSymbol({ height, color = 'currentColor', dot = 'var(--c-accent)' }: { height: number; color?: string; dot?: string }) {
  return (
    <svg width={(height * 92) / 60} height={height} viewBox="6 20 92 60" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <g fill={color}>
        <rect x="24" y="21" width="36" height="14" rx="3" />
        <rect x="24" y="43" width="58" height="14" rx="3" />
        <rect x="24" y="65" width="47" height="14" rx="3" />
        <rect x="7" y="45" width="9" height="10" rx="2.5" />
        <rect x="7" y="67" width="9" height="10" rx="2.5" />
        <rect x="88" y="23" width="9" height="10" rx="2.5" />
        <rect x="88" y="45" width="9" height="10" rx="2.5" />
        <rect x="88" y="67" width="9" height="10" rx="2.5" />
      </g>
      <rect x="7" y="23" width="9" height="10" rx="2.5" fill={dot} />
    </svg>
  )
}

/** Makers wordmark from the approved design. Always links home. */
export default function Logo({ size = 'md', color = 'var(--c-text)', align = 'left', symbol = true }: LogoProps) {
  const sizes = {
    sm: { fontSize: 11, lineHeight: 1.05, letterSpacing: '0.04em' },
    md: { fontSize: 15, lineHeight: 1.05, letterSpacing: '0.04em' },
    lg: { fontSize: 28, lineHeight: 1.0, letterSpacing: '0.02em' },
  }
  const s = sizes[size]
  return (
    <Link to="/" aria-label="Makers" className="shrink-0 inline-flex items-center" style={{ textAlign: align, direction: 'ltr', gap: s.fontSize * 0.7, color, transition: 'color .3s' }}>
      {symbol && <MakersSymbol height={Math.round(s.fontSize * s.lineHeight * 3 * 0.92)} />}
      <div className="font-archivo" style={{ ...s, fontWeight: 900, color, textTransform: 'uppercase', transition: 'color .3s' }}>
        <div>MAKERS</div>
        <div>FILMMAKERS</div>
        <div>CREATORS</div>
      </div>
    </Link>
  )
}
