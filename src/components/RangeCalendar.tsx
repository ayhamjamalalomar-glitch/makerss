import { useState } from 'react'
import { MONTHS_AR, formatDateAr, daysBetween, durationAr } from '../lib/constants'

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

export default function RangeCalendar({ start, end, onChange }: { start: string | null; end: string | null; onChange: (s: string | null, e: string | null) => void }) {
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
    if (mode === 'start' || !start || d < start) {
      onChange(d, end && end >= d ? end : null)
      setMode('end')
    } else {
      onChange(start, d)
      setMode('start')
    }
  }

  const box = (active: boolean) => ({ background: active ? 'rgba(37,99,235,0.18)' : '#1E1E1D', border: `1px solid ${active ? '#2563EB' : '#2E2E2C'}` })
  const dur = start && end ? durationAr(daysBetween(start, end)) : null

  return (
    <div className="flex flex-col gap-3.5 p-4 md:p-5 rounded-[28px]" style={{ background: '#1A1A19', border: '1px solid #2E2E2C' }}>
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={() => setMode('start')} className="text-right px-4 py-3 rounded-[20px] cursor-pointer flex flex-col gap-0.5 text-white" style={box(mode === 'start')}>
          <span className="text-[11px]" style={{ color: '#A3A3A0' }}>تاريخ البدء</span>
          <span className="text-[15px] font-semibold">{start ? formatDateAr(start) : 'اختر من التقويم'}</span>
        </button>
        <button type="button" onClick={() => setMode('end')} className="text-right px-4 py-3 rounded-[20px] cursor-pointer flex flex-col gap-0.5 text-white" style={box(mode === 'end')}>
          <span className="text-[11px]" style={{ color: '#A3A3A0' }}>تاريخ التسليم</span>
          <span className="text-[15px] font-semibold">{end ? formatDateAr(end) : 'اختر من التقويم'}</span>
        </button>
      </div>
      <div className="flex items-center justify-between px-1">
        <button type="button" aria-label="الشهر السابق" disabled={!canPrev} onClick={() => (m === 0 ? (setM(11), setY(y - 1)) : setM(m - 1))} className="w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer disabled:opacity-30" style={{ border: '1px solid #2E2E2C', background: 'transparent' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 6l6 6-6 6" /></svg>
        </button>
        <span className="text-[15px] font-semibold text-white">{MONTHS_AR[m]} {y}</span>
        <button type="button" aria-label="الشهر التالي" onClick={() => (m === 11 ? (setM(0), setY(y + 1)) : setM(m + 1))} className="w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer" style={{ border: '1px solid #2E2E2C', background: 'transparent' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 6l-6 6 6 6" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((w) => (
          <span key={w} className="text-[10px] md:text-[11px] py-1" style={{ color: '#8C8C89' }}>{w}</span>
        ))}
        {Array.from({ length: first }).map((_, i) => <span key={'b' + i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = iso(y, m, i + 1)
          const past = d < today
          const edge = d === start || d === end
          const inRange = !!start && !!end && d > start && d < end
          return (
            <button
              key={d}
              type="button"
              disabled={past}
              aria-pressed={edge}
              onClick={() => pick(d)}
              className="h-10 rounded-full text-sm cursor-pointer disabled:cursor-default"
              style={{ border: 'none', background: edge ? '#2563EB' : inRange ? 'rgba(37,99,235,0.28)' : 'transparent', color: past ? '#55554F' : '#fff', fontWeight: edge ? 700 : 500 }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <span className="text-[13px] px-1" style={{ color: '#A3A3A0' }}>
        {dur ? `مدة المشروع: ${dur}` : mode === 'start' ? 'اختر يوم بدء المشروع.' : 'اختر الآن يوم التسليم.'}
      </span>
    </div>
  )
}
