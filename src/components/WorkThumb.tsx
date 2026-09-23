import { useState, type ReactNode } from 'react'
import type { Work } from '../lib/supabase'
import { useThumb } from '../lib/thumbs'
import { Corners } from './mk'

const TONES = ['#232220', '#5E4A38', '#37414C', '#4A3F52', '#3F4A3C', '#52463A']

/** Video frame for a work: real thumbnail when we can get one, otherwise a colour tile. */
export default function WorkThumb({ work, index, className = '', children }: { work: Work; index: number; className?: string; children?: ReactNode }) {
  const thumb = useThumb(work.url, work.thumbnail_url)
  const [failed, setFailed] = useState(false)
  const show = thumb && !failed
  const label = [work.platform, work.year].filter(Boolean).join(' · ')
  return (
    <span className={`relative overflow-hidden shrink-0 flex items-end p-2 md:p-4 ${className}`} style={{ background: TONES[index % TONES.length] }}>
      {show && <img src={thumb} alt="" loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 w-full h-full object-cover" />}
      {show && <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0) 55%)' }} />}
      {show && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.92)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#111" aria-hidden="true" style={{ marginLeft: 2 }}><path d="M7 4.5v15l13-7.5z" /></svg>
          </span>
        </span>
      )}
      <Corners size={12} inset={10} color="#FFFFFF" w={1.5} />
      {label && <span className="relative mono text-[10px] md:text-[11px] text-white px-1 md:px-2" dir="ltr">{label}</span>}
      {children}
    </span>
  )
}
