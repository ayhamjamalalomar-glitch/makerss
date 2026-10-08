import { useEffect, useState } from 'react'

/** Site theme: light, dark, or follow the device. Dark is the default. Stored in localStorage 'mk-theme'. */
export type ThemeMode = 'light' | 'dark' | 'system'

const KEY = 'mk-theme'
const EVENT = 'mk-theme-change'
const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null

function read(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch { /* storage blocked */ }
  return 'dark'
}

function apply(mode: ThemeMode) {
  const light = mode === 'light' || (mode === 'system' && !!media?.matches)
  document.documentElement.dataset.theme = light ? 'light' : 'dark'
}

// Apply the saved theme as early as possible, and follow the device while in system mode.
apply(read())
media?.addEventListener?.('change', () => { if (read() === 'system') apply('system') })

export function setThemeMode(mode: ThemeMode) {
  try { localStorage.setItem(KEY, mode) } catch { /* ignore */ }
  apply(mode)
  window.dispatchEvent(new Event(EVENT))
}

export function isLightNow() {
  return document.documentElement.dataset.theme === 'light'
}

/** Current mode, kept in sync across the menu and the footer. */
export function useThemeMode(): [ThemeMode, (m: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>(read)
  useEffect(() => {
    const on = () => setMode(read())
    window.addEventListener(EVENT, on)
    media?.addEventListener?.('change', on)
    return () => { window.removeEventListener(EVENT, on); media?.removeEventListener?.('change', on) }
  }, [])
  return [mode, setThemeMode]
}
