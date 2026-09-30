import { supabase } from './supabase'
import { unregisterPush } from './push'

/**
 * Deletes the signed-in member's account (Apple requires this inside the app).
 * Files in the member's own storage folders go first, then the database removes the
 * account and everything that belongs to it (RPC delete_my_account).
 */
export async function deleteMyAccount(userId: string): Promise<'ok' | 'staff' | 'failed'> {
  for (const bucket of ['avatars', 'works'] as const) {
    const { data } = await supabase.storage.from(bucket).list(userId, { limit: 1000 })
    const paths = (data || []).filter((f) => f.name && f.id).map((f) => `${userId}/${f.name}`)
    if (paths.length) await supabase.storage.from(bucket).remove(paths)
  }
  await unregisterPush()
  const { error } = await supabase.rpc('delete_my_account')
  if (error) return /staff/i.test(error.message) ? 'staff' : 'failed'
  await supabase.auth.signOut({ scope: 'local' })
  return 'ok'
}
