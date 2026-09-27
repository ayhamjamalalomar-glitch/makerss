import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'ar' | 'en'
const KEY = 'mk-lang'

function initial(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'ar' || saved === 'en') return saved
  } catch { /* storage blocked */ }
  const nav = (navigator.languages?.[0] || navigator.language || 'ar').toLowerCase()
  return nav.startsWith('ar') ? 'ar' : nav.startsWith('en') ? 'en' : 'ar'
}

// Module-level copy so plain helpers (t, formatDate…) can read it.
// The provider re-renders the whole tree when it changes.
let current: Lang = initial()

/** Pick the Arabic or English string for the current language. */
export const t = (ar: string, en: string) => (current === 'en' ? en : ar)
export const getLang = () => current
export const isRtl = () => current === 'ar'

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: current, setLang: () => {} })

function apply(l: Lang) {
  document.documentElement.lang = l
  document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setState] = useState<Lang>(current)
  useEffect(() => { apply(lang) }, [lang])
  const setLang = useCallback((l: Lang) => {
    current = l
    try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
    setState(l)
  }, [])
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)

/** A bilingual option list whose stored value is the Arabic label. */
export type Pair = { ar: string; en: string }
export const label = (list: Pair[], value: string | null | undefined) => {
  if (!value) return ''
  const hit = list.find((p) => p.ar === value || p.en === value)
  return hit ? t(hit.ar, hit.en) : value
}
