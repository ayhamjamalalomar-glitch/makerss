import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
      style={{ color: 'var(--c-text)', background: 'transparent', border: 'none', borderRadius: 0, boxShadow: 'none', outline: 'none', ...style }}
    />
  )
}

export interface BlockEditorApi {
  insert: (type: BlockType) => void
  bold: () => void
  /** While an element from the panel is dragged: show where it would land (null clears). */
  hover: (x: number, y: number) => boolean
  /** Drop a dragged element; false when the pointer is outside the article. */
  dropNew: (type: BlockType, x: number, y: number) => boolean
  clear: () => void
}

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

  // ── drag and drop ──
  // Blocks move by their handle (pointer drag); elements from the side panel drop in with HTML drag.
  const box = useRef<HTMLDivElement>(null)
  const rows = useRef(new Map<string, HTMLDivElement>())
  const [drag, setDrag] = useState<{ id: string } | null>(null)
  const [drop, setDrop] = useState<{ index: number; y: number } | null>(null)
  const [menu, setMenu] = useState<{ kind: 'insert'; index: number } | { kind: 'block'; id: string } | null>(null)

  const dropAt = (clientY: number) => {
    const el = box.current
    if (!el) return null
    const top = el.getBoundingClientRect().top
    const list = latest.current
    for (let i = 0; i < list.length; i++) {
      const r = rows.current.get(list[i].id)?.getBoundingClientRect()
      if (!r) continue
      if (clientY < r.top + r.height / 2) return { index: i, y: r.top - top - 10 }
    }
    const last = rows.current.get(list[list.length - 1]?.id)?.getBoundingClientRect()
    return { index: list.length, y: last ? last.bottom - top + 10 : 0 }
  }

  const insertAt = (index: number, b: Block) => {
    const list = [...latest.current]
    const here = list[index - 1]
    // Dropping right after an empty paragraph fills that paragraph instead of leaving it behind.
    if (here && here.type === 'p' && !here.text.trim() && b.type !== 'p') list.splice(index - 1, 1, b)
    else list.splice(index, 0, b)
    set(list)
    pending.current = { id: listFocusId(b), at: 'start' }
  }

  const startDrag = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    const y0 = e.clientY
    let moving = false
    const btn = e.currentTarget
    btn.setPointerCapture(e.pointerId)
    const onMove = (ev: PointerEvent) => {
      if (!moving && Math.abs(ev.clientY - y0) > 4) { moving = true; setDrag({ id }); setMenu(null) }
      if (moving) setDrop(dropAt(ev.clientY))
    }
    const onUp = (ev: PointerEvent) => {
      btn.removeEventListener('pointermove', onMove)
      btn.removeEventListener('pointerup', onUp)
      btn.removeEventListener('pointercancel', onUp)
      if (!moving) { setMenu((m) => (m && m.kind === 'block' && m.id === id ? null : { kind: 'block', id })); return }
      const target = dropAt(ev.clientY)
      setDrag(null); setDrop(null)
      if (!target) return
      const list = [...latest.current]
      const from = list.findIndex((b) => b.id === id)
      if (from < 0) return
      const [item] = list.splice(from, 1)
      list.splice(target.index > from ? target.index - 1 : target.index, 0, item)
      set(list)
    }
    btn.addEventListener('pointermove', onMove)
    btn.addEventListener('pointerup', onUp)
    btn.addEventListener('pointercancel', onUp)
  }

  const inside = (x: number, y: number) => {
    const r = box.current?.getBoundingClientRect()
    return !!r && x > r.left - 90 && x < r.right + 90 && y > r.top - 60 && y < r.bottom + 80
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
    hover: (x, y) => {
      if (!inside(x, y)) { setDrop(null); return false }
      setDrop(dropAt(y))
      return true
    },
    dropNew: (type, x, y) => {
      setDrop(null)
      if (!inside(x, y)) return false
      const at = dropAt(y)
      if (!at) return false
      insertAt(at.index, newBlock(type))
      return true
    },
    clear: () => setDrop(null),
  }

  return (
    <div
      ref={box}
      className="relative"
    >
      <AnimatePresence initial={false}>
        {blocks.map((b, i) => (
          <motion.div
            key={b.id}
            layout="position"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: drag?.id === b.id ? 0.35 : 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.7 }}
          >
            <Row
              rowRef={(el) => { if (el) rows.current.set(b.id, el); else rows.current.delete(b.id) }}
              focused={focusId === b.id}
              dragging={!!drag}
              onFocus={() => setFocusId(b.id)}
              onHandle={startDrag(b.id)}
              onPlus={() => setMenu({ kind: 'insert', index: i + 1 })}
              menu={menu?.kind === 'block' && menu.id === b.id ? (
                <BlockMenu
                  onUp={i > 0 ? () => { move(b.id, -1); setMenu(null) } : undefined}
                  onDown={i < blocks.length - 1 ? () => { move(b.id, 1); setMenu(null) } : undefined}
                  onRemove={() => { remove(b.id); setMenu(null) }}
                  onClose={() => setMenu(null)}
                />
              ) : null}
              mobileTools={{ onUp: i > 0 ? () => move(b.id, -1) : undefined, onDown: i < blocks.length - 1 ? () => move(b.id, 1) : undefined, onRemove: () => remove(b.id) }}
            >
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
            <Gap
              last={i === blocks.length - 1}
              hidden={!!drag || !!drop}
              open={menu?.kind === 'insert' && menu.index === i + 1}
              onOpen={() => setMenu({ kind: 'insert', index: i + 1 })}
            >
              {menu?.kind === 'insert' && menu.index === i + 1 && !drag && (
                <InsertMenu onPick={(type) => { insertAt(i + 1, newBlock(type)); setMenu(null) }} onClose={() => setMenu(null)} />
              )}
            </Gap>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* where a dragged block or element will land */}
      <AnimatePresence>
        {drop && (
          <motion.div
            key="drop"
            className="absolute inset-x-0 pointer-events-none flex items-center gap-2"
            style={{ top: 0, height: 2 }}
            initial={{ opacity: 0, y: drop.y }}
            animate={{ opacity: 1, y: drop.y }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 700, damping: 45 }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--c-accent)', boxShadow: '0 0 0 3px rgba(var(--c-accent-rgb),0.25)' }} />
            <span className="flex-1 h-[2px] rounded-full" style={{ background: 'var(--c-accent)' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** The element a block puts the caret in: the block itself, or its first list item. */
const listFocusId = (b: Block) => ('items' in b ? `${b.id}:0` : b.id)

const ghost = { background: 'none', border: 'none', color: 'inherit' } as const

/** One block: a handle beside it (drag to move, click for options) and a + to add below. */
function Row({ children, rowRef, focused, dragging, onFocus, onHandle, onPlus, menu, mobileTools }: {
  children: ReactNode; rowRef: (el: HTMLDivElement | null) => void; focused: boolean; dragging: boolean
  onFocus: () => void; onHandle: (e: React.PointerEvent<HTMLButtonElement>) => void; onPlus: () => void; menu: ReactNode
  mobileTools: { onUp?: () => void; onDown?: () => void; onRemove: () => void }
}) {
  const tool = 'w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/[0.07]'
  return (
    <div ref={rowRef} className="group relative" onFocusCapture={onFocus}>
      <div
        className={`absolute hidden md:flex items-center gap-0.5 transition-opacity duration-150 ${menu ? 'opacity-100' : focused && !dragging ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'}`}
        style={{ insetInlineStart: -64, top: 6, color: 'var(--c-muted)' }}
      >
        <button type="button" className={`${tool} cursor-pointer`} style={ghost} onClick={onPlus} aria-label={t('أضف تحته', 'Add below')} title={t('أضف عنصراً تحته', 'Add an element below')}>
          <ElementIcon size={15} d="M10 4.5v11M4.5 10h11" />
        </button>
        <button type="button" className={`${tool} cursor-grab active:cursor-grabbing touch-none`} style={ghost} onPointerDown={onHandle} aria-label={t('اسحب لتحريكه، أو اضغط للخيارات', 'Drag to move, click for options')} title={t('اسحب لتحريكه، أو اضغط للخيارات', 'Drag to move, click for options')}>
          <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">{[3, 8, 13].flatMap((y) => [3, 9].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="currentColor" />))}</svg>
        </button>
      </div>
      {menu && <div className="absolute z-30" style={{ insetInlineStart: -64, top: 38 }}>{menu}</div>}
      {focused && (
        <div className="flex md:hidden gap-1 mb-1.5 justify-end" style={{ color: 'var(--c-muted)' }}>
          <button type="button" className={`${tool} cursor-pointer disabled:opacity-25`} style={{ background: 'var(--c-surface-alt)', border: 'none', color: 'inherit' }} disabled={!mobileTools.onUp} onClick={mobileTools.onUp} aria-label={t('لفوق', 'Move up')}><ElementIcon size={14} d="M10 15V5M5.5 9.5L10 5l4.5 4.5" /></button>
          <button type="button" className={`${tool} cursor-pointer disabled:opacity-25`} style={{ background: 'var(--c-surface-alt)', border: 'none', color: 'inherit' }} disabled={!mobileTools.onDown} onClick={mobileTools.onDown} aria-label={t('لتحت', 'Move down')}><ElementIcon size={14} d="M10 5v10M5.5 10.5L10 15l4.5-4.5" /></button>
          <button type="button" className={`${tool} cursor-pointer`} style={{ background: 'var(--c-surface-alt)', border: 'none', color: '#F87171' }} onClick={mobileTools.onRemove} aria-label={t('احذف', 'Remove')}><ElementIcon size={14} d="M5 6h10M8 6V4.5h4V6M6.5 6l.7 9.5h5.6l.7-9.5" /></button>
        </div>
      )}
      {children}
    </div>
  )
}

/** The space under a block: hover it and a line with + appears, to add right there. */
function Gap({ last, hidden, open, onOpen, children }: { last: boolean; hidden: boolean; open: boolean; onOpen: () => void; children?: ReactNode }) {
  return (
    <div className={`group/gap relative hidden md:flex items-center ${last ? 'h-16' : 'h-5'}`}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={t('أضف عنصراً هنا', 'Add an element here')}
        className={`absolute inset-x-0 flex items-center gap-3 cursor-pointer transition-opacity duration-150 ${hidden ? 'opacity-0 pointer-events-none' : open ? 'opacity-100' : last ? 'opacity-0 group-hover/gap:opacity-100' : 'opacity-0 group-hover/gap:opacity-100'}`}
        style={{ background: 'none', border: 'none', padding: 0, height: '100%', color: 'var(--c-accent)', top: 0 }}
      >
        <span className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(var(--c-accent-rgb),0.45))' }} />
        <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-150 group-hover/gap:scale-110" style={{ background: 'var(--c-surface-alt)', border: '1px solid rgba(var(--c-accent-rgb),0.5)' }}>
          <ElementIcon size={14} d="M10 4.5v11M4.5 10h11" />
        </span>
        {last && <span className="text-[12.5px] shrink-0" style={{ color: 'var(--c-muted)' }}>{t('أضف عنصراً', 'Add an element')}</span>}
        <span className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(var(--c-accent-rgb),0.45))' }} />
      </button>
      {children && <div className="absolute z-30 left-1/2 -translate-x-1/2" style={{ top: last ? 52 : 24 }}>{children}</div>}
    </div>
  )
}

function useOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const fn = useRef(onClose)
  fn.current = onClose
  useEffect(() => {
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) fn.current() }
    const key = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') fn.current() }
    const id = setTimeout(() => document.addEventListener('mousedown', down), 0)
    document.addEventListener('keydown', key)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [])
  return ref
}

