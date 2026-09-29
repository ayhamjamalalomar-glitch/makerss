/** Share a link: the phone's own share sheet when there is one, otherwise copy to the clipboard. */
export async function shareLink(url: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  const touch = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || /Android|iPhone|iPad/i.test(navigator.userAgent))
  if (touch && typeof navigator.share === 'function') {
    try {
      await navigator.share({ url, title })
      return 'shared'
    } catch (e) {
      // The member closed the sheet: nothing to report.
      if ((e as Error)?.name === 'AbortError') return 'shared'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return legacyCopy(url) ? 'copied' : 'failed'
  }
}

// For browsers or embedded views that block the clipboard API.
function legacyCopy(text: string) {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  area.remove()
  return ok
}
