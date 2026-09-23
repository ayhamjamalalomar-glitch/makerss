import { t } from '../lib/i18n'
import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export const BLUE = '#2563EB'

export function Sheet({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`bg-white rounded-[32px] md:rounded-[40px] ${className}`} style={style}>
      {children}
    </div>
  )
}

export function Card({ children, className = '', style, dark }: { children: ReactNode; className?: string; style?: CSSProperties; dark?: boolean }) {
  return (
    <section
      className={`rounded-[28px] md:rounded-[32px] ${className}`}
      style={{ background: dark ? '#111111' : '#FFFFFF', color: dark ? '#FFFFFF' : undefined, border: dark ? 'none' : '1px solid #ECECEA', ...style }}
    >
      {children}
    </section>
  )
}

type BtnVariant = 'primary' | 'soft' | 'outline' | 'danger' | 'ghost' | 'dashed'
export function Btn({ variant = 'primary', className = '', style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const styles: Record<BtnVariant, CSSProperties> = {
    primary: { background: BLUE, color: '#fff', border: 'none' },
    soft: { background: '#F3F3F2', color: '#111', border: 'none' },
    outline: { background: '#fff', color: '#111', border: '1px solid #E3E3E0' },
    danger: { background: '#fff', color: '#B42318', border: '1px solid #F3C7C3' },
    ghost: { background: 'transparent', color: BLUE, border: 'none' },
    dashed: { background: 'transparent', color: '#5C5C59', border: '1.5px dashed #CFCFCB' },
  }
  return (
    <button
      className={`rounded-full px-6 py-3 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ ...styles[variant], ...style }}
      {...rest}
    />
  )
}

export function Chip({ on, className = '', dark, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { on: boolean; dark?: boolean }) {
  const s: CSSProperties = dark
    ? on
      ? { background: '#fff', color: '#111', border: '1px solid #fff', fontWeight: 600 }
      : { background: 'transparent', color: '#D4D4D1', border: '1px solid #3A3A38' }
    : on
      ? { background: '#111', color: '#fff', border: '1px solid #111', fontWeight: 600 }
      : { background: '#fff', color: '#3A3A38', border: '1px solid #E3E3E0' }
  return <button type="button" aria-pressed={on} className={`rounded-full px-3.5 py-2 text-[13px] cursor-pointer ${className}`} style={{ ...s, ...style }} {...rest} />
}

const fieldBase: CSSProperties = { height: 48, padding: '0 18px', borderRadius: 24, fontSize: 14, width: '100%' }

export function Field({ label, hint, children, dark }: { label: string; hint?: ReactNode; children: ReactNode; dark?: boolean }) {
  return (
    <label className="flex flex-col gap-2 text-[13px] font-semibold" style={{ color: dark ? '#A3A3A0' : undefined }}>
      <span className="flex justify-between gap-2">
        {label}
        {hint && <span className="font-normal" style={{ color: dark ? '#8C8C89' : '#5C5C59' }}>{hint}</span>}
      </span>
      {children}
    </label>
  )
}

const darkField: CSSProperties = { background: '#1E1E1D', borderColor: '#2E2E2C', color: '#fff' }

export function TextInput({ dark, style, ...rest }: InputHTMLAttributes<HTMLInputElement> & { dark?: boolean }) {
  return <input {...rest} style={{ ...fieldBase, ...(dark ? darkField : {}), ...style }} />
}

export function SelectInput({ dark, style, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { dark?: boolean; children: ReactNode }) {
  return (
    <select {...rest} style={{ ...fieldBase, ...(dark ? darkField : {}), ...style }}>
      {children}
    </select>
  )
}

export function TextArea({ dark, style, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { dark?: boolean }) {
  return <textarea {...rest} style={{ padding: '14px 18px', borderRadius: 24, fontSize: 14, width: '100%', resize: 'vertical', ...(dark ? darkField : {}), ...style }} />
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'blue' | 'amber' | 'red'; children: ReactNode }) {
  const m = {
    neutral: ['#F3F3F2', '#3A3A38'],
    green: ['#E8F5EC', '#166534'],
    blue: ['#E0E9FD', '#1E40AF'],
    amber: ['#FEF3C7', '#92400E'],
    red: ['#FDECEA', '#B42318'],
  }[tone]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: m[0], color: m[1] }}>
      {children}
    </span>
  )
}

export function Corners({ size = 18, inset = 12, color = '#111111', w = 2 }: { size?: number; inset?: number; color?: string; w?: number }) {
  const b = `${w}px solid ${color}`
  const base: CSSProperties = { position: 'absolute', width: size, height: size, pointerEvents: 'none' }
  return (
    <>
      <span style={{ ...base, top: inset, right: inset, borderTop: b, borderRight: b }} />
      <span style={{ ...base, top: inset, left: inset, borderTop: b, borderLeft: b }} />
      <span style={{ ...base, bottom: inset, right: inset, borderBottom: b, borderRight: b }} />
      <span style={{ ...base, bottom: inset, left: inset, borderBottom: b, borderLeft: b }} />
    </>
  )
}

export function Avatar({ url, name, size = 48, rounded = '50%' }: { url?: string | null; name?: string | null; size?: number; rounded?: string | number }) {
  const initial = (name || '').trim().charAt(0) || 'م'
  return (
    <span
      className="bw flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: size, height: size, borderRadius: rounded, background: '#D6D6D6', color: '#3A3A38', fontWeight: 600, fontSize: size * 0.36 }}
    >
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : initial}
    </span>
  )
}

export function Ring({ value, size = 52, stroke = 3, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = size / 2 - stroke / 2 - 0.5
  const c = 2 * Math.PI * r
  const color = value >= 1 ? '#16A34A' : value >= 0.6 ? '#F97316' : '#DC2626'
  return (
    <span className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * Math.min(1, value)).toFixed(1)} ${c.toFixed(1)}`} />
      </svg>
      {children}
    </span>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const m = { info: ['#EEF3FE', '#1E40AF'], error: ['#FDECEA', '#B42318'], success: ['#E8F5EC', '#166534'] }[tone]
  return (
    <div className="rounded-[20px] px-4 py-3 text-sm leading-relaxed" style={{ background: m[0], color: m[1] }}>
      {children}
    </div>
  )
}

export function Spinner() {
  return <div className="py-24 text-center text-sm" style={{ color: '#5C5C59' }}>{t('جارٍ التحميل…', 'Loading…')}</div>
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-start justify-center md:pt-28" style={{ background: 'rgba(17,17,17,0.35)' }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full md:w-[560px] max-h-[90vh] overflow-y-auto bg-white rounded-t-[32px] md:rounded-[32px] p-6 md:p-8 flex flex-col gap-5"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold">{title}</span>
          <button type="button" onClick={onClose} aria-label={t('إغلاق', 'Close')} className="w-9 h-9 rounded-full text-lg cursor-pointer" style={{ background: '#F3F3F2', border: 'none', color: '#3A3A38' }}>×</button>
        </div>
        {children}
        {footer && <div className="flex gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function PageShell({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return (
    <main className="md:ms-[120px] p-3 md:p-6 pb-28 md:pb-6">
      <Sheet className="px-4 py-6 md:px-8 md:py-16 flex justify-center min-h-[calc(100vh-48px)]">
        <div className={`w-full ${narrow ? 'max-w-[620px]' : 'max-w-[860px]'} flex flex-col gap-5 md:gap-7`}>{children}</div>
      </Sheet>
    </main>
  )
}

const BADGE_PATH = 'M12.00 1.05 L12.47 1.17 L12.92 1.52 L13.32 1.99 L13.68 2.47 L14.03 2.86 L14.39 3.07 L14.82 3.07 L15.31 2.91 L15.87 2.67 L16.45 2.46 L17.00 2.39 L17.47 2.52 L17.82 2.86 L18.04 3.38 L18.15 3.99 L18.22 4.59 L18.33 5.10 L18.54 5.46 L18.90 5.67 L19.41 5.78 L20.01 5.85 L20.62 5.96 L21.14 6.18 L21.48 6.53 L21.61 7.00 L21.54 7.55 L21.33 8.13 L21.09 8.69 L20.93 9.18 L20.93 9.61 L21.14 9.97 L21.53 10.32 L22.01 10.68 L22.48 11.08 L22.83 11.53 L22.95 12.00 L22.83 12.47 L22.48 12.92 L22.01 13.32 L21.53 13.68 L21.14 14.03 L20.93 14.39 L20.93 14.82 L21.09 15.31 L21.33 15.87 L21.54 16.45 L21.61 17.00 L21.48 17.47 L21.14 17.82 L20.62 18.04 L20.01 18.15 L19.41 18.22 L18.90 18.33 L18.54 18.54 L18.33 18.90 L18.22 19.41 L18.15 20.01 L18.04 20.62 L17.82 21.14 L17.48 21.48 L17.00 21.61 L16.45 21.54 L15.87 21.33 L15.31 21.09 L14.82 20.93 L14.39 20.93 L14.03 21.14 L13.68 21.53 L13.32 22.01 L12.92 22.48 L12.47 22.83 L12.00 22.95 L11.53 22.83 L11.08 22.48 L10.68 22.01 L10.32 21.53 L9.97 21.14 L9.61 20.93 L9.18 20.93 L8.69 21.09 L8.13 21.33 L7.55 21.54 L7.00 21.61 L6.52 21.48 L6.18 21.14 L5.96 20.62 L5.85 20.01 L5.78 19.41 L5.67 18.90 L5.46 18.54 L5.10 18.33 L4.59 18.22 L3.99 18.15 L3.38 18.04 L2.86 17.82 L2.52 17.48 L2.39 17.00 L2.46 16.45 L2.67 15.87 L2.91 15.31 L3.07 14.82 L3.07 14.39 L2.86 14.03 L2.47 13.68 L1.99 13.32 L1.52 12.92 L1.17 12.47 L1.05 12.00 L1.17 11.53 L1.52 11.08 L1.99 10.68 L2.47 10.32 L2.86 9.97 L3.07 9.61 L3.07 9.18 L2.91 8.69 L2.67 8.13 L2.46 7.55 L2.39 7.00 L2.52 6.53 L2.86 6.18 L3.38 5.96 L3.99 5.85 L4.59 5.78 L5.10 5.67 L5.46 5.46 L5.67 5.10 L5.78 4.59 L5.85 3.99 L5.96 3.38 L6.18 2.86 L6.53 2.52 L7.00 2.39 L7.55 2.46 L8.13 2.67 L8.69 2.91 L9.18 3.07 L9.61 3.07 L9.97 2.86 L10.32 2.47 L10.68 1.99 L11.08 1.52 L11.53 1.17Z'

/** Blue verified badge shown next to founding members' names. */
export function VerifiedBadge({ size = 20, title }: { size?: number; title?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={title} className="shrink-0 inline-block" style={{ verticalAlign: 'middle' }}>
      {title && <title>{title}</title>}
      <path d={BADGE_PATH} fill="#3B8BF5" />
      <path d="M8.2 12.3l2.6 2.6 5-5.3" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
