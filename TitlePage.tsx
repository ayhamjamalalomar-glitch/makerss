import { useState } from 'react'
import { getTitleById, getMakerById } from '../data/seed'
import type { Navigate } from '../App'

interface ProjectPageProps {
  id: string
  navigate: Navigate
}

function SectionHeader({ title, count, onSeeAll }: { title: string; count?: number | string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-inter font-bold text-paper flex items-center gap-2" style={{ fontSize: 20 }}>
        <span className="inline-block w-1 rounded-full" style={{ background: '#E85D04', height: 22, flexShrink: 0 }} />
        {title}
        {count !== undefined && (
          <span className="font-inter text-paper" style={{ fontSize: 20 }}>{count}</span>
        )}
        {onSeeAll && (
          <button onClick={onSeeAll} className="font-inter font-bold text-paper hover:opacity-60 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>›</button>
        )}
      </h2>
    </div>
  )
}

const FAKE_REVIEWS = [
  { stars: 9, count: 420 },
  { stars: 8, count: 380 },
  { stars: 7, count: 210 },
  { stars: 6, count: 90 },
  { stars: 5, count: 40 },
  { stars: 4, count: 18 },
  { stars: 3, count: 9 },
  { stars: 2, count: 5 },
  { stars: 1, count: 3 },
]
const TOTAL_REVIEWS = FAKE_REVIEWS.reduce((s, r) => s + r.count, 0)
const AVG_RATING = (FAKE_REVIEWS.reduce((s, r) => s + r.stars * r.count, 0) / TOTAL_REVIEWS).toFixed(1)

