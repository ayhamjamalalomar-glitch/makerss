import { useEffect, useState } from 'react'
import { supabase, type Specialty } from './supabase'
import { t } from './i18n'

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
