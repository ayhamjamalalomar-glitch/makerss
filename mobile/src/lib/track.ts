import { supabase } from './supabase'
import { store } from './storage'

// Page analytics, same as the website. A random id kept on this device tells repeat visits apart; nothing personal is sent.
const KEY = 'mk-visitor'

function visitorId() {
  let id = store.get(KEY)
  if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    id = 'app-' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('')
    store.set(KEY, id)
  }
  return id
}

export type TrackKind = 'view' | 'contact' | 'share' | 'social' | 'work' | 'message'

export function track(type: 'profile' | 'project', id: string | null | undefined, kind: TrackKind) {
  if (!id) return
  // Fire and forget: analytics must never slow down or break a screen.
  supabase.rpc('track_event', { p_type: type, p_id: id, p_kind: kind, p_visitor: visitorId() }).then(() => null, () => null)
}