const POP = { initial: { opacity: 0, y: -4, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.14, ease: [0.2, 0.7, 0.2, 1] as const } }
const popStyle: CSSProperties = { background: 'var(--c-surface)', border: '1px solid var(--c-border-mid)', boxShadow: '0 18px 50px rgba(0,0,0,0.55)' }

/** Pick an element to add at this spot. */
export function InsertMenu({ onPick, onClose }: { onPick: (t: BlockType) => void; onClose: () => void }) {
  const ref = useOutside(onClose)
  return (
    <motion.div ref={ref} {...POP} className="w-[300px] rounded-xl p-2 grid grid-cols-2 gap-0.5" style={popStyle} role="menu">
      {ELEMENTS.map((e) => (
        <button key={e.type} type="button" role="menuitem" onMouseDown={(ev) => ev.preventDefault()} onClick={() => onPick(e.type)}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-start cursor-pointer transition-colors hover:bg-white/[0.06]"
          style={{ background: 'none', border: 'none', color: 'var(--c-text)' }}>
          <span style={{ color: 'var(--c-muted)' }}><ElementIcon size={16} d={e.icon} /></span>
          {t(e.ar, e.en)}
        </button>
      ))}
    </motion.div>
  )
}

function BlockMenu({ onUp, onDown, onRemove, onClose }: { onUp?: () => void; onDown?: () => void; onRemove: () => void; onClose: () => void }) {
  const ref = useOutside(onClose)
  const item = 'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-[13px] text-start cursor-pointer transition-colors hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-default'
  return (
    <motion.div ref={ref} {...POP} className="w-[180px] rounded-xl p-1.5 flex flex-col" style={popStyle} role="menu">
      <button type="button" role="menuitem" className={item} style={{ background: 'none', border: 'none', color: 'var(--c-text)' }} disabled={!onUp} onClick={onUp}><ElementIcon size={15} d="M10 15V5M5.5 9.5L10 5l4.5 4.5" />{t('حرّكه لفوق', 'Move up')}</button>
      <button type="button" role="menuitem" className={item} style={{ background: 'none', border: 'none', color: 'var(--c-text)' }} disabled={!onDown} onClick={onDown}><ElementIcon size={15} d="M10 5v10M5.5 10.5L10 15l4.5-4.5" />{t('حرّكه لتحت', 'Move down')}</button>
      <span className="my-1 h-px" style={{ background: 'var(--c-border)' }} />
      <button type="button" role="menuitem" className={item} style={{ background: 'none', border: 'none', color: '#F87171' }} onClick={onRemove}><ElementIcon size={15} d="M5 6h10M8 6V4.5h4V6M6.5 6l.7 9.5h5.6l.7-9.5" />{t('احذف', 'Delete')}</button>
    </motion.div>
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
            style={{ fontSize: 17.5, lineHeight: 2.05, color: 'var(--c-text-2)', background: 'transparent', border: 'none', borderRadius: 0, height: 'auto', outline: 'none' }}
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
