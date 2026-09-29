import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from '../lib/router'
import { t, label, useLang } from '../lib/i18n'
import { CONTENT_TYPES, COUNTRIES, arNorm, cityLabel, contentLabel, listSep } from '../lib/constants'
import { useSpecialties, specName, memberLine, isCreator } from '../lib/specialties'
import { displayName, listMembers, totalFollowers, type MemberCard } from '../lib/data'
import { Skeleton, VerifiedBadge } from '../components/mk'
import { CastCard } from '../components/cine'

const selectStyle = { background: 'var(--c-surface)', border: '1px solid var(--c-border)', cursor: 'pointer', fontSize: 13, height: 42, paddingInline: '14px 32px', borderRadius: 12 } as const

function Caret() {
  return (
    <svg className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--c-muted-2)' }}>
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function MakersPage() {
  useLang()
  const specialties = useSpecialties()
  const [all, setAll] = useState<MemberCard[] | null>(null)
  // Every filter lives in the URL, so a filtered list can be shared or bookmarked.
  const [params] = useState(() => new URLSearchParams(window.location.search))
  const [search, setSearch] = useState(params.get('q') || '')
  const [specialty, setSpecialty] = useState<number | 'all'>(() => {
    const s = params.get('s')
    return s && /^\d+$/.test(s) ? Number(s) : 'all'
  })
  const [type, setType] = useState<'all' | 'maker' | 'creator'>(() => {
    const v = params.get('type')
    return v === 'maker' || v === 'creator' ? v : 'all'
  })
  const [content, setContent] = useState(params.get('c') || 'all')
  const [country, setCountry] = useState(params.get('country') || 'all')
  const [verifiedOnly, setVerifiedOnly] = useState(params.get('f') === '1')
  const [availableOnly, setAvailableOnly] = useState(params.get('available') === '1')
  const [sort, setSort] = useState<'default' | 'newest' | 'audience'>(() => {
    const v = params.get('sort')
    return v === 'newest' || v === 'audience' ? v : 'default'
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try { return localStorage.getItem('mk-makers-view') === 'list' ? 'list' : 'grid' } catch { return 'grid' }
  })

  useEffect(() => { listMembers().then(setAll) }, [])
  useEffect(() => { try { localStorage.setItem('mk-makers-view', viewMode) } catch { /* storage blocked */ } }, [viewMode])

  useEffect(() => {
    const u = new URLSearchParams()
    if (type !== 'all') u.set('type', type)
    if (search.trim()) u.set('q', search.trim())
    if (type !== 'creator' && specialty !== 'all') u.set('s', String(specialty))
    if (type === 'creator' && content !== 'all') u.set('c', content)
    if (country !== 'all') u.set('country', country)
    if (verifiedOnly) u.set('f', '1')
    if (availableOnly) u.set('available', '1')
    if (sort !== 'default') u.set('sort', sort)
    const qs = u.toString()
    const next = qs ? `/makers?${qs}` : '/makers'
    if (next !== window.location.pathname + window.location.search) window.history.replaceState(null, '', next)
  }, [type, search, specialty, content, country, verifiedOnly, availableOnly, sort])

  const filtered = useMemo(() => {
    const list = (all || []).filter((m) => {
      if (type === 'creator' && !isCreator(m)) return false
      if (type === 'maker' && isCreator(m)) return false
      if (type !== 'creator' && specialty !== 'all' && !(m.specialty_ids || []).includes(specialty)) return false
      if (type === 'creator' && content !== 'all' && !(m.content_types || []).includes(content)) return false
      if (country !== 'all' && m.country !== country) return false
      if (verifiedOnly && !m.is_founding) return false
      if (availableOnly && !m.available) return false
      if (search) {
        const q = arNorm(search.trim())
        const hay = arNorm([m.full_name, m.name_ar, m.username, m.city, cityLabel(m.city), label(COUNTRIES, m.country), m.country, memberLine(specialties, m)].join(' '))
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sort === 'newest') return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at))
    if (sort === 'audience') return [...list].sort((a, b) => totalFollowers(b) - totalFollowers(a))
    return list
  }, [all, search, type, specialty, content, country, verifiedOnly, availableOnly, sort, specialties])

  const pickType = (k: 'all' | 'maker' | 'creator') => {
    setType(k)
    setSpecialty('all')
    setContent('all')
  }
  const activeFilters = [search.trim(), specialty !== 'all', content !== 'all', country !== 'all', verifiedOnly, availableOnly].filter(Boolean).length
  const clearFilters = () => { setSearch(''); setSpecialty('all'); setContent('all'); setCountry('all'); setVerifiedOnly(false); setAvailableOnly(false) }

  // Side list: top specialties, or top content categories when browsing creators.
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of all || []) {
      if (type === 'creator') {
        if (isCreator(m)) for (const k of m.content_types || []) map.set(k, (map.get(k) || 0) + 1)
      } else if (type === 'all' || !isCreator(m)) {
        for (const id of m.specialty_ids || []) map.set(String(id), (map.get(String(id)) || 0) + 1)
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [all, type])

  const usedCountries = COUNTRIES.filter((c) => (all || []).some((m) => m.country === c.ar))

  return (
    <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-8">
      <div className="flex flex-col gap-2 mb-8 pt-4">
        <span className="font-mono text-[11px] tracking-[0.2em]" dir="ltr" style={{ color: 'var(--c-accent)', textAlign: 'start' }}>CASTING · {String(all?.length ?? 0).padStart(2, '0')}</span>
        <h1 className="font-display font-black m-0" style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{t('الصنّاع', 'Makers')}</h1>
        <p className="m-0 text-[15px] max-w-[560px]" style={{ color: 'var(--c-muted)', lineHeight: 1.8 }}>{t('اعثر على من يصنع الصورة: مخرجون، مصوّرون، مونتيرون، وصنّاع محتوى من كل العالم العربي.', 'Find the people who make the image: directors, cinematographers, editors and creators across the Arab world.')}</p>
      </div>

      <div className="relative mb-5">
        <svg className="absolute start-5 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--c-muted-2)' }}>
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" /><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('ابحث بالاسم أو المدينة أو التخصص…', 'Search by name, city or specialty…')}
          className="w-full ps-12 pe-5 py-4 rounded-2xl text-sm"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 14 }}
        />
      </div>

      <div className="md:sticky md:top-16 z-20 -mx-4 px-4 sm:-mx-8 sm:px-8 pt-3 pb-1 mb-3" style={{ background: 'var(--c-overlay)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
      <div className="flex gap-1.5 p-1 rounded-full self-start mb-5 w-fit max-w-full overflow-x-auto no-scrollbar" role="tablist" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)' }}>
        {([['all', t('الكل', 'All')], ['maker', t('صنّاع الإنتاج', 'Production')], ['creator', t('صنّاع المحتوى', 'Content creators')]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={type === k} onClick={() => pickType(k)} className="text-[13px] px-4 py-2 rounded-full cursor-pointer whitespace-nowrap" style={{ border: 'none', background: type === k ? 'var(--c-accent)' : 'transparent', fontWeight: type === k ? 600 : 400, color: type === k ? 'var(--c-on-accent)' : 'var(--c-muted)' }}>{l}</button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {type === 'creator' ? (
          <div className="relative">
            <select value={content} onChange={(e) => setContent(e.target.value)} aria-label={t('نوع المحتوى', 'Content type')} className="appearance-none" style={{ ...selectStyle, color: content !== 'all' ? 'var(--c-text)' : 'var(--c-muted)' }}>
              <option value="all">{t('كل أنواع المحتوى', 'All content')}</option>
              {CONTENT_TYPES.map((c) => <option key={c.key} value={c.key}>{t(c.ar, c.en)}</option>)}
            </select>
            <Caret />
          </div>
        ) : (
          <div className="relative">
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value === 'all' ? 'all' : Number(e.target.value))} aria-label={t('التخصص', 'Specialty')} className="appearance-none" style={{ ...selectStyle, color: specialty !== 'all' ? 'var(--c-text)' : 'var(--c-muted)' }}>
              <option value="all">{t('كل التخصصات', 'All specialties')}</option>
              {specialties.map((s) => <option key={s.id} value={s.id}>{t(s.name_ar || s.name_en, s.name_en)}</option>)}
            </select>
            <Caret />
          </div>
        )}
        <div className="relative">
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="appearance-none" style={{ ...selectStyle, color: country !== 'all' ? 'var(--c-text)' : 'var(--c-muted)' }}>
            <option value="all">{t('كل الدول', 'All countries')}</option>
            {(usedCountries.length ? usedCountries : COUNTRIES).map((c) => <option key={c.ar} value={c.ar}>{t(c.ar, c.en)}</option>)}
          </select>
          <Caret />
        </div>
        {([[verifiedOnly, setVerifiedOnly, t('المؤسسون فقط', 'Founding only')], [availableOnly, setAvailableOnly, t('المتاحون فقط', 'Available only')]] as const).map(([on, set, text]) => (
          <button key={text} type="button" role="switch" aria-checked={on} onClick={() => set(!on)} className="flex items-center gap-2.5 text-sm px-4 rounded-xl transition-all cursor-pointer" style={{ height: 42, background: 'var(--c-surface)', border: `1px solid ${on ? 'var(--c-accent)' : 'var(--c-border)'}`, color: on ? 'var(--c-text)' : 'var(--c-muted)', fontSize: 13 }}>
            <span className="w-8 h-4 rounded-full flex items-center" style={{ backgroundColor: on ? 'var(--c-accent)' : 'var(--c-border)', padding: 2, justifyContent: on ? 'flex-end' : 'flex-start', transition: 'background-color .2s' }}>
              <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 34 }} className="w-3 h-3 rounded-full" style={{ background: 'var(--c-text)' }} />
            </span>
            {text}
          </button>
        ))}
        <div className="relative">
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label={t('الترتيب', 'Sort')} className="appearance-none" style={{ ...selectStyle, color: sort !== 'default' ? 'var(--c-text)' : 'var(--c-muted)' }}>
            <option value="default">{t('الترتيب: المؤسسون أولاً', 'Sort: founding first')}</option>
            <option value="newest">{t('الأحدث انضماماً', 'Newest members')}</option>
            <option value="audience">{t('الأكثر متابعين', 'Biggest audience')}</option>
          </select>
          <Caret />
        </div>
        {activeFilters > 0 && (
          <button type="button" onClick={clearFilters} className="text-[13px] font-semibold cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--c-accent)', padding: '0 4px' }}>
            {t(`مسح الفلاتر (${activeFilters})`, `Clear filters (${activeFilters})`)}
          </button>
        )}
      </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm m-0" style={{ color: 'var(--c-muted)' }}>{all ? t(`${filtered.length} صانع`, `${filtered.length} maker${filtered.length !== 1 ? 's' : ''}`) : ''}</p>
            <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
              {(['list', 'grid'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)} aria-label={mode === 'list' ? t('قائمة', 'List') : t('شبكة', 'Grid')} className="p-2.5 cursor-pointer" style={{ background: viewMode === mode ? 'var(--c-accent)' : 'transparent', border: 'none', color: viewMode === mode ? 'var(--c-on-accent)' : 'var(--c-muted-2)' }}>
                  {mode === 'list' ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3.5" width="12" height="1.5" rx="0.75" fill="currentColor" /><rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" /><rect x="2" y="11" width="12" height="1.5" rx="0.75" fill="currentColor" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" /><rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" /><rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" /><rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {!all ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" aria-busy="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="rounded-2xl" style={{ aspectRatio: '3/4' }} />
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 px-6 text-center rounded-2xl flex flex-col items-center gap-4" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
              <p className="text-base m-0" style={{ color: 'var(--c-muted)' }}>
                {type === 'creator' && !(all || []).some(isCreator)
                  ? t('باب صنّاع المحتوى فُتح الآن. كن من أوائل الأسماء هنا.', 'Content creators can now join. Be one of the first names here.')
                  : t('لا يوجد صنّاع بهذه المواصفات بعد.', 'No makers match your filters yet.')}
              </p>
              {type === 'creator' && !(all || []).some(isCreator) && (
                <Link to="/join?type=creator" className="font-bold px-6 py-2.5 rounded-full text-sm" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>{t('انضم كصانع محتوى', 'Join as a creator')}</Link>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence initial={false}>
              {filtered.map((m, i) => (
                <motion.div key={m.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.025 } }} exit={{ opacity: 0, scale: 0.97 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
                <CastCard m={m} specialties={specialties} place={[cityLabel(m.city), label(COUNTRIES, m.country)].filter(Boolean).join(listSep())} />
                </motion.div>
              ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
              {filtered.map((m, i) => (
                <Link key={m.id} to={`/${m.username}`} className="flex items-center gap-4 px-5 py-4 group transition-colors hover:bg-white/[0.03]" style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                  <span className="relative shrink-0">
                    {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid var(--c-border)' }} /> : <span className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ background: 'var(--c-surface-alt)', color: 'var(--c-muted)' }}>{displayName(m).charAt(0)}</span>}
                    {m.is_founding && <span className="absolute -bottom-0.5 -end-0.5"><VerifiedBadge size={16} /></span>}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold group-hover:text-orange transition-colors" style={{ fontSize: 15 }}>{displayName(m)}</span>
                    <span className="block text-sm truncate" style={{ color: 'var(--c-muted)' }}>{memberLine(specialties, m)}</span>
                  </span>
                  <span className="hidden sm:block text-xs shrink-0" style={{ color: 'var(--c-muted-2)' }}>{label(COUNTRIES, m.country)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {counts.length > 0 && (
          <aside className="w-full lg:w-[280px] shrink-0">
            <h3 className="font-bold mb-4 mt-0" style={{ fontSize: 18 }}>{type === 'creator' ? t('حسب نوع المحتوى', 'By content') : t('حسب التخصص', 'By specialty')}</h3>
            <div className="flex flex-col rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
              {counts.map(([key, n], i) => {
                const on = type === 'creator' ? content === key : specialty === Number(key)
                return (
                  <button key={key} onClick={() => { if (type === 'creator') setContent(key); else setSpecialty(Number(key)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex items-center justify-between gap-3 px-4 py-3.5 text-start cursor-pointer group hover:bg-white/[0.03]" style={{ background: on ? 'rgba(var(--c-accent-rgb),0.08)' : 'transparent', border: 'none', borderBottom: i < counts.length - 1 ? '1px solid var(--c-border)' : 'none', color: 'var(--c-text)' }}>
                    <span className="font-semibold group-hover:text-orange transition-colors" style={{ fontSize: 13 }}>{type === 'creator' ? contentLabel(key) : specName(specialties, Number(key))}</span>
                    <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>{n}</span>
                  </button>
                )
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
