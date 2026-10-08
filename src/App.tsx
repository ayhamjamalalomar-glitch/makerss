import { lazy, Suspense, useEffect, type ReactElement } from 'react'
import { useRouter } from './lib/router'
import { useLang } from './lib/i18n'
import { supabase } from './lib/supabase'
import { RESERVED_PATHS } from './lib/constants'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Footer from './components/Footer'
import CommandPalette from './components/CommandPalette'
import { motion } from 'framer-motion'
import { PageSkeleton } from './components/mk'
import Landing from './pages/Landing'
import MakersPage from './pages/MakersPage'
import MakerProfile from './pages/MakerProfile'
import TitlesPage from './pages/TitlesPage'
import TitlePage from './pages/TitlePage'
import OpenProjects from './pages/OpenProjects'
import WritingsPage from './pages/WritingsPage'
import WritingPage from './pages/WritingPage'

// Pages that only signed-in members or the team open load on demand, so first visits stay light.
const TitleEditor = lazy(() => import('./pages/TitleEditor'))
const OpenCallEditor = lazy(() => import('./pages/OpenCallEditor'))
const JoinPage = lazy(() => import('./pages/JoinPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const EditorPage = lazy(() => import('./pages/EditorPage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const InboxPage = lazy(() => import('./pages/InboxPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const Admin = lazy(() => import('./pages/Admin'))
const WritingEditor = lazy(() => import('./pages/WritingEditor'))

export default function App() {
  const { path, search, go } = useRouter()
  const { lang } = useLang()

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') go('/login?reset=1')
    })
    return () => data.subscription.unsubscribe()
  }, [go])

  const seg = path.replace(/^\/+|\/+$/g, '').split('/').map((s) => decodeURIComponent(s))
  const [first = '', second = '', third = ''] = seg

  // Full-screen pages (own layout, no header/footer)
  let bare: ReactElement | null = null
  if (first === 'join') bare = <JoinPage />
  else if (first === 'login') bare = <LoginPage />
  // The writing editor is a page of its own, like a blank sheet: no site header or footer.
  else if (first === 'writing' && second === 'new') bare = <WritingEditor />
  else if (first === 'writing' && second && third === 'edit') bare = <WritingEditor id={second} />

  let page: ReactElement
  if (!first) page = <Landing />
  else if (first === 'makers') page = <MakersPage />
  else if (first === 'projects' && second === 'new') page = <TitleEditor />
  else if (first === 'projects' && second && third === 'edit') page = <TitleEditor id={second} />
  else if (first === 'projects' && second) page = <TitlePage id={second} />
  else if (first === 'projects') page = <TitlesPage />
  else if (first === 'opportunities' && second === 'new') page = <OpenCallEditor />
  else if (first === 'opportunities') page = <OpenProjects openId={second || undefined} />
  else if (first === 'writing' && second) page = <WritingPage id={second} />
  else if (first === 'writing' || first === 'writings') page = <WritingsPage />
  else if (first === 'me' && second === 'status') page = <StatusPage />
  else if (first === 'me') page = <EditorPage />
  else if (first === 'inbox') page = <InboxPage />
  else if (first === 'messages') page = <MessagesPage />
  else if (first === 'admin') page = <Admin />
  else if (!RESERVED_PATHS.includes(first) && second && !third) page = <WritingPage username={first} slug={second} />
  else if (!RESERVED_PATHS.includes(first)) page = <MakerProfile username={first} />
  else page = <Landing />

  // Remount on real page changes only. Opening an open call keeps the list (and its filters) mounted;
  // on /makers a new query from a link (Makers / Creators tabs) remounts so the filters are re-read.
  const pageKey = first === 'opportunities' ? first : first === 'makers' ? first + search : first + '/' + second

  return (
    <div className="min-h-screen" dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang} style={{ backgroundColor: 'var(--c-bg)', color: 'var(--c-text)' }}>
      {bare ? (
        <Suspense fallback={null}>{bare}</Suspense>
      ) : (
        <>
          <Header />
          <main className="pt-16 pb-28 md:pb-0 flex flex-col min-h-screen">
            <motion.div key={pageKey} className="flex-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
              <Suspense fallback={<PageSkeleton />}>{page}</Suspense>
            </motion.div>
            {first !== 'messages' && first !== 'admin' && <Footer />}
          </main>
          <BottomNav />
          <CommandPalette />
        </>
      )}
    </div>
  )
}
