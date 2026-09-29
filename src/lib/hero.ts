import { useEffect, useSyncExternalStore } from 'react'

// Pages that open on a dark, full-bleed hero tell the header, so it can start transparent over it.

let count = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Call from a page whose top is a dark hero. */
export function useDarkHero(active = true) {
  useEffect(() => {
    if (!active) return
    count++
    emit()
    return () => { count--; emit() }
  }, [active])
}

/** True while a page with a dark hero is on screen. */
export function useHasDarkHero() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => count > 0,
  )
}
