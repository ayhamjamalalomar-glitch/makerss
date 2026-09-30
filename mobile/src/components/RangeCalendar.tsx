import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { months, formatDateAr, daysBetween, durationAr } from '@/lib/constants'
import { t, useLang } from '@/lib/i18n'
import { alpha, useTheme } from '@/lib/theme'
import { IconBtn, Label, Sheet, Txt, tap } from './ui'

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/** Start and delivery dates on one month calendar. */
export function RangeCalendar({ start, end, onChange }: { start: string | null; end: string | null; onChange: (s: string | null, e: string | null) => void }) {
  const { c } = useTheme()
  const { rtl } = useLang()
  const now = new Date()
  const today = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const [y, setY] = useState(now.getFullYear())
  const [m, setM] = useState(now.getMonth())
  const [mode, setMode] = useState<'start' | 'end'>(start && !end ? 'end' : 'start')

  const first = new Date(y, m, 1).getDay()
  const days = new Date(y, m + 1, 0).getDate()
  const canPrev = y > now.getFullYear() || m > now.getMonth()

  const pick = (d: string) => {
    if (d < today) return
    tap()
    if (mode === 'start' || !start || d < start) {
      onChange(d, end && end >= d ? end : null)
      setMode('end')
    } else {
      onChange(start, d)
      setMode('start')
    }
  }

  const box = (active: boolean) => ({ flex: 1, padding: 12, borderRadius: 12, gap: 2, backgroundColor: active ? alpha(c, 0.18) : c.surface, borderWidth: 1, borderColor: active ? c.accent : c.border })
  const dur = start && end ? durationAr(daysBetween(start, end)) : null
  const cells: (string | null)[] = [...Array.from({ length: first }, () => null), ...Array.from({ length: days }, (_, i) => iso(y, m, i + 1))]
  while (cells.length % 7) cells.push(null)

  return (
    <View style={{ gap: 12, padding: 14, borderRadius: 18, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={() => setMode('start')} style={box(mode === 'start')}>
          <Txt size={11} color={c.muted}>{t('تاريخ البدء', 'Start date')}</Txt>
          <Txt size={14} weight="semi">{start ? formatDateAr(start) : t('اختر من التقويم', 'Pick below')}</Txt>
        </Pressable>
        <Pressable onPress={() => setMode('end')} style={box(mode === 'end')}>
          <Txt size={11} color={c.muted}>{t('تاريخ التسليم', 'Delivery date')}</Txt>
          <Txt size={14} weight="semi">{end ? formatDateAr(end) : t('اختر من التقويم', 'Pick below')}</Txt>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ opacity: canPrev ? 1 : 0.3 }} pointerEvents={canPrev ? 'auto' : 'none'}>
          <IconBtn name={rtl ? 'chevronRight' : 'chevronLeft'} size={34} label={t('الشهر السابق', 'Previous month')} onPress={() => (m === 0 ? (setM(11), setY(y - 1)) : setM(m - 1))} />
        </View>
        <Txt size={15} weight="semi">{`${months()[m]} ${y}`}</Txt>
        <IconBtn name={rtl ? 'chevronLeft' : 'chevronRight'} size={34} label={t('الشهر التالي', 'Next month')} onPress={() => (m === 11 ? (setM(0), setY(y + 1)) : setM(m + 1))} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {t('أحد|إثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت', 'Sun|Mon|Tue|Wed|Thu|Fri|Sat').split('|').map((w) => (
          <View key={w} style={{ flex: 1 }}><Txt size={10} color={c.muted} center>{w}</Txt></View>
        ))}
      </View>
      <View style={{ gap: 4 }}>
        {Array.from({ length: cells.length / 7 }).map((_, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 2 }}>
            {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
              if (!d) return <View key={i} style={{ flex: 1, height: 38 }} />
              const past = d < today
              const edge = d === start || d === end
              const inRange = !!start && !!end && d > start && d < end
              return (
                <Pressable key={d} disabled={past} onPress={() => pick(d)} style={{ flex: 1, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: edge ? c.accent : inRange ? alpha(c, 0.28) : 'transparent' }}>
                  <Txt size={14} weight={edge ? 'bold' : 'medium'} color={past ? c.muted2 : edge ? c.onAccent : c.text} center>{String(Number(d.slice(8)))}</Txt>
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
      <Txt size={13} color={c.muted}>
        {dur ? t(`مدة المشروع: ${dur}`, `Project length: ${dur}`) : mode === 'start' ? t('اختر يوم بدء المشروع.', 'Pick the start day.') : t('اختر الآن يوم التسليم.', 'Now pick the delivery day.')}
      </Txt>
    </View>
  )
}

/** One date (for example an application deadline), picked on a month calendar in a sheet. */
export function DateField({ label, value, onChange }: { label: string; value: string | null; onChange: (d: string | null) => void }) {
  const { c } = useTheme()
  const { rtl } = useLang()
  const [open, setOpen] = useState(false)
  const now = new Date()
  const today = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const [y, setY] = useState(now.getFullYear())
  const [m, setM] = useState(now.getMonth())
  const first = new Date(y, m, 1).getDay()
  const days = new Date(y, m + 1, 0).getDate()
  const canPrev = y > now.getFullYear() || m > now.getMonth()
  const cells: (string | null)[] = [...Array.from({ length: first }, () => null), ...Array.from({ length: days }, (_, i) => iso(y, m, i + 1))]
  while (cells.length % 7) cells.push(null)

  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <Pressable onPress={() => { tap(); setOpen(true) }} style={{ height: 50, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceAlt, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}><Txt size={16} color={value ? c.text : c.muted2}>{value ? formatDateAr(value) : t('بدون موعد محدد', 'No deadline')}</Txt></View>
        {value ? <Pressable hitSlop={10} onPress={() => onChange(null)}><Txt size={13} color={c.muted}>{t('إزالة', 'Remove')}</Txt></Pressable> : null}
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ opacity: canPrev ? 1 : 0.3 }} pointerEvents={canPrev ? 'auto' : 'none'}>
            <IconBtn name={rtl ? 'chevronRight' : 'chevronLeft'} size={34} label={t('الشهر السابق', 'Previous month')} onPress={() => (m === 0 ? (setM(11), setY(y - 1)) : setM(m - 1))} />
          </View>
          <Txt size={15} weight="semi">{`${months()[m]} ${y}`}</Txt>
          <IconBtn name={rtl ? 'chevronLeft' : 'chevronRight'} size={34} label={t('الشهر التالي', 'Next month')} onPress={() => (m === 11 ? (setM(0), setY(y + 1)) : setM(m + 1))} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {t('أحد|إثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت', 'Sun|Mon|Tue|Wed|Thu|Fri|Sat').split('|').map((w) => <View key={w} style={{ flex: 1 }}><Txt size={10} color={c.muted} center>{w}</Txt></View>)}
        </View>
        <View style={{ gap: 4 }}>
          {Array.from({ length: cells.length / 7 }).map((_, r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 2 }}>
              {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
                if (!d) return <View key={i} style={{ flex: 1, height: 42 }} />
                const past = d < today
                const on = d === value
                return (
                  <Pressable key={d} disabled={past} onPress={() => { tap(); onChange(d); setOpen(false) }} style={{ flex: 1, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.accent : 'transparent' }}>
                    <Txt size={15} weight={on ? 'bold' : 'medium'} color={past ? c.muted2 : on ? c.onAccent : c.text} center>{String(Number(d.slice(8)))}</Txt>
                  </Pressable>
                )
              })}
            </View>
          ))}
        </View>
      </Sheet>
    </View>
  )
}
