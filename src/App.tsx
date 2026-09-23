import { useEffect } from 'react'
import { RouterProvider, useRouter } from './lib/router'
import { supabase } from './lib/supabase'
import { RESERVED_PATHS } from './lib/constants'
import Dock from './components/Dock'
import Directory from './pages/Directory'
import MakerPage from './pages/MakerPage'
import JoinPage from './pages/JoinPage'
import LoginPage from './pages/LoginPage'
import EditorPage from './pages/EditorPage'
import StatusPage from './pages/StatusPage'
import InboxPage from './pages/InboxPage'
import Admin from './pages/Admin'

function Routes() {
  const { path, go } = useRouter()

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') go('/login?reset=1')
    })
    return () => data.subscription.unsubscribe()
  }, [go])

  const seg = path.replace(/^\/+|\/+$/g, '').split('/')
  const first = decodeURIComponent(seg[0] || '')

  let page
  if (!first) page = <Directory />
  else if (first === 'join') page = <JoinPage />
  else if (first === 'login') page = <LoginPage />
  else if (first === 'me' && seg[1] === 'status') page = <StatusPage />
  else if (first === 'me') page = <EditorPage />
  else if (first === 'inbox') page = <InboxPage />
  else if (first === 'admin') page = <Admin />
  else if (!RESERVED_PATHS.includes(first)) page = <MakerPage username={first} />
  else page = <Directory />

  return (
    <div className="mk" dir="rtl" lang="ar">
      <Dock />
      {page}
    </div>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  )
}
