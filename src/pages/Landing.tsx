import { useState, useEffect } from 'react'
import { makers, titles, formatFollowers } from '../data/seed'
import type { Navigate } from '../App'

interface LandingProps {
  navigate: Navigate
}

const sortedByRating = [...makers].sort((a, b) => b.ratingAverage - a.ratingAverage)

const RANK_CHANGES: Record<string, { delta: number; type: 'up' | 'down' | 'same' }> = {
  'lara-nassar': { delta: 0, type: 'same' },
  'kareem-al-rashid': { delta: 8, type: 'up' },
  'nour-khalil': { delta: 1, type: 'down' },
  'sana-mahmoud': { delta: 19, type: 'up' },
  'tarek-haddad': { delta: 3, type: 'up' },
  'rana-qasim': { delta: 2, type: 'down' },
  'ziad-barakat': { delta: 5, type: 'up' },
  'maya-idris': { delta: 12, type: 'up' },
  'omar-shamma': { delta: 4, type: 'up' },
  'dina-freijat': { delta: 7, type: 'up' },
}

const BY_RANKING = sortedByRating.slice(0, 4)
const TOP_RISING = makers
  .filter((m) => RANK_CHANGES[m.id]?.type === 'up')
  .sort((a, b) => (RANK_CHANGES[b.id]?.delta ?? 0) - (RANK_CHANGES[a.id]?.delta ?? 0))
  .slice(0, 2)

