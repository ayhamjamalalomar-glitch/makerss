import { useCallback, useEffect, useState } from 'react'
import { supabase, type Profile } from './supabase'
import { t } from './i18n'

export interface Progress {
  steps: { key: string; label: string; done: boolean }[]
  count: number
  ratio: number
}

export function computeProgress(p: Profile | null, worksCount: number): Progress {
  const hasSpec = !!p && ((p.specialty_ids?.length ?? 0) > 0 || !!p.other_specialty) && !!p.country
  const steps = [
    { key: 'account', label: t('الحساب', 'Account'), done: !!p },
    { key: 'photo', label: t('الصورة', 'Photo'), done: !!p?.avatar_url },
    { key: 'spec', label: t('التخصص والدولة', 'Role & country'), done: hasSpec },
    { key: 'bio', label: t('النبذة', 'Bio'), done: !!p?.bio && p.bio.trim().length >= 20 },
    { key: 'works', label: t('3 أعمال', '3 works'), done: worksCount >= 3 },
  ]
  const count = steps.filter((s) => s.done).length
  return { steps, count, ratio: count / steps.length }
}

/** Works count + new requests count for the signed-in member. */
export function useMyCounts(userId: string | undefined) {
  const [works, setWorks] = useState(0)
  const [newRequests, setNewRequests] = useState(0)

  const refresh = useCallback(async () => {
    if (!userId) return
    const [w, r] = await Promise.all([
      supabase.from('works').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
      supabase.from('contact_requests').select('id', { count: 'exact', head: true }).eq('to_id', userId).eq('status', 'new'),
    ])
    setWorks(w.count ?? 0)
    setNewRequests(r.count ?? 0)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { works, newRequests, refresh }
}
