import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { store } from './storage'

// The cinematic identity, same tokens as the website (src/index.css):
// darkroom black, bone white type, projector amber light, a red REC dot and a teal "live" signal.
export const palettes = {
  dark: {
    bg: '#09090B',
    surface: '#121216',
    surfaceAlt: '#1A1A1F',
    text: '#F3EFE7',
    text2: '#BFB9AE',
    border: '#25252C',
    borderMid: '#36363F',
    muted: '#807C74',
    muted2: '#5B5953',
    accent: '#F2B33D',
    accentRgb: '242,179,61',
    onAccent: '#0B0A08',
    rec: '#FF453A',
    live: '#5ED6B4',
    screen: '#050507',
    danger: '#F87171',
    success: '#4ADE80',
    overlay: 'rgba(9,9,11,0.82)',
  },
  light: {
    bg: '#F2EEE6',
    surface: '#E9E4DA',
    surfaceAlt: '#DFD9CD',
    text: '#0B0B0D',
    text2: '#3A3833',
    border: '#D2CBBE',
    borderMid: '#BFB7A8',
    muted: '#6E6A63',
    muted2: '#8F8A81',
    accent: '#C98A12',
    accentRgb: '201,138,18',
    onAccent: '#0B0A08',
    rec: '#FF453A',
    live: '#1E9E7E',
    screen: '#0B0B0D',
    danger: '#DC2626',
    success: '#15803D',
    overlay: 'rgba(242,238,230,0.88)',
  },
}
export type Palette = typeof palettes.dark
export type ThemeMode = 'dark' | 'light' | 'system'

/** Text colors for surfaces that stay dark in both themes (heroes, the full crew block). */
export const onScreen = { text: '#F3EFE7', dim: 'rgba(243,239,231,0.62)', faint: 'rgba(243,239,231,0.38)', line: 'rgba(243,239,231,0.14)' }

export const alpha = (c: Palette, a: number) => `rgba(${c.accentRgb},${a})`

const KEY = 'mk-theme'

const Ctx = createContext<{ c: Palette; dark: boolean; mode: ThemeMode; setMode: (m: ThemeMode) => void }>({
  c: palettes.dark, dark: true, mode: 'dark', setMode: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [mode, setState] = useState<ThemeMode>(() => {
    const saved = store.get(KEY)
    return saved === 'light' || saved === 'system' ? saved : 'dark'
  })
  const setMode = useCallback((m: ThemeMode) => {
    store.set(KEY, m)
    setState(m)
  }, [])
  const dark = mode === 'system' ? system !== 'light' : mode === 'dark'
  return <Ctx.Provider value={{ c: dark ? palettes.dark : palettes.light, dark, mode, setMode }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)

/** Font families. Custom fonts on iOS need one family per weight. */
export const F = {
  display: 'Alexandria_700Bold',
  displaySemi: 'Alexandria_600SemiBold',
  displayBlack: 'Alexandria_800ExtraBold',
  body: 'ReadexPro_400Regular',
  bodyMedium: 'ReadexPro_500Medium',
  bodySemi: 'ReadexPro_600SemiBold',
  bodyBold: 'ReadexPro_700Bold',
  mono: 'JetBrainsMono_500Medium',
  wordmark: 'ArchivoBlack_400Regular',
}
