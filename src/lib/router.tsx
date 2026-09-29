import { createContext, useCallback, useContext, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react'

interface RouterState {
  path: string
  /** Query string of the last navigation made with go() or the back button. In-page filter updates that use replaceState do not change it. */
  search: string
  go: (to: string) => void
}

const RouterContext = createContext<RouterState>({ path: '/', search: '', go: () => {} })

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname || '/')
  const [search, setSearch] = useState(() => window.location.search)

  useEffect(() => {
    const onPop = () => {
      setPath(window.location.pathname || '/')
      setSearch(window.location.search)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = useCallback((to: string) => {
    if (to !== window.location.pathname + window.location.hash) window.history.pushState(null, '', to)
    setPath(window.location.pathname)
    setSearch(window.location.search)
    if (!to.includes('#')) window.scrollTo({ top: 0 })
  }, [])

  return <RouterContext.Provider value={{ path, search, go }}>{children}</RouterContext.Provider>
}

export const useRouter = () => useContext(RouterContext)

export default function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { go } = useRouter()
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || to.startsWith('http') || to.startsWith('#')) return
        e.preventDefault()
        go(to)
      }}
      {...rest}
    />
  )
}
