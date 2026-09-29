import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type Tone = 'success' | 'error' | 'info'
interface Toast { id: number; text: string; tone: Tone }

const Ctx = createContext<(text: string, tone?: Tone) => void>(() => {})

/** Short confirmation messages ("Link copied", "Saved") that slide in above the bottom bar. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const seq = useRef(0)
  const push = useCallback((text: string, tone: Tone = 'success') => {
    const id = ++seq.current
    setItems((cur) => [...cur.slice(-2), { id, text, tone }])
    setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), tone === 'error' ? 5000 : 2600)
  }, [])

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed inset-x-0 z-[80] flex flex-col items-center gap-2 pointer-events-none px-4" style={{ bottom: 92 }} role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {items.map((x) => (
            <motion.div
              key={x.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-semibold max-w-full"
              style={{ background: 'var(--c-surface)', color: 'var(--c-text)', border: '1px solid var(--c-border-mid)', boxShadow: '0 10px 30px var(--c-shadow)' }}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: x.tone === 'error' ? '#F87171' : x.tone === 'info' ? 'var(--c-surface-alt)' : 'var(--c-accent)' }}>
                {x.tone === 'error' ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 5.2l2 2L8 3" stroke={x.tone === 'info' ? 'var(--c-text)' : 'var(--c-on-accent)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </span>
              <span dir="auto">{x.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
