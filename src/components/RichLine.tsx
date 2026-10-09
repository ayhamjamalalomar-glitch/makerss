import { useLayoutEffect, useRef, type ClipboardEvent, type CSSProperties, type KeyboardEvent } from 'react'

// A text block you type into directly, with bold shown as bold (no ** on screen).
// The stored value stays plain text with **bold** marks, the same format the reader renders.

export type Seg = { text: string; bold: boolean }

/** **bold** marks into segments. */
export function parseMarks(md: string): Seg[] {
  const out: Seg[] = []
  for (const part of md.split(/(\*\*[^*\n]+\*\*)/g)) {
    if (!part) continue
    if (/^\*\*[^*\n]+\*\*$/.test(part)) out.push({ text: part.slice(2, -2), bold: true })
    else out.push({ text: part, bold: false })
  }
  return out
}

/** Segments back into text with **bold** marks. Spaces stay outside the marks so the reader keeps them bold. */
export function joinMarks(segs: Seg[]): string {
  const merged: Seg[] = []
  for (const raw of segs) {
    const s = raw.bold ? raw : { ...raw, text: raw.text.replace(/\*{2,}/g, '') }
    if (!s.text) continue
    const last = merged[merged.length - 1]
    if (last && last.bold === s.bold) last.text += s.text
    else merged.push({ ...s })
  }
  return merged.map((s) => {
    const text = s.bold ? s.text : s.text.replace(/\*{2,}/g, '')
    if (!s.bold) return text
    const core = text.replace(/\*/g, '')
    const m = core.match(/^(\s*)([\s\S]*?)(\s*)$/)!
    if (!m[2] || m[2].includes('\n')) return core
    return `${m[1]}**${m[2]}**${m[3]}`
  }).join('')
}

/** Split text with marks at a position counted in visible characters. */
export function splitMarks(md: string, at: number): [string, string] {
  const before: Seg[] = []
  const after: Seg[] = []
  let n = 0
  for (const s of parseMarks(md)) {
    if (n + s.text.length <= at) before.push(s)
    else if (n >= at) after.push(s)
    else {
      before.push({ text: s.text.slice(0, at - n), bold: s.bold })
      after.push({ text: s.text.slice(at - n), bold: s.bold })
    }
    n += s.text.length
  }
  return [joinMarks(before), joinMarks(after)]
}

/** Tidy marks left over from older edits (stray ** pairs). */
export const cleanMarks = (md: string) => joinMarks(parseMarks(md))

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function toHtml(md: string) {
  return parseMarks(md).map((s) => {
    const t = esc(s.bold ? s.text : s.text.replace(/\*{2,}/g, '')).replace(/\n/g, '<br>')
    return s.bold ? `<strong>${t}</strong>` : t
  }).join('')
}

/** Read what is on screen back into text with marks. */
function fromDom(root: HTMLElement): string {
  const segs: Seg[] = []
  const walk = (node: Node, bold: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) { segs.push({ text: (node.textContent || '').replace(/ /g, ' '), bold }); return }
    if (!(node instanceof HTMLElement)) return
    if (node.tagName === 'BR') { segs.push({ text: '\n', bold: false }); return }
    let b = bold
    if (node.tagName === 'B' || node.tagName === 'STRONG') b = true
    const w = node.style?.fontWeight
    if (w === 'normal' || w === '400') b = false
    else if (w === 'bold' || Number(w) >= 600) b = true
    const block = node !== root && (node.tagName === 'DIV' || node.tagName === 'P')
    if (block && segs.length && !segs[segs.length - 1].text.endsWith('\n')) segs.push({ text: '\n', bold: false })
    node.childNodes.forEach((c) => walk(c, b))
  }
  root.childNodes.forEach((c) => walk(c, false))
  return joinMarks(segs).replace(/\n+$/, '')
}

/** Caret or selection inside an element, counted in visible characters. */
export function caretRange(el: HTMLElement): [number, number] | null {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return null
  const r = sel.getRangeAt(0)
  if (!el.contains(r.startContainer)) return null
  const pre = document.createRange()
  pre.selectNodeContents(el)
  pre.setEnd(r.startContainer, r.startOffset)
  const a = pre.toString().length
  pre.setEnd(r.endContainer, r.endOffset)
  return [a, pre.toString().length]
}

/** Put the caret at the start or the end of an element. */
export function placeCaret(el: HTMLElement, at: 'start' | 'end') {
  el.focus()
  const r = document.createRange()
  r.selectNodeContents(el)
  r.collapse(at === 'start')
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(r)
}

export default function RichLine({ value, onChange, placeholder, style, onKeyDown, onFocus, onPaste, inputRef, maxLength = 6000, multiline = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; style?: CSSProperties
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void; onFocus?: () => void; onPaste?: (e: ClipboardEvent<HTMLDivElement>) => void
  inputRef?: (el: HTMLDivElement | null) => void; maxLength?: number; multiline?: boolean
}) {
  const el = useRef<HTMLDivElement | null>(null)
  const shown = useRef<string | null>(null)
  // Only rewrite the screen when the value changed from outside (typing keeps the caret where it is).
  useLayoutEffect(() => {
    const d = el.current
    if (!d || shown.current === value) return
    d.innerHTML = toHtml(value)
    shown.current = value
  }, [value])
  return (
    <div
      ref={(x) => { el.current = x; inputRef?.(x) }}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={multiline}
      aria-placeholder={placeholder}
      data-placeholder={placeholder}
      dir={value ? 'auto' : undefined}
      className="mk-rich w-full outline-none"
      style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: 'var(--c-text)', ...style }}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (multiline && e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); return }
        onKeyDown?.(e)
      }}
      onPaste={(e) => {
        onPaste?.(e)
        if (e.defaultPrevented) return
        // Paste words only, never the formatting of the page they came from.
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n')
        document.execCommand('insertText', false, multiline ? text : text.replace(/\n+/g, ' '))
      }}
      onInput={(e) => {
        const d = e.currentTarget
        let next = fromDom(d)
        if (next.length > maxLength) next = next.slice(0, maxLength)
        if (!next && d.innerHTML) d.innerHTML = ''
        shown.current = next
        onChange(next)
      }}
    />
  )
}
