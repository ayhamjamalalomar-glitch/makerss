import { useEffect, useMemo, useState } from 'react'
import Link from '../lib/router'
import { useAuth } from '../lib/auth'
import { t, useLang } from '../lib/i18n'
import { displayName, kindLabel, listProjects, posterOf, PROJECT_KINDS, type Project } from '../lib/data'
import { arNorm } from '../lib/constants'
import { useDarkHero } from '../lib/hero'
import { PosterFallback, Skeleton } from '../components/mk'

export default function TitlesPage() {
  useLang()
  const [heroOn, setHeroOn] = useState(false)
  useDarkHero(heroOn)
  const { profile } = useAuth()
  const [all, setAll] = useState<Project[] | null>(null)
  const [kind, setKind] = useState('all')
  const [sort, setSort] = useState<'latest' | 'year' | 'az'>('latest')
  const [search, setSearch] = useState('')

  useEffect(() => { listProjects({ limit: 200 }).then(setAll).catch(() => setAll([])) }, [])

  const kinds = PROJECT_KINDS.filter((k) => (all || []).some((p) => p.kind === k.key))
  const filtered = useMemo(() => (all || [])
    .filter((p) => (kind === 'all' || p.kind === kind) && (!search || arNorm(`${p.title} ${p.brand || ''} ${displayName(p.owner)}`).includes(arNorm(search.trim()))))
    .sort((a, b) => sort === 'az' ? a.title.localeCompare(b.title) : sort === 'year' ? (b.year ?? 0) - (a.year ?? 0) : b.created_at.localeCompare(a.created_at)), [all, kind, sort, search])

  const hero = (all || []).find((p) => posterOf(p))
  useEffect(() => { setHeroOn(!!hero) }, [hero])
  const canAdd = profile?.status === 'approved'
  const pill = (on: boolean) => ({
    background: on ? 'var(--c-accent)' : 'transparent', border: '1px solid ' + (on ? 'var(--c-accent)' : 'var(--c-border)'),
    color: on ? 'white' : 'var(--c-muted)', cursor: 'pointer', fontSize: 12, fontWeight: on ? 600 : 400,
  })

  if (!all) {
    return (
      <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-10 flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} style={{ aspectRatio: '2/3' }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {hero ? (
        <div className="relative overflow-hidden -mt-16" style={{ height: 500, background: 'var(--c-screen)' }}>
          <img src={posterOf(hero)!} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'brightness(0.4) saturate(0.85)', transform: 'scale(1.05)' }} />
          <div className="absolute inset-0 rtl:scale-x-[-1]" style={{ background: 'linear-gradient(to right, rgba(5,5,7,0.96) 30%, rgba(5,5,7,0.15) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--c-bg) 0%, transparent 50%)' }} />
          <div className="relative z-10 flex flex-col justify-end h-full max-w-[1120px] mx-auto w-full px-4 sm:px-8 pb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold px-2.5 py-1 rounded-md" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)', fontSize: 10, letterSpacing: '0.06em' }}>{t('أحدث مشروع', 'Latest')}</span>
              <span style={{ color: 'rgba(245,240,235,0.6)', fontSize: 12 }}>{[kindLabel(hero.kind), hero.year].filter(Boolean).join(' · ')}</span>
            </div>
            <h1 className="font-display font-black mb-3 mt-0" style={{ fontSize: 'clamp(34px,6vw,72px)', letterSpacing: '-0.02em', lineHeight: 1.05, color: '#F3EFE7' }}>{hero.title}</h1>
            {hero.description && <p className="mb-6 mt-0 leading-relaxed max-w-lg" style={{ fontSize: 14, color: 'rgba(245,240,235,0.65)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{hero.description}</p>}
            <div className="flex gap-3">
              <Link to={`/projects/${hero.id}`} className="flex items-center gap-2 font-bold px-6 py-3 rounded-full hover:opacity-90" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)', fontSize: 13 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rtl:-scale-x-100"><path d="M3 2l9 5-9 5V2z" fill="currentColor" /></svg>
                {t('عرض المشروع', 'View project')}
              </Link>
              {canAdd && (
                <Link to="/projects/new" className="flex items-center gap-2 font-semibold px-6 py-3 rounded-full hover:opacity-80" style={{ background: 'rgba(245,240,235,0.1)', border: '1px solid rgba(245,240,235,0.15)', color: '#F5F0EB', fontSize: 13 }}>
                  + {t('أضف مشروعك', 'Add your project')}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 pt-10 flex items-center gap-2">
          <span className="inline-block w-1 rounded-full" style={{ background: 'var(--c-accent)', height: 24 }} />
          <h1 className="font-display font-black m-0" style={{ fontSize: 'clamp(34px, 5vw, 58px)' }}>{t('المشاريع', 'Projects')}</h1>
        </div>
      )}

      <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <div className="flex gap-2 overflow-x-auto flex-1 no-scrollbar">
            <button onClick={() => setKind('all')} className="shrink-0 px-4 py-1.5 rounded-full" style={pill(kind === 'all')}>{t('الكل', 'All')}</button>
            {kinds.map((k) => <button key={k.key} onClick={() => setKind(k.key)} className="shrink-0 px-4 py-1.5 rounded-full" style={pill(kind === k.key)}>{t(k.ar, k.en)}</button>)}
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('ابحث في المشاريع', 'Search projects')} className="px-4 py-2 rounded-full shrink-0" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 12, width: 190 }} />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>{t('ترتيب:', 'Sort by:')}</span>
          {([['latest', t('الأحدث', 'Latest')], ['year', t('سنة الإنتاج', 'Year')], ['az', t('أبجدي', 'A-Z')]] as const).map(([k, text]) => (
            <button key={k} onClick={() => setSort(k)} className="px-3 py-1 rounded-lg" style={{ ...pill(sort === k), borderRadius: 8 }}>{text}</button>
          ))}
          <span className="ms-auto" style={{ fontSize: 12, color: 'var(--c-muted)' }}>{t(`${filtered.length} مشروع`, `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`)}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center rounded-2xl flex flex-col items-center gap-4" style={{ border: '1px dashed var(--c-border-mid)', background: 'var(--c-surface)' }}>
            <p className="m-0" style={{ color: 'var(--c-muted)', fontSize: 14 }}>{all.length === 0 ? t('لا توجد مشاريع بعد. كن أول من يضيف عمله.', 'No projects yet. Be the first to add your work.') : t('لا مشاريع تطابق البحث.', 'No projects match.')}</p>
            {canAdd && <Link to="/projects/new" className="font-bold px-5 py-2.5 rounded-full text-sm" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>{t('أضف مشروعاً', 'Add a project')}</Link>}
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {filtered.map((p) => {
              const img = posterOf(p)
              return (
                <Link key={p.id} to={`/projects/${p.id}`} className="text-start group">
                  <div className="relative rounded-xl overflow-hidden mb-3" style={{ aspectRatio: '2/3', background: 'var(--c-surface)' }}>
                    {img ? <img src={img} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <PosterFallback title={p.title} />}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(13,10,8,0.5)' }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--c-accent)' }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rtl:-scale-x-100"><path d="M4 3l10 5-10 5V3z" fill="white" /></svg></div>
                    </div>
                    {p.kind && <span className="absolute top-2 start-2 font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(13,10,8,0.75)', color: 'var(--c-accent)', fontSize: 9, letterSpacing: '0.05em' }}>{kindLabel(p.kind)}</span>}
                  </div>
                  <p className="font-bold leading-tight mb-0.5 mt-0 group-hover:text-orange transition-colors" style={{ fontSize: 13 }}>{p.title}</p>
                  <p className="m-0 truncate" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{[p.year, p.brand || displayName(p.owner)].filter(Boolean).join(' · ')}</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
