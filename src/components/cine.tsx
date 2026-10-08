import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import Link from '../lib/router'
import { isRtl, t } from '../lib/i18n'
import { displayName, formatFollowers, kindLabel, posterOf, totalFollowers, type MemberCard, type Project, projectPath } from '../lib/data'
import { firstRole, isCreator } from '../lib/specialties'
import type { Specialty } from '../lib/supabase'
import { PosterFallback, VerifiedBadge } from './mk'

// Building blocks of the cinematic design: timecode, scene headers, rails, poster and cast cards.

const pad = (n: number) => String(n).padStart(2, '0')

/** A running timecode (HH:MM:SS:FF at 24 fps), counted from when the page opened. */
export function Timecode({ className = '', style }: { className?: string; style?: CSSProperties }) {
  const [now, setNow] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    let last = -1
    const tick = () => {
      const ms = performance.now() - start
      const frame = Math.floor(ms / (1000 / 24))
      if (frame !== last) { last = frame; setNow(ms) }
      raf = requestAnimationFrame(tick)
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const s = Math.floor(now / 1000)
  const f = Math.floor((now % 1000) / (1000 / 24))
  return <span dir="ltr" className={`font-mono tabular-nums ${className}`} style={style}>{pad(Math.floor(s / 3600))}:{pad(Math.floor(s / 60) % 60)}:{pad(s % 60)}:{pad(f)}</span>
}

/** Red REC light with a timecode, the camera's own signature. */
export function RecBadge({ light }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wider" dir="ltr" style={{ color: light ? 'rgba(var(--h-ink-rgb),0.8)' : 'var(--c-muted)' }}>
      <span className="mk-rec w-2 h-2 rounded-full" style={{ background: 'var(--c-rec)', boxShadow: '0 0 10px var(--c-rec)' }} />
      REC
      <Timecode />
    </span>
  )
}

