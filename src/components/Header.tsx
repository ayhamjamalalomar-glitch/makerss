import { useEffect, useRef, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { useAuth } from '../lib/auth'
import { t, useLang } from '../lib/i18n'
import { displayName } from '../lib/data'
import { motion } from 'framer-motion'
import Logo from './Logo'
import NotificationBell from './NotificationBell'
import { useHasDarkHero } from '../lib/hero'
import { Avatar } from './mk'
import { useIsWriter } from '../lib/writings'

function AccountMenu() {
  const { profile, signOut } = useAuth()
  const { go } = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const writer = useIsWriter()
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  if (!profile) return null
  const staff = profile.role === 'admin' || profile.role === 'reviewer'
  const approved = profile.status === 'approved'
  const item = (to: string, label: string) => (
    <Link to={to} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-[13px] hover:bg-white/5 transition-colors" style={{ color: 'var(--c-text)' }}>{label}</Link>
  )
  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen(!open)} aria-label={t('حسابي', 'My account')} aria-expanded={open} className="rounded-full p-0 cursor-pointer" style={{ background: 'none', border: '2px solid ' + (approved ? 'rgba(var(--c-accent-rgb),0.6)' : 'var(--c-border-mid)') }}>
        <Avatar url={profile.avatar_url} name={profile.full_name} size={32} />
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-60 rounded-xl overflow-hidden py-1.5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: '0 16px 40px var(--c-shadow)', zIndex: 100 }}>
          <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--c-border)' }}>
            <div className="text-[13px] font-bold truncate">{displayName(profile)}</div>
            <div className="text-[11px] truncate" style={{ color: 'var(--c-muted)' }}>{profile.email}</div>
          </div>
          {approved && profile.username && item(`/${profile.username}`, t('صفحتي', 'My page'))}
          {item('/me', t('تعديل الملف الشخصي', 'Edit profile'))}
          {!approved && item('/me/status', t('حالة الطلب', 'Application status'))}
          {approved && item('/projects/new', t('أضف مشروعاً', 'Add a project'))}
          {approved && item('/opportunities/new', t('انشر فرصة', 'Post an opportunity'))}
          {writer && item('/writing/new', t('اكتب', 'Write'))}
          {item('/inbox', t('الوارد', 'Inbox'))}
          {approved && item('/messages', t('الرسائل', 'Messages'))}
          {staff && item('/admin', t('لوحة الإدارة', 'Admin'))}
          <button onClick={async () => { setOpen(false); await signOut(); go('/') }} className="block w-full text-start px-4 py-2.5 text-[13px] hover:bg-white/5 cursor-pointer" style={{ background: 'none', border: 'none', borderTop: '1px solid var(--c-border)', color: '#F87171' }}>
            {t('تسجيل الخروج', 'Sign out')}
          </button>
        </div>
      )}
    </div>
  )
}

const NAV = [
  { to: '/makers', match: (p: string, q: string) => p === '/makers' && !q.includes('type=creator'), ar: 'الصنّاع', en: 'Makers' },
  { to: '/makers?type=creator', match: (p: string, q: string) => p === '/makers' && q.includes('type=creator'), ar: 'صنّاع المحتوى', en: 'Creators' },
  { to: '/projects', match: (p: string) => p.startsWith('/projects'), ar: 'المشاريع', en: 'Projects' },
  { to: '/opportunities', match: (p: string) => p.startsWith('/opportunities'), ar: 'الفرص', en: 'Open calls' },
  { to: '/writing', match: (p: string) => p.startsWith('/writing'), ar: 'كتابات', en: 'Writing' },
]

const openPalette = () => window.dispatchEvent(new Event('mk-open-palette'))

