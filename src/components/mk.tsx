import { t } from '../lib/i18n'
import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

/** Accent colour of the new design. (Name kept so older screens keep compiling.) */
export const BLUE = '#E85D04'
export const ORANGE = '#E85D04'

export function Sheet({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', ...style }}>
      {children}
    </div>
  )
}

export function Card({ children, className = '', style, dark }: { children: ReactNode; className?: string; style?: CSSProperties; dark?: boolean }) {
  return (
    <section
      className={`rounded-2xl ${className}`}
      style={{
        background: dark ? 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(232,93,4,0.16) 0%, transparent 70%), var(--c-surface)' : 'var(--c-surface)',
        border: dark ? '1px solid rgba(232,93,4,0.25)' : '1px solid var(--c-border)',
        color: 'var(--c-text)',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

type BtnVariant = 'primary' | 'soft' | 'outline' | 'danger' | 'ghost' | 'dashed'
export function Btn({ variant = 'primary', className = '', style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const styles: Record<BtnVariant, CSSProperties> = {
    primary: { background: ORANGE, color: '#fff', border: 'none' },
    soft: { background: 'var(--c-surface-alt)', color: 'var(--c-text)', border: '1px solid var(--c-border)' },
    outline: { background: 'transparent', color: 'var(--c-text)', border: '1px solid var(--c-border-mid)' },
    danger: { background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.35)' },
    ghost: { background: 'transparent', color: ORANGE, border: 'none' },
    dashed: { background: 'transparent', color: 'var(--c-muted)', border: '1.5px dashed var(--c-border-mid)' },
  }
  return (
    <button
      className={`rounded-full px-6 py-3 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ ...styles[variant], ...style }}
      {...rest}
    />
  )
}

export function Chip({ on, className = '', dark: _dark, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { on: boolean; dark?: boolean }) {
  const s: CSSProperties = on
    ? { background: ORANGE, color: '#fff', border: `1px solid ${ORANGE}`, fontWeight: 600 }
    : { background: 'transparent', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }
  return <button type="button" aria-pressed={on} className={`rounded-full px-3.5 py-2 text-[13px] cursor-pointer transition-colors ${className}`} style={{ ...s, ...style }} {...rest} />
}

const fieldBase: CSSProperties = { height: 48, padding: '0 16px', borderRadius: 12, fontSize: 14, width: '100%', background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode; dark?: boolean }) {
  return (
    <label className="flex flex-col gap-2 text-[13px] font-semibold" style={{ color: 'var(--c-text-2)' }}>
      <span className="flex justify-between gap-2">
        {label}
        {hint && <span className="font-normal" style={{ color: 'var(--c-muted)' }}>{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export function TextInput({ dark: _dark, style, ...rest }: InputHTMLAttributes<HTMLInputElement> & { dark?: boolean }) {
  return <input {...rest} style={{ ...fieldBase, ...style }} />
}

export function SelectInput({ dark: _dark, style, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { dark?: boolean; children: ReactNode }) {
  return (
    <select {...rest} style={{ ...fieldBase, ...style }}>
      {children}
    </select>
  )
}

export function TextArea({ dark: _dark, style, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { dark?: boolean }) {
  return <textarea {...rest} style={{ ...fieldBase, height: 'auto', padding: '12px 16px', resize: 'vertical', ...style }} />
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'blue' | 'amber' | 'red'; children: ReactNode }) {
  const m = {
    neutral: ['var(--c-surface-alt)', 'var(--c-text-2)'],
    green: ['rgba(74,222,128,0.12)', '#4ADE80'],
    blue: ['rgba(232,93,4,0.14)', '#FB923C'],
    amber: ['rgba(251,191,36,0.14)', '#FBBF24'],
    red: ['rgba(248,113,113,0.14)', '#F87171'],
  }[tone]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: m[0], color: m[1] }}>
      {children}
    </span>
  )
}

export function Corners({ size = 18, inset = 12, color = 'var(--c-border-mid)', w = 2 }: { size?: number; inset?: number; color?: string; w?: number }) {
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
  const initial = (name || '').trim().charAt(0).toUpperCase() || 'M'
  return (
    <span
      className="flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: size, height: size, borderRadius: rounded, background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-muted)', fontWeight: 700, fontSize: size * 0.36 }}
    >
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : initial}
    </span>
  )
}

export function Ring({ value, size = 52, stroke = 3, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = size / 2 - stroke / 2 - 0.5
  const c = 2 * Math.PI * r
  const color = value >= 1 ? '#4ADE80' : value >= 0.6 ? ORANGE : '#F87171'
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
  const m = { info: ['rgba(232,93,4,0.10)', '#FDBA74'], error: ['rgba(248,113,113,0.12)', '#FCA5A5'], success: ['rgba(74,222,128,0.12)', '#86EFAC'] }[tone]
  return (
    <div className="rounded-xl px-4 py-3 text-sm leading-relaxed" style={{ background: m[0], color: m[1] }}>
      {children}
    </div>
  )
}

/** Grey placeholder block shown while content loads, so the layout does not jump. */
export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`mk-skeleton block rounded-xl ${className}`} style={style} />
}

export function Spinner() {
  return <div className="py-24 text-center text-sm" style={{ color: 'var(--c-muted)' }}>{t('جارٍ التحميل…', 'Loading…')}</div>
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full md:w-[560px] max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-6 md:p-8 flex flex-col gap-5"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center gap-3">
          <span className="text-xl font-bold">{title}</span>
          <button type="button" onClick={onClose} aria-label={t('إغلاق', 'Close')} className="w-9 h-9 rounded-full text-lg cursor-pointer shrink-0" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}>×</button>
        </div>
        {children}
        {footer && <div className="flex gap-2">{footer}</div>}
      </div>
    </div>
  )
}

/** Standard page wrapper under the fixed header. */
export function PageShell({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 flex justify-center">
      <div className={`w-full ${narrow ? 'max-w-[640px]' : 'max-w-[920px]'} flex flex-col gap-5 md:gap-7`}>{children}</div>
    </div>
  )
}

/** Orange bar + title, the section header used across the design. */
export function SectionHeader({ title, count, onSeeAll, action }: { title: string; count?: number; onSeeAll?: () => void; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="inline-block w-1 rounded-full flex-shrink-0" style={{ background: ORANGE, height: 20 }} />
      <h2 className="font-inter font-bold text-paper m-0" style={{ fontSize: 19 }}>{title}</h2>
      {count !== undefined && <span className="font-inter text-muted" style={{ fontSize: 16 }}>{count}</span>}
      {onSeeAll && (
        <button onClick={onSeeAll} aria-label={t('عرض الكل', 'See all')} className="font-inter font-bold text-paper hover:opacity-60 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
          <span className="inline-block rtl:-scale-x-100">›</span>
        </button>
      )}
      {action && <span className="ms-auto">{action}</span>}
    </div>
  )
}

/** Verified mark shown next to founding members. Orange disc with a white check. */
export function VerifiedBadge({ size = 18, title }: { size?: number; title?: string }) {
  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, background: ORANGE, verticalAlign: 'middle' }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 9 9" fill="none" aria-hidden="true">
        <path d="M2 4.5L3.5 6L7 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

/** Placeholder poster when a project has no image. */
export function PosterFallback({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex items-end p-3" style={{ background: 'linear-gradient(160deg, #2C2420 0%, #161210 60%, #3a1d08 100%)' }}>
      <span className="font-inter font-bold leading-tight" style={{ fontSize: 13, color: 'var(--c-text)' }}>{title}</span>
    </div>
  )
}