// Social media content feed
const SOCIAL_CONTENT = [
  { makerId: 'sana-mahmoud', platform: 'TikTok', views: '2.4M', likes: '184K', label: 'Ramadan Campaign BTS', thumb: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=600&fit=crop&q=80' },
  { makerId: 'dina-freijat', platform: 'Instagram', views: '890K', likes: '67K', label: 'Brand Collab Reel', thumb: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=600&fit=crop&q=80' },
  { makerId: 'lara-nassar', platform: 'YouTube', views: '1.1M', likes: '92K', label: 'Threads of Jordan — Full Doc', thumb: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=600&fit=crop&q=80' },
  { makerId: 'tarek-haddad', platform: 'TikTok', views: '3.2M', likes: '241K', label: 'Motion Graphics Showcase', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop&q=80' },
  { makerId: 'kareem-al-rashid', platform: 'Instagram', views: '560K', likes: '44K', label: 'Desert Shoot — Behind the Lens', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&q=80' },
  { makerId: 'nour-khalil', platform: 'YouTube', views: '740K', likes: '58K', label: 'Edit Breakdown — City Pulse', thumb: 'https://images.unsplash.com/photo-1574717024453-354056aafa98?w=400&h=600&fit=crop&q=80' },
]

const PLATFORM_COLORS: Record<string, string> = {
  TikTok: '#FF004F',
  Instagram: '#E85D04',
  YouTube: '#FF0000',
}

// Top film ratings data
const TOP_FILM_RATINGS = [
  { rank: 1, title: 'Threads of Jordan', year: 2024, rating: 9.2, votes: '14.2K', genre: 'Fashion Doc', thumb: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=120&h=80&fit=crop&q=80' },
  { rank: 2, title: 'The Shawshank Redemption', year: 1994, rating: 9.3, votes: '2.8M', genre: 'Drama', thumb: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=120&h=80&fit=crop&q=80' },
  { rank: 3, title: 'City Pulse', year: 2023, rating: 8.9, votes: '8.7K', genre: 'Documentary', thumb: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=120&h=80&fit=crop&q=80' },
  { rank: 4, title: 'Ramadan Glow', year: 2024, rating: 8.7, votes: '5.1K', genre: 'Brand Film', thumb: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=120&h=80&fit=crop&q=80' },
  { rank: 5, title: 'The Godfather', year: 1972, rating: 9.2, votes: '1.9M', genre: 'Crime Drama', thumb: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=120&h=80&fit=crop&q=80' },
  { rank: 6, title: 'Voice of the Streets', year: 2023, rating: 8.4, votes: '3.9K', genre: 'Music Video', thumb: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=80&fit=crop&q=80' },
  { rank: 7, title: 'Schindler\'s List', year: 1993, rating: 9.0, votes: '1.4M', genre: 'Historical', thumb: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=120&h=80&fit=crop&q=80' },
  { rank: 8, title: '12 Angry Men', year: 1957, rating: 9.0, votes: '840K', genre: 'Drama', thumb: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=120&h=80&fit=crop&q=80' },
  { rank: 9, title: 'The Dark Knight', year: 2008, rating: 9.0, votes: '2.7M', genre: 'Action', thumb: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=120&h=80&fit=crop&q=80' },
  { rank: 10, title: 'Pulp Fiction', year: 1994, rating: 8.9, votes: '2.1M', genre: 'Crime', thumb: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=120&h=80&fit=crop&q=80' },
]

// Featured production for hero
const HERO_TITLE = titles[0]
const HERO_MAKERS = (HERO_TITLE?.credits ?? [])
  .map((c) => makers.find((m) => m.id === c.makerId))
  .filter(Boolean) as typeof makers

// "Up next" sidebar items
const UP_NEXT = titles.slice(1)

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className="inline-flex items-center justify-center font-inter font-black rounded-lg"
      style={{ background: '#E85D04', color: '#fff', fontSize: 12, minWidth: 32, height: 20, paddingInline: 5 }}
    >
      #{rank}
    </span>
  )
}


function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="inline-block w-1 rounded-full flex-shrink-0" style={{ background: '#E85D04', height: 20 }} />
      <h2 className="font-inter font-bold text-paper" style={{ fontSize: 19 }}>{title}</h2>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="font-inter font-bold text-paper hover:opacity-60 transition-opacity ml-0.5"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
        >›</button>
      )}
    </div>
  )
}

export default function Landing({ navigate }: LandingProps) {
  const [heroIndex, setHeroIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  // Cycle through titles every 8 seconds
  useEffect(() => {
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % titles.length), 8000)
    return () => clearInterval(t)
  }, [])

  const heroTitle = titles[heroIndex % titles.length] ?? titles[0]
  const heroDirector = makers.find((m) => heroTitle?.credits.some((c) => c.makerId === m.id && c.role.toLowerCase().includes('director')))
    ?? makers.find((m) => heroTitle.credits.some((c) => c.makerId === m.id))

  const searchResults = searchQuery.length > 1
    ? makers.filter((m) =>
        m.nameLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.nameArabic.includes(searchQuery) ||
        m.specialtyTags.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : []

  const top3 = sortedByRating.slice(0, 3)
  const rest7 = sortedByRating.slice(3, 10)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--c-bg)' }}>

      {/* ══════════════════════════════════════════════════════
          FULL-SCREEN HERO — Featured Production
      ══════════════════════════════════════════════════════ */}
      <section className="relative" style={{ height: '100vh', minHeight: 560 }}>

        {/* Background image — cross-fade between titles */}
        {titles.map((t, i) => (
          <div
            key={t.id}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === heroIndex ? 1 : 0 }}
          >
            <img
              src={t.thumb}
              alt={t.name}
              className="w-full h-full object-cover object-top"
            />
          </div>
        ))}

        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(13,10,8,0.98) 0%, rgba(13,10,8,0.7) 50%, rgba(13,10,8,0.25) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,10,8,1) 0%, transparent 40%)' }} />

        {/* Left: nav arrows */}
        <button
          onClick={() => setHeroIndex((i) => (i - 1 + titles.length) % titles.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', width: 40, height: 40, backdropFilter: 'blur(4px)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button
          onClick={() => setHeroIndex((i) => (i + 1) % titles.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', width: 40, height: 40, backdropFilter: 'blur(4px)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        {/* Main content — positioned bottom-left over image */}
        <div className="absolute inset-0 flex">
          <div className="flex flex-col justify-end px-10 pb-10 max-w-2xl">

            {/* Poster thumbnail + play button */}
            <div className="flex items-end gap-5 mb-6">
              <div className="relative flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 100, height: 140, border: '2px solid rgba(255,255,255,0.15)' }}>
                <img src={heroTitle.thumb} alt={heroTitle.name} className="w-full h-full object-cover" />
              </div>

              <div className="flex items-center gap-4 pb-1">
                {/* Play button */}
                <button
                  className="flex items-center gap-2 font-inter font-bold px-5 py-3 rounded-full hover:opacity-90 active:scale-95 transition-all"
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', fontSize: 14, backdropFilter: 'blur(6px)', color: 'white' }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8.25" stroke="white" strokeWidth="1.5" />
                    <path d="M7 6.2l5 2.8-5 2.8V6.2z" fill="white" />
                  </svg>
                  View Project
                </button>
              </div>
            </div>

            {/* Title name */}
            <h1
              className="font-inter font-black leading-tight mb-2"
              style={{ fontSize: 'clamp(32px, 5vw, 60px)', letterSpacing: '-0.02em', textShadow: '0 2px 20px rgba(0,0,0,0.5)', color: 'white' }}
            >
              {heroTitle.name}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="font-inter text-muted text-sm">{heroTitle.year}</span>
              {heroTitle.platforms.map((p) => (
                <span key={p} className="font-inter text-muted text-xs px-2 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.2)', fontSize: 11 }}>{p}</span>
              ))}
            </div>

            {/* Action row */}
            <div className="flex items-center gap-4 mb-4">
              <button
                className="flex items-center gap-1.5 font-inter text-xs hover:opacity-80 transition-opacity"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E85D04', padding: 0 }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#E85D04" strokeWidth="1" /><path d="M3 6h6M7 4l2 2-2 2" stroke="#E85D04" strokeWidth="1" strokeLinecap="round" /></svg>
                Mark as watched
              </button>
            </div>

            {/* Description */}
            <p className="font-inter leading-relaxed mb-6 max-w-lg" style={{ fontSize: 14, color: 'rgba(245,240,235,0.65)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {heroTitle.description}
            </p>

            {/* Crew avatars */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {HERO_MAKERS.slice(0, 5).map((m) => (
                  <img key={m.id} src={m.photo} alt={m.nameLatin} className="w-8 h-8 rounded-full object-cover" style={{ border: '2px solid rgba(13,10,8,0.8)' }} />
                ))}
              </div>
              <span className="font-inter text-muted text-xs">{heroTitle.credits.length} makers credited</span>
              <button
                onClick={() => navigate({ name: 'project', id: heroTitle.id })}
                className="font-inter text-xs hover:opacity-80 transition-opacity"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E85D04', padding: 0 }}
              >
                View all →
              </button>
            </div>
          </div>

          {/* Right side: Up next panel */}
          <div className="ml-auto flex flex-col justify-end pr-8 pb-10 w-72 flex-shrink-0 hidden lg:flex">
            <p className="font-inter font-bold mb-4" style={{ color: '#E85D04', fontSize: 13 }}>Up next</p>
            <div className="flex flex-col gap-3">
              {UP_NEXT.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate({ name: 'project', id: t.id })}
                  className="flex items-center gap-3 text-left cursor-pointer group rounded-xl p-2 transition-colors hover:bg-white/5"
                  style={{ background: 'none', border: 'none' }}
                >
                  <div className="relative flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 76, height: 52 }}>
                    <img src={t.thumb} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="9" cy="9" r="8" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
                        <path d="M7.5 6.5l4 2.5-4 2.5V6.5z" fill="white" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-inter font-semibold truncate group-hover:text-orange transition-colors" style={{ fontSize: 12, color: 'white' }}>
                      {t.name}
                    </p>
                    <p className="font-inter text-muted truncate" style={{ fontSize: 11 }}>View Credits</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-inter text-muted" style={{ fontSize: 10 }}>👍 {t.credits.length * 68}</span>
                      <span className="font-inter text-muted" style={{ fontSize: 10 }}>❤️ {t.credits.length * 24}</span>
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => navigate({ name: 'makers' })}
                className="font-inter font-semibold hover:opacity-80 transition-opacity text-left"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E85D04', fontSize: 13, padding: '4px 8px' }}
              >
                Browse all projects ›
              </button>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {titles.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className="rounded-full transition-all"
              style={{
                width: i === heroIndex ? 20 : 6,
                height: 6,
                background: i === heroIndex ? '#E85D04' : 'rgba(255,255,255,0.3)',
                border: 'none',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SEARCH BAR — floats just below hero fold
      ══════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-8 py-5 border-b" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg)' }}>
        <div className="max-w-2xl mx-auto relative">
          <div
            className="flex items-center rounded-xl"
            style={{
              background: 'var(--c-surface-alt)',
              border: `1.5px solid ${searchFocused ? '#E85D04' : 'var(--c-border-mid)'}`,
              transition: 'border-color 0.15s',
            }}
          >
            <svg className="ml-4 flex-shrink-0" width="15" height="15" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--c-muted)' }}>
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search Makers, Projects, Specialties..."
              className="flex-1 px-4 py-3 font-inter text-paper bg-transparent outline-none"
              style={{ fontSize: 14 }}
            />
            <button
              className="font-inter font-bold text-paper m-1.5 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
              style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 13, padding: '8px 14px', flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.6" />
                <path d="M11 11l3 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
              style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border-mid)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            >
              {searchResults.map((maker) => (
                <button
                  key={maker.id}
                  onClick={() => navigate({ name: 'maker', id: maker.id })}
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-surface-alt transition-colors text-left"
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--c-border)', cursor: 'pointer' }}
                >
                  <img src={maker.photo} alt={maker.nameLatin} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-inter text-paper font-semibold text-sm">{maker.nameLatin}</p>
                    <p className="font-inter text-muted text-xs">{maker.specialtyTags[0]} · {maker.city}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-8 py-8 sm:py-10 flex flex-col gap-10 sm:gap-14">

        {/* ══════════════════════════════════════════════════
            أعمال من ترشيحنا — OUR PICKS
        ══════════════════════════════════════════════════ */}
        {(() => {
          const OUR_PICKS = [
            {
              type: 'Project',
              tag: 'Documentary',
              label: 'Threads of Jordan',
              sub: 'A cinematic journey through Jordanian fashion heritage',
              cta: 'Watch now',
              titleId: 'threads-of-jordan',
              posters: [
                'https://images.unsplash.com/photo-1645616672289-3681f160db22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80',
                'https://images.unsplash.com/photo-1623680904963-5580d963e18e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80',
                'https://images.unsplash.com/photo-1760741319697-cf29ac50fc7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80',
              ],
              hero: 'https://images.unsplash.com/photo-1645616672289-3681f160db22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
            },
            {
              type: 'Collection',
              tag: 'Editor\'s Pick',
              label: 'Arab Voices — Aug 2026',
              sub: '12 hand-picked productions from across the Arab world',
              cta: 'See the list',
              titleId: null,
              posters: [
                'https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80',
                'https://images.unsplash.com/photo-1676221515185-e2ad0b61e798?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80',
                'https://images.unsplash.com/photo-1623674657689-3444240b19fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80',
              ],
              hero: 'https://images.unsplash.com/photo-1572188863110-46d457c9234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
            },
          ]
          return (
            <section>
              {/* Header */}
              <div className="flex items-center gap-3 mb-1">
                <span className="inline-block w-1 rounded-full flex-shrink-0" style={{ background: '#E85D04', height: 20 }} />
                <h2 className="font-inter font-black text-paper" style={{ fontSize: 20, letterSpacing: '-0.01em' }}>
                  Our Picks
                </h2>
              </div>
              <p className="font-inter text-muted text-sm mb-5 ml-4">Curated by the Makers editorial team</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OUR_PICKS.map((pick, i) => (
                  <div
                    key={i}
                    onClick={() => pick.titleId ? navigate({ name: 'project', id: pick.titleId }) : undefined}
                    className="group relative rounded-2xl overflow-hidden"
                    style={{ cursor: pick.titleId ? 'pointer' : 'default', background: 'var(--c-surface)', border: '1px solid var(--c-border)', minHeight: 240 }}
                  >
                    {/* Hero image */}
                    <div className="absolute inset-0">
                      <img
                        src={pick.hero}
                        alt={pick.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'brightness(0.45)' }}
                      />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(13,10,8,0.7) 0%, transparent 60%), linear-gradient(to top, rgba(13,10,8,0.95) 0%, rgba(13,10,8,0.2) 50%, transparent 100%)' }} />
                    </div>

                    {/* Stacked poster thumbnails — top right */}
                    <div className="absolute top-4 right-4 flex gap-1.5">
                      {pick.posters.map((src, j) => (
                        <div
                          key={j}
                          className="rounded-lg overflow-hidden flex-shrink-0 shadow-lg"
                          style={{
                            width: 52,
                            height: 72,
                            border: '1.5px solid rgba(255,255,255,0.12)',
                            transform: `rotate(${(j - 1) * 3}deg) translateY(${j === 1 ? -4 : 0}px)`,
                            zIndex: j === 1 ? 3 : j === 0 ? 2 : 1,
                            position: 'relative',
                          }}
                        >
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-6 flex flex-col justify-end" style={{ minHeight: 240 }}>
                      {/* Type badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="font-inter font-black text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                          style={{ background: '#E85D04', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            {pick.type === 'Collection'
                              ? <><rect x="0.5" y="0.5" width="2.5" height="2.5" rx="0.5" fill="white" /><rect x="5" y="0.5" width="2.5" height="2.5" rx="0.5" fill="white" /><rect x="0.5" y="5" width="2.5" height="2.5" rx="0.5" fill="white" /><rect x="5" y="5" width="2.5" height="2.5" rx="0.5" fill="white" /></>
                              : <path d="M2 1.5l4 2.5-4 2.5V1.5z" fill="white" />
                            }
                          </svg>
                          {pick.type}
                        </span>
                        <span className="font-inter text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{pick.tag}</span>
                      </div>

                      <h3 className="font-inter font-black mb-1 group-hover:text-orange transition-colors leading-tight" style={{ fontSize: 22, color: 'white' }}>
                        {pick.label}
                      </h3>
                      <p className="font-inter text-sm mb-5 leading-relaxed" style={{ maxWidth: 320, color: 'rgba(255,255,255,0.55)' }}>
                        {pick.sub}
                      </p>

                      <span className="inline-flex items-center gap-2 font-inter font-semibold text-sm group-hover:gap-3 transition-all" style={{ color: '#E85D04' }}>
                        {pick.cta}
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })()}

        {/* ══════════════════════════════════════════════════
            TOP 10 MAKERS THIS WEEK
        ══════════════════════════════════════════════════ */}
        <section>
          <SectionHeader title="Top 10 Makers this week" onSeeAll={() => navigate({ name: 'makers' })} />

          {/* All 10 — uniform poster grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {[...top3, ...rest7].map((maker, i) => (
              <button
                key={maker.id}
                onClick={() => navigate({ name: 'maker', id: maker.id })}
                className="text-left cursor-pointer group"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                <div
                  className="rounded-xl overflow-hidden relative mb-1.5"
                  style={{ aspectRatio: '2/3', background: 'var(--c-surface)', border: '1px solid var(--c-border)', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--c-border-mid)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--c-border)')}
                >
                  <img src={maker.photo} alt={maker.nameLatin} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                  <div className="absolute top-1.5 left-1.5">
                    <RankBadge rank={i + 1} />
                  </div>
                </div>
                <p className="font-inter text-paper font-semibold group-hover:text-orange transition-colors truncate" style={{ fontSize: 11 }}>
                  {maker.nameLatin}
                </p>
                <p className="font-inter text-muted truncate" style={{ fontSize: 10 }}>{maker.specialtyTags[0]}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-center mt-5">
            <button
              onClick={() => navigate({ name: 'makers' })}
              className="font-inter font-semibold text-paper px-14 py-3 rounded-full hover:opacity-80 transition-all"
              style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border-mid)', cursor: 'pointer', fontSize: 13 }}
            >
              See all
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            OPEN PROJECTS — job board teaser
        ══════════════════════════════════════════════════ */}
        <section>
          <SectionHeader title="Open Projects" onSeeAll={() => navigate({ name: 'open-projects' })} />
          <p className="font-inter text-muted text-sm mb-4" style={{ marginTop: -12 }}>
            Productions actively looking for Makers — apply to join the crew
          </p>

          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'op-1', title: 'Ramadan Campaign — Series of 4 Short Films', brand: 'intime Creative', type: 'Brand Campaign', roles: ['Director', 'Cinematographer'], budget: '$2,000–$4,000', deadline: 'Feb 15', color: '#E85D04' },
              { id: 'op-2', title: 'Fashion Editorial — Desert Collection', brand: 'Al-Noor Studios', type: 'Editorial', roles: ['Photographer', 'Stylist'], budget: '$800–$1,500', deadline: 'Jan 30', color: '#9333EA' },
              { id: 'op-3', title: 'Social Media Content — Monthly Retainer', brand: 'Meshwar Agency', type: 'Retainer', roles: ['Content Creator', 'Editor'], budget: '$500/mo', deadline: 'Rolling', color: '#059669' },
              { id: 'op-4', title: 'Documentary — Urban Street Culture in Cairo', brand: 'Nile Wave Productions', type: 'Documentary', roles: ['Cinematographer', 'Sound'], budget: '$3,500–$6,000', deadline: 'Mar 1', color: '#2563EB' },
              { id: 'op-5', title: 'Motion Graphics Package — Sports Brand', brand: 'Riyada Media', type: 'Motion Design', roles: ['Motion Designer'], budget: '$1,200–$2,000', deadline: 'Feb 5', color: '#DC2626' },
            ].map((job) => (
              <button
                key={job.id}
                onClick={() => navigate({ name: 'open-projects' })}
                className="flex-shrink-0 text-left cursor-pointer group rounded-2xl overflow-hidden flex flex-col"
                style={{ width: 220, background: 'var(--c-surface)', border: '1px solid var(--c-border)', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E85D04')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--c-border)')}
              >
                {/* Color stripe */}
                <div style={{ height: 4, background: job.color, width: '100%' }} />
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div>
                    <span className="font-inter font-bold px-2 py-0.5 rounded-md" style={{ background: job.color, color: 'white', fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {job.type}
                    </span>
                  </div>
                  <p className="font-inter font-bold text-paper leading-snug group-hover:text-orange transition-colors" style={{ fontSize: 13 }}>
                    {job.title}
                  </p>
                  <p className="font-inter" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{job.brand}</p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {job.roles.map((r) => (
                      <span key={r} className="font-inter px-2 py-0.5 rounded-md" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 10 }}>{r}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
                    <span className="font-inter font-semibold" style={{ color: '#E85D04', fontSize: 11 }}>{job.budget}</span>
                    <span className="font-inter" style={{ color: 'var(--c-muted-2)', fontSize: 10 }}>⏰ {job.deadline}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            TOP PICKS
        ══════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-start justify-between mb-1">
            <div>
              <SectionHeader title="Top Picks" onSeeAll={() => navigate({ name: 'makers' })} />
              <p className="font-inter text-muted text-sm" style={{ marginTop: -14, marginBottom: 16 }}>
                Projects and makers curated for you
              </p>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {titles.map((title, i) => {
              const rating = 7.5 + (i % 4) * 0.35
              return (
                <div
                  key={title.id + '-' + i}
                  className="flex-shrink-0 rounded-2xl overflow-hidden"
                  style={{ width: 180, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
                >
                  {/* Poster */}
                  <div
                    className="relative cursor-pointer group"
                    style={{ height: 260 }}
                    onClick={() => navigate({ name: 'project', id: title.id })}
                  >
                    <img
                      src={title.thumb}
                      alt={title.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(22,18,16,0.6) 0%, transparent 50%)' }} />
                    <div
                      className="absolute top-2.5 left-2.5 w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></svg>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="#F5C518">
                        <path d="M6.5 1l1.54 3.12 3.44.5-2.49 2.43.59 3.42L6.5 8.9l-3.08 1.57.59-3.42L1.52 4.62l3.44-.5L6.5 1z" />
                      </svg>
                      <span className="font-inter font-bold" style={{ fontSize: 13, color: '#F5C518' }}>{rating.toFixed(1)}</span>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ cursor: 'pointer', marginLeft: 2 }}>
                        <path d="M6.5 1l1.54 3.12 3.44.5-2.49 2.43.59 3.42L6.5 8.9l-3.08 1.57.59-3.42L1.52 4.62l3.44-.5L6.5 1z" stroke="#7A6E66" strokeWidth="1" />
                      </svg>
                    </div>

                    <button
                      onClick={() => navigate({ name: 'project', id: title.id })}
                      className="font-inter font-bold text-paper text-left w-full hover:text-orange transition-colors leading-tight mb-3"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {title.name}
                    </button>

                    <button
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-full font-inter font-semibold mb-2 hover:opacity-80 transition-opacity"
                      style={{ background: 'var(--c-border)', border: 'none', cursor: 'pointer', color: '#E85D04', fontSize: 12 }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="#E85D04" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      Watchlist
                    </button>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => navigate({ name: 'project', id: title.id })}
                        className="flex items-center gap-1.5 font-inter text-paper text-xs hover:opacity-70 transition-opacity"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M3 2l6 3.5L3 9V2z" fill="currentColor" /></svg>
                        Project
                      </button>
                      <button
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                        style={{ background: 'none', border: '1px solid var(--c-border-mid)', cursor: 'pointer' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#7A6E66" strokeWidth="1" /><path d="M5 4.5v3M5 3v.5" stroke="#7A6E66" strokeWidth="1" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>


        {/* ══════════════════════════════════════════════════
            BIGGEST AUDIENCES + RATINGS — two-col
        ══════════════════════════════════════════════════ */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Biggest Audiences */}
            <div>
              <SectionHeader title="Biggest Audiences" onSeeAll={() => navigate({ name: 'creators' })} />
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {[...makers].sort((a, b) => {
                  const aT = Object.values(a.social).reduce((s, n) => s + (n ?? 0), 0)
                  const bT = Object.values(b.social).reduce((s, n) => s + (n ?? 0), 0)
                  return bT - aT
                }).slice(0, 5).map((maker) => {
                  const total = Object.values(maker.social).reduce((s, n) => s + (n ?? 0), 0)
                  return (
                    <button
                      key={maker.id}
                      onClick={() => navigate({ name: 'maker', id: maker.id })}
                      className="flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer group text-center"
                      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', minWidth: 110, transition: 'border-color 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--c-border-mid)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--c-border)')}
                    >
                      <div className="relative">
                        <img src={maker.photo} alt={maker.nameLatin} className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid var(--c-border)' }} />
                        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full" style={{ background: '#4ADE80', border: '2px solid var(--c-surface)' }} />
                      </div>
                      <div>
                        <p className="font-inter text-paper font-semibold group-hover:text-orange transition-colors" style={{ fontSize: 12 }}>{maker.nameLatin.split(' ')[0]}</p>
                        <p className="font-inter text-muted" style={{ fontSize: 11 }}>{maker.specialtyTags[0]}</p>
                        <p className="font-inter font-bold mt-1" style={{ color: '#E85D04', fontSize: 13 }}>{formatFollowers(total)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            TOP SOCIAL MEDIA CONTENT
        ══════════════════════════════════════════════════ */}
        <section>
          <SectionHeader title="Top Social Media Content" onSeeAll={() => navigate({ name: 'creators' })} />
          <p className="font-inter text-muted text-sm mb-4" style={{ marginTop: -12 }}>
            Most viewed content from verified Makers
          </p>

          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {SOCIAL_CONTENT.map((item, i) => {
              const maker = makers.find((m) => m.id === item.makerId)
              return (
                <div
                  key={i}
                  onClick={() => maker && navigate({ name: 'maker', id: maker.id })}
                  className="flex-shrink-0 cursor-pointer group rounded-2xl overflow-hidden"
                  style={{ width: 200, background: 'var(--c-surface)', border: '1px solid var(--c-border)', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--c-border-mid)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--c-border)')}
                >
                  {/* Thumbnail portrait */}
                  <div className="relative overflow-hidden" style={{ height: 260 }}>
                    <img
                      src={item.thumb}
                      alt={item.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,10,8,0.95) 0%, rgba(13,10,8,0.1) 55%, transparent 100%)' }} />

                    {/* Platform badge */}
                    <div
                      className="absolute top-3 left-3 font-inter font-black text-white px-2.5 py-1 rounded-lg"
                      style={{ background: PLATFORM_COLORS[item.platform] ?? '#E85D04', fontSize: 11, letterSpacing: '0.03em' }}
                    >
                      {item.platform}
                    </div>

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.9)' }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 5l7 4-7 4V5z" fill="#0D0A08" /></svg>
                      </div>
                    </div>

                    {/* Stats bottom */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-inter font-bold text-paper" style={{ fontSize: 13 }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6C1 6 3 2 6 2s5 4 5 4-2 4-5 4S1 6 1 6z" stroke="white" strokeWidth="1.1" /><circle cx="6" cy="6" r="1.5" fill="white" /></svg>
                          {item.views}
                        </span>
                        <span className="flex items-center gap-1 font-inter text-paper" style={{ fontSize: 12 }}>
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 10C5.5 10 1 7 1 4a2.5 2.5 0 014.5-1.5A2.5 2.5 0 0110 4c0 3-4.5 6-4.5 6z" stroke="#FF6B6B" strokeWidth="1" fill="#FF6B6B" /></svg>
                          {item.likes}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="font-inter font-bold text-paper group-hover:text-orange transition-colors leading-tight mb-2" style={{ fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.label}
                    </p>
                    {maker && (
                      <p className="font-inter text-muted truncate" style={{ fontSize: 11 }}>{maker.nameLatin}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            TOP FILMS RATING (IMDB-style ranked list)
        ══════════════════════════════════════════════════ */}
        <section>
          <SectionHeader title="Top Rated Films" onSeeAll={() => navigate({ name: 'makers' })} />
          <p className="font-inter text-muted text-sm mb-5" style={{ marginTop: -12 }}>
            250 best-rated productions of all time
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
            {TOP_FILM_RATINGS.map((film, i) => {
              const isLocal = titles.find((t) => t.name === film.title)
              return (
                <div
                  key={film.rank}
                  onClick={() => isLocal ? navigate({ name: 'project', id: isLocal.id }) : undefined}
                  className="flex items-center gap-4 px-5 py-4 group"
                  style={{
                    borderBottom: i < TOP_FILM_RATINGS.length - 2 ? '1px solid var(--c-border)' : 'none',
                    borderRight: i % 2 === 0 ? '1px solid var(--c-border)' : 'none',
                    cursor: isLocal ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (isLocal) e.currentTarget.style.background = 'var(--c-surface-alt)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Rank */}
                  <span
                    className="font-inter font-black flex-shrink-0 text-right"
                    style={{
                      width: 28,
                      fontSize: film.rank <= 3 ? 17 : 14,
                      color: film.rank === 1 ? '#E85D04' : film.rank === 2 ? '#C0B090' : film.rank === 3 ? '#9B7B4E' : 'var(--c-border-mid)',
                    }}
                  >
                    {film.rank}
                  </span>

                  {/* Thumb */}
                  <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 54, height: 36 }}>
                    <img src={film.thumb} alt={film.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-inter font-bold text-sm leading-tight group-hover:text-orange transition-colors ${isLocal ? '' : 'text-paper'}`} style={{ color: isLocal ? undefined : 'var(--c-text)' }}>
                      {film.title}
                    </p>
                    <p className="font-inter text-muted" style={{ fontSize: 11 }}>
                      {film.year} · {film.genre}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="#F5C518">
                      <path d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.05L6 8l-2.78 1.5.53-3.05L1.5 4.25l3.1-.45L6 1z" />
                    </svg>
                    <span className="font-inter font-bold text-paper" style={{ fontSize: 14, color: '#F5C518' }}>{film.rating.toFixed(1)}</span>
                    <span className="font-inter text-muted" style={{ fontSize: 10 }}>({film.votes})</span>
                  </div>

                  {/* Bookmark icon */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                    <path d="M3 2h8v10l-4-3-4 3V2z" stroke="#E85D04" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                </div>
              )
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            JOIN CTA
        ══════════════════════════════════════════════════ */}
        <section
          className="rounded-2xl p-10 text-center relative overflow-hidden"
          style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(232,93,4,0.18) 0%, transparent 70%), var(--c-surface)', border: '1px solid rgba(232,93,4,0.2)' }}
        >
          <p className="font-inter text-xs uppercase tracking-widest mb-3" style={{ color: '#E85D04', letterSpacing: '0.18em', fontWeight: 600 }}>
            Invite Only · 70 / 150 spots filled
          </p>
          <h2 className="font-inter font-bold text-paper mb-3 leading-tight" style={{ fontSize: 'clamp(22px, 3vw, 34px)' }}>
            We're just getting started.<br />Be one of the first 150 names.
          </h2>
          <p className="font-inter text-muted text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Every application needs a referral from an existing Maker. No pitch decks — submit your credits and we'll review.
          </p>
          <button
            onClick={() => navigate({ name: 'request-invite' })}
            className="inline-flex items-center gap-3 font-inter font-bold text-paper px-10 py-4 rounded-full hover:opacity-90 active:scale-95 transition-all"
            style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 15 }}
          >
            Request an Invitation
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </section>

      </div>

      {/* ══════════════════════════════════════════════════
          TOP NEWS — last section
      ══════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-8 pb-12">
        <section>
          <SectionHeader title="Top News" onSeeAll={() => navigate({ name: 'news' })} />

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main news list */}
            <div className="flex-1 flex flex-col gap-0" style={{ minWidth: 0 }}>

              {/* Hero story */}
              <div
                className="flex gap-4 pb-5 mb-5 cursor-pointer group"
                style={{ borderBottom: '1px solid var(--c-border)' }}
                onClick={() => navigate({ name: 'news-article', id: 'n1' })}
              >
                <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 100, height: 72 }}>
                  <img src="https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=144&fit=crop" alt="News" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-inter font-bold text-paper leading-snug group-hover:text-orange transition-colors mb-1" style={{ fontSize: 14 }}>
                    Arab Filmmakers Dominate Cannes 2025 — Record Number of Selections from the Region
                  </p>
                  <p className="font-inter leading-relaxed mb-2" style={{ fontSize: 12, color: 'rgba(245,240,235,0.55)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    This year's Cannes Film Festival saw an unprecedented 14 projects from Arab directors in official selection, signaling a global shift in attention toward Middle Eastern cinema and its makers.
                  </p>
                  <p className="font-inter" style={{ fontSize: 11, color: 'var(--c-muted-2)' }}>Aug 11 · Makers News</p>
                </div>
              </div>

              {/* 2-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Saudi Arabia Announces $500M Film Fund for Regional Co-Productions', date: 'Aug 11', source: 'Variety', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=160&h=100&fit=crop' },
                  { title: "Jordan's 'Desert Echo' Wins Best Cinematography at Dubai International Film Festival", date: 'Aug 10', source: 'Screen Daily', img: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=160&h=100&fit=crop' },
                  { title: 'TikTok Arabia Launches Creator Fund Targeting Arab Content Makers', date: 'Aug 10', source: 'Arab News', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=160&h=100&fit=crop' },
                  { title: "Lebanese Director Nadia Karim's Debut Feature Gets Netflix Worldwide Deal", date: 'Aug 9', source: 'The Hollywood Reporter', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=160&h=100&fit=crop' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => navigate({ name: 'news-article', id: ['n2','n3','n4','n5'][i] })}
                    className="flex gap-3 text-left cursor-pointer group"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 72, height: 52 }}>
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-inter font-semibold text-paper leading-snug group-hover:text-orange transition-colors mb-1" style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.title}
                      </p>
                      <p className="font-inter" style={{ fontSize: 10, color: 'var(--c-muted-2)' }}>{item.date} · {item.source}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>
  )
}
