import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { t } from '../lib/i18n'
import { toJpeg } from '../lib/image'
import { newBlock, newId, podcastEmbed, uploadWritingMedia, videoEmbed, type Block, type BlockType } from '../lib/writings'
import { BlockView } from './writing'

// The article editor: a column of blocks that look like the published article while you type.
// Text blocks are plain textareas (no HTML is ever stored); **bold** is the only inline mark.

export const ELEMENTS: { type: BlockType; ar: string; en: string; icon: string; group: 'basic' | 'media' }[] = [
  { type: 'p', ar: 'نص', en: 'Text', icon: 'M4 5h12M10 5v11', group: 'basic' },
  { type: 'h2', ar: 'عنوان رئيسي', en: 'Heading', icon: 'M4 4v12M12 4v12M4 10h8M15 9l2-1.5V16', group: 'basic' },
  { type: 'h3', ar: 'عنوان فرعي', en: 'Subheading', icon: 'M4 4v12M11 4v12M4 10h7M14.5 9.5c.6-1 2.8-1 2.8.6 0 1-1 1.4-1.6 1.6.8.2 1.8.6 1.8 1.7 0 1.8-2.4 1.9-3.1.8', group: 'basic' },
  { type: 'ul', ar: 'قائمة نقطية', en: 'Bullet list', icon: 'M8 5h9M8 10h9M8 15h9M3.5 5h.5M3.5 10h.5M3.5 15h.5', group: 'basic' },
  { type: 'ol', ar: 'قائمة مرقّمة', en: 'Numbered list', icon: 'M8 5h9M8 10h9M8 15h9M3 4l1-.5V7M3 11.5c.3-.8 2-.8 2 .2S3 13.5 3 14h2', group: 'basic' },
  { type: 'quote', ar: 'اقتباس', en: 'Quote', icon: 'M5 13V9.5A3.5 3.5 0 018.5 6M5 13h3v-3H5M12 13V9.5A3.5 3.5 0 0115.5 6M12 13h3v-3h-3', group: 'basic' },
  { type: 'divider', ar: 'فاصل', en: 'Divider', icon: 'M3 10h3M8.5 10h3M14 10h3', group: 'basic' },
  { type: 'image', ar: 'صورة', en: 'Image', icon: 'M3 4.5h14v11H3zM3 13l4-4 3 3 2-2 5 4.5M13 7.5h.5', group: 'media' },
  { type: 'video', ar: 'فيديو', en: 'Video', icon: 'M3 5h14v10H3zM8.5 8v4l3.5-2z', group: 'media' },
  { type: 'podcast', ar: 'بودكاست', en: 'Podcast', icon: 'M10 3a2.5 2.5 0 012.5 2.5V10a2.5 2.5 0 01-5 0V5.5A2.5 2.5 0 0110 3zM5 9.5a5 5 0 0010 0M10 14.5V17', group: 'media' },
  { type: 'button', ar: 'زر برابط', en: 'Button', icon: 'M3 7h14v6H3zM7 10h6', group: 'media' },
]

