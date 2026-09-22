import { useState } from 'react'
import SparkStar from './SparkStar'
import type { Maker } from '../data/seed'

interface RateReviewModalProps {
  maker: Maker
  onClose: () => void
}

type State = 'form' | 'waiting'

export default function RateReviewModal({ maker, onClose }: RateReviewModalProps) {
  const [state, setState] = useState<State>('form')
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (stars === 0 || !comment.trim()) return
    setState('waiting')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(16,20,8,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md border border-divider"
        style={{ background: '#141a0c', borderRadius: 20 }}
      >
        {state === 'form' ? (
          <>
            <div className="p-6 border-b border-divider flex items-start justify-between">
              <div>
                <p className="text-volt text-xs uppercase tracking-widest mb-1" style={{ letterSpacing: '0.1em' }}>
                  Rate Your Collaboration
                </p>
                <h2 className="font-archivo text-paper text-xl">{maker.nameLatin}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-paper/40 hover:text-paper transition-colors mt-1"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
              {/* Star selector */}
              <div className="flex flex-col gap-3">
                <span className="text-paper/50 text-xs uppercase tracking-widest" style={{ letterSpacing: '0.1em' }}>
                  Rating
                </span>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setStars(n)}
                      className="transition-transform hover:scale-110"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                      aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                    >
                      <SparkStar filled={n <= (hovered || stars)} size={32} />
                    </button>
                  ))}
                </div>
                {stars > 0 && (
                  <p className="text-paper/40 text-xs">{stars} / 5</p>
                )}
              </div>

              {/* Comment */}
              <label className="flex flex-col gap-2">
                <span className="text-paper/50 text-xs uppercase tracking-widest" style={{ letterSpacing: '0.1em' }}>
                  Written Review
                </span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience working with this Maker..."
                  required
                  rows={4}
                  className="bg-ink border border-divider text-paper placeholder-paper/20 px-4 py-3 text-sm focus:outline-none focus:border-volt transition-colors resize-none"
                  style={{ borderRadius: 10 }}
                />
              </label>

              <p className="text-paper/30 text-xs leading-relaxed">
                Your review will remain private until both parties have submitted — or 14 days after the first submission.
              </p>

              <button
                type="submit"
                disabled={stars === 0}
                className="font-archivo text-ink bg-volt hover:bg-volt-deep disabled:opacity-30 transition-colors px-6 py-3 text-sm uppercase tracking-widest"
                style={{ borderRadius: 10, letterSpacing: '0.1em', cursor: stars === 0 ? 'not-allowed' : 'pointer' }}
              >
                Submit Review
              </button>
            </form>
          </>
        ) : (
          <div className="p-10 text-center">
            <div
              className="inline-flex items-center justify-center border-2 border-volt w-14 h-14 mb-6"
              style={{ borderRadius: 14 }}
            >
              <SparkStar filled size={28} />
            </div>
            <h3 className="font-archivo text-paper text-xl mb-3">Review Submitted</h3>
            <p className="text-paper/50 text-sm leading-relaxed mb-2">
              Your review is sealed and private.
            </p>
            <p className="text-paper/30 text-sm leading-relaxed mb-8">
              It will become visible once <strong className="text-paper/60">{maker.nameLatin}</strong> submits their review — or in 14 days, whichever comes first.
            </p>
            <button
              onClick={onClose}
              className="font-archivo text-volt border border-volt hover:bg-volt hover:text-ink transition-colors px-6 py-3 text-sm uppercase tracking-widest"
              style={{ borderRadius: 10, letterSpacing: '0.1em' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
