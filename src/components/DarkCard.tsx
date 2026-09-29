import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import Logo from './Logo'
import { Corners } from './mk'
import { FilmStrip, RecBadge } from './cine'
import { listMembers } from '../lib/data'

/** Full-screen stage for sign-up and sign-in: faces of real members roll by behind a glass slate. */
export default function DarkCard({ children }: { children: ReactNode }) {
  const [faces, setFaces] = useState<string[]>([])
  useEffect(() => {
    listMembers(40).then((list) => setFaces(list.map((m) => m.avatar_url).filter(Boolean) as string[])).catch(() => null)
  }, [])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'var(--c-screen)', color: 'var(--c-text)' }}>
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        {faces.length > 0 && (
          <div className="absolute inset-0 flex flex-col justify-center gap-6" style={{ transform: 'rotate(-7deg) scale(1.3)', opacity: 0.4 }}>
            <FilmStrip images={faces} speed={120} height={160} />
            <FilmStrip images={[...faces].reverse()} speed={140} reverse height={160} />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(5,5,7,0.7), #050507 85%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 10%, rgba(var(--c-accent-rgb),0.14), transparent 45%)' }} />
      </div>
      <div className="absolute top-5 start-5 z-10"><Logo size="md" color="#F3EFE7" /></div>
      <div className="absolute top-6 end-5 z-10 hidden sm:block"><RecBadge light /></div>
      <div className="relative min-h-full flex items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative w-full max-w-[520px] p-6 md:p-12 rounded-2xl flex flex-col gap-7"
          style={{ background: 'color-mix(in srgb, var(--c-surface) 88%, transparent)', border: '1px solid var(--c-border-mid)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}
        >
          <Corners size={14} inset={10} color="rgba(var(--c-accent-rgb),0.6)" w={1.5} />
          {children}
        </motion.div>
      </div>
    </div>
  )
}

export const darkRow = 'flex items-center gap-4 py-3.5'
export const darkRowStyle = { borderBottom: '1px solid var(--c-border)' }
export const darkInputStyle = { flex: 1, minWidth: 0, height: 36, border: 'none', background: 'transparent', fontSize: 16, color: 'var(--c-text)', padding: 0 } as const
