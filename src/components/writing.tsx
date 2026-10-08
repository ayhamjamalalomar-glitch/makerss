import { Fragment, type CSSProperties, type ReactNode } from 'react'
import Link from '../lib/router'
import { t } from '../lib/i18n'
import { displayName } from '../lib/data'
import { formatDateAr } from '../lib/constants'
import { excerpt, podcastEmbed, videoEmbed, writingKindLabel, writingPath, writingTag, type Block, type Writing } from '../lib/writings'

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
            style={{ fontSize: titleSize(w.title, wide), fontWeight: 800, lineHeight: 1.5, letterSpacing: '-0.005em', paddingTop: '0.12em', color: BONE, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}
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

type MdBlock = { type: 'h2' | 'h3' | 'p' | 'quote'; text: string } | { type: 'list'; items: string[] }

export function parseArticle(src: string): MdBlock[] {
  const blocks: MdBlock[] = []
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

// ── Article blocks (new editor) ──────────────────────────────

const ytThumbFrame = { aspectRatio: '16/9', border: 'none' } as const

export function ArticleBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div dir="auto" className="flex flex-col gap-6" style={{ fontSize: 17.5, lineHeight: 2.05, color: 'var(--c-text-2)' }}>
      {blocks.map((b, i) => <BlockView key={b.id || i} b={b} />)}
    </div>
  )
}

export function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case 'h2': return <h2 className="font-display m-0 mt-4" style={{ fontSize: 26, lineHeight: 1.4, fontWeight: 800, color: 'var(--c-text)' }}>{b.text}</h2>
    case 'h3': return <h3 className="font-display m-0 mt-2" style={{ fontSize: 20, lineHeight: 1.45, fontWeight: 700, color: 'var(--c-text)' }}>{b.text}</h3>
    case 'quote': return <blockquote className="m-0 py-1" style={{ borderInlineStart: '3px solid var(--c-accent)', paddingInlineStart: 22, fontSize: 21, lineHeight: 1.8, fontWeight: 500, color: 'var(--c-text)' }}>{inline(b.text)}</blockquote>
    case 'ul': return (
      <ul className="m-0 flex flex-col gap-2" style={{ paddingInlineStart: 22 }}>
        {b.items.map((it, j) => <li key={j} style={{ listStyle: 'none', position: 'relative' }}><span aria-hidden="true" className="absolute rotate-45" style={{ width: 6, height: 6, background: 'var(--c-accent)', insetInlineStart: -18, top: '0.9em' }} />{inline(it)}</li>)}
      </ul>
    )
    case 'ol': return (
      <ol className="m-0 flex flex-col gap-2" style={{ paddingInlineStart: 28 }}>
        {b.items.map((it, j) => <li key={j} style={{ listStyle: 'none', position: 'relative' }}><span aria-hidden="true" className="absolute font-mono text-[13px]" style={{ insetInlineStart: -28, top: '0.35em', color: 'var(--c-accent)' }}>{String(j + 1).padStart(2, '0')}</span>{inline(it)}</li>)}
      </ol>
    )
    case 'image': return (
      <figure className="m-0 flex flex-col gap-2">
        <img src={b.url} alt={b.caption || ''} loading="lazy" className="w-full rounded-xl block" style={{ border: '1px solid var(--c-border)' }} />
        {b.caption && <figcaption className="text-[13px] text-center" style={{ color: 'var(--c-muted)' }}>{b.caption}</figcaption>}
      </figure>
    )
    case 'video': {
      const src = videoEmbed(b.url)
      return src ? <iframe src={src} title="video" className="w-full rounded-xl block" style={ytThumbFrame} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /> : null
    }
    case 'podcast': {
      const e = podcastEmbed(b.url)
      if (!e) return null
      return e.height ? <iframe src={e.src} title="podcast" className="w-full rounded-xl block" style={{ height: e.height, border: 'none' }} allow="autoplay; clipboard-write; encrypted-media" loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms" />
        : <iframe src={e.src} title="podcast" className="w-full rounded-xl block" style={ytThumbFrame} allow="autoplay; encrypted-media; fullscreen" allowFullScreen loading="lazy" />
    }
    case 'button': return (
      <a href={b.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="self-center inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full text-[15px] transition hover:brightness-110" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)', lineHeight: 1.4 }}>
        {b.label}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="rtl:-scale-x-100" aria-hidden="true"><path d="M3 9l6-6M4.5 3H9v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </a>
    )
    case 'divider': return <div className="flex justify-center gap-3 py-2" aria-hidden="true">{[0, 1, 2].map((k) => <span key={k} className="w-1.5 h-1.5 rotate-45" style={{ background: 'var(--c-accent)' }} />)}</div>
    default: return <p className="m-0 whitespace-pre-line">{inline((b as { text: string }).text)}</p>
  }
}

