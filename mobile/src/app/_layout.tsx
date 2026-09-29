import { Alexandria_700Bold, Alexandria_800ExtraBold } from '@expo-google-fonts/alexandria'
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black'
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono'
import { ReadexPro_400Regular, ReadexPro_500Medium, ReadexPro_600SemiBold } from '@expo-google-fonts/readex-pro'
import { useFonts } from 'expo-font'
import { DarkTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { I18nManager, Platform, View } from 'react-native'
import { C, F } from '../lib/theme'

SplashScreen.preventAutoHideAsync()

// Arabic first: the whole app lays out right to left.
I18nManager.allowRTL(true)
if (!I18nManager.isRTL) I18nManager.forceRTL(true)
// Web preview: the browser lays out flex rows from the document direction.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl'
  document.documentElement.lang = 'ar'
}

const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, text: C.text, primary: C.accent, border: C.border } }

export default function RootLayout() {
  const [loaded] = useFonts({
    Alexandria_700Bold, Alexandria_800ExtraBold,
    ReadexPro_400Regular, ReadexPro_500Medium, ReadexPro_600SemiBold,
    JetBrainsMono_500Medium, ArchivoBlack_400Regular,
  })
  useEffect(() => { if (loaded) SplashScreen.hideAsync() }, [loaded])
  if (!loaded) return null

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      {/* Explicit RTL on the root as well, so the layout is right to left even before the app restarts after forceRTL. */}
      <View style={{ flex: 1, direction: 'rtl', backgroundColor: C.bg }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.text,
          headerTitleStyle: { fontFamily: F.bodyBold, fontSize: 16 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="maker/[username]" options={{ headerTransparent: true, title: '' }} />
        <Stack.Screen name="project/[id]" options={{ headerTransparent: true, title: '' }} />
        <Stack.Screen name="opportunity/[id]" options={{ presentation: 'modal', title: '' }} />
      </Stack>
      </View>
    </ThemeProvider>
  )
}
