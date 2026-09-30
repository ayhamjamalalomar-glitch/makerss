import 'expo-sqlite/localStorage/install'

// Small key value store. On the phone `localStorage` is backed by SQLite (installed above);
// on web it is the browser's own. Reads never throw.
export const store = {
  get(key: string): string | null {
    try { return globalThis.localStorage?.getItem(key) ?? null } catch { return null }
  },
  set(key: string, value: string) {
    try { globalThis.localStorage?.setItem(key, value) } catch { /* ignore */ }
  },
  remove(key: string) {
    try { globalThis.localStorage?.removeItem(key) } catch { /* ignore */ }
  },
}
