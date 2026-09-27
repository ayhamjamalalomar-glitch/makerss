import SparkStar from './SparkStar'
import type { Maker } from '../data/seed'
import { phaseLabels } from '../data/seed'
import type { Navigate } from '../App'

interface MakerCardProps {
  maker: Maker
  navigate: Navigate
}

export default function MakerCard({ maker, navigate }: MakerCardProps) {
  return (
    <button
      onClick={() => navigate({ name: 'maker', id: maker.id })}
      className="group text-left w-full"
      style={{
        background: '#131908',
        borderRadius: 20,
        padding: 0,
        cursor: 'pointer',
        border: '1px solid #1e2a10',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: '0 0 0 0 rgba(200,245,60,0)',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,245,60,0.4)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 40px -8px rgba(200,245,60,0.08)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#1e2a10'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 0 rgba(200,245,60,0)'
      }}
    >
      {/* Photo */}
      <div className="relative overflow-hidden" style={{ height: 216, background: '#1a2210' }}>
        <img
          src={maker.photo}
          alt={maker.nameLatin}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ display: 'block' }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(19,25,8,0.8) 0%, transparent 55%)' }}
        />

        {/* Verified badge */}
        {maker.verified && (
          <span
            className="absolute top-3 left-3 font-inter text-ink bg-volt text-xs uppercase px-2.5 py-1 flex items-center gap-1"
            style={{ borderRadius: 100, letterSpacing: '0.06em', fontSize: 10, fontWeight: 700 }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
              <path d="M1.5 4L3 5.5L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Verified
          </span>
        )}

        {/* Phase label bottom-left */}
        <span
          className="absolute bottom-3 left-3 font-inter text-paper/70 text-xs uppercase"
          style={{ letterSpacing: '0.12em', fontSize: 10, fontWeight: 600 }}
        >
          {phaseLabels[maker.phases[0]]}
        </span>

        {/* Rating bottom-right */}
        <span className="absolute bottom-3 right-3 flex items-center gap-1">
          <SparkStar filled size={11} />
          <span className="font-inter text-paper text-xs font-semibold">{maker.ratingAverage.toFixed(1)}</span>
        </span>
      </div>

      {/* Info */}
      <div className="p-5">
        {/* Name block */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="font-archivo text-paper text-base leading-tight group-hover:text-volt transition-colors">
              {maker.nameLatin}
            </p>
            <p className="font-arabic text-paper/35 text-sm mt-0.5" dir="rtl">
              {maker.nameArabic}
            </p>
          </div>
          <div
            className="w-7 h-7 border border-divider flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-volt group-hover:text-volt transition-all text-paper/20"
            style={{ borderRadius: 8 }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 9L9 2M9 2H4M9 2V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <p className="font-inter text-paper/35 text-xs mt-2 mb-4" style={{ fontWeight: 400 }}>
          {maker.city}, {maker.country}
        </p>

        {/* Specialty tags */}
        <div className="flex flex-wrap gap-1.5">
          {maker.specialtyTags.map((tag) => (
            <span
              key={tag}
              className="font-inter text-paper/50 text-xs px-2.5 py-1 border border-divider"
              style={{ borderRadius: 100, fontSize: 11 }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}
