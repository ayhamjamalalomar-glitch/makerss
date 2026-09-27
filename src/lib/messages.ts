import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Conversation {
  id: string
  user_a: string
  user_b: string
  created_at: string
  last_message_at: string | null
  last_message_preview: string | null
  last_sender: string | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

/** Unread direct-message count for the signed-in member, kept live over realtime. */
export function useUnreadMessages(userId: string | undefined) {
  const [count, setCount] = useState(0)
  const refresh = useCallback(async () => {
    if (!userId) return setCount(0)
    const { data } = await supabase.rpc('unread_messages_count')
    setCount(typeof data === 'number' ? data : 0)
  }, [userId])

  useEffect(() => {
    refresh()
    if (!userId) return
    const ch = supabase
      .channel(`unread-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => refresh())
      .subscribe()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    window.addEventListener('mk-messages-read', onFocus)
    return () => {
      supabase.removeChannel(ch)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('mk-messages-read', onFocus)
    }
  }, [userId, refresh])

  return count
}

/** Turn plain URLs in a message into safe links. */
export function splitLinks(text: string): { text: string; href?: string }[] {
  const parts: { text: string; href?: string }[] = []
  const re = /(https?:\/\/[^\s]+)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) })
    parts.push({ text: m[0], href: m[0] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}
