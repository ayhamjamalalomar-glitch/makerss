import { useState, useMemo } from 'react'
import { makers, titles, phaseLabels, type Phase } from '../data/seed'
import type { Navigate } from '../App'

interface MakersPageProps {
  navigate: Navigate
}

const ALL_SPECIALTIES = [
  'Director', 'Actor', 'Content Creator',
  'Cinematographer', 'Producer', 'Screenwriter', 'Storyboard Artist',
  'Makeup Artist', 'Stylist', 'Production Designer', 'Photographer',
  'Production Manager', 'Sound Engineer', 'Gaffer', 'Drone Operator',
  'Video Editor', 'VFX', 'Colorist', 'Motion Designer', 'Graphic Designer',
  'Art Director', 'Set Designer', 'Costume Designer', 'Hair Stylist',
  'Script Supervisor', 'Casting Director', 'Location Manager', 'Grip',
  'Boom Operator', 'Foley Artist', 'Music Composer', 'Narrator',
  'Social Media Manager', 'Brand Strategist', 'Creative Director',
]

const ARAB_COUNTRIES = [
  'Algeria', 'Bahrain', 'Comoros', 'Djibouti', 'Egypt', 'Iraq', 'Jordan',
  'Kuwait', 'Lebanon', 'Libya', 'Mauritania', 'Morocco', 'Oman', 'Palestine',
  'Qatar', 'Saudi Arabia', 'Somalia', 'Sudan', 'Syria', 'Tunisia',
  'United Arab Emirates', 'Yemen',
]

const POPULAR_CHARTS = [
  { label: 'Top Makers this week', sub: 'As rated by the community', thumb: makers[0].photo },
  { label: 'Most followed Creators', sub: '100 creators by audience size', thumb: makers[1].photo },
  { label: 'Top Rated Projects', sub: 'Best productions of all time', thumb: titles[0].thumb },
  { label: 'Rising Talents', sub: 'Fastest growing this month', thumb: makers[2].photo },
  { label: 'Fashion & Lifestyle', sub: 'Top makers in fashion content', thumb: makers[3].photo },
  { label: 'Documentary Makers', sub: '50 verified documentary directors', thumb: makers[4].photo },
  { label: 'Brand Collaboration', sub: 'Most booked for brand deals', thumb: makers[5].photo },
]

