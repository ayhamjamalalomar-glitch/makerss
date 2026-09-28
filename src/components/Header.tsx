import { useEffect, useRef, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { useAuth } from '../lib/auth'
import { t, useLang } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { CARD_COLUMNS, displayName, posterOf, type MemberCard, type Project } from '../lib/data'
import { useSpecialties, roleLine } from '../lib/specialties'
import Logo from './Logo'
import { Avatar } from './mk'

type Result = { kind: 'maker'; id: string; to: string; name: string; sub: string; photo: string | null } | { kind: 'title'; id: string; to: string; name: string; sub: string; photo: string | null }

function useSearch(query: string) {
  const specialties = useSpecialties()
  const [results, setResults] = useState<Result[]>([])
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return setResults([])
    const safe = q.replace(/[%_,()*]/g, ' ')
    let alive = true
    const timer = setTimeout(async () => {
      const specIds = specialties.filter((s) => `${s.name_en} ${s.name_ar || ''}`.toLowerCase().includes(q.toLowerCase())).map((s) => s.id)
      const or = [`full_name.ilike.%${safe}%`, `name_ar.ilike.%${safe}%`, `username.ilike.%${safe}%`]
      if (specIds.length) or.push(`specialty_ids.ov.{${specIds.join(',')}}`)
      const [m, w] = await Promise.all([
        supabase.from('profiles').select(CARD_COLUMNS).eq('status', 'approved').or(or.join(',')).limit(4),
        supabase.from('works').select('id, title, year, thumb_url, thumbnail_url, url').ilike('title', `%${safe}%`).limit(3),
      ])
      if (!alive) return
      const makers = ((m.data as unknown as MemberCard[]) || []).map((x) => ({
        kind: 'maker' as const, id: x.id, to: `/${x.username}`, name: displayName(x), sub: roleLine(specialties, x.specialty_ids, x.other_specialty), photo: x.avatar_url,
      }))
      const titles = ((w.data as unknown as Project[]) || []).map((x) => ({
        kind: 'title' as const, id: x.id, to: `/projects/${x.id}`, name: x.title, sub: x.year ? String(x.year) : '', photo: posterOf(x),
      }))
      setResults([...makers, ...titles])
    }, 220)
    return () => { alive = false; clearTimeout(timer) }
  }, [query, specialties])
  return results
}

