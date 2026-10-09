import { useEffect, useState } from 'react'
import { supabase, type Profile } from './supabase'
import { useAuth } from './auth'
import { t } from './i18n'
import { CARD_COLUMNS, type MemberCard } from './data'

// Writing on Makers: articles written on the site, and finished scripts or storyboards shared as PDF.
// Only members with a writing specialty publish (server side: is_writer). The first 5 are reviewed by the team.

export type WritingKind = 'article' | 'script' | 'storyboard'
export type WritingStatus = 'pending' | 'published' | 'rejected' | 'hidden'

/** Specialties that may publish: content writer, screenwriter, storyboard artist. Keep in sync with public.is_writer. */
export const WRITER_SPECIALTY_IDS = [7, 8, 14]
export const WRITING_LIMITS = { title: 140, summary: 400, bodyMin: 200, body: 80000, pdfBytes: 20 * 1024 * 1024 }

export interface Writing {
  id: string
  owner_id: string
  kind: WritingKind
  title: string
  summary: string | null
  body?: string | null
  blocks?: Block[] | null
  slug: string | null
  cover_url: string | null
  file_path: string | null
  file_name: string | null
  visibility: 'public' | 'members'
  completed: boolean
  status: WritingStatus
  review_note: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  owner?: MemberCard | null
}

export const WRITING_KINDS: { key: WritingKind; ar: string; en: string; tag: string }[] = [
  { key: 'article', ar: 'مقال', en: 'Article', tag: 'ARTICLE' },
  { key: 'script', ar: 'سيناريو', en: 'Script', tag: 'SCREENPLAY' },
  { key: 'storyboard', ar: 'ستوري بورد', en: 'Storyboard', tag: 'STORYBOARD' },
]
export const writingKindLabel = (k: WritingKind) => {
  const hit = WRITING_KINDS.find((x) => x.key === k)
  return hit ? t(hit.ar, hit.en) : ''
}
export const writingTag = (k: WritingKind) => WRITING_KINDS.find((x) => x.key === k)?.tag || ''

const OWNER = `owner:profiles!writings_owner_id_fkey(${CARD_COLUMNS})`
const LIST_SELECT = `id, owner_id, kind, title, summary, slug, cover_url, file_path, file_name, visibility, completed, status, review_note, published_at, created_at, updated_at, ${OWNER}`
const FULL_SELECT = `id, owner_id, kind, title, summary, body, blocks, slug, cover_url, file_path, file_name, visibility, completed, status, review_note, published_at, created_at, updated_at, ${OWNER}`

/** Short link: makerss.net/<username>/<first words of the title>. Falls back to /writing/<id>. */
export const writingPath = (w: Pick<Writing, 'id'> & { slug?: string | null; owner?: { username?: string | null } | null }) =>
  w.slug && w.owner?.username ? `/${w.owner.username}/${w.slug}` : `/writing/${w.id}`

// ── Article blocks ───────────────────────────────────────────
export type Block =
  | { id: string; type: 'p' | 'h2' | 'h3' | 'quote'; text: string; size?: number }
  | { id: string; type: 'ul' | 'ol'; items: string[]; size?: number }
  | { id: string; type: 'image'; url: string; caption?: string }
  | { id: string; type: 'video' | 'podcast'; url: string }
  | { id: string; type: 'button'; label: string; url: string }
  | { id: string; type: 'divider' }
export type BlockType = Block['type']

// Text size of a block in px: a default per type, or the writer's own number (12 to 48).
export const BLOCK_SIZE: Record<'p' | 'h2' | 'h3' | 'quote' | 'ul' | 'ol', number> = { p: 18, h2: 26, h3: 20, quote: 21, ul: 18, ol: 18 }
export const SIZE_MIN = 12
export const SIZE_MAX = 48
export const isSized = (b: Block): b is Extract<Block, { text: string }> | Extract<Block, { items: string[] }> => b.type in BLOCK_SIZE
/** The size a block shows at, always inside the allowed range. */
export function blockSize(b: Block): number {
  if (!isSized(b)) return BLOCK_SIZE.p
  const n = Number(b.size)
  return Number.isFinite(n) && n >= SIZE_MIN && n <= SIZE_MAX ? n : BLOCK_SIZE[b.type]
}

