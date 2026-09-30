import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Platform, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { F, useTheme } from './theme'
import { useLang } from './i18n'

type Tone = 'ok' | 'error'
const Ctx = createContext<(text: string, tone?: Tone) => void>(() => {})

/** Short confirmations ("Link copied", "Saved") that slide in at the top. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { c } = useTheme()
  const { rtl } = useLang()
  const insets = useSafeAreaInsets()
  const [msg, setMsg] = useState<{ text: string; tone: Tone } | null>(null)
  const y = useRef(new Animated.Value(-120)).current
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback((text: string, tone: Tone = 'ok') => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(tone === 'ok' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => null)
    setMsg({ text, tone })
    clearTimeout(timer.current)
    Animated.spring(y, { toValue: 0, useNativeDriver: Platform.OS !== 'web', damping: 18 }).start()
    timer.current = setTimeout(() => {
      Animated.timing(y, { toValue: -120, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start(() => setMsg(null))
    }, 2200)
  }, [y])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <Ctx.Provider value={show}>
      {children}
      {msg && (
        <Animated.View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8, transform: [{ translateY: y }] }]}>
          <Animated.View style={[styles.pill, { backgroundColor: c.surfaceAlt, borderColor: msg.tone === 'ok' ? c.borderMid : c.danger }]}>
            <Text style={{ color: msg.tone === 'ok' ? c.text : c.danger, fontFamily: F.bodyMedium, fontSize: 14, textAlign: rtl ? 'right' : 'left' }}>{msg.text}</Text>
          </Animated.View>
        </Animated.View>
      )}
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000 },
  pill: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
})
