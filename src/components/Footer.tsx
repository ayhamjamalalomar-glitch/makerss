import { useEffect, useState, type CSSProperties } from 'react'
import Link from '../lib/router'
import { isRtl, t } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import Logo from './Logo'
import { isLightNow, useThemeMode } from '../lib/theme'

const iconBtn: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 999,
  border: '1px solid var(--c-border)', background: 'none', cursor: 'pointer', color: 'var(--c-muted)', flexShrink: 0,
}

export default function Footer() {
  const { session } = useAuth()
  const [showTop, setShowTop] = useState(false)
  const [mode, setMode] = useThemeMode()
  const isLight = mode === 'light' || (mode === 'system' && isLightNow())

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = () => setMode(isLight ? 'dark' : 'light')

  const credits: [string, { label: string; to: string }[]][] = [
    [t('المنصة', 'Platform'), [{ label: t('الرئيسية', 'Home'), to: '/' }, { label: t('الصنّاع', 'Makers'), to: '/makers' }, { label: t('صنّاع المحتوى', 'Creators'), to: '/makers?type=creator' }, { label: t('المشاريع', 'Projects'), to: '/projects' }, { label: t('كتابات', 'Writing'), to: '/writing' }]],
    [t('العمل', 'Work'), [{ label: t('الفرص المفتوحة', 'Open calls'), to: '/opportunities' }, session ? { label: t('حسابي', 'My account'), to: '/me' } : { label: t('انضم إلى Makers', 'Join Makers'), to: '/join' }]],
  ]

  // Closing credits: the film's last frame, laid out in columns.
  return (
    <footer className="relative overflow-hidden" style={{ background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)' }}>
      <div aria-hidden="true" className="pointer-events-none select-none font-archivo absolute inset-x-0 -bottom-[0.18em] text-center leading-none" dir="ltr" style={{ fontSize: 'clamp(90px, 21vw, 300px)', color: 'transparent', WebkitTextStroke: '1px var(--c-border-mid)', opacity: 0.7 }}>MAKERS</div>
      <div className="relative max-w-[1120px] mx-auto px-6 sm:px-10 pt-16 pb-40 md:pb-56">
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-12 md:gap-20">
          <div className="flex flex-col gap-6">
            <Logo size="md" align={isRtl() ? 'right' : 'left'} />
          </div>
          <div className="grid grid-cols-2 gap-8">
            {credits.map(([role, links]) => (
              <div key={role} className="flex flex-col gap-3">
                <span className="text-[12px] pb-2" style={{ color: 'var(--c-muted-2)', borderBottom: '1px solid var(--c-border)' }}>{role}</span>
                {links.map((l) => <Link key={l.to} to={l.to} className="text-[14px] font-medium transition-colors hover:text-[color:var(--c-accent)]" style={{ color: 'var(--c-text-2)' }}>{l.label}</Link>)}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-6 flex flex-wrap items-center justify-between gap-4" style={{ borderTop: '1px dashed var(--c-border)' }}>
          <span className="text-[12px]" style={{ color: 'var(--c-muted-2)' }}>© {new Date().getFullYear()} Makers, by intime</span>
          <div className="flex items-center gap-3">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={t('للأعلى', 'Back to top')} style={{ ...iconBtn, opacity: showTop ? 1 : 0.35, pointerEvents: showTop ? 'auto' : 'none' }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button onClick={toggleTheme} aria-label={isLight ? t('الوضع الداكن', 'Dark mode') : t('الوضع الفاتح', 'Light mode')} style={{ ...iconBtn, color: isLight ? 'var(--c-accent)' : 'var(--c-muted)' }}>
              {isLight ? (
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
