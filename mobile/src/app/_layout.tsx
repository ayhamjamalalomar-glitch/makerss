import { useEffect } from 'react'
import { View } from 'react-native'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavTheme, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Alexandria_600SemiBold } from '@expo-google-fonts/alexandria/600SemiBold'
import { Alexandria_700Bold } from '@expo-google-fonts/alexandria/700Bold'
import { Alexandria_800ExtraBold } from '@expo-google-fonts/alexandria/800ExtraBold'
import { ReadexPro_400Regular } from '@expo-google-fonts/readex-pro/400Regular'
import { ReadexPro_500Medium } from '@expo-google-fonts/readex-pro/500Medium'
import { ReadexPro_600SemiBold } from '@expo-google-fonts/readex-pro/600SemiBold'
import { ReadexPro_700Bold } from '@expo-google-fonts/readex-pro/700Bold'
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium'
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black/400Regular'
import { LangProvider, takeReopen, useLang } from '@/lib/i18n'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { AuthProvider } from '@/lib/auth'
import { ToastProvider } from '@/lib/toast'
import { UnreadProvider } from '@/lib/unread'
import { usePushRouting } from '@/lib/push'

SplashScreen.preventAutoHideAsync().catch(() => null)

function Shell() {
  const { c, dark } = useTheme()
  const { rtl, lang } = useLang()
  const [fonts] = useFonts({
    Alexandria_600SemiBold, Alexandria_700Bold, Alexandria_800ExtraBold,
    ReadexPro_400Regular, ReadexPro_500Medium, ReadexPro_600SemiBold, ReadexPro_700Bold,
    JetBrainsMono_500Medium, ArchivoBlack_400Regular,
  })
  useEffect(() => { if (fonts) SplashScreen.hideAsync().catch(() => null) }, [fonts])
  usePushRouting(fonts)
  useEffect(() => {
    const path = takeReopen()
    if (path) setTimeout(() => router.push(path as never), 60)
  }, [lang])

  const base = dark ? DarkTheme : DefaultTheme
  const nav = { ...base, colors: { ...base.colors, background: c.bg, card: c.bg, text: c.text, border: c.border, primary: c.accent } }
  if (!fonts) return <View style={{ flex: 1, backgroundColor: c.bg }} />

  return (
    <NavTheme value={nav}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {/* The whole app lays out right to left in Arabic (see Dir in components/ui). Keyed by language:
          screens keep their rendered text between renders, so a language switch rebuilds them all. */}
      <View key={lang} style={{ flex: 1, direction: rtl ? 'rtl' : 'ltr', backgroundColor: c.bg }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="join" options={{ presentation: 'modal' }} />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
        </Stack>
      </View>
    </NavTheme>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LangProvider>
          <ThemeProvider>
            <AuthProvider>
              <UnreadProvider>
                <ToastProvider>
                  <Shell />
                </ToastProvider>
              </UnreadProvider>
            </AuthProvider>
          </ThemeProvider>
        </LangProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
