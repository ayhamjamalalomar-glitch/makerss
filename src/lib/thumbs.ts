import { useEffect, useState } from 'react'

// Video thumbnails for work links. YouTube is derived from the URL; Vimeo and TikTok
// come from their public oEmbed endpoints. Anything else falls back to a colour tile.

export function youtubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i)
  return m ? m[1] : null
}

export function quickThumb(url: string | null | undefined) {
  if (!url) return null
  const yt = youtubeId(url)
  return yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null
}

const cache = new Map<string, string | null>()

export async function fetchThumb(url: string, timeoutMs = 5000): Promise<string | null> {
  const quick = quickThumb(url)
  if (quick) return quick
  if (cache.has(url)) return cache.get(url) ?? null
  let endpoint: string | null = null
  if (/vimeo\.com/i.test(url)) endpoint = `https://vimeo.com/api/oembed.json?width=640&url=${encodeURIComponent(url.split('?')[0])}`
  else if (/tiktok\.com/i.test(url)) endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
  if (!endpoint) {
    cache.set(url, null)
    return null
  }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(endpoint, { signal: ctrl.signal })
    const data = res.ok ? await res.json() : null
    const thumb: string | null = data?.thumbnail_url && /^https:\/\//.test(data.thumbnail_url) ? data.thumbnail_url : null
    cache.set(url, thumb)
    return thumb
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/** Stored thumbnail first, then a derived or fetched one. */
export function useThumb(url: string | null | undefined, stored?: string | null) {
  const [thumb, setThumb] = useState<string | null>(stored || quickThumb(url))
  useEffect(() => {
    if (stored || !url) return
    const q = quickThumb(url)
    if (q) return setThumb(q)
    let alive = true
    fetchThumb(url).then((t) => alive && setThumb(t))
    return () => { alive = false }
  }, [url, stored])
  return thumb
}
