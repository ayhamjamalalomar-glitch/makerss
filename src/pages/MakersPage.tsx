import { useEffect, useMemo, useState } from 'react'
import Link from '../lib/router'
import { t, label, useLang } from '../lib/i18n'
import { COUNTRIES, cityLabel } from '../lib/constants'
import { useSpecialties, specName, roleLine } from '../lib/specialties'
import { displayName, listMembers, type MemberCard } from '../lib/data'
import { Spinner, VerifiedBadge } from '../components/mk'

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
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState<number | 'all'>(() => {
    const s = new URLSearchParams(window.location.search).get('s')
    return s && /^\d+$/.test(s) ? Number(s) : 'all'
  })
  const [country, setCountry] = useState('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => { listMembers().then(setAll) }, [])

  const filtered = useMemo(() => {
    return (all || []).filter((m) => {
      if (specialty !== 'all' && !(m.specialty_ids || []).includes(specialty)) return false
      if (country !== 'all' && m.country !== country) return false
      if (verifiedOnly && !m.is_founding) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = [m.full_name, m.name_ar, m.username, m.city, label(COUNTRIES, m.country), m.country, roleLine(specialties, m.specialty_ids, m.other_specialty)].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [all, search, specialty, country, verifiedOnly, specialties])

  const counts = useMemo(() => {
    const map = new Map<number, number>()
    for (const m of all || []) for (const id of m.specialty_ids || []) map.set(id, (map.get(id) || 0) + 1)
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [all])

  const usedCountries = COUNTRIES.filter((c) => (all || []).some((m) => m.country === c.ar))

  return (
    <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <span className="inline-block w-1 rounded-full" style={{ background: '#E85D04', height: 24 }} />
        <h1 className="font-black m-0" style={{ fontSize: 28, letterSpacing: '-0.01em' }}>{t('الصنّاع', 'Makers')}</h1>
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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="appearance-none" style={{ ...selectStyle, color: specialty !== 'all' ? 'var(--c-text)' : 'var(--c-muted)' }}>
            <option value="all">{t('كل التخصصات', 'All specialties')}</option>
            {specialties.map((s) => <option key={s.id} value={s.id}>{t(s.name_ar || s.name_en, s.name_en)}</option>)}
          </select>
          <Caret />
        </div>
        <div className="relative">
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="appearance-none" style={{ ...selectStyle, color: country !== 'all' ? 'var(--c-text)' : 'var(--c-muted)' }}>
            <option value="all">{t('كل الدول', 'All countries')}</option>
            {(usedCountries.length ? usedCountries : COUNTRIES).map((c) => <option key={c.ar} value={c.ar}>{t(c.ar, c.en)}</option>)}
          </select>
          <Caret />
        </div>
        <button onClick={() => setVerifiedOnly(!verifiedOnly)} className="flex items-center gap-2.5 text-sm px-4 rounded-xl transition-all cursor-pointer" style={{ height: 42, background: 'var(--c-surface)', border: `1px solid ${verifiedOnly ? '#E85D04' : 'var(--c-border)'}`, color: verifiedOnly ? 'var(--c-text)' : 'var(--c-muted)', fontSize: 13 }}>
          <span className="w-8 h-4 rounded-full flex items-center" style={{ backgroundColor: verifiedOnly ? '#E85D04' : 'var(--c-border)', padding: 2, justifyContent: verifiedOnly ? 'flex-end' : 'flex-start' }}>
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--c-text)' }} />
          </span>
          {t('المؤسسون فقط', 'Founding only')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm m-0" style={{ color: 'var(--c-muted)' }}>{all ? t(`${filtered.length} صانع`, `${filtered.length} maker${filtered.length !== 1 ? 's' : ''}`) : ''}</p>
            <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
              {(['list', 'grid'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)} aria-label={mode === 'list' ? t('قائمة', 'List') : t('شبكة', 'Grid')} className="p-2.5 cursor-pointer" style={{ background: viewMode === mode ? '#E85D04' : 'transparent', border: 'none', color: viewMode === mode ? '#fff' : 'var(--c-muted-2)' }}>
                  {mode === 'list' ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3.5" width="12" height="1.5" rx="0.75" fill="currentColor" /><rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" /><rect x="2" y="11" width="12" height="1.5" rx="0.75" fill="currentColor" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" /><rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" /><rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" /><rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {!all ? <Spinner /> : filtered.length === 0 ? (
            <div className="py-20 text-center rounded-2xl" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
              <p className="text-base m-0" style={{ color: 'var(--c-muted)' }}>{t('لا يوجد صنّاع بهذه المواصفات بعد.', 'No makers match your filters yet.')}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((m) => (
                <Link key={m.id} to={`/${m.username}`} className="group rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: 'var(--c-surface-alt)' }}>
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={displayName(m)} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black" style={{ fontSize: 44, color: 'var(--c-muted-2)' }}>{displayName(m).charAt(0)}</div>
                    )}
                    {m.is_founding && <span className="absolute top-2.5 end-2.5"><VerifiedBadge size={24} title={t('عضو مؤسس', 'Founding member')} /></span>}
                    {m.available && (
                      <span className="absolute bottom-2.5 start-2.5 flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: 'rgba(13,10,8,0.75)', fontSize: 10, color: '#4ADE80' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ADE80' }} />{t('متاح', 'Available')}
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <p className="font-bold group-hover:text-orange transition-colors leading-tight m-0" style={{ fontSize: 14 }}>{displayName(m)}</p>
                    <p className="m-0 truncate" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{roleLine(specialties, m.specialty_ids, m.other_specialty) || ' '}</p>
                    <p className="m-0 truncate" style={{ fontSize: 11, color: 'var(--c-muted-2)' }}>{[cityLabel(m.city), label(COUNTRIES, m.country)].filter(Boolean).join('، ')}</p>
                  </div>
                </Link>
              ))}
            </div>
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
                    <span className="block text-sm truncate" style={{ color: 'var(--c-muted)' }}>{roleLine(specialties, m.specialty_ids, m.other_specialty)}</span>
                  </span>
                  <span className="hidden sm:block text-xs shrink-0" style={{ color: 'var(--c-muted-2)' }}>{label(COUNTRIES, m.country)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {counts.length > 0 && (
          <aside className="w-full lg:w-[280px] shrink-0">
            <h3 className="font-bold mb-4 mt-0" style={{ fontSize: 18 }}>{t('حسب التخصص', 'By specialty')}</h3>
            <div className="flex flex-col rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
              {counts.map(([id, n], i) => (
                <button key={id} onClick={() => { setSpecialty(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex items-center justify-between gap-3 px-4 py-3.5 text-start cursor-pointer group hover:bg-white/[0.03]" style={{ background: specialty === id ? 'rgba(232,93,4,0.08)' : 'transparent', border: 'none', borderBottom: i < counts.length - 1 ? '1px solid var(--c-border)' : 'none', color: 'var(--c-text)' }}>
                  <span className="font-semibold group-hover:text-orange transition-colors" style={{ fontSize: 13 }}>{specName(specialties, id)}</span>
                  <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>{n}</span>
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
