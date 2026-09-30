import { useEffect } from 'react'
import { Platform } from 'react-native'
import { isRunningInExpoGo } from 'expo'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import { router } from 'expo-router'
import { supabase } from './supabase'
import { getLang } from './i18n'
import { store } from './storage'

// Push notifications. The backend (push_tokens, push_outbox, the send-push function) sends a push for new
// messages, collaboration requests, review decisions and open call updates. Each push carries data.url,
// a path inside this app (for example /chat/<id>), which we open when the member taps it.

const KEY = 'mk-push-token'

/** Pushes need a real device, a build of our own (not Expo Go) and an EAS project id. */
export const pushSupported = () =>
  Platform.OS !== 'web' && Device.isDevice && !isRunningInExpoGo() && !!projectId()

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined
}

async function lib() {
  // Loaded lazily so Expo Go and web never touch the native push module.
  return await import('expo-notifications')
}

let handlerSet = false
async function setHandler() {
  if (handlerSet) return
  handlerSet = true
  const N = await lib()
  N.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  })
}

/** Ask for permission (once) and save this device's token for the signed-in member. */
export async function registerPush(ask: boolean): Promise<'on' | 'denied' | 'unsupported'> {
  if (!pushSupported()) return 'unsupported'
  try {
    await setHandler()
    const N = await lib()
    let { status } = await N.getPermissionsAsync()
    if (status !== 'granted' && ask) status = (await N.requestPermissionsAsync()).status
    if (status !== 'granted') return 'denied'
    const { data: token } = await N.getExpoPushTokenAsync({ projectId: projectId() })
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS === 'android' ? 'android' : 'ios', p_lang: getLang() })
    if (error) return 'denied'
    store.set(KEY, token)
    return 'on'
  } catch {
    return 'unsupported'
  }
}

/** Forget this device before signing out, so the next person on it gets no pushes meant for us. */
export async function unregisterPush() {
  const token = store.get(KEY)
  if (!token) return
  await supabase.rpc('unregister_push_token', { p_token: token }).then(() => null, () => null)
  store.remove(KEY)
}

/** Opens the screen a tapped push points to, including the push that launched the app. */
export function usePushRouting(ready: boolean) {
  useEffect(() => {
    if (!ready || !pushSupported()) return
    let sub: { remove: () => void } | undefined
    let alive = true
    const open = (url: unknown) => {
      if (typeof url === 'string' && url.startsWith('/')) router.push(url as never)
    }
    lib().then(async (N) => {
      if (!alive) return
      await setHandler()
      const last = N.getLastNotificationResponse()
      if (last) {
        open(last.notification.request.content.data?.url)
        await N.clearLastNotificationResponseAsync()
      }
      sub = N.addNotificationResponseReceivedListener((r) => open(r.notification.request.content.data?.url))
    })
    return () => { alive = false; sub?.remove() }
  }, [ready])
}