export const newId = () => Math.random().toString(36).slice(2, 10)

export function newBlock(type: BlockType): Block {
  const id = newId()
  switch (type) {
    case 'ul': case 'ol': return { id, type, items: [''] }
    case 'image': return { id, type, url: '', caption: '' }
    case 'video': case 'podcast': return { id, type, url: '' }
    case 'button': return { id, type, label: '', url: '' }
    case 'divider': return { id, type }
    default: return { id, type, text: '' }
  }
}

/** Plain text of the blocks (what the server keeps in body). */
export function blocksText(blocks: Block[]) {
  return blocks.map((b) => {
    if ('text' in b) return b.text
    if ('items' in b) return b.items.join('\n')
    if (b.type === 'image') return b.caption || ''
    if (b.type === 'button') return b.label
    return ''
  }).filter((x) => x.trim()).join('\n\n').trim()
}

/** Turn an older markdown-style article into blocks, so it opens in the block editor. */
export function blocksFromBody(body: string): Block[] {
  const out: Block[] = []
  for (const raw of body.replace(/\r\n?/g, '\n').split(/\n{2,}/)) {
    const lines = raw.split('\n').filter((l) => l.trim())
    if (!lines.length) continue
    if (lines.every((l) => /^[-•]\s+/.test(l))) { out.push({ id: newId(), type: 'ul', items: lines.map((l) => l.replace(/^[-•]\s+/, '')) }); continue }
    if (lines.every((l) => /^>\s?/.test(l))) { out.push({ id: newId(), type: 'quote', text: lines.map((l) => l.replace(/^>\s?/, '')).join('\n') }); continue }
    if (lines.length === 1 && /^###\s+/.test(lines[0])) { out.push({ id: newId(), type: 'h3', text: lines[0].replace(/^###\s+/, '') }); continue }
    if (lines.length === 1 && /^##\s+/.test(lines[0])) { out.push({ id: newId(), type: 'h2', text: lines[0].replace(/^##\s+/, '') }); continue }
    for (const l of lines) out.push(lineAsMedia(l) ?? { id: newId(), type: 'p', text: l })
  }
  return out
}

/** A line that is only a link to a video or a podcast becomes that element. */
export function lineAsMedia(line: string): Block | null {
  const u = line.trim()
  if (!/^https?:\/\/\S+$/i.test(u)) return null
  if (videoEmbed(u)) return { id: newId(), type: 'video', url: u }
  if (/^https:\/\/(open\.spotify\.com\/(episode|show)\/|podcasts\.apple\.com\/)/i.test(u)) return { id: newId(), type: 'podcast', url: u }
  return null
}

/** One block per line: plain text blocks holding several lines are split, so every line can be moved, styled or have an element put between. */
export function splitLines(blocks: Block[]): Block[] {
  const out: Block[] = []
  for (const b of blocks) {
    if (b.type !== 'p' || !b.text.includes('\n')) { out.push(b); continue }
    const lines = b.text.split('\n').filter((l) => l.trim())
    if (!lines.length) { out.push({ ...b, text: '' }); continue }
    lines.forEach((l, i) => out.push(lineAsMedia(l) ?? { ...b, id: i === 0 ? b.id : newId(), text: l }))
  }
  return out
}

/** Drop empty blocks and the local ids before saving. */
export function cleanBlocks(blocks: Block[]) {
  return blocks
    .map((b) => ('items' in b ? { ...b, items: b.items.map((x) => x.trim()).filter(Boolean) } : b))
    .filter((b) => {
      if ('text' in b) return b.text.trim().length > 0
      if ('items' in b) return b.items.length > 0
      if (b.type === 'image' || b.type === 'video' || b.type === 'podcast') return !!b.url.trim()
      if (b.type === 'button') return !!b.url.trim() && !!b.label.trim()
      return true
    })
    .map((b) => {
      const { id: _id, ...rest } = b
      return 'text' in rest ? { ...rest, text: rest.text.trim() } : rest
    })
}

/** YouTube or Vimeo link to an embeddable player address. */
export function videoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0`
  return null
}

/** Spotify, Apple Podcasts or YouTube episode link to an embeddable player. */
export function podcastEmbed(url: string): { src: string; height: number } | null {
  const sp = url.match(/open\.spotify\.com\/(episode|show)\/([A-Za-z0-9]+)/i)
  if (sp) return { src: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}`, height: 232 }
  if (/^https:\/\/podcasts\.apple\.com\//i.test(url)) return { src: url.replace('https://podcasts.apple.com/', 'https://embed.podcasts.apple.com/'), height: 175 }
  const v = videoEmbed(url)
  if (v && !v.includes('vimeo')) return { src: v, height: 0 }
  return null
}

export const MEDIA_BASE = 'https://ggtdseujebmfugwcbnyk.supabase.co/storage/v1/object/public/writing-media/'

/** Upload an image for an article (or the share image). Returns its public address. */
export async function uploadWritingMedia(uid: string, file: Blob, ext: string) {
  const path = `${uid}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('writing-media').upload(path, file, { contentType: file.type || `image/${ext}`, upsert: false })
  if (error) throw error
  return MEDIA_BASE + path
}

export async function setWritingCover(id: string, url: string) {
  await supabase.rpc('set_writing_cover', { p_id: id, p_url: url })
}

export async function getWritingBySlug(username: string, slug: string) {
  const { data: prof } = await supabase.from('profiles').select('id').ilike('username', username).maybeSingle()
  if (!prof) return null
  const { data } = await supabase.from('writings').select(FULL_SELECT).eq('owner_id', (prof as { id: string }).id).eq('slug', slug.toLowerCase()).maybeSingle()
  return (data as unknown as Writing) || null
}

/** Client hint only (the server decides): an approved member with a writing specialty. */
export const isWriterProfile = (p: Pick<Profile, 'status' | 'specialty_ids'> | null | undefined) =>
  !!p && p.status === 'approved' && (p.specialty_ids || []).some((id) => WRITER_SPECIALTY_IDS.includes(id))

// The server decides who writes (specialty, or an exception granted by the team in writer_grants).
const writerCache = new Map<string, Promise<WriterStatus>>()
/** True when the signed-in member may publish writing. */
export function useIsWriter() {
  const { profile } = useAuth()
  const id = profile?.status === 'approved' ? profile.id : null
  const [on, setOn] = useState(() => isWriterProfile(profile))
  useEffect(() => {
    if (!id) { setOn(false); return }
    let live = true
    if (!writerCache.has(id)) writerCache.set(id, myWriterStatus())
    writerCache.get(id)!.then((s) => { if (live) setOn(s.writer) })
    return () => { live = false }
  }, [id])
  return on
}

export async function listWritings(opts: { kind?: WritingKind; owner?: string; limit?: number; all?: boolean; status?: WritingStatus } = {}) {
  let q = supabase.from('writings').select(LIST_SELECT).order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(opts.limit ?? 60)
  if (opts.status) q = q.eq('status', opts.status)
  else if (!opts.all) q = q.eq('status', 'published')
  if (opts.kind) q = q.eq('kind', opts.kind)
  if (opts.owner) q = q.eq('owner_id', opts.owner)
  const { data, error } = await q
  if (error) throw error
  return (data as unknown as Writing[]) || []
}

export async function getWriting(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data } = await supabase.from('writings').select(FULL_SELECT).eq('id', id).maybeSingle()
  return (data as unknown as Writing) || null
}

export interface WriterStatus { writer: boolean; reviewed: number; trusted: boolean }
export async function myWriterStatus(): Promise<WriterStatus> {
  const { data } = await supabase.rpc('my_writer_status')
  return (data as WriterStatus) || { writer: false, reviewed: 0, trusted: false }
}

/** Short-lived link to a script or storyboard PDF. Storage rules decide who may open it. */
export async function writingFileUrl(path: string) {
  const { data } = await supabase.storage.from('writings').createSignedUrl(path, 60 * 60)
  return data?.signedUrl || null
}

export async function uploadWritingPdf(uid: string, file: File) {
  const path = `${uid}/${crypto.randomUUID()}.pdf`
  const { error } = await supabase.storage.from('writings').upload(path, file, { contentType: 'application/pdf', upsert: false })
  if (error) throw error
  return path
}

export async function removeWritingFile(path: string | null | undefined) {
  if (path) await supabase.storage.from('writings').remove([path]).then(() => null, () => null)
}

export interface WritingInput {
  kind: WritingKind
  title: string
  summary: string
  body: string
  blocks?: unknown[] | null
  file_path: string | null
  file_name: string | null
  visibility: 'public' | 'members'
  completed: boolean
}

export async function saveWriting(id: string | null, p: WritingInput) {
  const { data, error } = await supabase.rpc('save_writing', { p_id: id, p })
  if (error) throw error
  return data as string
}

export async function deleteWriting(id: string) {
  const { data, error } = await supabase.rpc('delete_writing', { p_id: id })
  if (error) throw error
  await removeWritingFile(data as string | null)
}

/** Readable message for an error from save_writing. */
export function writingError(e: unknown) {
  const m = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e)
  if (m.includes('not a writer')) return t('النشر في الكتابات متاح لأصحاب تخصصات الكتابة: كاتب محتوى، كاتب سيناريو، رسام ستوري بورد.', 'Writing is open to members with a writing specialty: content writer, screenwriter, storyboard artist.')
  if (m.includes('only finished work')) return t('ننشر السيناريوهات والستوري بورد المنجزة فقط. أكّد أن العمل مكتمل.', 'We only publish finished scripts and storyboards. Confirm the work is complete.')
  if (m.includes('too many writings')) return t('وصلت إلى حد خمس كتابات جديدة في اليوم. أكمل غداً.', 'You reached five new writings today. Continue tomorrow.')
  if (m.includes('hidden by the team')) return t('أخفى فريق Makers هذه الكتابة، ولا يمكن تعديلها.', 'The Makers team hid this writing. It cannot be edited.')
  if (m.includes('bad image')) return t('صورة غير صالحة. ارفعها من جديد.', 'An image is not valid. Upload it again.')
  if (m.includes('bad video')) return t('رابط الفيديو يجب أن يكون من YouTube أو Vimeo.', 'Video links must be from YouTube or Vimeo.')
  if (m.includes('bad podcast')) return t('رابط البودكاست يجب أن يكون من Spotify أو Apple Podcasts أو YouTube.', 'Podcast links must be from Spotify, Apple Podcasts or YouTube.')
  if (m.includes('bad size')) return t('حجم النص يجب أن يكون بين 12 و48.', 'Text size must be between 12 and 48.')
  if (m.includes('bad link') || m.includes('bad button')) return t('كل زر يحتاج نصاً قصيراً ورابطاً يبدأ بـ https.', 'Each button needs a short label and a link starting with https.')
  if (m.includes('too many blocks') || m.includes('block too long') || m.includes('bad list')) return t('المقال طويل جداً. قسّمه إلى مقالين.', 'The article is too long. Split it in two.')
  if (m.includes('bad file')) return t('ارفع ملف PDF من جديد.', 'Upload the PDF again.')
  if (m.includes('writing_content')) return t(`المقال يحتاج ${WRITING_LIMITS.bodyMin} حرفاً على الأقل.`, `An article needs at least ${WRITING_LIMITS.bodyMin} characters.`)
  if (m.includes('title')) return t('العنوان بين 3 و140 حرفاً.', 'The title must be 3 to 140 characters.')
  return t('تعذّر الحفظ. حاول مرة أخرى.', 'Could not save. Try again.')
}

/** Reading time in minutes (about 200 words a minute, Arabic and English alike). */
export function readingMinutes(body: string | null | undefined) {
  const words = (body || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** First lines of an article as plain text, for cards and previews. */
export function excerpt(w: Pick<Writing, 'summary' | 'body'>, n = 180) {
  const src = w.summary || (w.body || '').replace(/^#{2,3}\s+/gm, '').replace(/^>\s?/gm, '').replace(/\*\*|__|\*/g, '')
  const v = src.replace(/\s+/g, ' ').trim()
  return v.length > n ? `${v.slice(0, n - 1).trimEnd()}…` : v
}
