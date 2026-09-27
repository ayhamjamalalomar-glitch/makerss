import { useState, useRef, useEffect } from 'react'
import { LangContext } from './LangContext'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import MakersPage from './pages/MakersPage'
import MakerProfile from './pages/MakerProfile'
import FeedPage from './pages/FeedPage'
import CreatorsPage from './pages/CreatorsPage'
import EventsPage from './pages/EventsPage'
import ProjectPage from './pages/TitlePage'
import RequestInvitation from './pages/RequestInvitation'
import OpenProjects from './pages/OpenProjects'
import NewsPage from './pages/NewsPage'
import NewsArticle from './pages/NewsArticle'
import TitlesPage from './pages/TitlesPage'
import Footer from './components/Footer'
import Logo from './components/Logo'
import { makers, titles } from './data/seed'

export type Page =
  | { name: 'home' }
  | { name: 'feed' }
  | { name: 'makers' }
  | { name: 'maker'; id: string }
  | { name: 'creators' }
  | { name: 'events' }
  | { name: 'project'; id: string }
  | { name: 'request-invite' }
  | { name: 'open-projects' }
  | { name: 'news' }
  | { name: 'news-article'; id: string }
  | { name: 'titles' }

export type Navigate = (page: Page) => void

function GlobalSearch({ navigate }: { navigate: Navigate }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const results = query.length > 1
    ? [
        ...makers.filter((m) =>
          m.nameLatin.toLowerCase().includes(query.toLowerCase()) ||
          m.nameArabic.includes(query) ||
          m.specialtyTags.join(' ').toLowerCase().includes(query.toLowerCase())
        ).slice(0, 3).map((m) => ({ type: 'maker' as const, id: m.id, name: m.nameLatin, sub: m.specialtyTags[0] ?? '', photo: m.photo })),
        ...titles.filter((t) =>
          t.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 2).map((t) => ({ type: 'title' as const, id: t.id, name: t.name, sub: String(t.year), photo: t.thumb })),
      ]
    : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setExpanded(false)
        setFocused(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const open = () => {
    setExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  const pick = (r: typeof results[number]) => {
    setQuery('')
    setExpanded(false)
    setFocused(false)
    if (r.type === 'maker') navigate({ name: 'maker', id: r.id })
    else navigate({ name: 'project', id: r.id })
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Collapsed pill */}
      {!expanded && (
        <button
          onClick={open}
          className="flex items-center gap-2 font-inter transition-all hover:opacity-80"
          style={{
            background: 'var(--c-surface-alt)',
            border: '1px solid var(--c-border-mid)',
            borderRadius: 999,
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--c-muted)',
            gap: 8,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Search makers, titles…</span>
          <span
            style={{
              background: 'var(--c-border)',
              borderRadius: 4,
              padding: '1px 5px',
              fontSize: 10,
              fontFamily: 'monospace',
              color: 'var(--c-muted-2)',
            }}
          >⌘K</span>
        </button>
      )}

      {/* Expanded bar */}
      {expanded && (
        <div style={{ position: 'relative', width: 'min(420px, 60vw)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--c-surface-alt)',
              border: `1.5px solid ${focused ? '#E85D04' : 'var(--c-border-mid)'}`,
              borderRadius: 12,
              padding: '6px 12px',
              transition: 'border-color 0.15s',
              boxShadow: focused ? '0 0 0 3px rgba(232,93,4,0.12)' : 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" style={{ color: focused ? '#E85D04' : 'var(--c-muted)', flexShrink: 0, transition: 'color 0.15s' }}>
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search makers, titles, specialties…"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: 'var(--c-text)',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', padding: 2, lineHeight: 1 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {results.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: 'var(--c-surface)',
                border: '1px solid var(--c-border)',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 12px 32px var(--c-shadow)',
                zIndex: 100,
              }}
            >
              {results.map((r, i) => (
                <button
                  key={r.id + i}
                  onMouseDown={() => pick(r)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    borderBottom: i < results.length - 1 ? '1px solid var(--c-border)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <img src={r.photo} alt={r.name} style={{ width: 32, height: 32, borderRadius: r.type === 'maker' ? '50%' : 6, objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', fontFamily: 'Inter, sans-serif' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'Inter, sans-serif' }}>
                      {r.type === 'maker' ? '👤 Maker' : '🎬 Title'} · {r.sub}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'home' })
  const [isArabic, setIsArabic] = useState(true)

  const navigate: Navigate = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const t = {
    invite: isArabic ? 'طلب دعوة' : 'Request Invite',
    inviteShort: isArabic ? 'دعوة' : 'Invite',
  }

  const lang = isArabic ? 'ar' : 'en'

  return (
    <LangContext.Provider value={lang}>
    <div className="min-h-screen" dir={isArabic ? 'rtl' : 'ltr'} style={{ backgroundColor: 'var(--c-bg)', color: 'var(--c-text)' }}>

      {/* Top header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center px-4 sm:px-8"
        style={{ height: 56, background: 'var(--c-overlay)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--c-border)', gap: 12 }}
      >
        <Logo onClick={() => navigate({ name: 'home' })} size="sm" />

        {/* Center search — hidden on small screens */}
        <div className="hidden sm:flex" style={{ flex: 1, justifyContent: 'center' }}>
          <GlobalSearch navigate={navigate} />
        </div>

        {/* Mobile: spacer */}
        <div className="flex sm:hidden" style={{ flex: 1 }} />

        {/* Mobile search icon */}
        <button
          className="flex sm:hidden items-center justify-center rounded-full hover:opacity-80 transition-opacity"
          style={{ width: 36, height: 36, background: 'var(--c-surface-alt)', border: '1px solid var(--c-border-mid)', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => {
            const el = document.getElementById('mobile-search-input')
            if (el) el.focus()
          }}
          aria-label="بحث"
        >
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--c-muted)' }}>
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setIsArabic((v) => !v)}
          className="flex items-center justify-center font-inter font-bold hover:opacity-80 transition-opacity flex-shrink-0"
          style={{
            background: 'var(--c-surface-alt)',
            border: '1px solid var(--c-border-mid)',
            borderRadius: 999,
            cursor: 'pointer',
            fontSize: 11,
            color: 'var(--c-muted)',
            padding: '5px 10px',
            letterSpacing: '0.04em',
          }}
          aria-label="Switch language"
        >
          {isArabic ? 'EN' : 'ع'}
        </button>

        <button
          onClick={() => navigate({ name: 'request-invite' })}
          className="flex items-center gap-2 font-arabic font-semibold text-paper px-3 sm:px-4 py-2 rounded-full hover:opacity-90 transition-all flex-shrink-0"
          style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 12 }}
        >
          <span className="hidden sm:inline">{t.invite}</span>
          <span className="sm:hidden">{t.inviteShort}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d={isArabic ? 'M8 5H2M5 2l-3 3 3 3' : 'M2 5h6M5 2l3 3-3 3'} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      {/* Page content */}
      <main className="pt-14 pb-28 flex flex-col min-h-screen">
        <div className="flex-1">
          {page.name === 'home' && <Landing navigate={navigate} />}
          {page.name === 'feed' && <FeedPage navigate={navigate} />}
          {page.name === 'makers' && <MakersPage navigate={navigate} />}
          {page.name === 'maker' && <MakerProfile id={page.id} navigate={navigate} />}
          {page.name === 'creators' && <CreatorsPage navigate={navigate} />}
          {page.name === 'events' && <EventsPage navigate={navigate} />}
          {page.name === 'project' && <ProjectPage id={page.id} navigate={navigate} />}
          {page.name === 'request-invite' && <RequestInvitation navigate={navigate} />}
          {page.name === 'open-projects' && <OpenProjects navigate={navigate} />}
          {page.name === 'news' && <NewsPage navigate={navigate} />}
          {page.name === 'news-article' && <NewsArticle id={page.id} navigate={navigate} />}
          {page.name === 'titles' && <TitlesPage navigate={navigate} />}
        </div>
        <Footer navigate={navigate} />
      </main>

      {/* Bottom nav bar */}
      <Sidebar page={page} navigate={navigate} />
    </div>
    </LangContext.Provider>
  )
}
