import { makers } from '../data/seed'
import type { Navigate } from '../App'

interface CreatorsPageProps {
  navigate: Navigate
}

const CREATOR_CATEGORIES = ['All', 'Comedy', 'Filmmaker', 'Artist', 'Blogger', 'Food', 'Editing']

export default function CreatorsPage({ navigate }: CreatorsPageProps) {
  const featuredCreators = makers.slice(0, 6)
  const newCreators = makers.slice(3, 9)

  return (
    <div className="min-h-screen">
      {/* Hero band */}
      <div
        className="flex items-center justify-center"
        style={{
          height: 200,
          background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(180,60,0,0.5) 0%, var(--c-bg) 70%)',
          borderBottom: '1px solid var(--c-border)',
        }}
      >
        <h1 className="font-inter font-bold text-paper" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
          Creators
        </h1>
      </div>

      <div className="px-8 py-10">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CREATOR_CATEGORIES.map((cat, i) => (
            <button
              key={cat}
              className="font-inter text-sm px-4 py-2 rounded-full transition-all"
              style={{
                background: i === 0 ? '#E85D04' : 'transparent',
                color: i === 0 ? 'var(--c-text)' : 'var(--c-muted)',
                border: i === 0 ? 'none' : '1px solid var(--c-border)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured */}
        <section className="max-w-5xl mx-auto mb-10">
          <h2 className="font-inter font-semibold text-paper mb-5" style={{ fontSize: 15 }}>Featured this week</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {featuredCreators.map((maker) => (
              <button
                key={maker.id}
                onClick={() => navigate({ name: 'maker', id: maker.id })}
                className="flex items-center gap-3 p-4 rounded-xl text-left hover:border-orange/50 transition-all cursor-pointer group"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
              >
                <div className="relative flex-shrink-0">
                  <img src={maker.photo} alt={maker.nameLatin} className="w-10 h-10 rounded-full object-cover" />
                  {maker.verified && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: '#E85D04', border: '1.5px solid var(--c-surface)' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-inter text-paper font-semibold text-sm truncate group-hover:text-orange transition-colors">{maker.nameLatin}</p>
                  </div>
                  <p className="font-inter text-muted text-xs">{maker.city}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="font-inter text-paper text-xs px-2 py-0.5 rounded-full" style={{ background: '#E85D04', fontSize: 10 }}>Creator</span>
                    <span className="font-inter text-muted text-xs px-2 py-0.5 rounded-full" style={{ border: '1px solid var(--c-border)', fontSize: 10 }}>{maker.specialtyTags[0]}</span>
                  </div>
                </div>
                <span style={{ color: '#E85D04', fontSize: 16, flexShrink: 0 }}>◆</span>
              </button>
            ))}
          </div>
        </section>

        {/* New on Makers */}
        <section className="max-w-5xl mx-auto mb-10">
          <h2 className="font-inter font-semibold text-paper mb-5" style={{ fontSize: 15 }}>New on Makers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {newCreators.map((maker) => (
              <button
                key={maker.id}
                onClick={() => navigate({ name: 'maker', id: maker.id })}
                className="flex items-center gap-3 p-4 rounded-xl text-left hover:border-orange/50 transition-all cursor-pointer group"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
              >
                <div className="relative flex-shrink-0">
                  <img src={maker.photo} alt={maker.nameLatin} className="w-10 h-10 rounded-full object-cover" />
                  {maker.verified && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: '#E85D04', border: '1.5px solid var(--c-surface)' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-inter text-paper font-semibold text-sm truncate group-hover:text-orange transition-colors">{maker.nameLatin}</p>
                  <p className="font-inter text-muted text-xs">{maker.city}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="font-inter text-paper text-xs px-2 py-0.5 rounded-full" style={{ background: '#E85D04', fontSize: 10 }}>Creator</span>
                    <span className="font-inter text-muted text-xs px-2 py-0.5 rounded-full" style={{ border: '1px solid var(--c-border)', fontSize: 10 }}>{maker.specialtyTags[0]}</span>
                  </div>
                </div>
                <span style={{ color: '#E85D04', fontSize: 16, flexShrink: 0 }}>◆</span>
              </button>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto">
          <div
            className="p-10 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg, rgba(232,93,4,0.15) 0%, transparent 100%)', border: '1px solid rgba(232,93,4,0.2)' }}
          >
            <p className="font-inter font-bold text-paper mb-2" style={{ fontSize: 20 }}>
              Don't want to search?
            </p>
            <p className="font-inter text-muted text-base leading-relaxed mb-8 max-w-lg mx-auto italic">
              Tell us about the project and we'll build the crew, from people whose work is verified here, not from a contact list.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['hello@makerss.net', 'brands@makerss.net', 'press@makerss.net', 'Creators@makerss.net'].map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 font-inter text-paper text-sm px-5 py-3 rounded-full hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border-mid)', textDecoration: 'none' }}
                >
                  <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: '#E85D04' }} />
                  {email}
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