/** Section title with an optional line under it and a "see all" link. */
export function SceneHeader({ title, sub, to, action }: { title: string; sub?: string; to?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="flex flex-col gap-1.5 min-w-0">
        <h2 className="font-display m-0 font-bold leading-tight" style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', letterSpacing: '-0.01em' }}>{title}</h2>
        {sub && <p className="m-0 text-sm" style={{ color: 'var(--c-muted)' }}>{sub}</p>}
      </div>
      {action ?? (to && (
        <Link to={to} className="group shrink-0 inline-flex items-center gap-2 text-[13px] font-medium pb-1" style={{ color: 'var(--c-text-2)' }}>
          {t('عرض الكل', 'See all')}
          <span className="w-7 h-7 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--c-accent)] group-hover:text-[color:var(--c-on-accent)]" style={{ border: '1px solid var(--c-border-mid)' }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="rtl:-scale-x-100" aria-hidden="true"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </Link>
      ))}
    </div>
  )
}

/** Horizontal rail like a streaming row: drag with the mouse, swipe on touch, arrow buttons on desktop. */
export function Rail({ children, label, itemWidth = 180, gap = 14 }: { children: ReactNode; label: string; itemWidth?: number; gap?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = () => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const pos = Math.abs(el.scrollLeft)
    setEdges({ start: pos < 4, end: pos > max - 4 || max <= 0 })
  }
  useEffect(() => {
    measure()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [children])

  const page = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    // "forward" follows reading direction: leftwards in Arabic, rightwards in English
    const sign = isRtl() ? -1 : 1
    el.scrollBy({ left: dir * sign * Math.max(itemWidth + gap, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  const btn = (dir: 1 | -1, hidden: boolean) => (
    <button
      type="button"
      onClick={() => page(dir)}
      aria-label={dir === 1 ? t('التالي', 'Next') : t('السابق', 'Previous')}
      className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full items-center justify-center cursor-pointer transition-opacity"
      style={{ [dir === 1 ? 'insetInlineEnd' : 'insetInlineStart']: -14, opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto', background: 'var(--c-surface)', border: '1px solid var(--c-border-mid)', color: 'var(--c-text)', boxShadow: '0 8px 24px var(--c-shadow)' }}
    >
      <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className={dir === 1 ? 'rtl:-scale-x-100' : 'ltr:-scale-x-100'} aria-hidden="true"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  )

  return (
    <div className="relative" role="region" aria-label={label}>
      {btn(-1, edges.start)}
      <div
        ref={ref}
        onScroll={measure}
        className="mk-rail flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ gap }}
        onPointerDown={(e) => { if (e.pointerType === 'mouse' && ref.current) drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false } }}
        onPointerMove={(e) => {
          const d = drag.current
          const el = ref.current
          if (!d || !el) return
          // Button already released (e.g. the browser took over with a native drag): stop.
          if (e.buttons === 0) { el.classList.remove('dragging'); drag.current = null; return }
          const dx = e.clientX - d.x
          if (Math.abs(dx) > 5) { d.moved = true; el.classList.add('dragging') }
          if (d.moved) el.scrollLeft = d.left - dx
        }}
        onPointerUp={() => { ref.current?.classList.remove('dragging'); setTimeout(() => { drag.current = null }, 0) }}
        onPointerLeave={() => { ref.current?.classList.remove('dragging'); drag.current = null }}
        onPointerCancel={() => { ref.current?.classList.remove('dragging'); drag.current = null }}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => { if (drag.current?.moved) { e.preventDefault(); e.stopPropagation() } }}
      >
        {children}
      </div>
      {btn(1, edges.end)}
    </div>
  )
}

/** Tilts toward the pointer a little, like holding a print up to the light. */
function useTilt(strength = 6) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const sx = useSpring(rx, { stiffness: 220, damping: 20 })
  const sy = useSpring(ry, { stiffness: 220, damping: 20 })
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * strength)
    rx.set(-py * strength)
  }
  const onLeave = () => { rx.set(0); ry.set(0) }
  return { style: { rotateX: sx, rotateY: sy, transformPerspective: 800 }, onMove, onLeave }
}

/** Project poster (2:3) with a focus pull on load and a hover frame. */
export function PosterCard({ p, width, rank }: { p: Project; width?: number; rank?: number }) {
  const img = posterOf(p)
  const [loaded, setLoaded] = useState(false)
  const tilt = useTilt()
  return (
    <Link to={projectPath(p)} className="group shrink-0 flex flex-col gap-2.5 text-start" style={{ width }}>
      <motion.div
        className="relative rounded-xl overflow-hidden w-full"
        style={{ aspectRatio: '2/3', background: 'var(--c-surface)', ...tilt.style }}
        onPointerMove={tilt.onMove}
        onPointerLeave={tilt.onLeave}
      >
        {img ? (
          <img src={img} alt={p.title} loading="lazy" draggable={false} onLoad={() => setLoaded(true)} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.04]" style={{ filter: loaded ? 'blur(0)' : 'blur(12px)', transform: loaded ? undefined : 'scale(1.08)' }} />
        ) : <PosterFallback title={p.title} />}
        <span className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'linear-gradient(to top, rgba(5,5,7,0.85), rgba(5,5,7,0) 55%)' }} />
        <span className="absolute inset-2 rounded-lg pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ boxShadow: 'inset 0 0 0 1.5px var(--c-accent)' }} />
        {p.kind && <span className="absolute top-2.5 start-2.5 font-mono text-[10px] px-2 py-1 rounded-md" style={{ background: 'rgba(5,5,7,0.72)', color: '#F3EFE7', backdropFilter: 'blur(6px)' }}>{kindLabel(p.kind)}</span>}
        <span className="absolute bottom-3 start-3 end-3 flex items-center gap-2 text-[12px] font-semibold text-white translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M2.5 1.5v7l6-3.5z" /></svg>
          </span>
          {t('افتح المشروع', 'Open project')}
        </span>
        {rank !== undefined && <RankNumeral n={rank} />}
      </motion.div>
      <div className="min-w-0">
        <p className="font-display font-semibold leading-snug m-0 truncate" style={{ fontSize: 14 }}>{p.title}</p>
        <p className="m-0 font-mono text-[11px] truncate" style={{ color: 'var(--c-muted)' }}>{[p.year, p.brand].filter(Boolean).join(' · ') || displayName(p.owner)}</p>
      </div>
    </Link>
  )
}

function RankNumeral({ n }: { n: number }) {
  return (
    <span className="absolute -bottom-3 end-2 font-display font-black leading-none pointer-events-none select-none" style={{ fontSize: 76, color: 'transparent', WebkitTextStroke: '1.5px var(--c-accent)', textShadow: '0 4px 24px rgba(0,0,0,0.6)' }} aria-hidden="true">
      {n}
    </span>
  )
}

/** Gold "founder" chip for the first makers on the platform. */
export function FounderChip({ big = false }: { big?: boolean }) {
  return (
    <span className={`mk-founder-chip inline-flex items-center gap-1 rounded-full font-semibold ${big ? 'px-3 py-1.5 text-[12px]' : 'px-2 py-1 text-[10.5px]'}`}>
      <svg width={big ? 11 : 9} height={big ? 11 : 9} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 .8l1.6 3.3 3.6.5-2.6 2.5.6 3.6L6 9l-3.2 1.7.6-3.6L.8 4.6l3.6-.5z" /></svg>
      {t('مؤسس', 'Founder')}
    </span>
  )
}

