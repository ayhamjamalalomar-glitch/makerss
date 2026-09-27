import { useState, useEffect } from 'react'
import Logo from './Logo'
import type { Page, Navigate } from '../App'

interface NavProps {
  page: Page
  navigate: Navigate
}

export default function Nav({ page, navigate }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links: { label: string; target: Page }[] = [
    { label: 'Browse', target: { name: 'browse' } },
    { label: 'About', target: { name: 'about' } },
  ]

  const isActive = (target: Page) => page.name === target.name

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(16,20,8,0.97)' : 'rgba(16,20,8,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid #1e2a10' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16">
        <Logo onClick={() => navigate({ name: 'landing' })} />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.target)}
              className={`font-inter text-sm px-4 py-2 transition-all rounded-lg ${
                isActive(link.target)
                  ? 'text-volt bg-volt/8'
                  : 'text-paper/50 hover:text-paper hover:bg-paper/5'
              }`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              {link.label}
            </button>
          ))}

          <div className="w-px h-5 mx-2" style={{ background: '#2a3318' }} />

          <button
            onClick={() => navigate({ name: 'request-invite' })}
            className="font-archivo text-ink bg-volt hover:bg-volt-deep active:scale-95 transition-all px-5 py-2 text-xs uppercase tracking-widest ml-1"
            style={{ borderRadius: 8, letterSpacing: '0.12em' }}
          >
            Request Invite
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center text-paper/70 hover:text-paper transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{ background: 'none', border: '1px solid #2a3318', cursor: 'pointer', borderRadius: 8 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            {menuOpen ? (
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <>
                <line x1="2" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="2" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden flex flex-col gap-1 p-4"
          style={{ borderTop: '1px solid #1e2a10', backgroundColor: '#0e1207' }}
        >
          {links.map((link) => (
            <button
              key={link.label}
              onClick={() => { navigate(link.target); setMenuOpen(false) }}
              className={`text-left font-inter text-sm px-4 py-3 rounded-lg transition-colors ${
                isActive(link.target) ? 'text-volt bg-volt/8' : 'text-paper/60 hover:text-paper hover:bg-paper/5'
              }`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { navigate({ name: 'request-invite' }); setMenuOpen(false) }}
            className="font-archivo text-ink bg-volt px-5 py-3 text-xs uppercase tracking-widest text-center mt-2 active:scale-95 transition-all"
            style={{ borderRadius: 8, letterSpacing: '0.12em' }}
          >
            Request Invite
          </button>
        </div>
      )}
    </nav>
  )
}
