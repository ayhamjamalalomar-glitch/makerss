import type { ReactNode } from 'react'
import Link from '../lib/router'
import { LogoMark } from './Dock'

/** Dark, centered card used by sign-up and sign-in. */
export default function DarkCard({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: '#0B0B0B', color: '#F2F2F0' }}>
      <Link to="/" aria-label="Makers" className="absolute top-5 right-5 w-[60px] h-[60px] md:w-[72px] md:h-[72px] rounded-full flex items-center justify-center" style={{ background: '#151514', border: '1px solid #242422' }}>
        <LogoMark size={26} />
      </Link>
      <div className="min-h-full flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-[520px] p-6 md:p-12 rounded-[32px] md:rounded-[40px] flex flex-col gap-7" style={{ background: '#151514', border: '1px solid #242422' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export const darkRow = 'flex items-center gap-4 py-3.5'
export const darkRowStyle = { borderBottom: '1px solid #2E2E2C' }
export const darkInputStyle = { flex: 1, minWidth: 0, height: 36, border: 'none', background: 'transparent', fontSize: 16, color: '#F2F2F0', padding: 0 } as const
