import { useState } from 'react'
import type { Navigate } from '../App'

interface OpenProjectsProps {
  navigate: Navigate
}

const ROLES = ['All roles', 'Director', 'Cinematographer', 'Video Editor', 'Photographer', 'Motion Designer', 'Sound Engineer', 'Makeup Artist', 'Stylist', 'Screenwriter', 'Social Media Manager', 'Content Creator']

const LISTINGS = [
  {
    id: 'op-1',
    title: 'Ramadan Campaign — Series of 4 Short Films',
    brand: 'intime Creative',
    logo: 'https://images.unsplash.com/photo-1631891337800-9a2f2b7c8f3e?w=60&h=60&fit=crop',
    type: 'Brand Campaign',
    location: 'Amman, Jordan',
    remote: false,
    deadline: 'Feb 15, 2025',
    budget: '$2,000 – $4,000',
    roles: ['Director', 'Cinematographer', 'Video Editor'],
    description: 'We are producing a 4-part Ramadan short film series celebrating Arab family traditions. Looking for a Director with branded content experience and a Cinematographer comfortable with intimate, warm lighting setups.',
    platforms: ['Instagram', 'YouTube'],
    posted: '2 days ago',
    applicants: 14,
  },
  {
    id: 'op-2',
    title: 'Fashion Editorial — Desert Collection',
    brand: 'Al-Noor Studios',
    logo: 'https://images.unsplash.com/photo-1512850183-6d7990f42385?w=60&h=60&fit=crop',
    type: 'Editorial',
    location: 'Dubai, UAE',
    remote: false,
    deadline: 'Jan 30, 2025',
    budget: '$800 – $1,500',
    roles: ['Photographer', 'Stylist', 'Makeup Artist'],
    description: 'Desert editorial for a luxury modest fashion label. Shooting over 2 days in the Dubai desert. Need a photographer with fashion/editorial portfolio and a stylist familiar with modest fashion aesthetics.',
    platforms: ['Instagram', 'TikTok'],
    posted: '5 days ago',
    applicants: 28,
  },
  {
    id: 'op-3',
    title: 'Social Media Content — Monthly Retainer',
    brand: 'Meshwar Agency',
    logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=60&h=60&fit=crop',
    type: 'Retainer',
    location: 'Remote',
    remote: true,
    deadline: 'Rolling',
    budget: '$500/month',
    roles: ['Content Creator', 'Video Editor', 'Social Media Manager'],
    description: 'Growing regional digital agency looking for a content creator + editor on a monthly retainer. 8–12 short-form videos per month for multiple Arab lifestyle brands. Flexible hours, fully remote.',
    platforms: ['TikTok', 'Instagram', 'YouTube'],
    posted: '1 week ago',
    applicants: 41,
  },
  {
    id: 'op-4',
    title: 'Documentary — Urban Street Culture in Cairo',
    brand: 'Nile Wave Productions',
    logo: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=60&h=60&fit=crop',
    type: 'Documentary',
    location: 'Cairo, Egypt',
    remote: false,
    deadline: 'Mar 1, 2025',
    budget: '$3,500 – $6,000',
    roles: ['Cinematographer', 'Sound Engineer', 'Video Editor'],
    description: 'Feature-length documentary exploring Cairo\'s underground music and street art scene. 3-week shoot starting April. Looking for a cinematographer with documentary experience and a sound engineer comfortable in unpredictable environments.',
    platforms: ['Vimeo', 'YouTube'],
    posted: '3 days ago',
    applicants: 9,
  },
  {
    id: 'op-5',
    title: 'Motion Graphics Package — Sports Brand',
    brand: 'Riyada Media',
    logo: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=60&h=60&fit=crop',
    type: 'Motion Design',
    location: 'Remote',
    remote: true,
    deadline: 'Feb 5, 2025',
    budget: '$1,200 – $2,000',
    roles: ['Motion Designer'],
    description: 'Sports brand launching new regional identity needs a full motion graphics package: logo animations, lower thirds, transitions, and social media templates. Full Adobe After Effects workflow.',
    platforms: ['Instagram', 'YouTube'],
    posted: '1 day ago',
    applicants: 22,
  },
  {
    id: 'op-6',
    title: 'Wedding Films — Peak Season Bookings',
    brand: 'Qalb Films',
    logo: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=60&h=60&fit=crop',
    type: 'Wedding',
    location: 'Beirut & Amman',
    remote: false,
    deadline: 'Feb 20, 2025',
    budget: '$1,500 – $2,500 / event',
    roles: ['Cinematographer', 'Video Editor'],
    description: 'Wedding film studio booking for 2025 peak season. Looking for a second-shooter cinematographer and an editor who can deliver cinematic 8-min highlight films. Arabic cultural context required.',
    platforms: ['Vimeo', 'Instagram'],
    posted: '4 days ago',
    applicants: 17,
  },
]