export default function ProjectPage({ id, navigate }: ProjectPageProps) {
  const title = getTitleById(id)
  const [watchlisted, setWatchlisted] = useState(false)
  const [watched, setWatched] = useState(false)

  if (!title) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-24 text-center">
        <p className="font-inter text-muted text-2xl">Project not found.</p>
      </div>
    )
  }

  const credits = title.credits.map((c) => ({ ...c, maker: getMakerById(c.makerId) })).filter((c) => c.maker)

  // Key roles for the info panel
  const director = credits.find((c) => c.role.toLowerCase().includes('director') && !c.role.toLowerCase().includes('motion'))
  const writer = credits.find((c) => c.role.toLowerCase().includes('script') || c.role.toLowerCase().includes('writer') || c.role.toLowerCase().includes('consultant'))
  const keyCreatives = credits.filter((c) => c.makerId !== director?.makerId && c.makerId !== writer?.makerId).slice(0, 3)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--c-bg)' }}>

      {/* ── TOP NAV STRIP ── */}
      <div
        className="border-b px-4 sm:px-8 py-3 flex items-center justify-between"
        style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg)' }}
      >
        <button
          onClick={() => navigate({ name: 'home' })}
          className="inline-flex items-center gap-2 font-inter text-muted hover:text-paper text-sm transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          Back
        </button>
        <div className="flex items-center gap-5">
          {['Full Crew', 'Gallery', 'Reviews'].map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} className="font-inter text-muted hover:text-paper text-xs transition-colors" style={{ textDecoration: 'none' }}>{l}</a>
          ))}
          <button
            className="flex items-center gap-1.5 font-inter text-muted hover:text-paper text-xs transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" /><path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            Share
          </button>
        </div>
      </div>

      {/* ── HERO AREA ── */}
      <div className="relative" style={{ background: '#0D0A08' }}>
        {/* Blurred bg */}
        <div className="absolute inset-0 overflow-hidden">
          <img src={title.thumb} alt="" className="w-full h-full object-cover" style={{ filter: 'blur(40px) brightness(0.3)', transform: 'scale(1.1)' }} />
        </div>

        <div className="relative px-4 sm:px-8 pt-6 pb-0">
          {/* Title block */}
          <div className="mb-4 pt-8 sm:pt-0">
            <h1 className="font-inter font-black leading-none mb-2" style={{ fontSize: 'clamp(22px, 4vw, 48px)', letterSpacing: '-0.02em', color: 'white' }}>
              {title.name}
            </h1>
            <p className="font-inter text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {title.year}
              {title.platforms.slice(0, 2).map((p) => (
                <span key={p}> · {p}</span>
              ))}
              <span> · {title.brand}</span>
            </p>
          </div>

          {/* Media grid — horizontal on desktop, vertical stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-3" style={{ minHeight: 0 }}>
            {/* Poster — hidden on mobile to save space */}
            <div className="hidden sm:block flex-shrink-0 relative rounded-xl overflow-hidden" style={{ width: 200, height: 380 }}>
              <img src={title.thumb} alt={title.name} className="w-full h-full object-cover" />
              <div
                className="absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </div>
            </div>

            {/* Main visual / play */}
            <div className="flex-1 relative rounded-xl overflow-hidden cursor-pointer group" style={{ minHeight: 200, maxHeight: 380 }}>
              <img src={title.thumb} alt={title.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" style={{ objectPosition: 'center 30%', aspectRatio: '16/9' }} />
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />

              {/* Three-dot menu */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="3" r="1.2" fill="white" />
                  <circle cx="7" cy="7" r="1.2" fill="white" />
                  <circle cx="7" cy="11" r="1.2" fill="white" />
                </svg>
              </div>

              {/* Play button */}
              <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.9)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l7 4-7 4V3z" fill="#0D0A08" /></svg>
                </div>
                <div className="hidden sm:block">
                  <p className="font-inter font-bold text-paper" style={{ fontSize: 14 }}>View Project Reel</p>
                  <p className="font-inter text-paper/60 text-xs">Full production walkthrough</p>
                </div>
              </div>

              {/* Like counts */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2.5">
                <span className="flex items-center gap-1 font-inter text-paper text-xs">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 6h2v6H2V6zM6 6c0-1.1.9-2 2-2h1l1 3h2v5H6V6z" stroke="white" strokeWidth="1.1" strokeLinejoin="round" /></svg>
                  {title.credits.length * 45}
                </span>
                <span className="flex items-center gap-1 font-inter text-paper text-xs">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 12.5C7 12.5 1.5 8.5 1.5 5a3 3 0 015.5-1.7A3 3 0 0112.5 5c0 3.5-5.5 7.5-5.5 7.5z" stroke="#E85D04" strokeWidth="1.2" /></svg>
                  {title.credits.length * 28}
                </span>
              </div>
            </div>

          </div>

          {/* Genre / platform tags */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pb-5">
            {title.platforms.map((p) => (
              <span
                key={p}
                className="font-inter text-paper text-xs px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                style={{ border: '1px solid rgba(255,255,255,0.25)', fontSize: 12 }}
              >
                {p}
              </span>
            ))}
            <span className="font-inter text-paper text-xs px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity" style={{ border: '1px solid rgba(255,255,255,0.25)', fontSize: 12 }}>
              Branded Content
            </span>
            <span className="font-inter text-paper text-xs px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity" style={{ border: '1px solid rgba(255,255,255,0.25)', fontSize: 12 }}>
              Arab World
            </span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', padding: '4px 6px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="px-4 sm:px-8 py-6 flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* Left: description + credits rows */}
        <div className="flex-1 min-w-0">
          <p className="font-inter leading-relaxed mb-6 max-w-2xl" style={{ fontSize: 15, color: 'rgba(245,240,235,0.75)' }}>
            {title.description}
          </p>

          {/* Key credit rows */}
          <div className="max-w-2xl" style={{ borderTop: '1px solid var(--c-border)' }}>
            {director && (
              <div className="flex items-start gap-4 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <span className="font-inter font-bold text-paper text-sm flex-shrink-0" style={{ width: 80 }}>Director</span>
                <button
                  onClick={() => navigate({ name: 'maker', id: director.makerId })}
                  className="font-inter text-sm hover:underline transition-all"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E85D04', padding: 0 }}
                >
                  {director.maker?.nameLatin}
                </button>
              </div>
            )}
            {writer && (
              <div className="flex items-start gap-4 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <span className="font-inter font-bold text-paper text-sm flex-shrink-0" style={{ width: 80 }}>Writer</span>
                <button
                  onClick={() => navigate({ name: 'maker', id: writer.makerId })}
                  className="font-inter text-sm hover:underline transition-all"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E85D04', padding: 0 }}
                >
                  {writer.maker?.nameLatin}
                </button>
              </div>
            )}
            {keyCreatives.length > 0 && (
              <div className="flex items-start gap-4 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <span className="font-inter font-bold text-paper text-sm flex-shrink-0" style={{ width: 80 }}>Crew</span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {keyCreatives.map((c, i) => (
                    <span key={c.makerId} className="flex items-center gap-1">
                      <button
                        onClick={() => navigate({ name: 'maker', id: c.makerId })}
                        className="font-inter text-sm hover:underline"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E85D04', padding: 0 }}
                      >
                        {c.maker?.nameLatin}
                      </button>
                      {i < keyCreatives.length - 1 && <span className="text-muted">·</span>}
                    </span>
                  ))}
                  <button
                    className="flex items-center gap-1 font-inter text-muted text-xs hover:text-paper transition-colors"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => document.getElementById('full-crew')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                  </button>
                </div>
              </div>
            )}
            <button
              className="w-full flex items-center justify-between py-4 font-inter text-paper text-sm hover:text-orange transition-colors"
              style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', cursor: 'pointer', padding: '16px 0' }}
              onClick={() => document.getElementById('full-crew')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="font-inter font-semibold">All cast &amp; crew</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            </button>
            <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <span className="font-inter font-semibold text-paper text-sm">Production info &amp; credits</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2v10H2" stroke="#7A6E66" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </div>
          </div>
        </div>

        {/* Right: actions panel */}
        <div className="flex-shrink-0 w-full lg:w-64">
          <button
            onClick={() => setWatchlisted((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl font-inter font-bold mb-2 transition-all hover:opacity-90"
            style={{ background: watchlisted ? '#CC4F03' : '#E85D04', border: 'none', cursor: 'pointer', color: 'white', fontSize: 14 }}
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
              {watchlisted ? 'Added to Watchlist' : 'Add to Watchlist'}
            </span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 6l3 3 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" /></svg>
          </button>

          <button
            onClick={() => setWatched((v) => !v)}
            className="w-full flex items-center gap-2 px-5 py-3.5 rounded-xl font-inter text-sm mb-6 transition-all hover:opacity-80"
            style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', cursor: 'pointer', color: watched ? '#4ADE80' : 'var(--c-muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" /><path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            {watched ? 'Watched' : 'Mark as watched'}
          </button>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <span className="font-inter text-muted text-xs">Makers credited</span>
              <span className="font-inter text-paper font-bold text-sm">{title.credits.length}</span>
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <span className="font-inter text-muted text-xs">Platform</span>
              <span className="font-inter text-paper text-xs">{title.platforms[0]}</span>
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <span className="font-inter text-muted text-xs">Year</span>
              <span className="font-inter text-paper text-xs">{title.year}</span>
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <span className="font-inter text-muted text-xs">Brand</span>
              <span className="font-inter text-paper text-xs">{title.brand}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── VIDEOS SECTION ── */}
      <div id="gallery" className="px-4 sm:px-8 py-6 sm:py-8 border-t" style={{ borderColor: 'var(--c-border)' }}>
        <SectionHeader title="BTS Videos" count=" 6" />

        {/* Mixed orientation grid — vertical for Instagram/TikTok, landscape for YouTube/Vimeo */}
        {(() => {
          const PLATFORM_BADGE_COLORS: Record<string, string> = {
            TikTok: '#FF004F', Instagram: '#E85D04', YouTube: '#FF0000', Vimeo: '#1AB7EA',
          }
          const BTS_VIDEOS = [
            { label: 'Behind the Scenes', duration: '0:58', platform: 'TikTok',    likes: 241, views: '3.2M', pos: '20% 30%' },
            { label: 'Ramadan Campaign BTS', duration: '1:12', platform: 'Instagram', likes: 184, views: '2.4M', pos: '60% 20%' },
            { label: 'Full Production Walkthrough', duration: '8:24', platform: 'YouTube',   likes: 920, views: '1.1M', pos: '30% 50%' },
            { label: "Director's Commentary",  duration: '12:05', platform: 'Vimeo',     likes: 147, views: '890K', pos: '70% 40%' },
            { label: 'On-Set Moments',         duration: '0:34', platform: 'TikTok',    likes: 58,  views: '740K', pos: '10% 60%' },
            { label: 'Edit Breakdown',         duration: '6:50', platform: 'YouTube',   likes: 92,  views: '1.1M', pos: '50% 70%' },
          ]
          const isVertical = (p: string) => p === 'TikTok' || p === 'Instagram'
          return (
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', alignItems: 'flex-start' }}>
              {BTS_VIDEOS.map((v, i) => {
                const vertical = isVertical(v.platform)
                const w = vertical ? 160 : 280
                const h = vertical ? 284 : 158
                return (
                  <div
                    key={i}
                    className="relative flex-shrink-0 rounded-xl overflow-hidden cursor-pointer group"
                    style={{ width: w, height: h }}
                  >
                    <img
                      src={title.thumb}
                      alt={v.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ objectPosition: v.pos }}
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />

                    {/* Platform badge */}
                    <div
                      className="absolute top-2 left-2 font-inter font-black text-white px-2 py-0.5 rounded-md"
                      style={{ background: PLATFORM_BADGE_COLORS[v.platform], fontSize: 9, letterSpacing: '0.04em' }}
                    >
                      {v.platform}
                    </div>

                    {/* Duration */}
                    <div
                      className="absolute top-2 right-2 font-inter text-white px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(0,0,0,0.65)', fontSize: 10, fontWeight: 600 }}
                    >
                      {v.duration}
                    </div>

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"
                        style={{ background: 'rgba(255,255,255,0.92)' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4 2.5l7 4-7 4V2.5z" fill="#0D0A08" /></svg>
                      </div>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="font-inter font-semibold text-paper leading-tight mb-1" style={{ fontSize: 11, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {v.label}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-inter text-paper/60" style={{ fontSize: 10 }}>{v.views} views</span>
                        <span className="flex items-center gap-1 font-inter text-paper/60" style={{ fontSize: 10 }}>
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="#FF6B6B"><path d="M4.5 8C4.5 8 1 5.5 1 3.2a1.8 1.8 0 013.5-.7 1.8 1.8 0 013.5.7C8 5.5 4.5 8 4.5 8z" /></svg>
                          {v.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Photos — 10 total */}
        <div className="mt-10" />
        <SectionHeader title="BTS Photos" count=" 10" />
        <div className="grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div
              key={i}
              className="relative rounded-xl overflow-hidden cursor-pointer group"
              style={{ height: 120 }}
            >
              <img
                src={title.thumb}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                style={{ objectPosition: `${(i * 17) % 100}% ${(i * 13) % 100}%` }}
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(232,93,4,0.15)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── FULL CREW (Top Cast style) ── */}
      <div id="full-crew" className="px-4 sm:px-8 py-6 sm:py-8 border-t" style={{ borderColor: 'var(--c-border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-inter font-bold text-paper flex items-center gap-2" style={{ fontSize: 20 }}>
            <span className="inline-block w-1 rounded-full" style={{ background: '#E85D04', height: 22 }} />
            Full Crew
            <span className="font-inter text-paper" style={{ fontSize: 20 }}>{credits.length}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="#F5F0EB" strokeWidth="1.3" strokeLinecap="round" /></svg>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0">
          {credits.map((c) => (
            <button
              key={c.makerId}
              onClick={() => navigate({ name: 'maker', id: c.makerId })}
              className="flex items-center gap-4 py-5 text-left group w-full"
              style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', cursor: 'pointer', padding: '20px 0' }}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="absolute bottom-0 left-0 z-10 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--c-border)', border: '2px solid var(--c-bg)' }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 1v7M1 4.5h7" stroke="#7A6E66" strokeWidth="1.3" strokeLinecap="round" /></svg>
                </div>
                <div
                  className="rounded-full overflow-hidden"
                  style={{ width: 72, height: 72, border: '2px solid var(--c-border)' }}
                >
                  <img src={c.maker?.photo} alt={c.maker?.nameLatin} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                {c.maker?.verified && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center z-20" style={{ background: '#E85D04', border: '2px solid var(--c-bg)' }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" /></svg>
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-inter font-bold text-paper group-hover:text-orange transition-colors mb-0.5" style={{ fontSize: 15 }}>
                  {c.maker?.nameLatin}
                </p>
                <p className="font-inter text-muted text-sm">{c.role}</p>
                {c.maker?.nameArabic && (
                  <p className="font-arabic text-muted text-xs mt-0.5" dir="rtl">{c.maker.nameArabic}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── USER REVIEWS ── */}
      <div id="reviews" className="px-4 sm:px-8 py-6 sm:py-8 border-t" style={{ borderColor: 'var(--c-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-inter font-bold text-paper flex items-center gap-2" style={{ fontSize: 20 }}>
            <span className="inline-block w-1 rounded-full" style={{ background: '#E85D04', height: 22 }} />
            User reviews
            <span className="font-inter text-paper" style={{ fontSize: 20 }}>{TOTAL_REVIEWS}</span>
            <button onClick={() => {}} className="font-inter font-bold text-paper hover:opacity-60 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>›</button>
          </h2>
          <button
            className="flex items-center gap-2 font-inter font-semibold text-paper px-4 py-2 rounded-full hover:opacity-80 transition-all"
            style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></svg>
            Review
          </button>
        </div>

        <div
          className="flex items-center gap-8 p-6 rounded-2xl max-w-2xl"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          {/* Big star + number */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <svg width="38" height="38" viewBox="0 0 38 38" fill="#F5C518">
              <path d="M19 3l4.1 8.3 9.2 1.34-6.65 6.48 1.57 9.15L19 23.6l-8.22 4.27 1.57-9.15L5.7 12.64l9.2-1.34L19 3z" />
            </svg>
            <div>
              <p className="font-inter font-black leading-none" style={{ fontSize: 42, color: '#F5C518' }}>{AVG_RATING}</p>
              <p className="font-inter text-muted text-xs mt-1">{TOTAL_REVIEWS.toLocaleString()}</p>
            </div>
          </div>

          {/* Histogram */}
          <div className="flex-1 flex items-end gap-2">
            {[3, 5, 8, 12, 18, 35, 90, 380, 420, 210].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: Math.max(3, (h / 420) * 80),
                    background: i >= 6 ? '#E85D04' : 'var(--c-border)',
                  }}
                />
                <span className="font-inter text-muted" style={{ fontSize: 10 }}>{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