// ── Share image ──────────────────────────────────────────────
// Drawn in the browser (canvas shapes Arabic correctly) in the same style as the cover, 1200 x 630.

const RTL_RE = /[֐-ࣿ]/
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = w } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export async function renderShareImage(w: { kind: Writing['kind']; title: string; author: string }): Promise<Blob | null> {
  const W = 1200, H = 630, PAD = 84
  try {
    await Promise.all([
      document.fonts.load(`800 80px Alexandria`, w.title),
      document.fonts.load(`400 26px "Readex Pro"`, w.author),
      document.fonts.load(`600 20px "JetBrains Mono"`, 'ARTICLE'),
      document.fonts.load(`400 20px "Archivo Black"`, 'MAKERS'),
    ])
  } catch { /* draw with what is loaded */ }
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#050507'
  ctx.fillRect(0, 0, W, H)
  const g = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.75)
  g.addColorStop(0, 'rgba(242,179,61,0.24)')
  g.addColorStop(0.4, 'rgba(242,179,61,0.06)')
  g.addColorStop(1, 'rgba(242,179,61,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  const fade = ctx.createLinearGradient(0, H * 0.5, 0, H)
  fade.addColorStop(0, 'rgba(0,0,0,0)')
  fade.addColorStop(1, 'rgba(0,0,0,0.4)')
  ctx.fillStyle = fade
  ctx.fillRect(0, 0, W, H)

  ctx.textBaseline = 'alphabetic'
  ctx.direction = 'ltr'
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '5px'
  ctx.font = '600 20px "JetBrains Mono", monospace'
  ctx.fillStyle = '#F2B33D'
  ctx.textAlign = 'left'
  ctx.fillText(writingTag(w.kind), PAD, PAD + 10)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '2px'
  ctx.font = '400 20px "Archivo Black", sans-serif'
  ctx.fillStyle = 'rgba(243,239,231,0.6)'
  ctx.textAlign = 'right'
  ctx.fillText('MAKERS', W - PAD, PAD + 10)
  ;(ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'

  const rtl = RTL_RE.test(w.title)
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.textAlign = rtl ? 'right' : 'left'
  const x = rtl ? W - PAD : PAD
  let size = 84
  let lines: string[] = []
  for (; size >= 44; size -= 4) {
    ctx.font = `800 ${size}px Alexandria, "Readex Pro", sans-serif`
    lines = wrap(ctx, w.title, W - PAD * 2)
    if (lines.length <= 3) break
  }
  if (lines.length > 4) { lines = lines.slice(0, 4); lines[3] = `${lines[3]}…` }
  const lh = size * 1.36
  const bottom = H - PAD - 96
  ctx.fillStyle = '#F3EFE7'
  lines.forEach((l, i) => ctx.fillText(l, x, bottom - (lines.length - 1 - i) * lh))

  ctx.fillStyle = '#F2B33D'
  const lineW = 64
  const ay = H - PAD + 4
  if (rtl) ctx.fillRect(W - PAD - lineW, ay - 9, lineW, 3)
  else ctx.fillRect(PAD, ay - 9, lineW, 3)
  ctx.font = '400 26px "Readex Pro", Alexandria, sans-serif'
  ctx.fillStyle = 'rgba(243,239,231,0.78)'
  ctx.direction = RTL_RE.test(w.author) ? 'rtl' : 'ltr'
  ctx.fillText(w.author, rtl ? W - PAD - lineW - 22 : PAD + lineW + 22, ay)
  ctx.fillStyle = 'rgba(243,239,231,0.45)'
  ctx.font = '400 20px "Readex Pro", sans-serif'
  ctx.direction = 'ltr'
  ctx.textAlign = rtl ? 'left' : 'right'
  ctx.fillText('makerss.net', rtl ? PAD : W - PAD, ay)

  return new Promise((res) => c.toBlob((b) => res(b), 'image/png'))
}
