// Data access for the app. Same queries as the website (src/lib/data.ts), so both read the same way.
import { useEffect, useState } from 'react'
import { contentLabel } from './constants'
import { t, type Pair } from './i18n'
import { PUBLIC_PROFILE_COLUMNS, supabase, type Profile, type Specialty } from './supabase'

export const CARD_COLUMNS = 'id, full_name, name_ar, username, avatar_url, is_founding, specialty_ids, other_specialty, city, country, followers, created_at, available, is_featured, status, account_type, content_types'
export type MemberCard = Pick<Profile, 'id' | 'full_name' | 'name_ar' | 'username' | 'avatar_url' | 'is_founding' | 'specialty_ids' | 'other_specialty' | 'city' | 'country' | 'followers' | 'created_at' | 'available' | 'is_featured' | 'status' | 'account_type' | 'content_types'>

export const PROJECT_KINDS: (Pair & { key: string })[] = [
  { key: 'commercial', ar: 'إعلان', en: 'Commercial' },
  { key: 'film', ar: 'فيلم', en: 'Film' },
  { key: 'short', ar: 'فيلم قصير', en: 'Short film' },
  { key: 'series', ar: 'مسلسل', en: 'Series' },
  { key: 'documentary', ar: 'وثائقي', en: 'Documentary' },
  { key: 'music-video', ar: 'فيديو كليب', en: 'Music video' },
  { key: 'social', ar: 'محتوى سوشال', en: 'Social content' },
  { key: 'program', ar: 'برنامج', en: 'Show' },
  { key: 'ai-film', ar: 'فيلم ذكاء اصطناعي', en: 'AI film' },
  { key: 'ai-video', ar: 'فيديو ذكاء اصطناعي', en: 'AI video' },
  { key: 'other', ar: 'أخرى', en: 'Other' },
]
export const kindLabel = (k: string | null | undefined) => {
  const hit = PROJECT_KINDS.find((x) => x.key === k)
  return hit ? t(hit.ar, hit.en) : ''
}

export interface CreditRow {
  id: string
  role: string | null
  status: 'unconfirmed' | 'confirmed' | 'disputed'
  profile_id: string | null
  display_name: string | null
  created_at: string
  profile?: MemberCard | null
}

export interface Project {
  id: string
  owner_id: string
  title: string
  brand: string | null
  year: number | null
  thumb_url: string | null
  thumbnail_url: string | null
  platforms: string[] | null
  description: string | null
  url: string | null
  role: string | null
  kind: string | null
  created_at: string
  owner?: MemberCard | null
  credits?: CreditRow[]
}

const PROJECT_SELECT = `id, owner_id, title, brand, year, thumb_url, thumbnail_url, platforms, description, url, role, kind, created_at,
  owner:profiles!works_owner_id_fkey(${CARD_COLUMNS}),
  credits(id, role, status, profile_id, display_name, created_at, profile:profiles!credits_profile_id_fkey(${CARD_COLUMNS}))`

function clean(p: Project): Project {
  const credits = (p.credits || [])
    .filter((c) => c.status !== 'disputed' && (c.display_name || (c.profile && c.profile.status === 'approved')))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  return { ...p, credits }
}

export function youtubeId(url: string | null | undefined) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i)
  return m ? m[1] : null
}
const quickThumb = (url: string | null | undefined) => {
  const yt = youtubeId(url)
  return yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null
}

/** Poster: uploaded image, else the video's thumbnail. */
export const posterOf = (p: Pick<Project, 'thumb_url' | 'thumbnail_url' | 'url'>) => p.thumb_url || p.thumbnail_url || quickThumb(p.url) || null
/** Wide frame for the project page: the video's own frame when there is one. */
export const frameOf = (p: Pick<Project, 'thumb_url' | 'thumbnail_url' | 'url'>) => {
  const yt = youtubeId(p.url)
  return yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : p.thumbnail_url || null
}

export async function listProjects(opts: { limit?: number; kind?: string } = {}) {
  let q = supabase.from('works').select(PROJECT_SELECT).order('created_at', { ascending: false }).limit(opts.limit ?? 60)
  if (opts.kind) q = q.eq('kind', opts.kind)
  const { data, error } = await q
  if (error) throw error
  return ((data as unknown as Project[]) || []).map(clean)
}

/** Newest project from each maker, like "New on Makers" on the website. */
export async function newOnMakers(count = 10) {
  const list = await listProjects({ limit: 80 })
  const seen = new Set<string>()
  return list.filter((p) => (seen.has(p.owner_id) ? false : (seen.add(p.owner_id), true))).slice(0, count)
}

export async function getProject(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data } = await supabase.from('works').select(PROJECT_SELECT).eq('id', id).maybeSingle()
  return data ? clean(data as unknown as Project) : null
}

export async function projectsForMember(profileId: string) {
  const [own, credited] = await Promise.all([
    supabase.from('works').select(PROJECT_SELECT).eq('owner_id', profileId),
    supabase.from('credits').select('work_id').eq('profile_id', profileId).neq('status', 'disputed'),
  ])
  const ownList = ((own.data as unknown as Project[]) || []).map(clean)
  const ids = ((credited.data as { work_id: string }[]) || []).map((c) => c.work_id).filter((id) => !ownList.some((p) => p.id === id))
  let extra: Project[] = []
  if (ids.length) {
    const { data } = await supabase.from('works').select(PROJECT_SELECT).in('id', ids)
    extra = ((data as unknown as Project[]) || []).map(clean)
  }
  return [...ownList, ...extra].sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || b.created_at.localeCompare(a.created_at))
}

export function roleOn(p: Project, profileId: string) {
  const c = p.credits?.find((x) => x.profile_id === profileId)
  return c?.role || (p.owner_id === profileId ? p.role : null) || ''
}