export function ElementIcon({ d, size = 18 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

const isText = (b: Block): b is Extract<Block, { text: string }> => 'text' in b
const TEXT_STYLE: Record<'p' | 'h2' | 'h3' | 'quote', CSSProperties> = {
  p: { fontSize: 17.5, lineHeight: 2.05, color: 'var(--c-text-2)' },
  h2: { fontSize: 26, lineHeight: 1.4, fontWeight: 800, color: 'var(--c-text)', fontFamily: "'Alexandria', 'Readex Pro', sans-serif" },
  h3: { fontSize: 20, lineHeight: 1.45, fontWeight: 700, color: 'var(--c-text)', fontFamily: "'Alexandria', 'Readex Pro', sans-serif" },
  quote: { fontSize: 21, lineHeight: 1.8, fontWeight: 500, color: 'var(--c-text)' },
}
const PLACEHOLDER: Record<'p' | 'h2' | 'h3' | 'quote', [string, string]> = {
  p: ['اكتب هنا…', 'Write here…'],
  h2: ['عنوان رئيسي', 'Heading'],
  h3: ['عنوان فرعي', 'Subheading'],
  quote: ['اقتباس', 'Quote'],
}

/** Textarea that grows with its text. */
export function AutoText({ value, onChange, placeholder, style, className = '', onKeyDown, onFocus, inputRef, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; style?: CSSProperties; className?: string
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void; onFocus?: () => void; inputRef?: (el: HTMLTextAreaElement | null) => void; maxLength?: number
}) {
  const el = useRef<HTMLTextAreaElement | null>(null)
  useLayoutEffect(() => {
    const a = el.current
    if (!a) return
    a.style.height = '0px'
    a.style.height = `${a.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={(x) => { el.current = x; inputRef?.(x) }}
      dir={value ? 'auto' : undefined}
      rows={1}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      className={`w-full block resize-none outline-none bg-transparent border-none p-0 overflow-hidden ${className}`}
      style={{ color: 'var(--c-text)', background: 'transparent', border: 'none', borderRadius: 0, boxShadow: 'none', ...style }}
    />
  )
}

export interface BlockEditorApi { insert: (type: BlockType) => void; bold: () => void }

export default function BlockEditor({ blocks, onChange, uid, apiRef }: { blocks: Block[]; onChange: (b: Block[]) => void; uid: string; apiRef: { current: BlockEditorApi | null } }) {
  const refs = useRef(new Map<string, HTMLTextAreaElement | HTMLInputElement>())
  const [focusId, setFocusId] = useState<string | null>(null)
  const pending = useRef<{ id: string; at?: 'start' | 'end' } | null>(null)
  const latest = useRef(blocks)
  latest.current = blocks

  useEffect(() => {
    const p = pending.current
    if (!p) return
    const el = refs.current.get(p.id)
    if (!el) return
    pending.current = null
    el.focus()
    const pos = p.at === 'start' ? 0 : el.value.length
    el.setSelectionRange(pos, pos)
  })

  const set = (next: Block[]) => onChange(next)
  const patch = (id: string, change: Partial<Block>) => set(latest.current.map((b) => (b.id === id ? ({ ...b, ...change } as Block) : b)))
  const remove = (id: string) => {
    const list = latest.current
    const i = list.findIndex((b) => b.id === id)
    const next = list.filter((b) => b.id !== id)
    set(next.length ? next : [newBlock('p')])
    const prev = next[Math.max(0, i - 1)]
    if (prev) pending.current = { id: listFocusId(prev), at: 'end' }
  }
  const move = (id: string, dir: -1 | 1) => {
    const list = [...latest.current]
    const i = list.findIndex((b) => b.id === id)
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    set(list)
  }
  const insertAfter = (afterId: string | null, b: Block) => {
    const list = [...latest.current]
    const i = afterId ? list.findIndex((x) => x.id === afterId) : list.length - 1
    // An empty paragraph where you are gets replaced by the new element.
    const here = list[i]
    if (here && here.type === 'p' && !here.text.trim() && b.type !== 'p') list.splice(i, 1, b)
    else list.splice(i + 1, 0, b)
    set(list)
    pending.current = { id: listFocusId(b), at: 'start' }
  }

  apiRef.current = {
    insert: (type) => insertAfter(focusId && latest.current.some((b) => b.id === focusId) ? focusId : null, newBlock(type)),
    bold: () => {
      const el = focusId ? refs.current.get(focusId) : null
      if (!el || !(el instanceof HTMLTextAreaElement)) return
      const b = latest.current.find((x) => x.id === focusId)
      if (!b || !isText(b)) return
      const { selectionStart: a, selectionEnd: z, value } = el
      const sel = value.slice(a, z) || t('نص عريض', 'bold text')
      patch(b.id, { text: value.slice(0, a) + '**' + sel + '**' + value.slice(z) })
      pending.current = { id: b.id, at: 'end' }
    },
  }

  const reg = (id: string) => (el: HTMLTextAreaElement | HTMLInputElement | null) => { if (el) refs.current.set(id, el); else refs.current.delete(id) }

  const textKeys = (b: Extract<Block, { text: string }>) => (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    if (e.key === 'Enter' && !e.shiftKey && b.type !== 'quote') {
      e.preventDefault()
      const pos = el.selectionStart
      const before = b.text.slice(0, pos)
      const after = b.text.slice(el.selectionEnd)
      const nb: Block = { id: newId(), type: 'p', text: after }
      const list = latest.current.map((x) => (x.id === b.id ? { ...x, text: before } : x)) as Block[]
      const i = list.findIndex((x) => x.id === b.id)
      list.splice(i + 1, 0, nb)
      set(list)
      pending.current = { id: nb.id, at: 'start' }
    } else if (e.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0) {
      const list = latest.current
      const i = list.findIndex((x) => x.id === b.id)
      if (i <= 0) return
      const prev = list[i - 1]
      e.preventDefault()
      if (!b.text) { remove(b.id); return }
      if (isText(prev)) {
        const merged = list.filter((x) => x.id !== b.id).map((x) => (x.id === prev.id ? { ...x, text: (x as typeof prev).text + b.text } : x)) as Block[]
        set(merged)
        pending.current = { id: prev.id, at: 'end' }
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {blocks.map((b, i) => (
        <Row key={b.id} focused={focusId === b.id} onUp={i > 0 ? () => move(b.id, -1) : undefined} onDown={i < blocks.length - 1 ? () => move(b.id, 1) : undefined} onRemove={() => remove(b.id)} onFocus={() => setFocusId(b.id)}>
          {isText(b) ? (
            <div style={b.type === 'quote' ? { borderInlineStart: '3px solid var(--c-accent)', paddingInlineStart: 22 } : undefined}>
              <AutoText inputRef={reg(b.id)} value={b.text} maxLength={6000} onChange={(v) => patch(b.id, { text: v })} onKeyDown={textKeys(b)} onFocus={() => setFocusId(b.id)} placeholder={t(...PLACEHOLDER[b.type])} style={TEXT_STYLE[b.type]} />
            </div>
          ) : b.type === 'ul' || b.type === 'ol' ? (
            <ListEdit b={b} reg={reg} onFocus={() => setFocusId(b.id)} onChange={(items) => patch(b.id, { items })} onEmpty={() => remove(b.id)} onExit={() => insertAfter(b.id, newBlock('p'))} />
          ) : b.type === 'image' ? (
            <ImageEdit b={b} uid={uid} onChange={(c) => patch(b.id, c)} />
          ) : b.type === 'video' || b.type === 'podcast' ? (
            <EmbedEdit b={b} reg={reg} onChange={(url) => patch(b.id, { url })} />
          ) : b.type === 'button' ? (
            <ButtonEdit b={b} reg={reg} onChange={(c) => patch(b.id, c)} />
          ) : (
            <BlockView b={b} />
          )}
        </Row>
      ))}
    </div>
  )
}

/** The element a block puts the caret in: the block itself, or its first list item. */
const listFocusId = (b: Block) => ('items' in b ? `${b.id}:0` : b.id)

function Row({ children, focused, onUp, onDown, onRemove, onFocus }: { children: ReactNode; focused: boolean; onUp?: () => void; onDown?: () => void; onRemove: () => void; onFocus: () => void }) {
  const tool = 'w-7 h-7 rounded-md flex items-center justify-center cursor-pointer disabled:opacity-25 disabled:cursor-default hover:bg-white/5'
  return (
    <div className="group relative" onFocusCapture={onFocus}>
      <div className={`absolute top-0 -end-11 hidden md:flex flex-col gap-0.5 transition-opacity ${focused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ color: 'var(--c-muted)' }}>
        <button type="button" className={tool} style={{ background: 'none', border: 'none', color: 'inherit' }} disabled={!onUp} onClick={onUp} aria-label={t('لفوق', 'Move up')}><ElementIcon size={14} d="M10 15V5M5.5 9.5L10 5l4.5 4.5" /></button>
        <button type="button" className={tool} style={{ background: 'none', border: 'none', color: 'inherit' }} disabled={!onDown} onClick={onDown} aria-label={t('لتحت', 'Move down')}><ElementIcon size={14} d="M10 5v10M5.5 10.5L10 15l4.5-4.5" /></button>
        <button type="button" className={tool} style={{ background: 'none', border: 'none', color: '#F87171' }} onClick={onRemove} aria-label={t('احذف', 'Remove')}><ElementIcon size={14} d="M5 6h10M8 6V4.5h4V6M6.5 6l.7 9.5h5.6l.7-9.5" /></button>
      </div>
      {focused && (
        <div className="flex md:hidden gap-1 mb-1.5 justify-end" style={{ color: 'var(--c-muted)' }}>
          <button type="button" className={tool} style={{ background: 'var(--c-surface-alt)', border: 'none', color: 'inherit' }} disabled={!onUp} onClick={onUp} aria-label={t('لفوق', 'Move up')}><ElementIcon size={14} d="M10 15V5M5.5 9.5L10 5l4.5 4.5" /></button>
          <button type="button" className={tool} style={{ background: 'var(--c-surface-alt)', border: 'none', color: 'inherit' }} disabled={!onDown} onClick={onDown} aria-label={t('لتحت', 'Move down')}><ElementIcon size={14} d="M10 5v10M5.5 10.5L10 15l4.5-4.5" /></button>
          <button type="button" className={tool} style={{ background: 'var(--c-surface-alt)', border: 'none', color: '#F87171' }} onClick={onRemove} aria-label={t('احذف', 'Remove')}><ElementIcon size={14} d="M5 6h10M8 6V4.5h4V6M6.5 6l.7 9.5h5.6l.7-9.5" /></button>
        </div>
      )}
      {children}
    </div>
  )
}

function ListEdit({ b, reg, onFocus, onChange, onEmpty, onExit }: {
  b: Extract<Block, { items: string[] }>; reg: (id: string) => (el: HTMLInputElement | null) => void
  onFocus: () => void; onChange: (items: string[]) => void; onEmpty: () => void; onExit: () => void
}) {
  const focusItem = (i: number) => requestAnimationFrame(() => {
    const el = document.querySelector<HTMLInputElement>(`[data-item="${b.id}:${i}"]`)
    el?.focus()
  })
  return (
    <div className="flex flex-col gap-2" style={{ paddingInlineStart: b.type === 'ol' ? 28 : 22 }}>
      {b.items.map((it, i) => (
        <div key={i} className="relative">
          {b.type === 'ol'
            ? <span aria-hidden="true" className="absolute font-mono text-[13px]" style={{ insetInlineStart: -28, top: 9, color: 'var(--c-accent)' }}>{String(i + 1).padStart(2, '0')}</span>
            : <span aria-hidden="true" className="absolute rotate-45" style={{ width: 6, height: 6, background: 'var(--c-accent)', insetInlineStart: -18, top: 15 }} />}
          <input
            ref={reg(`${b.id}:${i}`)}
            data-item={`${b.id}:${i}`}
            dir={it ? 'auto' : undefined}
            value={it}
            maxLength={1000}
            onFocus={onFocus}
            placeholder={t('عنصر في القائمة', 'List item')}
            onChange={(e) => onChange(b.items.map((x, j) => (j === i ? e.target.value : x)))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (!it.trim() && i === b.items.length - 1) { onChange(b.items.slice(0, -1).length ? b.items.slice(0, -1) : ['']); if (b.items.length > 1) onExit(); else onEmpty(); return }
                const next = [...b.items]
                next.splice(i + 1, 0, '')
                onChange(next)
                focusItem(i + 1)
              } else if (e.key === 'Backspace' && !it) {
                e.preventDefault()
                if (b.items.length === 1) return onEmpty()
                onChange(b.items.filter((_, j) => j !== i))
                focusItem(Math.max(0, i - 1))
              }
            }}
            className="w-full bg-transparent outline-none border-none p-0"
            style={{ fontSize: 17.5, lineHeight: 2.05, color: 'var(--c-text-2)', background: 'transparent', border: 'none', borderRadius: 0, height: 'auto' }}
          />
        </div>
      ))}
    </div>
  )
}