const TYPE_COLORS: Record<string, string> = {
  'Brand Campaign': '#E85D04',
  'Editorial': '#9333EA',
  'Retainer': '#059669',
  'Documentary': '#2563EB',
  'Motion Design': '#DC2626',
  'Wedding': '#D97706',
}

export default function OpenProjects({ navigate }: OpenProjectsProps) {
  const [selectedRole, setSelectedRole] = useState('All roles')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [activeModal, setActiveModal] = useState<string | null>(null)

  const filtered = LISTINGS.filter((l) => {
    if (remoteOnly && !l.remote) return false
    if (selectedRole !== 'All roles' && !l.roles.includes(selectedRole)) return false
    return true
  })

  const activeJob = LISTINGS.find((l) => l.id === activeModal)

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-1 rounded-full flex-shrink-0" style={{ background: '#E85D04', height: 24 }} />
          <h1 className="font-inter font-black text-paper" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
            Open Projects
          </h1>
        </div>
        <p className="font-inter text-muted ml-3" style={{ fontSize: 14 }}>
          Productions actively looking for Makers — apply to join the crew
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-7">
        <div className="relative">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="font-inter text-sm pl-4 pr-9 py-2.5 rounded-xl appearance-none"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: selectedRole !== 'All roles' ? 'var(--c-text)' : 'var(--c-muted)', cursor: 'pointer', fontSize: 13 }}
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--c-muted-2)' }}>
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>

        <button
          onClick={() => setRemoteOnly(!remoteOnly)}
          className="flex items-center gap-2.5 font-inter text-sm px-4 py-2.5 rounded-xl transition-all"
          style={{ background: 'var(--c-surface)', border: `1px solid ${remoteOnly ? '#E85D04' : 'var(--c-border)'}`, cursor: 'pointer', color: remoteOnly ? 'var(--c-text)' : 'var(--c-muted)', fontSize: 13 }}
        >
          <div className="w-8 h-4 rounded-full flex items-center" style={{ backgroundColor: remoteOnly ? '#E85D04' : 'var(--c-border)', padding: '2px' }}>
            <div className="w-3 h-3 rounded-full transition-transform" style={{ background: 'var(--c-text)', transform: remoteOnly ? 'translateX(16px)' : 'translateX(0)' }} />
          </div>
          Remote only
        </button>

        <span className="font-inter text-muted text-sm ml-auto">{filtered.length} open positions</span>
      </div>

      {/* Listings */}
      <div className="flex flex-col gap-4">
        {filtered.map((job) => {
          const isApplied = applied.has(job.id)
          return (
            <div
              key={job.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">

                  {/* Logo */}
                  <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 52, height: 52, border: '1px solid var(--c-border)' }}>
                    <img src={job.logo} alt={job.brand} className="w-full h-full object-cover" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className="font-inter font-bold text-white px-2 py-0.5 rounded-md"
                        style={{ background: TYPE_COLORS[job.type] ?? '#E85D04', fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                      >
                        {job.type}
                      </span>
                      {job.remote && (
                        <span className="font-inter text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(5,150,105,0.15)', color: '#34D399', border: '1px solid rgba(5,150,105,0.3)', fontSize: 10 }}>
                          Remote
                        </span>
                      )}
                    </div>

                    <h2
                      className="font-inter font-bold text-paper mb-0.5 cursor-pointer hover:text-orange transition-colors"
                      style={{ fontSize: 16 }}
                      onClick={() => setActiveModal(job.id)}
                    >
                      {job.title}
                    </h2>
                    <p className="font-inter text-muted text-sm">{job.brand} · {job.location}</p>
                  </div>

                  {/* Apply button */}
                  <button
                    onClick={() => setApplied((prev) => { const n = new Set(prev); isApplied ? n.delete(job.id) : n.add(job.id); return n })}
                    className="flex-shrink-0 font-inter font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-90 hidden sm:block"
                    style={{
                      background: isApplied ? 'transparent' : '#E85D04',
                      border: isApplied ? '1.5px solid #E85D04' : 'none',
                      color: isApplied ? '#E85D04' : 'white',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    {isApplied ? '✓ Applied' : 'Apply now'}
                  </button>
                </div>

                {/* Description */}
                <p className="font-inter mt-4 leading-relaxed" style={{ fontSize: 13, color: 'rgba(245,240,235,0.6)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {job.description}
                </p>

                {/* Roles + meta row */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {job.roles.map((r) => (
                      <span key={r} className="font-inter text-xs px-2.5 py-1 rounded-lg" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 11 }}>
                        {r}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 ml-auto">
                    <span className="font-inter text-muted flex items-center gap-1.5" style={{ fontSize: 12 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" /><path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      {job.deadline}
                    </span>
                    <span className="font-inter font-semibold" style={{ color: '#E85D04', fontSize: 12 }}>{job.budget}</span>
                    <span className="font-inter text-muted" style={{ fontSize: 12 }}>{job.applicants} applicants</span>
                    <span className="font-inter text-muted" style={{ fontSize: 11 }}>{job.posted}</span>
                  </div>
                </div>

                {/* Mobile apply */}
                <button
                  onClick={() => setApplied((prev) => { const n = new Set(prev); isApplied ? n.delete(job.id) : n.add(job.id); return n })}
                  className="sm:hidden w-full font-inter font-bold py-3 rounded-xl mt-4 transition-all"
                  style={{
                    background: isApplied ? 'transparent' : '#E85D04',
                    border: isApplied ? '1.5px solid #E85D04' : 'none',
                    color: isApplied ? '#E85D04' : 'white',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {isApplied ? '✓ Applied' : 'Apply now'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Post a project CTA */}
      <div
        className="mt-8 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{ background: 'linear-gradient(135deg, rgba(232,93,4,0.12) 0%, rgba(13,10,8,0) 100%)', border: '1px solid rgba(232,93,4,0.25)' }}
      >
        <div>
          <h3 className="font-inter font-black text-paper mb-1" style={{ fontSize: 18 }}>Have a project to crew up?</h3>
          <p className="font-inter text-muted" style={{ fontSize: 14 }}>Post your production and connect with verified Makers in the Arab world.</p>
        </div>
        <button
          className="flex-shrink-0 font-inter font-bold text-paper px-8 py-3.5 rounded-full hover:opacity-90 transition-all"
          style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}
        >
          Post a Project
        </button>
      </div>

      {/* Detail modal */}
      {activeJob && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 52, height: 52, border: '1px solid var(--c-border)' }}>
                    <img src={activeJob.logo} alt={activeJob.brand} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-inter font-bold text-white px-2 py-0.5 rounded-md block mb-1" style={{ background: TYPE_COLORS[activeJob.type] ?? '#E85D04', fontSize: 10, textTransform: 'uppercase', display: 'inline-block' }}>
                      {activeJob.type}
                    </span>
                    <p className="font-inter text-muted text-sm">{activeJob.brand}</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted-2)' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </button>
              </div>

              <h2 className="font-inter font-black text-paper mb-2" style={{ fontSize: 20 }}>{activeJob.title}</h2>
              <div className="flex flex-wrap items-center gap-3 mb-5 text-sm font-inter text-muted">
                <span>📍 {activeJob.location}</span>
                <span>⏰ Deadline: {activeJob.deadline}</span>
                <span className="font-bold" style={{ color: '#E85D04' }}>{activeJob.budget}</span>
              </div>

              <p className="font-inter leading-relaxed mb-6" style={{ fontSize: 14, color: 'rgba(245,240,235,0.7)' }}>{activeJob.description}</p>

              <div className="mb-6">
                <p className="font-inter font-semibold text-paper mb-2 text-sm">Roles needed</p>
                <div className="flex flex-wrap gap-2">
                  {activeJob.roles.map((r) => (
                    <span key={r} className="font-inter px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: 'rgba(232,93,4,0.15)', color: '#E85D04', border: '1px solid rgba(232,93,4,0.3)' }}>{r}</span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="font-inter font-semibold text-paper mb-2 text-sm">Platforms</p>
                <div className="flex gap-2">
                  {activeJob.platforms.map((p) => (
                    <span key={p} className="font-inter px-3 py-1 rounded-lg text-xs font-bold" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>{p}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { setApplied((prev) => { const n = new Set(prev); n.has(activeJob.id) ? n.delete(activeJob.id) : n.add(activeJob.id); return n }); setActiveModal(null) }}
                className="w-full font-inter font-bold text-paper py-4 rounded-xl hover:opacity-90 transition-all"
                style={{ background: applied.has(activeJob.id) ? 'transparent' : '#E85D04', border: applied.has(activeJob.id) ? '2px solid #E85D04' : 'none', color: applied.has(activeJob.id) ? '#E85D04' : 'white', cursor: 'pointer', fontSize: 15 }}
              >
                {applied.has(activeJob.id) ? '✓ Already Applied' : 'Apply for this project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