function SearchBox({ onDone, autoFocus }: { onDone?: () => void; autoFocus?: boolean }) {
  const { go } = useRouter()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const results = useSearch(query)
  const pick = (r: Result) => { setQuery(''); onDone?.(); go(r.to) }
  return (
    <div className="relative w-full" style={{ maxWidth: 440 }}>
      <div className="flex items-center gap-2.5 rounded-full px-4" style={{ height: 38, background: 'var(--c-surface-alt)', border: `1px solid ${focused ? 'rgba(232,93,4,0.5)' : 'var(--c-border-mid)'}`, boxShadow: focused ? '0 0 0 3px rgba(232,93,4,0.12)' : 'none', transition: 'border-color .15s' }}>
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none" style={{ color: focused ? '#E85D04' : 'var(--c-muted)', flexShrink: 0 }}>
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) pick(results[0]); if (e.key === 'Escape') { setQuery(''); onDone?.() } }}
          placeholder={t('ابحث عن صنّاع، مشاريع، تخصصات…', 'Search makers, projects, specialties…')}
          aria-label={t('بحث', 'Search')}
          className="flex-1 min-w-0"
          style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--c-text)', padding: 0 }}
        />
      </div>
      {focused && query.trim().length > 1 && (
        <div className="absolute start-0 end-0 rounded-xl overflow-hidden" style={{ top: 'calc(100% + 6px)', background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: '0 12px 32px var(--c-shadow)', zIndex: 100 }}>
          {results.length === 0 ? (
            <div className="px-4 py-3 text-xs" style={{ color: 'var(--c-muted)' }}>{t('لا نتائج', 'No results')}</div>
          ) : results.map((r, i) => (
            <button
              key={r.kind + r.id}
              onMouseDown={() => pick(r)}
              className="flex items-center gap-2.5 w-full text-start hover:bg-white/5 transition-colors"
              style={{ padding: '10px 14px', background: 'none', border: 'none', borderBottom: i < results.length - 1 ? '1px solid var(--c-border)' : 'none', cursor: 'pointer', color: 'var(--c-text)' }}
            >
              {r.kind === 'maker' ? <Avatar url={r.photo} name={r.name} size={32} /> : (
                <span className="shrink-0 overflow-hidden rounded-md" style={{ width: 32, height: 32, background: 'var(--c-surface-alt)' }}>
                  {r.photo && <img src={r.photo} alt="" className="w-full h-full object-cover" />}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{r.name}</span>
                <span className="block truncate text-[11px]" style={{ color: 'var(--c-muted)' }}>{r.kind === 'maker' ? t('صانع', 'Maker') : t('مشروع', 'Project')}{r.sub ? ` · ${r.sub}` : ''}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AccountMenu() {
  const { profile, signOut } = useAuth()
  const { go } = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
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
      <button onClick={() => setOpen(!open)} aria-label={t('حسابي', 'My account')} aria-expanded={open} className="rounded-full p-0 cursor-pointer" style={{ background: 'none', border: '2px solid ' + (approved ? 'rgba(232,93,4,0.6)' : 'var(--c-border-mid)') }}>
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

export default function Header() {
  const { lang, setLang } = useLang()
  const { session, loading } = useAuth()
  const [mobileSearch, setMobileSearch] = useState(false)
  const ar = lang === 'ar'

  return (
    <header className="fixed top-0 left-0 right-0 z-40" style={{ height: 56, background: 'var(--c-overlay)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--c-border)' }}>
      <div className="max-w-[1120px] mx-auto w-full h-full flex items-center px-4 sm:px-8" style={{ gap: 10 }}>
      {mobileSearch ? (
        <div className="flex sm:hidden items-center gap-2 w-full">
          <SearchBox autoFocus onDone={() => setMobileSearch(false)} />
          <button onClick={() => setMobileSearch(false)} className="text-[13px] shrink-0 cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--c-muted)' }}>{t('إلغاء', 'Cancel')}</button>
        </div>
      ) : (
        <>
          <Logo size="sm" />
          <div className="hidden sm:flex" style={{ flex: 1, justifyContent: 'center' }}><SearchBox /></div>
          <div className="flex sm:hidden" style={{ flex: 1 }} />
          <button className="flex sm:hidden items-center justify-center rounded-full shrink-0 cursor-pointer" style={{ width: 36, height: 36, background: 'var(--c-surface-alt)', border: '1px solid var(--c-border-mid)' }} onClick={() => setMobileSearch(true)} aria-label={t('بحث', 'Search')}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--c-muted)' }}><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
          <button
            onClick={() => setLang(ar ? 'en' : 'ar')}
            className="flex items-center justify-center font-bold shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border-mid)', borderRadius: 999, fontSize: 11, color: 'var(--c-muted)', height: 32, minWidth: 36, padding: '0 10px', letterSpacing: '0.04em' }}
            aria-label={ar ? 'English' : 'العربية'}
          >
            {ar ? 'EN' : 'ع'}
          </button>
          {!loading && (session ? <AccountMenu /> : (
            <>
              <Link to="/login" className="hidden sm:inline-flex items-center text-[12px] font-semibold px-3 py-2 rounded-full shrink-0 hover:opacity-80" style={{ color: 'var(--c-text)' }}>{t('دخول', 'Sign in')}</Link>
              <Link to="/join" className="flex items-center gap-2 font-semibold px-3 sm:px-4 py-2 rounded-full shrink-0 hover:opacity-90 transition-opacity" style={{ background: '#E85D04', color: '#fff', fontSize: 12 }}>
                {t('انضم', 'Join')}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="rtl:-scale-x-100"><path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </>
          ))}
        </>
      )}
      </div>
    </header>
  )
}
