import { supabase } from './supabase'

// Page analytics. A random id kept in this browser tells repeat visits apart; nothing personal is sent.
// The database ignores a member's visits to their own page and counts each action once per day.

const KEY = 'mk-visitor'

function visitorId() {
  try {
    let id = localStorage.getItem(KEY)
    if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return null
  }
}

export type TrackKind = 'view' | 'contact' | 'share' | 'social' | 'work' | 'message'

export function track(type: 'profile' | 'project', id: string | null | undefined, kind: TrackKind) {
  const visitor = visitorId()
  if (!id || !visitor) return
  // Fire and forget: analytics must never slow down or break the page.
  supabase.rpc('track_event', { p_type: type, p_id: id, p_kind: kind, p_visitor: visitor }).then(() => null, () => null)
}
