import { useState } from 'react'
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

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'home' })

  const navigate: Navigate = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--c-bg)', color: 'var(--c-text)' }}>

      {/* Top header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 sm:px-8"
        style={{ height: 56, background: 'var(--c-overlay)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--c-border)' }}
      >
        <Logo onClick={() => navigate({ name: 'home' })} size="sm" />

        <button
          onClick={() => navigate({ name: 'request-invite' })}
          className="flex items-center gap-2 font-inter font-semibold text-paper px-4 py-2 rounded-full hover:opacity-90 transition-all"
          style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 12 }}
        >
          Request an invitation
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
  )
}
