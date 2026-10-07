import { Fragment, type CSSProperties, type ReactNode } from 'react'
import Link from '../lib/router'
import { t } from '../lib/i18n'
import { displayName } from '../lib/data'
import { formatDateAr } from '../lib/constants'
import { excerpt, writingKindLabel, writingPath, writingTag, type Writing } from '../lib/writings'

// One cover style for every writing: the title set big on the dark screen, the kind in amber,
// the author at the foot. Members only type the title; the cover is drawn from it.

const BONE = '#F3EFE7'

function titleSize(title: string, wide: boolean) {
  const n = [...title].length
  const base = n <= 24 ? 11.5 : n <= 45 ? 9.2 : n <= 80 ? 7.4 : 6
  return `${(wide ? base * 0.62 : base).toFixed(2)}cqw`
}

export function WritingCover({ w, ratio = '4/5', wide = false, className = '', style }: {
  w: Pick<Writing, 'kind' | 'title'> & { owner?: Writing['owner'] }
  ratio?: string
  wide?: boolean
  className?: string
  style?: CSSProperties
}) {
  const author = w.owner ? displayName(w.owner) : ''
  return (
    <div className={`relative overflow-hidden select-none ${className}`} style={{ aspectRatio: ratio, containerType: 'inline-size', background: 'var(--c-screen)', color: BONE, ...style }} aria-hidden="true">
      {/* projector light from the top corner */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 70% at 100% 0%, rgba(242,179,61,0.20) 0%, rgba(242,179,61,0.05) 35%, transparent 65%)' }} />
      <div className="absolute inset-0 rtl:-scale-x-100" style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />
      <div className="absolute inset-0 flex flex-col" style={{ padding: wide ? '4.2cqw 5cqw' : '7cqw' }}>
        <div className="flex items-center justify-between gap-3" dir="ltr">
          <span className="font-mono font-semibold" style={{ fontSize: wide ? '1.25cqw' : '2.9cqw', letterSpacing: '0.22em', color: '#F2B33D' }}>{writingTag(w.kind)}</span>
          <span className="font-archivo" style={{ fontSize: wide ? '1.25cqw' : '2.8cqw', letterSpacing: '0.06em', color: 'rgba(243,239,231,0.55)' }}>MAKERS</span>
        </div>
        <div className="flex-1 flex items-end">
          <h3
            dir="auto"
            className="m-0 font-display w-full"
            style={{ fontSize: titleSize(w.title, wide), fontWeight: 800, lineHeight: 1.18, letterSpacing: '-0.015em', color: BONE, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}
          >
            {w.title || t('العنوان', 'Title')}
          </h3>
        </div>
        <div className="flex items-center gap-[2.4cqw]" style={{ marginTop: wide ? '2.4cqw' : '5cqw' }}>
          <span style={{ width: wide ? '4cqw' : '9cqw', height: 2, background: '#F2B33D', flexShrink: 0 }} />
          <span className="truncate" style={{ fontSize: wide ? '1.45cqw' : '3.3cqw', color: 'rgba(243,239,231,0.72)' }}>{author || writingKindLabel(w.kind)}</span>
        </div>
      </div>
    </div>
  )
}

const STATUS_LABEL: Record<Writing['status'], [string, string, string]> = {
  pending: ['قيد المراجعة', 'In review', 'var(--c-accent)'],
  published: ['منشورة', 'Published', 'var(--c-live)'],
  rejected: ['تحتاج تعديلاً', 'Needs changes', '#F87171'],
  hidden: ['مخفية', 'Hidden', 'var(--c-muted)'],
}
export const writingStatusLabel = (s: Writing['status']) => t(STATUS_LABEL[s][0], STATUS_LABEL[s][1])

/** Card used in lists, rails and on profiles. */
export function WritingCard({ w, width, showStatus }: { w: Writing; width?: number; showStatus?: boolean }) {
  const line = [writingKindLabel(w.kind), formatDateAr(w.published_at || w.created_at)].filter(Boolean).join(' · ')
  const ex = excerpt(w, 110)
  return (
    <Link to={writingPath(w)} className="group flex flex-col gap-2.5 shrink-0" style={width ? { width } : undefined}>
      <div className="relative rounded-xl overflow-hidden transition-transform duration-500 group-hover:-translate-y-1" style={{ border: '1px solid var(--c-border)' }}>
        <WritingCover w={w} />
        {showStatus && w.status !== 'published' && (
          <span className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold" style={{ background: 'rgba(5,5,7,0.8)', color: STATUS_LABEL[w.status][2], border: '1px solid currentColor' }}>{writingStatusLabel(w.status)}</span>
        )}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-[11.5px]" style={{ color: 'var(--c-accent)' }}>{line}</span>
        {ex && <p dir="auto" className="m-0 text-[12.5px] leading-relaxed" style={{ color: 'var(--c-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ex}</p>}
      </div>
    </Link>
  )
}

// ── Article text ─────────────────────────────────────────────
// A small, safe subset of markdown, rendered as React elements (never as HTML):
// "## " heading, "### " small heading, "> " quote, "- " list, **bold**, blank line between paragraphs.

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g)
  parts.forEach((part, i) => {
    if (/^\*\*[^*\n]+\*\*$/.test(part)) out.push(<strong key={i} style={{ color: 'var(--c-text)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>)
    else if (part) {
      const lines = part.split('\n')
      lines.forEach((l, j) => out.push(<Fragment key={`${i}-${j}`}>{j > 0 && <br />}{l}</Fragment>))
    }
  })
  return out
}

type Block = { type: 'h2' | 'h3' | 'p' | 'quote'; text: string } | { type: 'list'; items: string[] }

export function parseArticle(src: string): Block[] {
  const blocks: Block[] = []
  const chunks = src.replace(/\r\n?/g, '\n').split(/\n{2,}/)
  for (const raw of chunks) {
    const chunk = raw.replace(/^\n+|\s+$/g, '')
    if (!chunk.trim()) continue
    const lines = chunk.split('\n')
    let para: string[] = []
    const flush = () => { if (para.length) { blocks.push({ type: 'p', text: para.join('\n') }); para = [] } }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/^###\s+/.test(line)) { flush(); blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '') }) }
      else if (/^##\s+/.test(line)) { flush(); blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '') }) }
      else if (/^>\s?/.test(line)) {
        flush()
        const q: string[] = []
        while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''))
        i--
        blocks.push({ type: 'quote', text: q.join('\n') })
      } else if (/^[-•]\s+/.test(line)) {
        flush()
        const items: string[] = []
        while (i < lines.length && /^[-•]\s+/.test(lines[i])) items.push(lines[i++].replace(/^[-•]\s+/, ''))
        i--
        blocks.push({ type: 'list', items })
      } else para.push(line)
    }
    flush()
  }
  return blocks
}

export function ArticleBody({ body }: { body: string }) {
  return (
    <div dir="auto" className="flex flex-col gap-6" style={{ fontSize: 17.5, lineHeight: 2.05, color: 'var(--c-text-2)' }}>
      {parseArticle(body).map((b, i) => {
        if (b.type === 'h2') return <h2 key={i} className="font-display m-0 mt-4" style={{ fontSize: 26, lineHeight: 1.4, fontWeight: 800, color: 'var(--c-text)' }}>{b.text}</h2>
        if (b.type === 'h3') return <h3 key={i} className="font-display m-0 mt-2" style={{ fontSize: 20, lineHeight: 1.45, fontWeight: 700, color: 'var(--c-text)' }}>{b.text}</h3>
        if (b.type === 'quote') return (
          <blockquote key={i} className="m-0 py-1" style={{ borderInlineStart: '3px solid var(--c-accent)', paddingInlineStart: 22, fontSize: 21, lineHeight: 1.8, fontWeight: 500, color: 'var(--c-text)' }}>{inline(b.text)}</blockquote>
        )
        if (b.type === 'list') return (
          <ul key={i} className="m-0 flex flex-col gap-2" style={{ paddingInlineStart: 22 }}>
            {b.items.map((it, j) => <li key={j} style={{ listStyle: 'none', position: 'relative' }}><span aria-hidden="true" className="absolute rotate-45" style={{ width: 6, height: 6, background: 'var(--c-accent)', insetInlineStart: -18, top: '0.9em' }} />{inline(it)}</li>)}
          </ul>
        )
        return <p key={i} className="m-0">{inline(b.text)}</p>
      })}
    </div>
  )
}
