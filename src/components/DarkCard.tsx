import type { ReactNode } from 'react'
import Logo from './Logo'

/** Dark, centered card used by sign-up and sign-in. */
export default function DarkCard({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}>
      <div className="absolute top-5 start-5"><Logo size="md" /></div>
      <div className="min-h-full flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-[520px] p-6 md:p-12 rounded-2xl md:rounded-2xl flex flex-col gap-7" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export const darkRow = 'flex items-center gap-4 py-3.5'
export const darkRowStyle = { borderBottom: '1px solid var(--c-border)' }
export const darkInputStyle = { flex: 1, minWidth: 0, height: 36, border: 'none', background: 'transparent', fontSize: 16, color: 'var(--c-text)', padding: 0 } as const
