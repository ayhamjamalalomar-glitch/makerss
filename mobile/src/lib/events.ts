// Tiny in-app event bus (the website uses window events for the same job).
type Fn = () => void
const subs = new Map<string, Set<Fn>>()

export function emit(name: string) {
  subs.get(name)?.forEach((fn) => fn())
}

export function on(name: string, fn: Fn) {
  if (!subs.has(name)) subs.set(name, new Set())
  subs.get(name)!.add(fn)
  return () => { subs.get(name)?.delete(fn) }
}
