import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { store } from './storage'

export type Lang = 'ar' | 'en'
const KEY = 'mk-lang'

// Arabic first, whatever the phone's language: the member switches to English from the home screen or Settings.
function initial(): Lang {
  const saved = store.get(KEY)
  return saved === 'en' ? 'en' : 'ar'
}

// Module-level copy so plain helpers (t, formatDate…) can read it.
// The provider re-renders the whole tree when it changes.
let current: Lang = initial()

/** Pick the Arabic or English string for the current language. */
export const t = (ar: string, en: string) => (current === 'en' ? en : ar)
export const getLang = () => current
export const isRtl = () => current === 'ar'

const Ctx = createContext<{ lang: Lang; rtl: boolean; setLang: (l: Lang) => void }>({ lang: current, rtl: current === 'ar', setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setState] = useState<Lang>(current)
  const setLang = useCallback((l: Lang) => {
    current = l
    store.set(KEY, l)
    setState(l)
  }, [])
  return <Ctx.Provider value={{ lang, rtl: lang === 'ar', setLang }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)

// Switching language rebuilds the whole screen tree (see app/_layout). A screen can ask to be reopened afterwards.
let reopen: string | null = null
export const reopenAfterLangChange = (path: string) => { reopen = path }
export const takeReopen = () => { const p = reopen; reopen = null; return p }

/** A bilingual option list whose stored value is the Arabic label. */
export type Pair = { ar: string; en: string }
export const label = (list: Pair[], value: string | null | undefined) => {
  if (!value) return ''
  const hit = list.find((p) => p.ar === value || p.en === value)
  return hit ? t(hit.ar, hit.en) : value
}
