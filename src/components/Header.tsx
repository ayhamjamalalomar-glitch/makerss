import { useEffect, useRef, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { useAuth } from '../lib/auth'
import { t, useLang } from '../lib/i18n'
import { displayName } from '../lib/data'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardCheck, Clapperboard, Inbox, Languages, LogOut, Megaphone, MessageCircle, Monitor, Moon, PenLine, Settings, ShieldCheck, Sun, UserRound } from 'lucide-react'
import { useThemeMode, type ThemeMode } from '../lib/theme'
import Logo from './Logo'
import NotificationBell from './NotificationBell'
import { useHasDarkHero } from '../lib/hero'
import { Avatar } from './mk'
import { useIsWriter } from '../lib/writings'

type MenuIcon = typeof UserRound

function AccountMenu() {
  const { profile, signOut } = useAuth()
  const { lang, setLang } = useLang()
  const { go } = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useThemeMode()
  const ref = useRef<HTMLDivElement>(null)
  const writer = useIsWriter()
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [open])
  if (!profile) return null
  const staff = profile.role === 'admin' || profile.role === 'reviewer'
  const approved = profile.status === 'approved'
  const ar = lang === 'ar'

  const row = 'flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-start transition-colors hover:bg-[color:var(--c-surface-alt)]'
  const Icon = ({ I }: { I: MenuIcon }) => <I size={18} strokeWidth={1.6} className="shrink-0" style={{ color: 'var(--c-muted)' }} aria-hidden="true" />
  const item = (to: string, I: MenuIcon, label: string) => (
    <Link to={to} onClick={() => setOpen(false)} className={row} style={{ color: 'var(--c-text)' }}>
      <Icon I={I} /><span className="truncate">{label}</span>
    </Link>
  )
  const sep = <div className="my-1.5" style={{ borderTop: '1px solid var(--c-border)' }} />
  const modes: [ThemeMode, MenuIcon, string][] = [['light', Sun, t('فاتح', 'Light')], ['system', Monitor, t('حسب الجهاز', 'System')], ['dark', Moon, t('داكن', 'Dark')]]

  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen(!open)} aria-label={t('حسابي', 'My account')} aria-expanded={open} className="rounded-full p-0 cursor-pointer" style={{ background: 'none', border: '2px solid ' + (approved ? 'rgba(var(--c-accent-rgb),0.6)' : 'var(--c-border-mid)') }}>
        <Avatar url={profile.avatar_url} name={profile.full_name} size={32} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute end-0 mt-2 w-[290px] rounded-2xl overflow-hidden py-1.5"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: '0 20px 50px var(--c-shadow)', zIndex: 100, transformOrigin: ar ? 'top left' : 'top right' }}
          >
            <div className="px-4 pt-2.5 pb-3">
              <div className="text-[15px] font-bold truncate">{displayName(profile)}</div>
              <div className="text-[12.5px] truncate mt-0.5" style={{ color: 'var(--c-muted)' }} dir="ltr">{profile.email}</div>
            </div>
            {sep}
            {approved && profile.username && item(`/${profile.username}`, UserRound, t('صفحتي', 'My page'))}
            {item('/me', Settings, t('الحساب والملف الشخصي', 'Account and profile'))}
            {!approved && item('/me/status', ClipboardCheck, t('حالة الطلب', 'Application status'))}

            <div className="flex items-center gap-3 px-4 py-2">
              <Icon I={mode === 'dark' ? Moon : mode === 'system' ? Monitor : Sun} />
              <span className="text-[14px] flex-1" style={{ color: 'var(--c-text)' }}>{t('المظهر', 'Appearance')}</span>
              <div className="flex items-center rounded-full p-[3px]" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)' }} role="radiogroup" aria-label={t('المظهر', 'Appearance')}>
                {modes.map(([m, I, label]) => {
                  const on = mode === m
                  return (
                    <button key={m} type="button" role="radio" aria-checked={on} title={label} aria-label={label} onClick={() => setMode(m)} className="relative flex items-center justify-center rounded-full cursor-pointer" style={{ width: 32, height: 28, background: 'none', border: 'none', color: on ? 'var(--c-text)' : 'var(--c-muted)' }}>
                      {on && <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-full" style={{ background: 'var(--c-surface)', boxShadow: '0 1px 4px var(--c-shadow)' }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                      <I size={15} strokeWidth={1.7} className="relative" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </div>
            <button type="button" onClick={() => setLang(ar ? 'en' : 'ar')} className={`${row} cursor-pointer`} style={{ background: 'none', border: 'none', color: 'var(--c-text)' }}>
              <Icon I={Languages} />
              <span className="flex-1">{ar ? 'English' : 'العربية'}</span>
            </button>

            {approved && sep}
            {approved && item('/projects/new', Clapperboard, t('أضف مشروعاً', 'Add a project'))}
            {approved && item('/opportunities/new', Megaphone, t('انشر فرصة', 'Post an opportunity'))}
            {writer && item('/writing/new', PenLine, t('اكتب', 'Write'))}

            {sep}
            {item('/inbox', Inbox, t('الوارد', 'Inbox'))}
            {approved && item('/messages', MessageCircle, t('الرسائل', 'Messages'))}
            {staff && item('/admin', ShieldCheck, t('لوحة الإدارة', 'Admin'))}

            {sep}
            <button onClick={async () => { setOpen(false); await signOut(); go('/') }} className={`${row} cursor-pointer`} style={{ background: 'none', border: 'none', color: '#E5484D' }}>
              <LogOut size={18} strokeWidth={1.6} className="shrink-0 rtl:-scale-x-100" aria-hidden="true" />
              <span>{t('تسجيل الخروج', 'Sign out')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
        {!loading && !session && (
        <button
          type="button"
          onClick={() => setLang(ar ? 'en' : 'ar')}
          className="flex items-center justify-center font-mono font-semibold shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          style={{ background: 'transparent', border: `1px solid ${clear ? 'rgba(var(--h-ink-rgb),0.18)' : 'var(--c-border-mid)'}`, borderRadius: 999, fontSize: 11, color: clear ? 'var(--h-ink)' : 'var(--c-muted)', height: 38, minWidth: 38, padding: '0 10px' }}
          aria-label={ar ? 'English' : 'العربية'}
        >
          {ar ? 'EN' : 'ع'}
        </button>
        )}
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
