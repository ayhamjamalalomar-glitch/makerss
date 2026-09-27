import { useEffect, useState, type CSSProperties } from 'react'
import Link from '../lib/router'
import { t } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import Logo from './Logo'

const THEME_KEY = 'mk-theme'

function applyTheme(light: boolean) {
  document.documentElement.dataset.theme = light ? 'light' : 'dark'
}

// Apply the saved theme as early as possible.
try { if (localStorage.getItem(THEME_KEY) === 'light') applyTheme(true) } catch { /* storage blocked */ }

const iconBtn: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 999,
  border: '1px solid var(--c-border)', background: 'none', cursor: 'pointer', color: 'var(--c-muted)', flexShrink: 0,
}

export default function Footer() {
  const { session } = useAuth()
  const [showTop, setShowTop] = useState(false)
  const [isLight, setIsLight] = useState(() => document.documentElement.dataset.theme === 'light')

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = () => {
    const next = !isLight
    setIsLight(next)
    applyTheme(next)
    try { localStorage.setItem(THEME_KEY, next ? 'light' : 'dark') } catch { /* ignore */ }
  }

  const columns = [
    { title: t('المنصة', 'Platform'), items: [{ label: t('الرئيسية', 'Home'), to: '/' }, { label: t('المشاريع', 'Projects'), to: '/projects' }, { label: t('الصنّاع', 'Makers'), to: '/makers' }] },
    {
      title: t('العمل', 'Work'),
      items: [
        { label: t('الفرص المفتوحة', 'Open Calls'), to: '/opportunities' },
        session ? { label: t('حسابي', 'My account'), to: '/me' } : { label: t('انضم إلى Makers', 'Join Makers'), to: '/join' },
      ],
    },
  ]

  return (
    <footer style={{ background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start md:items-center px-6 sm:px-10 pt-12 pb-10">
        <Logo />
        <p style={{ fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.8, maxWidth: 560, margin: 0 }}>
          {t(
            'كل صورة رأيتها صنعها أحد. Makers دليل مواهب الإنتاج في العالم العربي، مساحة تتعرّف فيها على من يقف خلف الصورة، وتصل إليه مباشرة. كل ملف فيه يراجعه فريقنا بعناية.',
            'Every image you have ever seen was made by someone. Makers is the talent directory for production across the Arab world, a place to meet the people behind the image and reach them directly. Every profile is carefully reviewed by our team.',
          )}
        </p>
      </div>

      <div style={{ borderTop: '1px dashed var(--c-border)' }} />

      <div className="max-w-7xl mx-auto grid grid-cols-2 md:flex md:flex-row gap-8 md:gap-20 px-6 sm:px-10 py-9">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--c-muted-2)' }}>{col.title}</span>
            <ul className="flex flex-col gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {col.items.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:opacity-100 transition-colors" style={{ fontSize: 13, color: 'var(--c-muted)' }}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px dashed var(--c-border)' }} />

      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3 px-6 sm:px-10 py-7">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={t('للأعلى', 'Back to top')} style={{ ...iconBtn, opacity: showTop ? 1 : 0.35, pointerEvents: showTop ? 'auto' : 'none' }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button onClick={toggleTheme} aria-label={isLight ? t('الوضع الداكن', 'Dark mode') : t('الوضع الفاتح', 'Light mode')} style={{ ...iconBtn, color: isLight ? '#E85D04' : 'var(--c-muted)' }}>
          {isLight ? (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto text-center px-6 sm:px-10 pb-9" style={{ fontSize: 11, color: 'var(--c-muted-2)' }}>
        © {new Date().getFullYear()} Makers, by intime
      </div>
    </footer>
  )
}
