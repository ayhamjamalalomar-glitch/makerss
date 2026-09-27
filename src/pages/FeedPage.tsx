import { useState } from 'react'
import { makers } from '../data/seed'
import type { Navigate } from '../App'

interface FeedPageProps {
  navigate: Navigate
}

const POSTS = [
  {
    id: 'p1',
    makerId: 'kareem-al-rashid',
    time: '1d · Amman',
    text: 'Same courtyard as last time. This is what it looks like before it looks good.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop&auto=format&q=80',
    likes: 42,
    comments: 8,
  },
  {
    id: 'p2',
    makerId: 'nour-khalil',
    time: '3h · Ramallah',
    text: "Wrapped our first short film entirely shot on mobile. Three weeks, two cities, one crew. Proof that the tools don't make the story — the story does.",
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop&auto=format&q=80',
    likes: 91,
    comments: 14,
  },
  {
    id: 'p3',
    makerId: 'lara-nassar',
    time: '2d · Amman',
    text: 'Scouting for the next campaign. The light in Wadi Rum at 5am is something else entirely.',
    image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=500&fit=crop&auto=format&q=80',
    likes: 67,
    comments: 5,
  },
]

const EVENTS = [
  { date: '15', month: 'Aug', title: 'Amman Film Circle', color: '#E85D04' },
  { date: '22', month: 'Aug', title: 'Cairo Content Week', color: '#E85D04' },
]

