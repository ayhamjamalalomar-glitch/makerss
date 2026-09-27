import { useEffect, type ReactElement } from 'react'
import { useRouter } from './lib/router'
import { useLang } from './lib/i18n'
import { supabase } from './lib/supabase'
import { RESERVED_PATHS } from './lib/constants'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import MakersPage from './pages/MakersPage'
import MakerProfile from './pages/MakerProfile'
import TitlesPage from './pages/TitlesPage'
import TitlePage from './pages/TitlePage'
import TitleEditor from './pages/TitleEditor'
import OpenProjects from './pages/OpenProjects'
import OpenCallEditor from './pages/OpenCallEditor'
import JoinPage from './pages/JoinPage'
import LoginPage from './pages/LoginPage'
import EditorPage from './pages/EditorPage'
import StatusPage from './pages/StatusPage'
import InboxPage from './pages/InboxPage'
import MessagesPage from './pages/MessagesPage'
import Admin from './pages/Admin'

export default function App() {
  const { path, go } = useRouter()
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

  let page: ReactElement
  if (!first) page = <Landing />
  else if (first === 'makers') page = <MakersPage />
  else if (first === 'projects' && second === 'new') page = <TitleEditor />
  else if (first === 'projects' && second && third === 'edit') page = <TitleEditor id={second} />
  else if (first === 'projects' && second) page = <TitlePage id={second} />
  else if (first === 'projects') page = <TitlesPage />
  else if (first === 'opportunities' && second === 'new') page = <OpenCallEditor />
  else if (first === 'opportunities') page = <OpenProjects openId={second || undefined} />
  else if (first === 'me' && second === 'status') page = <StatusPage />
  else if (first === 'me') page = <EditorPage />
  else if (first === 'inbox') page = <InboxPage />
  else if (first === 'messages') page = <MessagesPage />
  else if (first === 'admin') page = <Admin />
  else if (!RESERVED_PATHS.includes(first)) page = <MakerProfile username={first} />
  else page = <Landing />

  return (
    <div className="min-h-screen" dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang} style={{ backgroundColor: 'var(--c-bg)', color: 'var(--c-text)' }}>
      {bare ?? (
        <>
          <Header />
          <main className="pt-14 pb-28 flex flex-col min-h-screen">
            <div className="flex-1">{page}</div>
            {first !== 'messages' && first !== 'admin' && <Footer />}
          </main>
          <BottomNav />
        </>
      )}
    </div>
  )
}
