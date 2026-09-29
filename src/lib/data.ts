import { supabase, type Profile } from './supabase'
import { t, type Pair } from './i18n'
import { quickThumb } from './thumbs'
import { CONTENT_TYPES } from './constants'

/** Lightweight public card fields for a member. */
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

export const PLATFORMS = ['YouTube', 'Instagram', 'TikTok', 'Snapchat', 'Facebook', 'X', 'Netflix', 'Shahid', 'OSN+', 'TV', 'Cinema', 'Vimeo']

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

/** Image to show for a project: uploaded poster, else the video's thumbnail. */
export const posterOf = (p: Pick<Project, 'thumb_url' | 'thumbnail_url' | 'url'>) => p.thumb_url || p.thumbnail_url || quickThumb(p.url) || null

export async function listProjects(opts: { limit?: number; kind?: string; search?: string } = {}) {
  let q = supabase.from('works').select(PROJECT_SELECT).order('created_at', { ascending: false }).limit(opts.limit ?? 60)
  if (opts.kind) q = q.eq('kind', opts.kind)
  if (opts.search) q = q.ilike('title', `%${opts.search.replace(/[%_,()]/g, ' ')}%`)
  const { data, error } = await q
  if (error) throw error
  return ((data as unknown as Project[]) || []).map(clean)
}

export async function getProject(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data } = await supabase.from('works').select(PROJECT_SELECT).eq('id', id).maybeSingle()
  return data ? clean(data as unknown as Project) : null
}

/** Projects a member owns or is credited on (newest first). */
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

/** The role a member played on a project. */
export function roleOn(p: Project, profileId: string) {
  const c = p.credits?.find((x) => x.profile_id === profileId)
  return c?.role || (p.owner_id === profileId ? p.role : null) || ''
}

export async function listMembers(limit = 200) {
  const { data } = await supabase.from('profiles').select(CARD_COLUMNS).eq('status', 'approved').order('is_founding', { ascending: false }).order('created_at', { ascending: true }).limit(limit)
  return (data as unknown as MemberCard[]) || []
}

/** Makers ranked by activity this week. `ranked` is false when nobody had any activity,
 *  so the page does not show a ranking that means nothing. */
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

export type ProjectHit = Pick<Project, 'id' | 'title' | 'year' | 'thumb_url' | 'thumbnail_url' | 'url'>

/** Site search on the server: Arabic spelling variants and small typos still match (see `search_makers`). */
export async function searchSite(query: string, limits = { makers: 4, projects: 3 }) {
  const q = query.trim()
  if (q.length < 2) return { makers: [] as MemberCard[], projects: [] as ProjectHit[] }
  const lower = q.toLowerCase()
  const kinds = CONTENT_TYPES.filter((c) => `${c.ar} ${c.en}`.toLowerCase().includes(lower)).map((c) => c.key)
  const [m, w] = await Promise.all([
    supabase.rpc('search_makers', { p_q: q, p_limit: limits.makers, p_kinds: kinds }),
    supabase.rpc('search_projects', { p_q: q, p_limit: limits.projects }),
  ])
  const mIds = ((m.data as { id: string }[]) || []).map((r) => r.id)
  const wIds = ((w.data as { id: string }[]) || []).map((r) => r.id)
  const [cards, works] = await Promise.all([
    mIds.length ? supabase.from('profiles').select(CARD_COLUMNS).in('id', mIds) : Promise.resolve({ data: [] }),
    wIds.length ? supabase.from('works').select('id, title, year, thumb_url, thumbnail_url, url').in('id', wIds) : Promise.resolve({ data: [] }),
  ])
  const byOrder = <T extends { id: string }>(ids: string[], rows: T[]) => ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as T[]
  return {
    makers: byOrder(mIds, (cards.data as unknown as MemberCard[]) || []),
    projects: byOrder(wIds, (works.data as unknown as ProjectHit[]) || []),
  }
}

export const totalFollowers =(m: Pick<Profile, 'followers'>) => Object.values(m.followers || {}).reduce((s, n) => s + (Number(n) || 0), 0)

export function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`
  return String(n)
}

export const displayName = (m: Pick<Profile, 'full_name' | 'name_ar'> | null | undefined) =>
  (m ? t(m.name_ar || m.full_name || '', m.full_name || m.name_ar || '') : '') || t('عضو', 'Member')

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
  review_note: string | null
  applicants_count: number
  created_at: string
  owner?: MemberCard | null
}

export const CALL_SELECT = `*, owner:profiles!open_calls_owner_id_fkey(${CARD_COLUMNS})`

export async function listOpenCalls(limit = 50) {
  const { data } = await supabase.from('open_calls').select(CALL_SELECT).eq('status', 'open').order('created_at', { ascending: false }).limit(limit)
  return (data as unknown as OpenCall[]) || []
}

export const CALL_COLORS: Record<string, string> = {
  commercial: '#E85D04', film: '#2563EB', short: '#0891B2', series: '#9333EA', documentary: '#2563EB',
  'music-video': '#DC2626', social: '#059669', program: '#D97706', 'ai-film': '#7C3AED', 'ai-video': '#A855F7', other: '#7A6E66',
}
