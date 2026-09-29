import { useCallback, useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { t } from '../lib/i18n'

/** Frame an image before upload: drag to move, slider or wheel to zoom. `cropRef` returns the JPEG. */
export default function ImageCropper({ file, aspect, outWidth, width = 240, cropRef }: {
  file: File
  aspect: number // width / height
  outWidth: number
  width?: number
  cropRef: MutableRefObject<(() => Promise<Blob>) | null>
}) {
  const W = width
  const H = Math.round(width / aspect)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  useEffect(() => {
    // A new file starts clean: no stale error, and no stale image that Save could crop.
    setImg(null)
    setError(false)
    setZoom(1)
    let live = true
    const url = URL.createObjectURL(file)
    const i = new Image()
    i.onload = () => { if (live) setImg(i) }
    i.onerror = () => { if (live) setError(true) }
    i.src = url
    return () => { live = false; URL.revokeObjectURL(url) }
  }, [file])

  const base = img ? Math.max(W / img.naturalWidth, H / img.naturalHeight) : 1
  const scale = base * zoom
  const dw = img ? img.naturalWidth * scale : W
  const dh = img ? img.naturalHeight * scale : H
  const clamp = useCallback((x: number, y: number) => ({ x: Math.min(0, Math.max(W - dw, x)), y: Math.min(0, Math.max(H - dh, y)) }), [W, H, dw, dh])

  // Center the image when it loads.
  useEffect(() => { if (img) setPos({ x: (W - img.naturalWidth * base) / 2, y: (H - img.naturalHeight * base) / 2 }) }, [img]) // eslint-disable-line react-hooks/exhaustive-deps

  const setZoomAround = (z: number) => {
    const next = Math.min(3, Math.max(1, z))
    const s2 = base * next
    // keep the point under the frame's center where it is
    const cx = (W / 2 - pos.x) / scale
    const cy = (H / 2 - pos.y) / scale
    const nw = (img?.naturalWidth || 0) * s2
    const nh = (img?.naturalHeight || 0) * s2
    setZoom(next)
    setPos({ x: Math.min(0, Math.max(W - nw, W / 2 - cx * s2)), y: Math.min(0, Math.max(H - nh, H / 2 - cy * s2)) })
  }

  cropRef.current = img ? async () => {
    const outH = Math.round(outWidth / aspect)
    const canvas = document.createElement('canvas')
    canvas.width = outWidth
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, outWidth, outH)
    ctx.drawImage(img, -pos.x / scale, -pos.y / scale, W / scale, H / scale, 0, 0, outWidth, outH)
    return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.88))
  } : null

  if (error) return <span className="text-sm" style={{ color: '#F87171' }}>{t('لم نتمكن من قراءة هذه الصورة. جرّب صورة JPG أو PNG.', 'We could not read this image. Try a JPG or PNG.')}</span>

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        dir="ltr"
        className="relative overflow-hidden rounded-2xl touch-none select-none"
        style={{ width: W, height: H, background: 'var(--c-border)', cursor: drag.current ? 'grabbing' : 'grab' }}
        tabIndex={0}
        role="img"
        aria-label={t('اسحب الصورة لتحريكها، واستخدم الأسهم أيضاً', 'Drag the image to move it; arrow keys work too')}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); drag.current = { x: pos.x, y: pos.y, px: e.clientX, py: e.clientY } }}
        onPointerMove={(e) => { const d = drag.current; if (d) setPos(clamp(d.x + e.clientX - d.px, d.y + e.clientY - d.py)) }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
        onWheel={(e) => setZoomAround(zoom - e.deltaY * 0.002)}
        onKeyDown={(e) => {
          const step = 10
          const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
          const m = moves[e.key]
          if (m) { e.preventDefault(); setPos(clamp(pos.x + m[0], pos.y + m[1])) }
        }}
      >
        {img && <img src={img.src} alt="" draggable={false} style={{ position: 'absolute', left: pos.x, top: pos.y, width: dw, height: dh, maxWidth: 'none', pointerEvents: 'none' }} />}
        <span className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)', borderRadius: 16 }} />
      </div>
      <label className="flex items-center gap-3 text-xs w-full" style={{ maxWidth: W + 40, color: 'var(--c-muted)' }}>
        <span>{t('تكبير', 'Zoom')}</span>
        <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoomAround(Number(e.target.value))} className="flex-1" style={{ accentColor: 'var(--c-accent)', background: 'transparent', border: 'none', padding: 0 }} />
      </label>
      <span className="text-[11px]" style={{ color: 'var(--c-muted-2)' }}>{t('اسحب الصورة لاختيار الجزء الظاهر.', 'Drag the image to choose what shows.')}</span>
    </div>
  )
}

/** Wraps an area so an image can be dropped on it. */
export function DropZone({ onFile, children, className = '' }: { onFile: (f: File) => void; children: ReactNode; className?: string }) {
  const [over, setOver] = useState(false)
  return (
    <div
      className={className}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f && /^image\/(jpeg|png|webp)$/.test(f.type)) onFile(f)
      }}
      style={{ outline: over ? '2px dashed var(--c-accent)' : 'none', outlineOffset: 4, borderRadius: 18, transition: 'outline-color .15s' }}
    >
      {children}
    </div>
  )
}
