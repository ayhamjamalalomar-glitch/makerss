import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from '../lib/router'
import { useAuth } from '../lib/auth'
import { t, useLang } from '../lib/i18n'
import { arNorm } from '../lib/constants'
import { displayName, posterOf, searchSite } from '../lib/data'
import { memberLine, useSpecialties } from '../lib/specialties'
import { Avatar, useDialog } from './mk'

type Item = { key: string; kind: 'page' | 'maker' | 'project' | 'action'; label: string; sub?: string; photo?: string | null; to?: string; run?: () => void }

const RECENT_KEY = 'mk-recent'
const readRecent = (): Item[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as Item[] } catch { return [] }
}
const saveRecent = (item: Item) => {
  if (item.kind !== 'maker' && item.kind !== 'project') return
  try {
    const list = [item, ...readRecent().filter((x) => x.key !== item.key)].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch { /* storage blocked */ }
}

/** Open from anywhere with Ctrl+K (⌘K on Mac) or "/": search makers and projects, jump to any page. */
export default function CommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o) }
      else if (e.key === '/' && !typing) { e.preventDefault(); setOpen(true) }
    }
    const onOpen = () => setOpen(true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('mk-open-palette', onOpen)
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('mk-open-palette', onOpen) }
  }, [])

  return <AnimatePresence>{open && <Palette onClose={() => setOpen(false)} />}</AnimatePresence>
}

