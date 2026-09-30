import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from './auth'
import { useUnreadMessages } from './messages'

// One live unread count for the whole app (the messages button sits on several screens).
const Ctx = createContext(0)

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const n = useUnreadMessages(session?.user.id)
  return <Ctx.Provider value={n}>{children}</Ctx.Provider>
}

export const useUnread = () => useContext(Ctx)
