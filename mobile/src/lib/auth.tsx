import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Profile } from './supabase'
import { registerPush, unregisterPush } from './push'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null)
      return
    }
    const { data } = await supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).eq('id', s.user.id).maybeSingle()
    let review_note: string | null = null
    if (data && (data as { status?: string }).status === 'rejected') {
      const { data: note } = await supabase.rpc('my_review_note')
      review_note = (note as string | null) ?? null
    }
    setProfile(data ? ({ ...(data as unknown as Profile), email: s.user.email, review_note }) : null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session)
      setLoading(false)
      // Keep this device's push token fresh without asking again.
      if (data.session) registerPush(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      // defer to avoid calling Supabase inside the auth callback
      setTimeout(() => {
        loadProfile(s)
        if (event === 'SIGNED_IN' && s) registerPush(true)
      }, 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    await loadProfile(session)
  }, [loadProfile, session])

  const signOut = useCallback(async () => {
    await unregisterPush()
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