export default function FeedPage({ navigate }: FeedPageProps) {
  const [liked, setLiked] = useState<Set<string>>(new Set())

  const currentMaker = makers[0]

  return (
    <div className="flex gap-6 px-6 py-8 max-w-5xl">
      {/* Left: profile + events */}
      <aside className="w-52 flex-shrink-0 hidden lg:block">
        {/* Profile card */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
          <div className="h-16" style={{ background: 'linear-gradient(135deg, #E85D04 0%, #6B2800 100%)' }} />
          <div className="px-4 pb-4">
            <img
              src={currentMaker.photo}
              alt={currentMaker.nameLatin}
              className="w-12 h-12 rounded-full object-cover -mt-6 mb-2"
              style={{ border: '3px solid var(--c-surface)' }}
            />
            <p className="font-inter text-paper font-semibold text-sm leading-tight">{currentMaker.nameLatin}...</p>
            <p className="font-inter text-muted text-xs mt-0.5">{currentMaker.specialtyTags[0]} | {currentMaker.city}</p>
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
              <span className="font-inter text-muted text-xs">Profile viewers</span>
              <span className="font-inter text-orange font-bold text-sm">11</span>
            </div>
            <button className="font-inter text-orange text-xs hover:underline mt-1" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              View all analytics
            </button>
          </div>
        </div>

        {/* Events */}
        <div className="rounded-2xl p-4" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
          <p className="font-inter text-muted text-xs uppercase tracking-widest mb-3" style={{ letterSpacing: '0.14em', fontWeight: 600 }}>Events</p>
          {EVENTS.map((ev) => (
            <div key={ev.title} className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#E85D04' }}
              >
                <p className="font-inter text-paper font-bold leading-none text-center" style={{ fontSize: 12 }}>{ev.date}</p>
              </div>
              <div>
                <p className="font-inter text-paper text-xs font-semibold">{ev.title}</p>
                <p className="font-inter text-muted text-xs">{ev.month} {ev.date}</p>
              </div>
            </div>
          ))}
          <button
            onClick={() => navigate({ name: 'events' })}
            className="font-inter text-orange text-xs hover:underline"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            View all events →
          </button>
        </div>
      </aside>

      {/* Center: feed */}
      <div className="flex-1 min-w-0">
        {/* Post composer */}
        <div className="rounded-2xl p-4 mb-4" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
          <div className="flex items-center gap-3 mb-3">
            <img src={currentMaker.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
            <input
              type="text"
              placeholder="Start a post"
              className="flex-1 rounded-full px-4 py-2 font-inter text-sm"
              style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
            />
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-1.5 font-inter text-muted text-xs hover:text-paper transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 9L4.5 6.5 7 8.5 9.5 6 12.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              Video
            </button>
            <button className="flex items-center gap-1.5 font-inter text-muted text-xs hover:text-paper transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" /><circle cx="5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" /></svg>
              Photo
            </button>
          </div>
        </div>

        {/* Posts */}
        {POSTS.map((post) => {
          const maker = makers.find((m) => m.id === post.makerId)
          if (!maker) return null
          const isLiked = liked.has(post.id)
          return (
            <div key={post.id} className="rounded-2xl mb-4 overflow-hidden" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={maker.photo} alt={maker.nameLatin} className="w-9 h-9 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate({ name: 'maker', id: maker.id })} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate({ name: 'maker', id: maker.id })} className="font-inter text-paper font-semibold text-sm hover:text-orange transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{maker.nameLatin}</button>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#E85D04' }}>
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" /></svg>
                        </span>
                        <button className="font-inter text-orange text-xs font-semibold hover:opacity-80" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>+ Follow</button>
                      </div>
                      <p className="font-inter text-muted text-xs">{maker.specialtyTags[0]}</p>
                      <p className="font-inter text-muted text-xs">{post.time}</p>
                    </div>
                  </div>
                  <button className="text-muted hover:text-paper transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.2" fill="currentColor" /><circle cx="8" cy="8" r="1.2" fill="currentColor" /><circle cx="13" cy="8" r="1.2" fill="currentColor" /></svg>
                  </button>
                </div>
                <p className="font-inter text-paper/80 text-sm leading-relaxed mb-3">
                  {post.text}
                </p>
              </div>
              {post.image && (
                <div className="overflow-hidden" style={{ maxHeight: 280 }}>
                  <img src={post.image} alt="" className="w-full object-cover" style={{ maxHeight: 280 }} />
                </div>
              )}
              <div className="px-4 py-3 flex items-center gap-6" style={{ borderTop: '1px solid var(--c-border)' }}>
                {[
                  {
                    label: `Like${isLiked ? 'd' : ''}`,
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill={isLiked ? '#E85D04' : 'none'}>
                        <path d="M7 12S1.5 8.5 1.5 5a2.5 2.5 0 015-0C6.5 3.5 7 3 7 3s.5.5.5 2a2.5 2.5 0 015 0C12.5 8.5 7 12 7 12Z" stroke={isLiked ? '#E85D04' : 'currentColor'} strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                    ),
                    count: post.likes + (isLiked ? 1 : 0),
                    action: () => setLiked((prev) => { const n = new Set(prev); isLiked ? n.delete(post.id) : n.add(post.id); return n }),
                    active: isLiked,
                  },
                  { label: 'Comment', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h10a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 2V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>, count: post.comments, action: () => {} },
                  { label: 'Repost', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5L1 7l2 2M11 9L13 7l-2-2M1 7h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>, action: () => {} },
                  { label: 'Send', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 2L2 6.5l4.5 1L8 12l4-10z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>, action: () => {} },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="flex items-center gap-1.5 font-inter text-xs transition-colors hover:text-paper"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: action.active ? '#E85D04' : 'var(--c-muted)',
                    }}
                  >
                    {action.icon}
                    {action.label}
                    {action.count !== undefined && <span className="text-xs opacity-70">({action.count})</span>}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Right: suggestions */}
      <aside className="w-52 flex-shrink-0 hidden xl:block">
        <div className="rounded-2xl p-4" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
          <p className="font-inter text-muted text-xs uppercase tracking-widest mb-4" style={{ letterSpacing: '0.14em', fontWeight: 600 }}>Add to your feed</p>
          {makers.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-start gap-2.5 mb-4">
              <img src={m.photo} alt={m.nameLatin} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-inter text-paper text-xs font-semibold truncate">{m.nameLatin}</p>
                <p className="font-inter text-muted text-xs truncate">{m.specialtyTags[0]} · {m.city}</p>
                <button
                  onClick={() => navigate({ name: 'maker', id: m.id })}
                  className="font-inter text-orange text-xs font-semibold hover:opacity-80 transition-opacity mt-0.5"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  + Follow
                </button>
              </div>
            </div>
          ))}
          <button className="font-inter text-orange text-xs hover:underline" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            View all recommendations →
          </button>
        </div>
      </aside>
    </div>
  )
}