export default function Header() {
  const { lang, setLang } = useLang()
  const { session, loading } = useAuth()
  const { path, search } = useRouter()
  const ar = lang === 'ar'
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [path])

  // Over a dark hero the bar starts clear, like titles over a film frame.
  const hasHero = useHasDarkHero()
  const clear = hasHero && !scrolled
  const query = search

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 transition-colors duration-300"
      style={{
        height: 64,
        background: clear ? 'linear-gradient(to bottom, rgba(var(--h-veil-rgb),0.75), rgba(var(--h-veil-rgb),0))' : 'var(--c-overlay)',
        backdropFilter: clear ? 'none' : 'blur(14px)',
        WebkitBackdropFilter: clear ? 'none' : 'blur(14px)',
        borderBottom: `1px solid ${clear ? 'transparent' : 'var(--c-border)'}`,
      }}
    >
      <div className="max-w-[1120px] mx-auto w-full h-full flex items-center px-4 sm:px-8 gap-2.5">
        <Logo size="sm" color={clear ? 'var(--h-ink)' : undefined} />

        <nav className="hidden md:flex items-center gap-1 ms-6" aria-label={t('التنقل الرئيسي', 'Main navigation')}>
          {NAV.map((n) => {
            const on = n.match(path, query)
            return (
              <Link key={n.to} to={n.to} className="relative px-3 py-2 text-[13px] font-medium transition-colors" style={{ color: on ? 'var(--c-text)' : clear ? 'rgba(var(--h-ink-rgb),0.75)' : 'var(--c-muted)' }}>
                {t(n.ar, n.en)}
                {on && <motion.span layoutId="nav-underline" className="absolute start-3 end-3 -bottom-0.5 h-[2px] rounded-full" style={{ background: 'var(--c-accent)' }} />}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        <button
          type="button"
          onClick={openPalette}
          className="hidden sm:flex items-center gap-2.5 rounded-full px-3.5 cursor-pointer transition-colors"
          style={{ height: 38, minWidth: 220, background: clear ? 'rgba(var(--h-ink-rgb),0.08)' : 'var(--c-surface-alt)', border: `1px solid ${clear ? 'rgba(var(--h-ink-rgb),0.18)' : 'var(--c-border-mid)'}`, color: clear ? 'rgba(var(--h-ink-rgb),0.7)' : 'var(--c-muted)' }}
          aria-label={t('بحث', 'Search')}
        >
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span className="text-[12.5px] flex-1 text-start">{t('ابحث عن صانع أو مشروع', 'Search makers or projects')}</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded" dir="ltr" style={{ border: '1px solid currentColor', opacity: 0.7 }}>Ctrl K</kbd>
        </button>
        <button type="button" className="flex sm:hidden items-center justify-center rounded-full shrink-0 cursor-pointer" style={{ width: 38, height: 38, background: clear ? 'rgba(var(--h-ink-rgb),0.08)' : 'var(--c-surface-alt)', border: `1px solid ${clear ? 'rgba(var(--h-ink-rgb),0.18)' : 'var(--c-border-mid)'}`, color: clear ? 'var(--h-ink)' : 'var(--c-muted)' }} onClick={openPalette} aria-label={t('بحث', 'Search')}>
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <button
          type="button"
          onClick={() => setLang(ar ? 'en' : 'ar')}
          className="flex items-center justify-center font-mono font-semibold shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          style={{ background: 'transparent', border: `1px solid ${clear ? 'rgba(var(--h-ink-rgb),0.18)' : 'var(--c-border-mid)'}`, borderRadius: 999, fontSize: 11, color: clear ? 'var(--h-ink)' : 'var(--c-muted)', height: 38, minWidth: 38, padding: '0 10px' }}
          aria-label={ar ? 'English' : 'العربية'}
        >
          {ar ? 'EN' : 'ع'}
        </button>
        {!loading && session && <NotificationBell userId={session.user.id} clear={clear} />}
        {!loading && (session ? <AccountMenu /> : (
          <>
            <Link to="/login" className="hidden sm:inline-flex items-center text-[13px] font-medium px-3 py-2 rounded-full shrink-0 hover:opacity-80" style={{ color: clear ? 'var(--h-ink)' : 'var(--c-text)' }}>{t('دخول', 'Sign in')}</Link>
            <Link to="/join" className="flex items-center gap-2 font-semibold px-4 rounded-full shrink-0 hover:brightness-110 transition" style={{ height: 38, background: 'var(--c-accent)', color: 'var(--c-on-accent)', fontSize: 13 }}>
              {t('انضم', 'Join')}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="rtl:-scale-x-100" aria-hidden="true"><path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </>
        ))}
      </div>
      {/* reading progress, like a playhead on a timeline */}
      <span aria-hidden="true" className="absolute bottom-0 start-0 h-[2px] transition-[width] duration-150" style={{ width: `${progress * 100}%`, background: 'var(--c-accent)', opacity: scrolled ? 0.9 : 0 }} />
    </header>
  )
}