function ImageEdit({ b, uid, onChange }: { b: Extract<Block, { type: 'image' }>; uid: string; onChange: (c: Partial<Block>) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pick = async (f: File | undefined | null) => {
    if (!f) return
    setError(null)
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) return setError(t('الصورة يجب أن تكون JPG أو PNG أو WebP أو GIF.', 'Use a JPG, PNG, WebP or GIF image.'))
    setBusy(true)
    try {
      const gif = f.type === 'image/gif'
      if (gif && f.size > 8 * 1024 * 1024) throw new Error('size')
      const blob = gif ? f : await toJpeg(f, 2000)
      onChange({ url: await uploadWritingMedia(uid, blob, gif ? 'gif' : 'jpg') })
    } catch {
      setError(t('تعذّر رفع الصورة. جرّب صورة أصغر.', 'Could not upload the image. Try a smaller one.'))
    }
    setBusy(false)
  }
  if (!b.url) {
    return (
      <label className="rounded-xl p-7 flex flex-col items-center justify-center gap-2 text-center cursor-pointer" style={{ background: 'var(--c-surface)', border: '1.5px dashed var(--c-border-mid)', minHeight: 150 }}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]) }}>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
        <span style={{ color: 'var(--c-accent)' }}><ElementIcon size={24} d="M3 4.5h14v11H3zM3 13l4-4 3 3 2-2 5 4.5M13 7.5h.5" /></span>
        <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{busy ? t('جارٍ الرفع…', 'Uploading…') : t('اسحب صورة هنا أو اضغط لاختيارها', 'Drop an image here or click to choose')}</span>
        {error && <span className="text-xs" style={{ color: '#F87171' }}>{error}</span>}
      </label>
    )
  }
  return (
    <figure className="m-0 flex flex-col gap-2">
      <img src={b.url} alt={b.caption || ''} className="w-full rounded-xl block" style={{ border: '1px solid var(--c-border)' }} />
      <input dir={b.caption ? 'auto' : undefined} value={b.caption || ''} maxLength={300} onChange={(e) => onChange({ caption: e.target.value })} placeholder={t('وصف الصورة (اختياري)', 'Caption (optional)')} className="w-full bg-transparent outline-none border-none text-[13px] text-center" style={{ color: 'var(--c-muted)', background: 'transparent', border: 'none' }} />
    </figure>
  )
}

