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
const LIST_SELECT = `id, owner_id, kind, title, summary, file_path, file_name, visibility, completed, status, review_note, published_at, created_at, updated_at, ${OWNER}`
const FULL_SELECT = `id, owner_id, kind, title, summary, body, file_path, file_name, visibility, completed, status, review_note, published_at, created_at, updated_at, ${OWNER}`

export const writingPath = (w: Pick<Writing, 'id'>) => `/writing/${w.id}`

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
