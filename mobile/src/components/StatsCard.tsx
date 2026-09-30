import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { t } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { Card, Segmented, Skeleton, Txt } from './ui'

interface Stats {
  days: number
  views: number
  prev_views: number
  visitors: number
  project_views: number
  contacts: number
  shares: number
  requests: number
  series: { day: string; views: number }[] | null
}

const RANGES = ['7', '30', '90'] as const

/** The member's own numbers: who looked at the page and what they did. */
export function StatsCard() {
  const { c } = useTheme()
  const [days, setDays] = useState<(typeof RANGES)[number]>('30')
  const [s, setS] = useState<Stats | null>(null)

  useEffect(() => {
    let alive = true
    setS(null)
    supabase.rpc('my_page_stats', { p_days: Number(days) }).then(({ data }) => { if (alive) setS((data as Stats) || null) })
    return () => { alive = false }
  }, [days])

  const series = s?.series || []
  const max = Math.max(1, ...series.map((d) => d.views))
  const change = s && s.prev_views > 0 ? Math.round(((s.views - s.prev_views) / s.prev_views) * 100) : null
  const tiles: [string, number | undefined][] = [
    [t('زوّار مختلفون', 'Unique visitors'), s?.visitors],
    [t('مشاهدات مشاريعك', 'Project views'), s?.project_views],
    [t('ضغطوا تواصل', 'Contact clicks'), s?.contacts],
    [t('طلبات تعاون', 'Requests'), s?.requests],
  ]

  return (
    <Card>
      <Txt size={13} weight="semi" color={c.text2}>{t('إحصائيات صفحتك', 'Your page stats')}</Txt>
      <Segmented value={days} onChange={setDays} items={RANGES.map((d) => ({ key: d, label: t(`${d} يوماً`, `${d} days`) }))} />
      {!s ? <Skeleton style={{ height: 150 }} /> : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <Txt display size={40} color={c.accent}>{String(s.views)}</Txt>
            <View style={{ paddingBottom: 10, flex: 1 }}>
              <Txt size={13} color={c.text2}>{t('زيارة لصفحتك', 'page views')}</Txt>
              {change !== null ? <Txt size={12} color={change >= 0 ? c.success : c.danger}>{`${change > 0 ? '+' : ''}${change}% `}{t('عن الفترة السابقة', 'vs previous')}</Txt> : null}
            </View>
          </View>
          {series.length > 1 && (
            <View style={{ height: 56, flexDirection: 'row', alignItems: 'flex-end', gap: 2, direction: 'ltr' }}>
              {series.map((d) => <View key={d.day} style={{ flex: 1, height: Math.max(3, (d.views / max) * 56), borderRadius: 2, backgroundColor: d.views ? c.accent : c.border }} />)}
            </View>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {tiles.map(([k, v]) => (
              <View key={k} style={{ flexBasis: '47%', flexGrow: 1, padding: 12, borderRadius: 12, backgroundColor: c.surfaceAlt, gap: 2 }}>
                <Txt display size={20}>{String(v ?? 0)}</Txt>
                <Txt size={12} color={c.muted}>{k}</Txt>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  )
}
