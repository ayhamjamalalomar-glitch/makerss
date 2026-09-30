import { useEffect, useState } from 'react'
import { supabase, type Profile, type Specialty } from './supabase'
import { t } from './i18n'
import { contentLabel } from './constants'

let cache: Specialty[] | null = null

export function useSpecialties() {
  const [list, setList] = useState<Specialty[]>(cache || [])
  useEffect(() => {
    if (cache) return
    supabase
      .from('specialties')
      .select('*')
      .eq('is_active', true)
      .order('sort')
      .then(({ data }) => {
        cache = (data as Specialty[]) || []
        setList(cache)
      })
  }, [])
  return list
}

export function specName(list: Specialty[], id: number) {
  const s = list.find((x) => x.id === id)
  return s ? t(s.name_ar || s.name_en, s.name_en || s.name_ar || '') : ''
}

export function roleLine(list: Specialty[], ids: number[] | null | undefined, other?: string | null) {
  const names = (ids || []).map((id) => specName(list, id)).filter(Boolean)
  if (other) names.push(other)
  return names.join(t(' و', ' & '))
}

type LineFields = Pick<Profile, 'specialty_ids' | 'other_specialty'> & Partial<Pick<Profile, 'account_type' | 'content_types'>>

export const isCreator = (m: Partial<Pick<Profile, 'account_type'>> | null | undefined) => m?.account_type === 'creator'

/** What a member does, in one line: specialties for production makers, content categories for creators. */
export function memberLine(list: Specialty[], m: LineFields | null | undefined) {
  if (!m) return ''
  if (isCreator(m)) {
    const kinds = (m.content_types || []).map(contentLabel).filter(Boolean)
    return kinds.length ? `${t('صانع محتوى', 'Creator')} · ${kinds.join(t('، ', ', '))}` : t('صانع محتوى', 'Content creator')
  }
  return roleLine(list, m.specialty_ids, m.other_specialty)
}

/** Short label for cards: first specialty, or first content category for creators. */
export function firstRole(list: Specialty[], m: LineFields | null | undefined) {
  if (!m) return ''
  if (isCreator(m)) return m.content_types?.[0] ? contentLabel(m.content_types[0]) : t('صانع محتوى', 'Content creator')
  return m.specialty_ids?.[0] ? specName(list, m.specialty_ids[0]) : m.other_specialty || ''
}
