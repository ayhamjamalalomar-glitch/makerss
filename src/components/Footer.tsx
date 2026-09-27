import { useEffect, useState } from 'react'
import type { Navigate, Page } from '../App'
import Logo from './Logo'

interface FooterProps {
  navigate: Navigate
}

const columns: { title: string; items: { label: string; page: Page }[] }[] = [
  {
    title: 'Platform',
    items: [
      { label: 'Home', page: { name: 'home' } },
      { label: 'Community', page: { name: 'feed' } },
      { label: 'Makers', page: { name: 'makers' } },
      { label: 'Titles', page: { name: 'titles' } },
    ],
  },
  {
    title: 'Work',
    items: [
      { label: 'Open Projects', page: { name: 'open-projects' } },
      { label: 'Events', page: { name: 'events' } },
      { label: 'News', page: { name: 'news' } },
      { label: 'Request an Invitation', page: { name: 'request-invite' } },
    ],
  },
]

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82c-.9-.8-1.46-1.96-1.46-3.24h-3.2v13.86a2.6 2.6 0 1 1-2.6-2.6c.24 0 .48.03.71.08V10.7a5.8 5.8 0 0 0-.71-.04A5.8 5.8 0 1 0 15 16.44V9.36a8.4 8.4 0 0 0 4.6 1.37V7.53a5.13 5.13 0 0 1-3-1.71Z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.3v5.4l5-2.7-5-2.7Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

const socials = [
  { label: 'Instagram', href: 'https://instagram.com/makers.intime', icon: InstagramIcon },
  { label: 'TikTok', href: 'https://tiktok.com/@makers.intime', icon: TikTokIcon },
  { label: 'YouTube', href: 'https://youtube.com/@makersintime', icon: YouTubeIcon },
]

const linkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  color: 'var(--c-muted)',
  transition: 'color 0.15s',
}

const iconBtnBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 38,
  height: 38,
  borderRadius: 999,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--c-border)',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--c-muted)',
  transition: 'color 0.15s, border-color 0.15s, transform 0.15s',
  flexShrink: 0,
}

export default function Footer({ navigate }: FooterProps) {
  const [showTop, setShowTop] = useState(false)
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = () => {
    const next = !isLight
    setIsLight(next)
    document.documentElement.dataset.theme = next ? 'light' : 'dark'
  }

  return (
    <footer style={{ background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)' }}>

      {/* Logo + tagline */}
      <div
        className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start md:items-center"
        style={{ padding: '48px 40px 40px' }}
      >
        <div className="shrink-0">
          <Logo onClick={() => navigate({ name: 'home' })} />
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.7, maxWidth: 560 }}>
          Makers is an invite-only registry for the people who actually make the work — directors, DOPs, editors,
          stylists, sound, motion. Verified credits, real collaborations, no cold outreach. Built in Amman, built for the region.
        </p>
      </div>

      <div style={{ borderTop: '1px dashed var(--c-border)' }} />

      {/* Nav columns */}
      <div
        className="max-w-7xl mx-auto grid grid-cols-2 md:flex md:flex-row gap-8 md:gap-20"
        style={{ padding: '36px 40px' }}
      >
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.13em',
                color: 'var(--c-muted-2)',
              }}
            >
              {col.title}
            </span>
            <ul className="flex flex-col gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {col.items.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.page)}
                    style={linkStyle}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--c-text)')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--c-muted)')}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px dashed var(--c-border)' }} />

      {/* Social + utility row */}
      <div
        className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3"
        style={{ padding: '28px 40px' }}
      >
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            style={iconBtnBase}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.color = '#E85D04'
              el.style.borderColor = 'rgba(232,93,4,0.4)'
              el.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.color = 'var(--c-muted)'
              el.style.borderColor = 'var(--c-border)'
              el.style.transform = 'translateY(0)'
            }}
          >
            <s.icon className="w-4 h-4" />
          </a>
        ))}

        <a
          href="mailto:hello@makers.intime"
          aria-label="Email"
          style={iconBtnBase}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.color = '#E85D04'
            el.style.borderColor = 'rgba(232,93,4,0.4)'
            el.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.color = 'var(--c-muted)'
            el.style.borderColor = 'var(--c-border)'
            el.style.transform = 'translateY(0)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1.5 5l6.5 4.5L14.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </a>

        <div style={{ width: 1, height: 24, background: 'var(--c-border)', margin: '0 4px' }} />

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          style={{
            ...iconBtnBase,
            opacity: showTop ? 1 : 0.35,
            pointerEvents: showTop ? 'auto' : 'none',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.color = '#E85D04'
            el.style.borderColor = 'rgba(232,93,4,0.4)'
            el.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.color = 'var(--c-muted)'
            el.style.borderColor = 'var(--c-border)'
            el.style.transform = 'translateY(0)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={toggleTheme}
          aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{
            ...iconBtnBase,
            color: isLight ? '#E85D04' : 'var(--c-muted)',
            borderColor: isLight ? 'rgba(232,93,4,0.4)' : 'var(--c-border)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.color = '#E85D04'
            el.style.borderColor = 'rgba(232,93,4,0.4)'
            el.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.color = isLight ? '#E85D04' : 'var(--c-muted)'
            el.style.borderColor = isLight ? 'rgba(232,93,4,0.4)' : 'var(--c-border)'
            el.style.transform = 'translateY(0)'
          }}
        >
          {isLight ? (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Copyright */}
      <div
        className="max-w-7xl mx-auto text-center"
        style={{ padding: '0 40px 36px', fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'var(--c-muted-2)' }}
      >
        © {new Date().getFullYear()} Makers, by intime. Invite-only registry.
      </div>
    </footer>
  )
}
