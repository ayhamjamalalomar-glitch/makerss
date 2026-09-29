import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'
import { formatDateAr } from '../lib/constants'
import Link from '../lib/router'
import { Card, Skeleton } from './mk'

interface Stats {
  days: number
  views: number
  prev_views: number
  visitors: number
  project_views: number
  contacts: number
  shares: number
  clicks: number
  requests: number
  series: { day: string; views: number }[] | null
  top_projects: { id: string; title: string; views: number }[]
}

const RANGES = [7, 30, 90] as const

/** The member's own numbers: who looked at the page and what they did. */
export default function StatsCard() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [s, setS] = useState<Stats | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    setS(null)
    supabase.rpc('my_page_stats', { p_days: days }).then(({ data }) => { if (alive) setS((data as Stats) || null) })
    return () => { alive = false }
  }, [days])

  const series = s?.series || []
  const max = Math.max(1, ...series.map((d) => d.views))
  const change = s && s.prev_views > 0 ? Math.round(((s.views - s.prev_views) / s.prev_views) * 100) : null
  const tiles: [string, number | undefined, string?][] = [
    [t('زيارات صفحتك', 'Page views'), s?.views, change === null ? undefined : `${change > 0 ? '+' : ''}${change}% ${t('عن الفترة السابقة', 'vs previous')}`],
    [t('زوّار مختلفون', 'Unique visitors'), s?.visitors],
    [t('مشاهدات مشاريعك', 'Project views'), s?.project_views],
    [t('ضغطوا تواصل', 'Contact clicks'), s?.contacts],
    [t('طلبات تعاون', 'Requests'), s?.requests],
    [t('شاركوا صفحتك', 'Shares'), s?.shares],
  ]
  const hovered = hover !== null ? series[hover] : null

  return (
    <Card className="px-5 py-6 md:px-10 md:py-8 flex flex-col gap-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <span className="text-[13px] font-semibold">{t('إحصائيات صفحتك', 'Your page stats')}</span>
        <div className="flex gap-1 p-1 rounded-full" role="tablist" style={{ background: 'var(--c-surface-alt)' }}>
          {RANGES.map((d) => (
            <button key={d} type="button" role="tab" aria-selected={days === d} onClick={() => setDays(d)} className="text-xs px-3 py-1.5 rounded-full cursor-pointer" style={{ border: 'none', background: days === d ? '#E85D04' : 'transparent', color: days === d ? '#fff' : 'var(--c-muted)', fontWeight: days === d ? 600 : 400 }}>
              {t(`${d} يوماً`, `${d} days`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {tiles.map(([label, n, sub]) => (
          <div key={label} className="p-4 rounded-xl flex flex-col gap-1" style={{ background: 'var(--c-surface-alt)' }}>
            {n === undefined ? <Skeleton className="h-7 w-12" /> : <span className="text-[26px] font-bold" dir="ltr" style={{ lineHeight: 1.1, textAlign: 'start' }}>{n.toLocaleString('en')}</span>}
            <span className="text-xs" style={{ color: 'var(--c-text-2)' }}>{label}</span>
            {sub && <span className="text-[11px]" style={{ color: 'var(--c-muted)' }}>{sub}</span>}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline text-xs" style={{ color: 'var(--c-muted)' }}>
          <span>{t('الزيارات يوماً بيوم', 'Views per day')}</span>
          <span aria-live="polite">{hovered ? `${formatDateAr(hovered.day)} · ${t(`${hovered.views} زيارة`, `${hovered.views} view${hovered.views === 1 ? '' : 's'}`)}` : ''}</span>
        </div>
        {!s ? <Skeleton className="h-24 w-full" /> : (
          <div
            className="flex items-end h-24"
            dir="ltr"
            style={{ gap: 2, borderBottom: '1px solid var(--c-border)' }}
            role="img"
            aria-label={t(`${s.views} زيارة خلال آخر ${s.days} يوماً`, `${s.views} views in the last ${s.days} days`)}
            onMouseLeave={() => setHover(null)}
          >
            {series.map((d, i) => (
              <div key={d.day} className="flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
                <div
                  className="w-full"
                  style={{
                    height: d.views ? `${Math.max(6, (d.views / max) * 100)}%` : 2,
                    background: d.views ? '#E85D04' : 'var(--c-border-mid)',
                    opacity: hover === null || hover === i ? 1 : 0.45,
                    borderRadius: '4px 4px 0 0',
                    transition: 'opacity .15s',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {!!s?.top_projects.length && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{t('أكثر مشاريعك مشاهدة', 'Your most viewed projects')}</span>
          {s.top_projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="flex justify-between gap-3 py-2 text-sm" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <span className="truncate font-semibold">{p.title}</span>
              <span className="shrink-0" style={{ color: 'var(--c-muted)' }}>{t(`${p.views} مشاهدة`, `${p.views} views`)}</span>
            </Link>
          ))}
        </div>
      )}
      <span className="text-[11px]" style={{ color: 'var(--c-muted-2)' }}>{t('لا نحسب زياراتك أنت لصفحتك. كل زائر يُحسب مرة واحدة في اليوم.', 'Your own visits are not counted. Each visitor counts once a day.')}</span>
    </Card>
  )
}
