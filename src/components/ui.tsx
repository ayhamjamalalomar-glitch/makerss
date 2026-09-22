import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export const ORANGE = '#E85D04'

const fieldStyle = {
  background: 'var(--c-surface)',
  border: '1px solid var(--c-border)',
  color: 'var(--c-text)',
  fontSize: 14,
}

export function Label({ children, required, hint }: { children: ReactNode; required?: boolean; hint?: ReactNode }) {
  return (
    <span className="flex items-baseline justify-between gap-3">
      <span className="font-inter text-muted text-xs uppercase" style={{ letterSpacing: '0.12em', fontWeight: 600 }}>
        {children}
        {required && <span style={{ color: ORANGE }}> *</span>}
      </span>
      {hint && <span className="font-inter text-muted text-xs">{hint}</span>}
    </span>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`px-5 py-3.5 rounded-xl font-inter text-sm w-full ${props.className || ''}`} style={{ ...fieldStyle, ...props.style }} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`px-5 py-3.5 rounded-xl font-inter text-sm w-full ${props.className || ''}`} style={{ ...fieldStyle, resize: 'vertical', ...props.style }} />
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select {...props} className={`px-5 py-3.5 rounded-xl font-inter text-sm w-full ${props.className || ''}`} style={{ ...fieldStyle, ...props.style }}>
      {children}
    </select>
  )
}

export function Button({ variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'success' }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: ORANGE, color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: 'var(--c-text)', border: '1px solid var(--c-border-mid)' },
    danger: { background: 'rgba(220,38,38,0.12)', color: '#F87171', border: '1px solid rgba(220,38,38,0.35)' },
    success: { background: 'rgba(22,163,74,0.14)', color: '#4ADE80', border: '1px solid rgba(22,163,74,0.35)' },
  }
  return (
    <button
      {...props}
      className={`font-inter font-semibold px-5 py-2.5 rounded-full transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ''}`}
      style={{ cursor: 'pointer', fontSize: 13, ...styles[variant], ...props.style }}
    />
  )
}

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', ...style }}>
      {children}
    </div>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const colors = {
    info: { bg: 'rgba(232,93,4,0.1)', border: 'rgba(232,93,4,0.35)', text: 'var(--c-text)' },
    error: { bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.35)', text: '#FCA5A5' },
    success: { bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.35)', text: '#86EFAC' },
  }[tone]
  return (
    <div className="rounded-xl px-4 py-3 font-inter text-sm" style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
      {children}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    draft: { bg: 'rgba(122,110,102,0.18)', fg: '#A8998E', label: 'Draft' },
    pending: { bg: 'rgba(234,179,8,0.15)', fg: '#FACC15', label: 'Pending' },
    approved: { bg: 'rgba(22,163,74,0.15)', fg: '#4ADE80', label: 'Approved' },
    rejected: { bg: 'rgba(220,38,38,0.15)', fg: '#F87171', label: 'Rejected' },
    suspended: { bg: 'rgba(148,163,184,0.15)', fg: '#CBD5E1', label: 'Suspended' },
  }
  const s = map[status] || map.draft
  return (
    <span className="inline-flex items-center gap-1.5 font-inter font-semibold text-xs px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg }} />
      {s.label}
    </span>
  )
}