export async function listMembers(limit = 200) {
  const { data } = await supabase.from('profiles').select(CARD_COLUMNS).eq('status', 'approved').order('is_founding', { ascending: false }).order('created_at', { ascending: true }).limit(limit)
  return (data as unknown as MemberCard[]) || []
}

export async function getMember(username: string) {
  const { data } = await supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).ilike('username', username).maybeSingle()
  return (data as unknown as Profile) || null
}

export async function topMakers(limit = 10): Promise<{ list: MemberCard[]; ranked: boolean }> {
  const { data } = await supabase.rpc('top_makers', { p_limit: limit })
  const rows = (data as { id: string; score: number }[]) || []
  const active = rows.filter((r) => r.score > 0)
  const ids = (active.length ? active : rows).map((r) => r.id)
  if (!ids.length) return { list: [], ranked: false }
  const { data: cards } = await supabase.from('profiles').select(CARD_COLUMNS).in('id', ids)
  const list = (cards as unknown as MemberCard[]) || []
  return { list: ids.map((id) => list.find((m) => m.id === id)).filter(Boolean) as MemberCard[], ranked: active.length > 0 }
}

/** Server search with Arabic spelling variants (same RPCs as the website header). */
export async function searchMakers(query: string, limit = 30) {
  const q = query.trim()
  if (q.length < 2) return []
  const { data } = await supabase.rpc('search_makers', { p_q: q, p_limit: limit, p_kinds: [] })
  const ids = ((data as { id: string }[]) || []).map((r) => r.id)
  if (!ids.length) return []
  const { data: cards } = await supabase.from('profiles').select(CARD_COLUMNS).in('id', ids)
  const list = (cards as unknown as MemberCard[]) || []
  return ids.map((id) => list.find((m) => m.id === id)).filter(Boolean) as MemberCard[]
}

export const totalFollowers = (m: Pick<Profile, 'followers'>) => Object.values(m.followers || {}).reduce((s, n) => s + (Number(n) || 0), 0)

export function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`
  return String(n)
}

export const displayName = (m: Pick<Profile, 'full_name' | 'name_ar'> | null | undefined) =>
  (m ? t(m.name_ar || m.full_name || '', m.full_name || m.name_ar || '') : '') || t('عضو', 'Member')

// ── Specialties ──────────────────────────────────────────────
let specCache: Specialty[] | null = null
export function useSpecialties() {
  const [list, setList] = useState<Specialty[]>(specCache || [])
  useEffect(() => {
    if (specCache) return
    supabase.from('specialties').select('*').eq('is_active', true).order('sort').then(({ data }) => {
      specCache = (data as Specialty[]) || []
      setList(specCache)
    })
  }, [])
  return list
}
export const specName = (list: Specialty[], id: number) => {
  const s = list.find((x) => x.id === id)
  return s ? t(s.name_ar || s.name_en, s.name_en || s.name_ar || '') : ''
}
export const isCreator = (m: Partial<Pick<Profile, 'account_type'>> | null | undefined) => m?.account_type === 'creator'

/** Short label for cards: first specialty, or first content category for creators. */
export function firstRole(list: Specialty[], m: Pick<Profile, 'specialty_ids' | 'other_specialty'> & Partial<Pick<Profile, 'account_type' | 'content_types'>>) {
  if (isCreator(m)) return m.content_types?.[0] ? contentLabel(m.content_types[0]) : t('صانع محتوى', 'Content creator')
  return m.specialty_ids?.[0] ? specName(list, m.specialty_ids[0]) : m.other_specialty || ''
}
/** Full line of what a member does. */
export function memberLine(list: Specialty[], m: Pick<Profile, 'specialty_ids' | 'other_specialty'> & Partial<Pick<Profile, 'account_type' | 'content_types'>>) {
  if (isCreator(m)) {
    const kinds = (m.content_types || []).map(contentLabel).filter(Boolean)
    return kinds.length ? `${t('صانع محتوى', 'Creator')} · ${kinds.join(t('، ', ', '))}` : t('صانع محتوى', 'Content creator')
  }
  const names = (m.specialty_ids || []).map((id) => specName(list, id)).filter(Boolean)
  if (m.other_specialty) names.push(m.other_specialty)
  return names.join(t(' و', ' & '))
}

// ── Open calls ───────────────────────────────────────────────
export interface OpenCall {
  id: string
  owner_id: string
  title: string
  org: string | null
  kind: string | null
  description: string
  role_ids: number[]
  country: string | null
  city: string | null
  remote: boolean
  budget: string | null
  deadline: string | null
  status: 'pending' | 'open' | 'closed' | 'rejected'
  applicants_count: number
  created_at: string
  owner?: MemberCard | null
}

const CALL_SELECT = `*, owner:profiles!open_calls_owner_id_fkey(${CARD_COLUMNS})`

export async function listOpenCalls(limit = 50) {
  const { data } = await supabase.from('open_calls').select(CALL_SELECT).eq('status', 'open').order('created_at', { ascending: false }).limit(limit)
  return (data as unknown as OpenCall[]) || []
}

export async function getOpenCall(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data } = await supabase.from('open_calls').select(CALL_SELECT).eq('id', id).maybeSingle()
  return (data as unknown as OpenCall) || null
}

/** Small hook: run an async loader and keep { data, loading, error, reload }. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: boolean }>({ data: null, loading: true, error: false })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: false }))
    fn()
      .then((data) => alive && setState({ data, loading: false, error: false }))
      .catch(() => alive && setState({ data: null, loading: false, error: true }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return { ...state, reload: () => setTick((n) => n + 1) }
}