function EmbedEdit({ b, reg, onChange }: { b: Extract<Block, { type: 'video' | 'podcast' }>; reg: (id: string) => (el: HTMLInputElement | null) => void; onChange: (url: string) => void }) {
  const [draft, setDraft] = useState(b.url)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(!b.url)
  const video = b.type === 'video'
  const add = () => {
    const u = draft.trim()
    const ok = video ? !!videoEmbed(u) : !!podcastEmbed(u)
    if (!ok) return setError(video ? t('الصق رابطاً من YouTube أو Vimeo.', 'Paste a YouTube or Vimeo link.') : t('الصق رابط حلقة من Spotify أو Apple Podcasts أو YouTube.', 'Paste an episode link from Spotify, Apple Podcasts or YouTube.'))
    setError(null)
    onChange(u)
    setEditing(false)
  }
  if (editing) {
    return (
      <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <span className="text-[13px] font-semibold flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
          <ElementIcon size={16} d={ELEMENTS.find((e) => e.type === b.type)!.icon} />
          {video ? t('رابط الفيديو', 'Video link') : t('رابط الحلقة', 'Episode link')}
        </span>
        <div className="flex gap-2">
          <input ref={reg(b.id)} dir="ltr" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            placeholder={video ? 'https://youtube.com/watch?v=…' : 'https://open.spotify.com/episode/…'}
            className="flex-1 min-w-0 rounded-lg px-3 outline-none text-sm" style={{ height: 42, background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
          <button type="button" onClick={add} className="rounded-lg px-4 text-sm font-semibold cursor-pointer" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)', border: 'none' }}>{t('إضافة', 'Add')}</button>
        </div>
        <span className="text-xs" style={{ color: error ? '#F87171' : 'var(--c-muted)' }}>{error || (video ? t('YouTube أو Vimeo', 'YouTube or Vimeo') : t('Spotify أو Apple Podcasts أو YouTube', 'Spotify, Apple Podcasts or YouTube'))}</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      <BlockView b={b} />
      <button type="button" onClick={() => { setDraft(b.url); setEditing(true) }} className="self-start text-xs font-semibold cursor-pointer" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--c-accent)' }}>{t('غيّر الرابط', 'Change link')}</button>
    </div>
  )
}

function ButtonEdit({ b, reg, onChange }: { b: Extract<Block, { type: 'button' }>; reg: (id: string) => (el: HTMLInputElement | null) => void; onChange: (c: Partial<Block>) => void }) {
  const bad = b.url.trim() !== '' && !/^https?:\/\/\S+$/i.test(b.url.trim())
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
      <div className="flex flex-col sm:flex-row gap-2">
        <input ref={reg(b.id)} dir={b.label ? 'auto' : undefined} value={b.label} maxLength={60} onChange={(e) => onChange({ label: e.target.value })} placeholder={t('نص الزر، مثلاً: شاهد الفيلم', 'Button text, e.g. Watch the film')}
          className="sm:w-56 rounded-lg px-3 outline-none text-sm" style={{ height: 42, background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
        <input dir="ltr" value={b.url} maxLength={500} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://"
          className="flex-1 min-w-0 rounded-lg px-3 outline-none text-sm" style={{ height: 42, background: 'var(--c-surface-alt)', border: `1px solid ${bad ? '#F87171' : 'var(--c-border)'}`, color: 'var(--c-text)' }} />
      </div>
      {b.label.trim() && b.url.trim() && !bad && <div className="flex justify-center pt-1"><BlockView b={b} /></div>}
      {bad && <span className="text-xs" style={{ color: '#F87171' }}>{t('الرابط يبدأ بـ https://', 'The link starts with https://')}</span>}
    </div>
  )
}
