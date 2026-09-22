import { useState } from 'react'
import type { Navigate } from '../App'

interface TitlesPageProps {
  navigate: Navigate
}

interface TitleItem {
  id: string
  name: string
  brand: string
  year: number
  genre: string
  type: string
  rating: number
  thumb: string
  description: string
  platforms: string[]
  inSeed: boolean
}

const ALL_TITLES: TitleItem[] = [
  { id: 'threads-of-jordan', name: 'Threads of Jordan', brand: 'intime Creative', year: 2024, genre: 'Campaign', type: 'Campaign', rating: 8.5, thumb: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=600&fit=crop', description: 'A three-part fashion campaign documenting contemporary Jordanian designers against the backdrop of old Amman and Wadi Rum.', platforms: ['Instagram', 'TikTok', 'YouTube'], inSeed: true },
  { id: 'city-pulse', name: 'City Pulse', brand: 'intime Creative', year: 2023, genre: 'Documentary', type: 'Documentary', rating: 8.8, thumb: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=600&fit=crop', description: 'A short-form documentary series capturing the creative subcultures of Amman. Five episodes, each under 12 minutes.', platforms: ['YouTube', 'Instagram'], inSeed: true },
  { id: 'ramadan-glow', name: 'Ramadan Glow', brand: 'intime Creative', year: 2024, genre: 'Campaign', type: 'Campaign', rating: 8.3, thumb: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=600&fit=crop', description: 'A Ramadan brand campaign built around family rituals and shared light. Warm, intimate cinematography.', platforms: ['Instagram', 'TikTok'], inSeed: true },
  { id: 'voice-of-streets', name: 'Voice of the Streets', brand: 'intime Creative', year: 2023, genre: 'Music Video', type: 'Music Video', rating: 7.9, thumb: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop', description: 'A music video for an emerging Jordanian hip-hop artist, shot across three nights in central Amman.', platforms: ['YouTube', 'TikTok'], inSeed: true },
  { id: 'after-the-rain', name: 'After the Rain', brand: 'Karim Films', year: 2025, genre: 'Drama', type: 'Film', rating: 9.1, thumb: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop', description: 'A Beirut-set drama about a family fractured by displacement and reunion. Acquired by Netflix for worldwide distribution after TIFF.', platforms: [], inSeed: false },
  { id: 'desert-echo', name: 'Desert Echo', brand: 'Nile Wave Productions', year: 2025, genre: 'Documentary', type: 'Film', rating: 8.7, thumb: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=600&fit=crop', description: 'A Jordanian feature documentary following three young Bedouin women navigating tradition and modernity in Wadi Rum.', platforms: [], inSeed: false },
  { id: 'nile-series', name: 'Nile', brand: 'MBC Studios', year: 2025, genre: 'Drama', type: 'Series', rating: 8.4, thumb: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=600&fit=crop', description: 'A six-part miniseries tracing four generations of an Egyptian family from the 1950s to the present through archival footage and drama.', platforms: [], inSeed: false },
  { id: 'atlas-nights', name: 'Atlas Nights', brand: 'Atlas Studios', year: 2024, genre: 'Action', type: 'Film', rating: 7.8, thumb: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop', description: 'A Moroccan action thriller set across Marrakech and Casablanca, shot entirely at night with a crew of 12.', platforms: [], inSeed: false },
  { id: 'street-light', name: 'Street Light', brand: 'Meshwar Agency', year: 2024, genre: 'Documentary', type: 'Short', rating: 8.2, thumb: 'https://images.unsplash.com/photo-1517174637803-a2f5e8e0dcd4?w=400&h=600&fit=crop', description: "A 22-minute documentary portrait of Cairo's last gas-lamp lighter, captured over one Ramadan night.", platforms: [], inSeed: false },
  { id: 'beit-al-ward', name: 'Beit Al-Ward', brand: 'intime Creative', year: 2025, genre: 'Campaign', type: 'Campaign', rating: 8.9, thumb: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=400&h=600&fit=crop', description: 'A wedding film brand campaign celebrating Arab love stories across four Arab cities. Shot over 14 days with a crew of 18.', platforms: [], inSeed: false },
  { id: 'tariq', name: 'Tariq', brand: 'Sabeel Films', year: 2023, genre: 'Drama', type: 'Film', rating: 7.5, thumb: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop', description: "A road film following a Syrian musician's journey from Beirut to Amman, scored with live oud recordings.", platforms: [], inSeed: false },
  { id: 'pulse-24', name: 'Pulse 24', brand: 'Riyada Media', year: 2024, genre: 'Sports', type: 'Series', rating: 8.0, thumb: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=600&fit=crop', description: 'A sports documentary series profiling 8 Arab athletes redefining their disciplines across 12 Arab channels.', platforms: [], inSeed: false },
]

const GENRES = ['All', 'Campaign', 'Documentary', 'Drama', 'Action', 'Sports', 'Music Video', 'Series', 'Short']
const TYPES = ['All', 'Film', 'Series', 'Campaign', 'Short', 'Music Video', 'Documentary']
const SORT_OPTIONS = ['Latest', 'Top Rated', 'A-Z']

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#E85D04',
  TikTok: 'var(--c-text)',
  YouTube: '#DC2626',
  Vimeo: '#1AB7EA',
}

const HERO = ALL_TITLES[4]

export default function TitlesPage({ navigate }: TitlesPageProps) {
  const [activeGenre, setActiveGenre] = useState('All')
  const [activeType, setActiveType] = useState('All')
  const [sort, setSort] = useState('Latest')
  const [search, setSearch] = useState('')

  const filtered = ALL_TITLES.filter((t) => {
    if (activeGenre !== 'All' && t.genre !== activeGenre) return false
    if (activeType !== 'All' && t.type !== activeType) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sort === 'Top Rated') return b.rating - a.rating
    if (sort === 'A-Z') return a.name.localeCompare(b.name)
    return b.year - a.year
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-bg)' }}>

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden" style={{ height: 480 }}>
        <img
          src={HERO.thumb}
          alt={HERO.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.4)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(13,10,8,0.96) 35%, rgba(13,10,8,0.2) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,10,8,1) 0%, transparent 50%)' }} />

        <div className="relative z-10 flex flex-col justify-end h-full px-4 sm:px-8 pb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-inter font-bold px-2.5 py-1 rounded-md" style={{ background: '#E85D04', color: 'white', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {HERO.genre}
            </span>
            <span className="font-inter" style={{ color: 'rgba(245,240,235,0.6)', fontSize: 12 }}>
              ★ {HERO.rating} &nbsp;·&nbsp; {HERO.year}
            </span>
          </div>
          <h1 className="font-archivo text-paper mb-3" style={{ fontSize: 'clamp(30px,5vw,52px)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {HERO.name}
          </h1>
          <p className="font-inter mb-6 leading-relaxed max-w-lg" style={{ fontSize: 14, color: 'rgba(245,240,235,0.6)' }}>
            {HERO.description}
          </p>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 font-inter font-bold text-paper px-6 py-3 rounded-full hover:opacity-90 transition-all"
              style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 13 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2l9 5-9 5V2z" fill="currentColor" /></svg>
              View Project
            </button>
            <button
              className="flex items-center gap-2 font-inter font-semibold text-paper px-6 py-3 rounded-full hover:opacity-80 transition-all"
              style={{ background: 'rgba(245,240,235,0.1)', border: '1px solid rgba(245,240,235,0.15)', cursor: 'pointer', fontSize: 13 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              Add to list
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="px-4 sm:px-8 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <div className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGenre(g)}
                className="flex-shrink-0 font-inter px-4 py-1.5 rounded-full transition-all"
                style={{
                  background: activeGenre === g ? '#E85D04' : 'transparent',
                  border: '1px solid ' + (activeGenre === g ? '#E85D04' : 'var(--c-border)'),
                  color: activeGenre === g ? 'white' : 'var(--c-muted)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: activeGenre === g ? 600 : 400,
                }}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="relative flex-shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: 'var(--c-muted-2)' }}>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M9.5 9.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles"
              className="pl-8 pr-4 py-2 rounded-full font-inter"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 12, width: 160 }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="font-inter text-muted" style={{ fontSize: 12 }}>Sort by:</span>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className="font-inter px-3 py-1 rounded-lg transition-all"
              style={{
                background: sort === s ? '#E85D04' : 'var(--c-surface)',
                border: '1px solid ' + (sort === s ? '#E85D04' : 'var(--c-border)'),
                color: sort === s ? 'white' : 'var(--c-muted)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: sort === s ? 600 : 400,
              }}
            >
              {s}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap gap-2">
            {TYPES.map((tp) => (
              <button
                key={tp}
                onClick={() => setActiveType(tp)}
                className="font-inter px-3 py-1 rounded-lg transition-all"
                style={{
                  background: activeType === tp ? 'rgba(232,93,4,0.15)' : 'transparent',
                  border: '1px solid ' + (activeType === tp ? 'rgba(232,93,4,0.4)' : 'var(--c-border)'),
                  color: activeType === tp ? '#E85D04' : 'var(--c-muted-2)',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                {tp}
              </button>
            ))}
          </div>
        </div>

        <p className="font-inter text-muted mb-6" style={{ fontSize: 12 }}>
          {filtered.length} title{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Grid */}
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {filtered.map((title) => (
            <button
              key={title.id}
              onClick={() => title.inSeed && navigate({ name: 'project', id: title.id })}
              className="text-left group"
              style={{ background: 'none', border: 'none', padding: 0, cursor: title.inSeed ? 'pointer' : 'default' }}
            >
              <div className="relative rounded-xl overflow-hidden mb-3" style={{ aspectRatio: '2/3', background: 'var(--c-surface)' }}>
                <img
                  src={title.thumb}
                  alt={title.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(13,10,8,0.5)' }}>
                  {title.inSeed && (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#E85D04' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 3l10 5-10 5V3z" fill="white" /></svg>
                    </div>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: 'rgba(13,10,8,0.75)' }}>
                  <span style={{ color: '#E85D04', fontSize: 10 }}>★</span>
                  <span className="font-inter font-bold" style={{ color: 'var(--c-text)', fontSize: 10 }}>{title.rating}</span>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="font-inter font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(13,10,8,0.75)', color: '#E85D04', fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {title.type}
                  </span>
                </div>
              </div>
              <p className="font-inter font-bold text-paper leading-tight mb-0.5 group-hover:text-orange transition-colors" style={{ fontSize: 13 }}>
                {title.name}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-inter text-muted" style={{ fontSize: 11 }}>{title.year}</span>
                {title.platforms.length > 0 && (
                  <div className="flex gap-1">
                    {title.platforms.slice(0, 2).map((p) => (
                      <span key={p} className="font-inter font-bold" style={{ fontSize: 9, color: PLATFORM_COLORS[p] ?? 'var(--c-muted)' }}>
                        {p.slice(0, 2).toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-inter text-muted" style={{ fontSize: 14 }}>No titles match your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