function Palette({ onClose }: { onClose: () => void }) {
  useDialog(onClose)
  const { go } = useRouter()
  const { profile } = useAuth()
  const { lang, setLang } = useLang()
  const specialties = useSpecialties()
  const [q, setQ] = useState('')
  const [found, setFound] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const approved = profile?.status === 'approved'
  const staff = profile?.role === 'admin' || profile?.role === 'reviewer'
  const pages: Item[] = useMemo(() => [
    { key: 'p-home', kind: 'page', label: t('الرئيسية', 'Home'), to: '/' },
    { key: 'p-makers', kind: 'page', label: t('الصنّاع', 'Makers'), to: '/makers' },
    { key: 'p-creators', kind: 'page', label: t('صنّاع المحتوى', 'Content creators'), to: '/makers?type=creator' },
    { key: 'p-projects', kind: 'page', label: t('المشاريع', 'Projects'), to: '/projects' },
    { key: 'p-calls', kind: 'page', label: t('الفرص المفتوحة', 'Open calls'), to: '/opportunities' },
    ...(profile ? [
      { key: 'p-me', kind: 'page' as const, label: t('صفحتي', 'My page'), to: '/me' },
      { key: 'p-inbox', kind: 'page' as const, label: t('الوارد', 'Inbox'), to: '/inbox' },
    ] : [{ key: 'p-join', kind: 'page' as const, label: t('انضم إلى Makers', 'Join Makers'), to: '/join' }, { key: 'p-login', kind: 'page' as const, label: t('دخول', 'Sign in'), to: '/login' }]),
    ...(approved ? [
      { key: 'p-messages', kind: 'page' as const, label: t('الرسائل', 'Messages'), to: '/messages' },
      { key: 'p-new-project', kind: 'page' as const, label: t('أضف مشروعاً', 'Add a project'), to: '/projects/new' },
      { key: 'p-new-call', kind: 'page' as const, label: t('انشر فرصة', 'Post an opportunity'), to: '/opportunities/new' },
    ] : []),
    ...(staff ? [{ key: 'p-admin', kind: 'page' as const, label: t('لوحة الإدارة', 'Admin'), to: '/admin' }] : []),
    { key: 'a-lang', kind: 'action', label: lang === 'ar' ? 'English' : 'العربية', sub: t('تبديل اللغة', 'Switch language'), run: () => setLang(lang === 'ar' ? 'en' : 'ar') },
  ], [profile, approved, staff, lang, setLang])

  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) { setFound([]); setLoading(false); return }
    setLoading(true)
    let alive = true
    const timer = setTimeout(async () => {
      const r = await searchSite(query, { makers: 5, projects: 4 })
      if (!alive) return
      setFound([
        ...r.makers.map((m) => ({ key: `m-${m.id}`, kind: 'maker' as const, label: displayName(m), sub: memberLine(specialties, m), photo: m.avatar_url, to: `/${m.username}` })),
        ...r.projects.map((p) => ({ key: `w-${p.id}`, kind: 'project' as const, label: p.title, sub: p.year ? String(p.year) : '', photo: posterOf(p), to: `/projects/${p.id}` })),
      ])
      setLoading(false)
    }, 180)
    return () => { alive = false; clearTimeout(timer) }
  }, [q, specialties])

  const query = arNorm(q.trim())
  const matchedPages = query ? pages.filter((p) => arNorm(`${p.label} ${p.sub || ''}`).includes(query)) : pages
  const recent = query ? [] : readRecent()
  const sections: [string, Item[]][] = ([
    [t('آخر ما فتحته', 'Recently opened'), recent],
    [t('صنّاع ومشاريع', 'Makers & projects'), found],
    [t('انتقل إلى', 'Go to'), matchedPages],
  ] as [string, Item[]][]).filter(([, items]) => items.length)
  const flat = sections.flatMap(([, items]) => items)

  useEffect(() => { setActive(0) }, [q, found.length])
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const pick = (item: Item | undefined) => {
    if (!item) return
    saveRecent(item)
    onClose()
    if (item.run) item.run()
    else if (item.to) go(item.to)
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(flat.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); pick(flat[active]) }
  }

  let idx = -1
  return (
    <motion.div className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[10vh]" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t('بحث سريع', 'Quick search')}
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="w-full max-w-[600px] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border-mid)', boxShadow: '0 30px 80px rgba(0,0,0,0.55)', maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4" style={{ height: 56, borderBottom: '1px solid var(--c-border)' }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--c-accent)', flexShrink: 0 }} aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" /><path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder={t('ابحث عن صانع، مشروع، أو صفحة…', 'Search a maker, a project or a page…')}
            aria-label={t('بحث سريع', 'Quick search')}
            role="combobox"
            aria-expanded="true"
            aria-controls="mk-palette-list"
            aria-activedescendant={flat[active] ? `mk-pal-${active}` : undefined}
            className="flex-1 min-w-0"
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 16, color: 'var(--c-text)', padding: 0 }}
          />
          {loading && <span className="mk-spin w-4 h-4 rounded-full shrink-0" style={{ border: '2px solid var(--c-border-mid)', borderTopColor: 'var(--c-accent)' }} />}
          <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded" style={{ border: '1px solid var(--c-border-mid)', color: 'var(--c-muted)' }}>Esc</kbd>
        </div>
        <div ref={listRef} id="mk-palette-list" role="listbox" className="overflow-y-auto py-2">
          {sections.map(([title, items]) => (
            <div key={title} className="flex flex-col">
              <span className="px-4 pt-2 pb-1 text-[11px] font-semibold" style={{ color: 'var(--c-muted-2)' }}>{title}</span>
              {items.map((it) => {
                idx++
                const i = idx
                const on = i === active
                return (
                  <button
                    key={`${title}-${it.key}`}
                    id={`mk-pal-${i}`}
                    data-idx={i}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(it)}
                    className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-start cursor-pointer"
                    style={{ background: on ? 'rgba(var(--c-accent-rgb),0.12)' : 'transparent', border: 'none', color: 'var(--c-text)' }}
                  >
                    {it.kind === 'maker' ? <Avatar url={it.photo} name={it.label} size={32} /> : it.kind === 'project' ? (
                      <span className="shrink-0 overflow-hidden rounded-md" style={{ width: 32, height: 32, background: 'var(--c-surface-alt)' }}>{it.photo && <img src={it.photo} alt="" className="w-full h-full object-cover" />}</span>
                    ) : (
                      <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--c-surface-alt)', color: on ? 'var(--c-accent)' : 'var(--c-muted)' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="rtl:-scale-x-100" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{it.label}</span>
                      {it.sub && <span className="block truncate text-xs" style={{ color: 'var(--c-muted)' }}>{it.sub}</span>}
                    </span>
                    {on && <span className="text-[11px] shrink-0" style={{ color: 'var(--c-muted)' }}>↵</span>}
                  </button>
                )
              })}
            </div>
          ))}
          {q.trim().length >= 2 && !loading && flat.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--c-muted)' }}>{t('لا نتائج. جرّب اسماً آخر أو تخصصاً.', 'No results. Try another name or a specialty.')}</div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-[11px]" style={{ borderTop: '1px solid var(--c-border)', color: 'var(--c-muted-2)' }}>
          <span>↑ ↓ {t('للتنقل', 'to move')}</span>
          <span>↵ {t('للفتح', 'to open')}</span>
          <span className="ms-auto" dir="ltr">Ctrl K</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
