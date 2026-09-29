import { useCallback, useEffect, useState } from 'react'
import { supabase, type Profile } from './supabase'
import { t } from './i18n'

export interface Progress {
  steps: { key: string; label: string; done: boolean }[]
  count: number
  ratio: number
}

/** A creator has at least one account link with a follower count. */
export const hasAudience = (p: Pick<Profile, 'socials' | 'followers'> | null) =>
  !!p && Object.entries(p.socials || {}).some(([k, v]) => !!v && Number(p.followers?.[k] || 0) > 0)

export function computeProgress(p: Profile | null, worksCount: number): Progress {
  const creator = p?.account_type === 'creator'
  const hasSpec = !!p && !!p.country && (creator ? (p.content_types?.length ?? 0) > 0 : (p.specialty_ids?.length ?? 0) > 0 || !!p.other_specialty)
  const steps = [
    { key: 'account', label: t('الحساب', 'Account'), done: !!p },
    { key: 'photo', label: t('الصورة', 'Photo'), done: !!p?.avatar_url },
    { key: 'spec', label: creator ? t('المحتوى والدولة', 'Content & country') : t('التخصص والدولة', 'Role & country'), done: hasSpec },
    { key: 'bio', label: t('النبذة', 'Bio'), done: !!p?.bio && p.bio.trim().length >= 20 },
    creator
      ? { key: 'accounts', label: t('حساباتك', 'Your accounts'), done: hasAudience(p) }
      : { key: 'works', label: t('3 أعمال', '3 works'), done: worksCount >= 3 },
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
