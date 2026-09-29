// Arabic first, like the website. English (and the LTR flip that comes with it) is added with the account screen.
export type Lang = 'ar' | 'en'
export type Pair = { ar: string; en: string }

let current: Lang = 'ar'

export const t = (ar: string, en: string) => (current === 'en' ? en : ar)
export const getLang = () => current
export const setLangValue = (l: Lang) => { current = l }

/** A bilingual option list whose stored value is the Arabic label. */
export const label = (list: Pair[], value: string | null | undefined) => {
  if (!value) return ''
  const hit = list.find((p) => p.ar === value || p.en === value)
  return hit ? t(hit.ar, hit.en) : value
}