/** A maker as a casting card: portrait in black and white that comes to color on hover. */
export function CastCard({ m, specialties, width, rank, place }: { m: MemberCard; specialties: Specialty[]; width?: number; rank?: number; place?: string }) {
  const tilt = useTilt(5)
  const role = firstRole(specialties, m)
  const creator = isCreator(m)
  const audience = totalFollowers(m)
  return (
    <Link to={`/${m.username}`} className="group shrink-0 flex flex-col gap-2.5 text-start" style={{ width }}>
      <motion.div className={`relative rounded-xl overflow-hidden w-full ${m.is_founding ? 'mk-founder' : ''}`} style={{ aspectRatio: '3/4', background: 'var(--c-surface-alt)', ...tilt.style }} onPointerMove={tilt.onMove} onPointerLeave={tilt.onLeave}>
        {m.avatar_url ? (
          <img src={m.avatar_url} alt={displayName(m)} loading="lazy" draggable={false} className="w-full h-full object-cover transition-all duration-700 grayscale-[0.85] contrast-[1.05] group-hover:grayscale-0 group-hover:scale-[1.04]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display font-black" style={{ fontSize: 56, color: 'var(--c-muted-2)' }}>{displayName(m).charAt(0)}</div>
        )}
        <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,5,7,0.9) 0%, rgba(5,5,7,0) 45%)' }} />
        <span className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
          {m.is_founding && <FounderChip />}
          {m.available && (
            <span className="flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[10px]" style={{ background: 'rgba(5,5,7,0.7)', color: 'var(--c-live)', backdropFilter: 'blur(6px)' }} title={t('متاح', 'Available')}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-live)', boxShadow: '0 0 8px var(--c-live)' }} />{!m.is_founding && t('متاح', 'Available')}
            </span>
          )}
        </span>
        <span className="absolute bottom-3 start-3 end-3 flex flex-col gap-0.5 text-white">
          <span className="flex items-center gap-1.5 min-w-0"><span className="font-display font-bold leading-tight truncate" style={{ fontSize: 15 }}>{displayName(m)}</span>{m.is_founding && <span className="shrink-0"><VerifiedBadge size={15} title={t('عضو مؤسس', 'Founding member')} /></span>}</span>
          <span className="font-mono text-[10.5px] truncate" style={{ color: 'rgba(243,239,231,0.7)' }}>
            {role}{creator && audience > 0 ? ` · ${formatFollowers(audience)}` : ''}
          </span>
          {place && <span className="text-[10.5px] truncate" style={{ color: 'rgba(243,239,231,0.5)' }}>{place}</span>}
        </span>
        {rank !== undefined && <span className="absolute top-2.5 end-2.5 font-mono text-[11px] font-semibold px-2 py-1 rounded-md" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }} dir="ltr">#{pad(rank)}</span>}
      </motion.div>
    </Link>
  )
}

/** Text that lights up word by word as it scrolls through the screen. */
export function ScrollLitText({ text, className = '', style }: { text: string; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })
  const words = text.split(' ')
  return (
    <p ref={ref} className={className} style={{ ...style, display: 'flex', flexWrap: 'wrap', columnGap: '0.28em' }}>
      {words.map((w, i) => <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>)}
    </p>
  )
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1])
  return <motion.span style={{ opacity }}>{children}</motion.span>
}

/** A strip of frames that slides forever, with film perforations above and below. */
export function FilmStrip({ images, speed = 70, reverse = false, height = 150 }: { images: string[]; speed?: number; reverse?: boolean; height?: number }) {
  if (!images.length) return null
  // Enough frames to cover wide screens, doubled so the loop is seamless.
  const base: string[] = []
  while (base.length < 12) base.push(...images)
  const frames = [...base, ...base]
  const w = Math.round(height * 0.72)
  return (
    <div className="overflow-hidden" dir="ltr" aria-hidden="true" style={{ background: '#050507', padding: '12px 0' }}>
      <div className="mk-sprockets h-3 opacity-60" />
      <div className={`flex w-max ${reverse ? 'mk-marquee-rev' : 'mk-marquee'}`} style={{ ['--mk-speed' as string]: `${speed}s`, gap: 8, padding: '8px 0' }}>
        {frames.map((src, i) => (
          <div key={i} className="shrink-0 overflow-hidden rounded-[4px]" style={{ width: w, height, background: '#111' }}>
            <img src={src} alt="" loading="lazy" draggable={false} className="w-full h-full object-cover" style={{ filter: 'grayscale(0.6) contrast(1.05) brightness(0.8)' }} />
          </div>
        ))}
      </div>
      <div className="mk-sprockets h-3 opacity-60" />
    </div>
  )
}

/** Top of an inner page: a display title, an optional line and an action. */
export function PageHeader({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pt-2">
      <div className="flex flex-col gap-2 min-w-0">
        <h1 className="font-display font-black m-0" style={{ fontSize: 'clamp(30px, 4.2vw, 46px)', lineHeight: 1.12, letterSpacing: '-0.02em' }}>{title}</h1>
        {sub && <div className="text-[14px]" style={{ color: 'var(--c-muted)', lineHeight: 1.7 }}>{sub}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