export default function MakersPage({ navigate }: MakersPageProps) {
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [country, setCountry] = useState('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [activeTab, setActiveTab] = useState<'makers' | 'creators'>('makers')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(() => {
    return makers.filter((m) => {
      if (specialty !== 'all' && !m.specialtyTags.some((t) => t.toLowerCase().includes(specialty.toLowerCase()))) return false
      if (country !== 'all' && m.country !== country) return false
      if (verifiedOnly && !m.verified) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !m.nameLatin.toLowerCase().includes(q) &&
          !m.nameArabic.includes(q) &&
          !m.city.toLowerCase().includes(q) &&
          !m.country.toLowerCase().includes(q) &&
          !m.specialtyTags.join(' ').toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [search, specialty, country, verifiedOnly])

  return (
    <div className="min-h-screen px-8 py-8">

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--c-muted-2)' }}>
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Makers by name..."
          className="w-full pl-12 pr-5 py-4 rounded-2xl font-inter text-sm"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 14 }}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
          {(['makers', 'creators'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="font-inter font-semibold px-4 py-2.5 capitalize transition-all"
              style={{
                background: activeTab === tab ? '#E85D04' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === tab ? 'var(--c-text)' : 'var(--c-muted)',
                fontSize: 13,
              }}
            >
              {tab === 'makers' ? 'Makers · Filmmakers' : 'Creators'}
            </button>
          ))}
        </div>

        {/* Specialty */}
        <div className="relative">
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="font-inter text-sm pl-4 pr-9 py-2.5 rounded-xl appearance-none"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: specialty !== 'all' ? 'var(--c-text)' : 'var(--c-muted)', cursor: 'pointer', fontSize: 13 }}
          >
            <option value="all">All specialties</option>
            {ALL_SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--c-muted-2)' }}>
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Country */}
        <div className="relative">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="font-inter text-sm pl-4 pr-9 py-2.5 rounded-xl appearance-none"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: country !== 'all' ? 'var(--c-text)' : 'var(--c-muted)', cursor: 'pointer', fontSize: 13 }}
          >
            <option value="all">All countries</option>
            {ARAB_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--c-muted-2)' }}>
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Verified toggle */}
        <button
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className="flex items-center gap-2.5 font-inter text-sm px-4 py-2.5 rounded-xl transition-all"
          style={{ background: 'var(--c-surface)', border: `1px solid ${verifiedOnly ? '#E85D04' : 'var(--c-border)'}`, cursor: 'pointer', color: verifiedOnly ? 'var(--c-text)' : 'var(--c-muted)', fontSize: 13 }}
        >
          <div className="w-8 h-4 rounded-full flex items-center transition-colors" style={{ backgroundColor: verifiedOnly ? '#E85D04' : 'var(--c-border)', padding: '2px' }}>
            <div className="w-3 h-3 rounded-full transition-transform" style={{ background: 'var(--c-text)', transform: verifiedOnly ? 'translateX(16px)' : 'translateX(0)' }} />
          </div>
          Verified only
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8 items-start">

        {/* LEFT — makers list/grid */}
        <div className="flex-1 min-w-0">

          {/* Count + view toggle */}
          <div className="flex items-center justify-between mb-4">
            <p className="font-inter text-muted text-sm" style={{ color: 'var(--c-muted)' }}>
              {filtered.length} Maker{filtered.length !== 1 ? 's' : ''} found
            </p>
            <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
              {/* List view */}
              <button
                onClick={() => setViewMode('list')}
                className="p-2.5 transition-colors"
                style={{ background: viewMode === 'list' ? '#E85D04' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? 'var(--c-text)' : 'var(--c-muted-2)' }}
                title="List view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
                  <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
                  <rect x="2" y="11" width="12" height="1.5" rx="0.75" fill="currentColor" />
                </svg>
              </button>
              {/* Grid view */}
              <button
                onClick={() => setViewMode('grid')}
                className="p-2.5 transition-colors"
                style={{ background: viewMode === 'grid' ? '#E85D04' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--c-text)' : 'var(--c-muted-2)' }}
                title="Grid view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
                  <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" />
                  <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" />
                  <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center rounded-2xl" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
              <p className="font-inter text-muted text-base">No Makers match your filters.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID VIEW ── */
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {filtered.map((maker) => {
                const featuredCredit = maker.credits[0]
                const featuredTitle = featuredCredit ? titles.find((t) => t.id === featuredCredit.titleId) : null
                return (
                  <div
                    key={maker.id}
                    className="group rounded-2xl overflow-hidden flex flex-col"
                    style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', cursor: 'pointer' }}
                    onClick={() => navigate({ name: 'maker', id: maker.id })}
                  >
                    <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
                      <img src={maker.photo} alt={maker.nameLatin} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {maker.verified && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#E85D04', border: '2px solid var(--c-surface)' }}>
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5L3.5 6L7 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.75)', border: '1.5px solid rgba(255,255,255,0.3)' }} onClick={(e) => e.stopPropagation()}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5h6" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></svg>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <div>
                        <p className="font-inter font-bold text-paper group-hover:text-orange transition-colors leading-tight" style={{ fontSize: 14 }}>{maker.nameLatin}</p>
                        <p className="font-arabic text-muted" style={{ fontSize: 11 }} dir="rtl">{maker.nameArabic}</p>
                      </div>
                      {featuredTitle && (
                        <p className="font-inter text-xs leading-tight" style={{ color: '#E85D04' }} onClick={(e) => { e.stopPropagation(); navigate({ name: 'project', id: featuredTitle.id }) }}>
                          {featuredTitle.name} ({featuredCredit?.year})
                        </p>
                      )}
                      <button onClick={(e) => e.stopPropagation()} className="mt-auto w-full font-inter font-semibold py-2 rounded-xl transition-all hover:opacity-90" style={{ background: 'transparent', border: '1px solid var(--c-border)', color: '#E85D04', fontSize: 12, cursor: 'pointer' }}>
                        + Follow
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
              {filtered.map((maker, i) => {
                const featuredCredit = maker.credits[0]
                const featuredTitle = featuredCredit ? titles.find((t) => t.id === featuredCredit.titleId) : null
                return (
                  <div
                    key={maker.id}
                    className="flex items-center gap-4 px-5 py-4 group cursor-pointer transition-colors hover:bg-surface-alt"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--c-border)' : 'none' }}
                    onClick={() => navigate({ name: 'maker', id: maker.id })}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img src={maker.photo} alt={maker.nameLatin} className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid var(--c-border)' }} />
                      {maker.verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#E85D04', border: '1.5px solid var(--c-surface)' }}>
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1.5 3.5L3 5L5.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-inter font-bold text-paper group-hover:text-orange transition-colors" style={{ fontSize: 15 }}>
                        {maker.nameLatin}
                      </p>
                      <p className="font-inter text-muted text-sm">
                        {maker.specialtyTags.join(' · ')}
                      </p>
                    </div>

                    {/* + button */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity"
                      style={{ border: '1.5px solid var(--c-border-mid)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 2v8M2 6h8" stroke="#E85D04" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT — Popular charts sidebar */}
        <aside className="flex-shrink-0" style={{ width: 280 }}>
          <h3 className="font-inter font-bold text-paper mb-4" style={{ fontSize: 18 }}>Popular charts</h3>
          <div className="flex flex-col rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
            {POPULAR_CHARTS.map((chart, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer group transition-colors hover:bg-surface-alt"
                style={{ borderBottom: i < POPULAR_CHARTS.length - 1 ? '1px solid var(--c-border)' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-inter font-semibold text-paper group-hover:text-orange transition-colors leading-tight" style={{ fontSize: 13 }}>
                    {chart.label}
                  </p>
                  <p className="font-inter text-muted mt-0.5" style={{ fontSize: 11 }}>{chart.sub}</p>
                </div>
                <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 44, height: 56 }}>
                  <img src={chart.thumb} alt={chart.label} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        </aside>

      </div>
    </div>
  )
}
