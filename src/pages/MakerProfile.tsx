import { useState } from 'react'
import { getMakerById, getReviewsForMaker, getTitleById, formatFollowers, phaseLabels } from '../data/seed'
import type { Navigate } from '../App'

interface MakerProfileProps {
  id: string
  navigate: Navigate
}

const TABS = ['Overview', 'Credits', 'Contacts', 'About', 'Images', 'Videos']

export default function MakerProfile({ id, navigate }: MakerProfileProps) {
  const maker = getMakerById(id)
  const [activeTab, setActiveTab] = useState('Overview')
  const [showCollab, setShowCollab] = useState(false)

  if (!maker) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-24 text-center">
        <p className="font-inter text-muted text-2xl">Maker not found.</p>
      </div>
    )
  }

  const reviews = getReviewsForMaker(id)
  const workedWith = maker.workedWith.map(getMakerById).filter(Boolean) as NonNullable<ReturnType<typeof getMakerById>>[]
  const knownFor = maker.credits.slice(0, 4).map((c) => ({ ...c, title: getTitleById(c.titleId) })).filter((c) => c.title)
  const totalCredits = maker.credits.length

  // Credits breakdown
  const byProfession = maker.specialtyTags.slice(0, 3)
  const byYear = [...new Set(maker.credits.map((c) => c.year))].sort((a, b) => b - a)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--c-bg)' }}>

      {/* ── HERO ── */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="max-w-5xl mx-auto px-8 pt-6 pb-0">

          {/* Back */}
          <button
            onClick={() => navigate({ name: 'makers' })}
            className="inline-flex items-center gap-2 font-inter text-muted hover:text-paper text-sm transition-colors mb-6"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            Back to Makers
          </button>

          <div className="flex gap-7 items-start">
            {/* Portrait */}
            <div className="relative flex-shrink-0 rounded-2xl overflow-hidden" style={{ width: 180, height: 240, background: 'var(--c-surface-alt)' }}>
              <img src={maker.photo} alt={maker.nameLatin} className="w-full h-full object-cover" />
              {maker.verified && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-1.5" style={{ background: '#E85D04', fontSize: 10, fontWeight: 700 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  <span className="font-inter text-white">Verified Maker</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-2">
              <h1 className="font-inter font-black text-paper mb-1" style={{ fontSize: 'clamp(28px, 4vw, 52px)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                {maker.nameLatin}
              </h1>
              <p className="font-inter text-muted mb-3" style={{ fontSize: 15 }}>
                {maker.specialtyTags.join(' · ')}
              </p>
              <p className="font-arabic text-muted mb-4" style={{ fontSize: 16 }} dir="rtl">{maker.nameArabic}</p>

              {/* MakerMeter + discover */}
              <div className="flex items-center gap-8 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: 'rgba(232,93,4,0.15)', border: '1.5px solid #E85D04' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="#E85D04">
                      <path d="M7 1l1.4 2.8 3.1.45-2.25 2.2.53 3.05L7 8l-2.78 1.5.53-3.05L2.5 4.25l3.1-.45L7 1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-inter text-muted" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>MakerMeter</p>
                    <p className="font-inter font-black text-paper" style={{ fontSize: 18, lineHeight: 1 }}>{maker.ratingAverage.toFixed(1)}</p>
                  </div>
                </div>

                <div>
                  <p className="font-inter text-muted" style={{ fontSize: 11 }}>Discover more people</p>
                  <div className="flex gap-2 mt-1">
                    {maker.specialtyTags.slice(0, 2).map((tag) => (
                      <span key={tag} className="font-inter text-xs cursor-pointer hover:underline" style={{ color: '#E85D04' }}>{tag}</span>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => setShowCollab(true)}
                    className="font-inter font-semibold text-paper px-5 py-2.5 rounded-full hover:opacity-90 transition-all"
                    style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 13 }}
                  >
                    Request Collaboration
                  </button>
                  <button
                    className="font-inter font-semibold text-paper px-5 py-2.5 rounded-full transition-colors"
                    style={{ background: 'transparent', border: '1px solid var(--c-border-mid)', cursor: 'pointer', fontSize: 13 }}
                  >
                    + Follow
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="flex gap-0 mt-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="font-inter font-semibold px-5 py-3 text-sm transition-colors relative"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: activeTab === tab ? 'var(--c-text)' : 'var(--c-muted-2)',
                  fontSize: 13,
                  letterSpacing: '0.02em',
                }}
              >
                {tab.toUpperCase()}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#E85D04' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex gap-10 items-start">

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col gap-10">

            {/* Known For */}
            {knownFor.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <span className="inline-block w-1 rounded-full flex-shrink-0" style={{ background: '#E85D04', height: 20 }} />
                  <h2 className="font-inter font-bold text-paper" style={{ fontSize: 19 }}>Known for</h2>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#E85D04' }}><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {knownFor.map((c, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-xl cursor-pointer group transition-colors"
                      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
                      onClick={() => c.title && navigate({ name: 'project', id: c.titleId })}
                    >
                      <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 72, height: 96 }}>
                        <img src={c.title!.thumb} alt={c.title!.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <p className="font-inter font-bold text-paper group-hover:text-orange transition-colors leading-tight mb-1" style={{ fontSize: 14 }}>
                          {c.title!.name}
                        </p>
                        <div className="flex items-center gap-1 mb-1">
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="#F5C518"><path d="M5.5 1l1.1 2.2 2.4.35-1.75 1.7.41 2.38L5.5 6.5 3.34 7.63l.41-2.38L2 3.55l2.4-.35L5.5 1z" /></svg>
                          <span className="font-inter font-semibold" style={{ color: '#F5C518', fontSize: 12 }}>{(4 + i * 0.3).toFixed(1)}</span>
                        </div>
                        <p className="font-inter text-muted" style={{ fontSize: 11 }}>{c.role}</p>
                        <p className="font-inter text-muted" style={{ fontSize: 11 }}>{c.year}</p>
                      </div>
                      <div className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity self-center">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#E85D04" strokeWidth="1.2" /><path d="M7 5h1.5M8 5v6" stroke="#E85D04" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Awards bar */}
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer group"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: '3px solid #E85D04' }}
            >
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.4 2.8 3.1.45-2.25 2.2.53 3.05L8 8l-2.78 1.5.53-3.05L3.5 4.25l3.1-.45L8 1z" fill="#F5C518" /></svg>
                <span className="font-inter font-bold text-paper" style={{ fontSize: 14 }}>
                  Verified Maker · {maker.ratingCount} community reviews
                </span>
                <span className="font-inter text-muted" style={{ fontSize: 13 }}>
                  {maker.credits.length} total credits
                </span>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--c-muted-2)' }}><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </div>

            {/* All Credits */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-1 rounded-full flex-shrink-0" style={{ background: '#E85D04', height: 20 }} />
                <h2 className="font-inter font-bold text-paper" style={{ fontSize: 19 }}>All Credits</h2>
                <span className="font-inter text-muted" style={{ fontSize: 16 }}>{totalCredits}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#E85D04' }}><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
                {[
                  {
                    label: 'By status',
                    items: [
                      { text: 'Completed', count: totalCredits - 1, color: '#E85D04' },
                      { text: 'In Production', count: 1, color: '#E85D04' },
                    ],
                  },
                  {
                    label: 'By profession',
                    items: byProfession.map((p, i) => ({ text: p, count: Math.max(1, totalCredits - i * 2), color: '#E85D04' })),
                  },
                  {
                    label: 'By year',
                    items: byYear.slice(0, 4).map((y) => ({ text: String(y), count: maker.credits.filter((c) => c.year === y).length, color: '#E85D04' })),
                  },
                ].map((row, ri, arr) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-4 px-5 py-4 group cursor-pointer hover:bg-surface-alt transition-colors"
                    style={{ borderBottom: ri < arr.length - 1 ? '1px solid var(--c-border)' : 'none' }}
                  >
                    <span className="font-inter text-paper font-semibold flex-shrink-0" style={{ fontSize: 14, width: 100 }}>{row.label}</span>
                    <div className="flex items-center gap-3 flex-wrap flex-1">
                      {row.items.map((item, ii) => (
                        <span key={ii} className="flex items-center gap-1.5">
                          <span className="font-inter font-semibold hover:underline cursor-pointer" style={{ color: item.color, fontSize: 13 }}>{item.text}</span>
                          <span className="font-inter text-muted" style={{ fontSize: 13 }}>{item.count}</span>
                          {ii < row.items.length - 1 && <span className="text-muted">·</span>}
                        </span>
                      ))}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--c-border-mid)' }} className="group-hover:text-muted transition-colors flex-shrink-0"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                  </div>
                ))}
              </div>
            </section>

            {/* Photos */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-1 rounded-full flex-shrink-0" style={{ background: '#E85D04', height: 20 }} />
                <h2 className="font-inter font-bold text-paper" style={{ fontSize: 19 }}>Photos</h2>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#E85D04' }}><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1].map((i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden cursor-pointer group" style={{ height: 220 }}>
                    <img
                      src={maker.photo}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ objectPosition: i === 0 ? '20% 20%' : '80% 50%' }}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            {reviews.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block w-1 rounded-full flex-shrink-0" style={{ background: '#E85D04', height: 20 }} />
                  <h2 className="font-inter font-bold text-paper" style={{ fontSize: 19 }}>Reviews</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {reviews.map((rev) => {
                    const from = getMakerById(rev.fromMakerId)
                    return (
                      <div key={rev.id} className="p-5 rounded-2xl" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {from && <img src={from.photo} alt={from.nameLatin} className="w-9 h-9 rounded-full object-cover" />}
                            <div>
                              <p className="font-inter text-paper text-sm font-semibold">{from?.nameLatin}</p>
                              <p className="font-inter text-muted text-xs">{new Date(rev.visibleAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <span className="font-inter font-bold" style={{ color: '#F5C518', fontSize: 14 }}>★ {rev.stars}/10</span>
                        </div>
                        <p className="font-inter text-paper/65 text-sm leading-relaxed">"{rev.comment}"</p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="flex-shrink-0 flex flex-col gap-5" style={{ width: 240 }}>

            {/* Bio */}
            <div className="p-4 rounded-2xl" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
              <p className="font-inter text-muted text-xs uppercase tracking-widest mb-3" style={{ letterSpacing: '0.12em', fontWeight: 600 }}>About</p>
              <p className="font-inter leading-relaxed" style={{ color: '#C8B8A8', fontSize: 13 }}>{maker.bio}</p>
              <p className="font-inter text-muted mt-3" style={{ fontSize: 12 }}>{maker.city}, {maker.country}</p>
            </div>

            {/* Social */}
            {(maker.social.instagram || maker.social.tiktok || maker.social.youtube) && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                <p className="font-inter text-muted text-xs uppercase tracking-widest mb-3" style={{ letterSpacing: '0.12em', fontWeight: 600 }}>Social Reach</p>
                {maker.social.instagram && (
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--c-border)' }}>
                    <span className="font-inter text-muted text-sm">Instagram</span>
                    <span className="font-inter text-paper text-sm font-semibold">{formatFollowers(maker.social.instagram)}</span>
                  </div>
                )}
                {maker.social.tiktok && (
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--c-border)' }}>
                    <span className="font-inter text-muted text-sm">TikTok</span>
                    <span className="font-inter text-paper text-sm font-semibold">{formatFollowers(maker.social.tiktok)}</span>
                  </div>
                )}
                {maker.social.youtube && (
                  <div className="flex justify-between py-2">
                    <span className="font-inter text-muted text-sm">YouTube</span>
                    <span className="font-inter text-paper text-sm font-semibold">{formatFollowers(maker.social.youtube)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Worked with */}
            {workedWith.length > 0 && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                <p className="font-inter text-muted text-xs uppercase tracking-widest mb-3" style={{ letterSpacing: '0.12em', fontWeight: 600 }}>Worked With</p>
                <div className="flex flex-col gap-2">
                  {workedWith.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 cursor-pointer group"
                      onClick={() => navigate({ name: 'maker', id: m.id })}
                    >
                      <img src={m.photo} alt={m.nameLatin} className="w-8 h-8 rounded-full object-cover flex-shrink-0" style={{ border: '1.5px solid var(--c-border)' }} />
                      <div>
                        <p className="font-inter text-paper text-xs font-semibold group-hover:text-orange transition-colors">{m.nameLatin}</p>
                        <p className="font-inter text-muted" style={{ fontSize: 10 }}>{m.specialtyTags[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Collab modal */}
      {showCollab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setShowCollab(false)}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-inter font-bold text-paper text-xl mb-2">Request Collaboration</h2>
            <p className="font-inter text-muted text-sm mb-6">Send a request to {maker.nameLatin}</p>
            <textarea placeholder="Describe your project and what you're looking for..." className="w-full p-4 rounded-xl font-inter text-sm resize-none mb-4" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-text)', height: 120 }} />
            <div className="flex gap-3">
              <button onClick={() => setShowCollab(false)} className="flex-1 font-inter text-paper py-3 rounded-full" style={{ background: 'transparent', border: '1px solid var(--c-border-mid)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={() => setShowCollab(false)} className="flex-1 font-inter font-semibold text-paper py-3 rounded-full hover:opacity-90" style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 13 }}>Send Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
