import { useState, useMemo } from 'react'
import MakerCard from '../components/MakerCard'
import { makers, phaseLabels, phaseSpecialties, type Phase } from '../data/seed'
import type { Navigate } from '../App'

interface BrowseProps {
  navigate: Navigate
  initialPhase?: string
}

const ALL_PHASES: Phase[] = ['pre-production', 'production', 'post-production', 'social-media']
const ALL_CITIES = [
  'Algeria', 'Bahrain', 'Comoros', 'Djibouti', 'Egypt', 'Iraq', 'Jordan',
  'Kuwait', 'Lebanon', 'Libya', 'Mauritania', 'Morocco', 'Oman', 'Palestine',
  'Qatar', 'Saudi Arabia', 'Somalia', 'Sudan', 'Syria', 'Tunisia',
  'United Arab Emirates', 'Yemen',
]

export default function Browse({ navigate, initialPhase }: BrowseProps) {
  const [activePhase, setActivePhase] = useState<Phase | 'all'>((initialPhase as Phase) || 'all')
  const [activeCity, setActiveCity] = useState<string>('all')
  const [activeSpecialty, setActiveSpecialty] = useState<string>('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const specialties = useMemo(() => {
    if (activePhase === 'all') return []
    return phaseSpecialties[activePhase]
  }, [activePhase])

  const filtered = useMemo(() => {
    return makers.filter((m) => {
      if (activePhase !== 'all' && !m.phases.includes(activePhase)) return false
      if (activeCity !== 'all' && m.city !== activeCity) return false
      if (activeSpecialty !== 'all' && !m.specialtyTags.some((t) => t.toLowerCase().includes(activeSpecialty.toLowerCase()))) return false
      if (verifiedOnly && !m.verified) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !m.nameLatin.toLowerCase().includes(q) &&
          !m.nameArabic.includes(q) &&
          !m.city.toLowerCase().includes(q) &&
          !m.specialtyTags.join(' ').toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [activePhase, activeCity, activeSpecialty, verifiedOnly, search])

  const headingLabel = useMemo(() => {
    if (activePhase !== 'all') return phaseLabels[activePhase]
    return 'All Makers'
  }, [activePhase])

  const activeFilterCount = [
    activePhase !== 'all',
    activeCity !== 'all',
    activeSpecialty !== 'all',
    verifiedOnly,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-divider" style={{ backgroundColor: '#0b1006' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
          <p className="text-volt text-xs uppercase tracking-widest mb-2" style={{ letterSpacing: '0.18em' }}>
            Discover
          </p>
          <div className="flex flex-wrap items-end gap-6 justify-between">
            <h1 className="font-archivo text-paper" style={{ fontSize: 'clamp(28px, 5vw, 52px)', letterSpacing: '-0.02em' }}>
              {headingLabel}
              <span className="font-inter text-paper/20 ml-4 font-normal" style={{ fontSize: '0.38em', letterSpacing: 0 }}>
                {filtered.length} results
              </span>
            </h1>

            {/* Search */}
            <div className="relative flex-shrink-0">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-paper/25 pointer-events-none"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, city, specialty…"
                className="font-inter text-paper placeholder-paper/20 bg-card border border-divider pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-volt/50 transition-colors"
                style={{ borderRadius: 10, minWidth: 240 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        {/* Mobile: filter toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden flex items-center gap-2 mb-6 font-inter text-paper/60 hover:text-paper text-sm transition-colors"
          style={{ background: 'none', border: '1px solid #2a3318', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span
              className="w-4 h-4 rounded-full bg-volt text-ink text-xs flex items-center justify-center font-bold"
              style={{ fontSize: 9 }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex gap-10 flex-col lg:flex-row">
          {/* Sidebar */}
          <aside
            className={`lg:w-56 flex-shrink-0 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}
          >
            {/* Phase */}
            <FilterSection label="Production Phase">
              <FilterBtn active={activePhase === 'all'} onClick={() => { setActivePhase('all'); setActiveSpecialty('all') }}>
                All Phases
              </FilterBtn>
              {ALL_PHASES.map((phase) => (
                <FilterBtn
                  key={phase}
                  active={activePhase === phase}
                  onClick={() => { setActivePhase(phase); setActiveSpecialty('all') }}
                >
                  {phaseLabels[phase]}
                </FilterBtn>
              ))}
            </FilterSection>

            {specialties.length > 0 && (
              <FilterSection label="Specialty">
                <FilterBtn active={activeSpecialty === 'all'} onClick={() => setActiveSpecialty('all')}>
                  All
                </FilterBtn>
                {specialties.map((s) => (
                  <FilterBtn key={s} active={activeSpecialty === s} onClick={() => setActiveSpecialty(s)}>
                    {s}
                  </FilterBtn>
                ))}
              </FilterSection>
            )}

            <FilterSection label="City">
              <FilterBtn active={activeCity === 'all'} onClick={() => setActiveCity('all')}>
                All Cities
              </FilterBtn>
              {ALL_CITIES.map((city) => (
                <FilterBtn key={city} active={activeCity === city} onClick={() => setActiveCity(city)}>
                  {city}
                </FilterBtn>
              ))}
            </FilterSection>

            {/* Verified toggle */}
            <div className="mb-8">
              <button
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className="flex items-center gap-3 group w-full"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div
                  className="w-9 h-5 flex items-center flex-shrink-0 transition-colors"
                  style={{
                    borderRadius: 10,
                    backgroundColor: verifiedOnly ? '#C8F53C' : '#2a3318',
                    padding: '2px',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full transition-transform"
                    style={{
                      background: verifiedOnly ? '#101408' : '#FAFCF2',
                      transform: verifiedOnly ? 'translateX(16px)' : 'translateX(0)',
                    }}
                  />
                </div>
                <span className="font-inter text-paper/50 text-sm group-hover:text-paper transition-colors" style={{ fontWeight: 400 }}>
                  Verified Only
                </span>
              </button>
            </div>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setActivePhase('all'); setActiveCity('all'); setActiveSpecialty('all'); setVerifiedOnly(false) }}
                className="font-inter text-volt/60 hover:text-volt text-xs transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                Clear filters
              </button>
            )}
          </aside>

          {/* Grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div
                  className="w-14 h-14 border border-divider flex items-center justify-center mb-6"
                  style={{ borderRadius: 16 }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="10" cy="10" r="7.5" stroke="#2a3318" strokeWidth="1.5" />
                    <path d="M15.5 15.5L19 19" stroke="#2a3318" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="font-archivo text-paper/20 text-2xl mb-2">No Makers Found</p>
                <p className="font-inter text-paper/25 text-sm">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((maker) => (
                  <MakerCard key={maker.id} maker={maker} navigate={navigate} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="font-inter text-paper/25 text-xs uppercase tracking-widest mb-3" style={{ letterSpacing: '0.14em', fontWeight: 600 }}>
        {label}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-3 py-2 text-sm transition-all font-inter ${
        active ? 'text-ink bg-volt font-semibold' : 'text-paper/50 hover:text-paper'
      }`}
      style={{ borderRadius: 8, border: 'none', cursor: 'pointer', background: active ? '#C8F53C' : 'transparent' }}
    >
      {children}
    </button>
  )
}
