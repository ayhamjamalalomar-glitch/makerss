import { useState } from 'react'
import type { Navigate } from '../App'

interface EventsPageProps {
  navigate: Navigate
}


const EVENTS = [
  {
    id: 'e1',
    day: 'THU',
    date: '12',
    month: 'Feb',
    title: 'Golden Hour Walk — Downtown Amman',
    location: 'Rainbow Street · Amman',
    desc: 'Street photography walk through downtown at golden hour, ending with a live photo critique over coffee.',
    category: 'photographers',
    categoryLabel: 'AMMAN PHOTOGRAPHERS',
    time: 'Starts 4:30 PM',
    type: 'On-site',
  },
  {
    id: 'e2',
    day: 'SAT',
    date: '21',
    month: 'Feb',
    title: 'Portrait Lighting Lab',
    location: 'Studio 7, Jabal Amman · Amman',
    desc: 'Hands-on one-light and two-light portrait setups. Bring your camera — models and gear provided.',
    category: 'photographers',
    categoryLabel: 'AMMAN PHOTOGRAPHERS',
    time: 'Starts 6:00 PM',
    type: 'On-site',
  },
  {
    id: 'e3',
    day: 'WED',
    date: '18',
    month: 'Feb',
    title: 'The Cut — Editing Sprint Night',
    location: 'Online',
    desc: '90-minute live editing sprint on the same raw footage, then side-by-side timeline breakdowns.',
    category: 'editors',
    categoryLabel: 'VIDEO EDITORS',
    time: 'Starts 7:00 PM',
    type: 'Online',
  },
  {
    id: 'e4',
    day: 'SUN',
    date: '1',
    month: 'Mar',
    title: 'Color Grading Masterclass',
    location: 'Zain Innovation Campus · Amman',
    desc: 'Behind-the-scenes color grading sprint with live music visuals and realtime grading notes.',
    category: 'editors',
    categoryLabel: 'VIDEO EDITORS',
    time: 'Starts 5:30 PM',
    type: 'On-site',
  },
  {
    id: 'e5',
    day: 'FRI',
    date: '14',
    month: 'Mar',
    title: 'Short Film Pitch Night',
    location: 'The Royal Film Commission · Amman',
    desc: 'Pitch your short film concept to a panel of working directors and producers. 3-minute pitches, immediate feedback.',
    category: 'filmmakers',
    categoryLabel: 'FILMMAKERS',
    time: 'Starts 7:00 PM',
    type: 'On-site',
  },
  {
    id: 'e6',
    day: 'MON',
    date: '10',
    month: 'Mar',
    title: 'Content Strategy Workshop',
    location: 'Online',
    desc: 'Building a 30-day content calendar from scratch. Platforms, formats, distribution strategy — no theory, all execution.',
    category: 'creators',
    categoryLabel: 'CONTENT CREATORS',
    time: 'Starts 6:00 PM',
    type: 'Online',
  },
]

export default function EventsPage({ navigate: _navigate }: EventsPageProps) {
  const [search, setSearch] = useState('')
  const [reserved, setReserved] = useState<Set<string>>(new Set())
  const [reminded, setReminded] = useState<Set<string>>(new Set())

  const filtered = EVENTS.filter((e) => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.location.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
        <div>
          <p className="font-inter font-semibold mb-2" style={{ color: '#E85D04', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Experience Calendar
          </p>
          <h1 className="font-inter font-bold text-paper leading-tight mb-3" style={{ fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
            Upcoming meetups for<br />the Makers community.
          </h1>
          <p className="font-inter text-muted text-sm leading-relaxed max-w-md">
            Community hangs, live labs, and working sessions curated by category —<br />
            photographers, editors, <span style={{ color: '#E85D04' }}>filmmakers</span>, and creators.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--c-muted-2)' }}>
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city or topic"
              className="pl-9 pr-4 py-2.5 rounded-full font-inter text-sm"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 13, width: 220 }}
            />
          </div>
          <button
            className="font-inter font-semibold text-paper px-5 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
            style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            Submit an event
          </button>
        </div>
      </div>


      {/* Event list */}
      <div className="flex flex-col gap-3 max-w-4xl">
        {filtered.length === 0 && (
          <p className="font-inter text-muted py-12 text-center">No events found.</p>
        )}
        {filtered.map((event) => (
          <div
            key={event.id}
            className="flex gap-5 p-6 rounded-2xl"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            {/* Date block */}
            <div className="flex-shrink-0 text-center w-12">
              <p className="font-inter text-muted text-xs uppercase" style={{ fontSize: 10, letterSpacing: '0.1em' }}>{event.day}</p>
              <p className="font-archivo text-orange" style={{ fontSize: 28, lineHeight: 1 }}>{event.date}</p>
              <p className="font-inter text-muted text-xs">{event.month}</p>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch" style={{ background: 'var(--c-border)' }} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-inter font-bold text-paper" style={{ fontSize: 16 }}>{event.title}</h3>
                <div className="text-right flex-shrink-0">
                  <p className="font-inter font-bold" style={{ color: '#E85D04', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {event.categoryLabel}
                  </p>
                  <p className="font-inter text-muted text-xs flex items-center justify-end gap-1 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" /><path d="M5 3v2l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
                    {event.time}
                  </p>
                </div>
              </div>
              <p className="font-inter text-orange text-xs flex items-center gap-1 mb-2">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1C3.07 1 1.5 2.57 1.5 4.5c0 2.63 3.5 5.5 3.5 5.5S8.5 7.13 8.5 4.5C8.5 2.57 6.93 1 5 1zm0 4.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" stroke="currentColor" strokeWidth="1" /></svg>
                {event.location}
              </p>
              <p className="font-inter text-muted text-sm leading-relaxed mb-4">{event.desc}</p>
              <div className="flex items-center gap-3">
                <span
                  className="font-inter text-muted text-xs px-3 py-1 rounded-full"
                  style={{ border: '1px solid var(--c-border)', fontSize: 11 }}
                >
                  {event.type}
                </span>
                <button
                  onClick={() => setReserved((prev) => { const n = new Set(prev); reserved.has(event.id) ? n.delete(event.id) : n.add(event.id); return n })}
                  className="font-inter font-semibold text-paper px-5 py-2 rounded-full hover:opacity-90 active:scale-95 transition-all"
                  style={{ background: reserved.has(event.id) ? '#CC4F03' : '#E85D04', border: 'none', cursor: 'pointer', fontSize: 12 }}
                >
                  {reserved.has(event.id) ? 'Reserved ✓' : 'Reserve spot'}
                </button>
                <button
                  onClick={() => setReminded((prev) => { const n = new Set(prev); reminded.has(event.id) ? n.delete(event.id) : n.add(event.id); return n })}
                  className="font-inter font-semibold text-paper px-5 py-2 rounded-full hover:bg-surface-alt transition-colors"
                  style={{
                    background: reminded.has(event.id) ? 'var(--c-surface-alt)' : 'transparent',
                    border: `1px solid ${reminded.has(event.id) ? '#E85D04' : 'var(--c-border-mid)'}`,
                    cursor: 'pointer',
                    color: reminded.has(event.id) ? '#E85D04' : 'var(--c-text)',
                    fontSize: 12,
                  }}
                >
                  {reminded.has(event.id) ? 'Reminded ✓' : 'Remind me'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
