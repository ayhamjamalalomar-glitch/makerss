import { useState } from 'react'
import type { Maker } from '../data/seed'

interface CollaborationModalProps {
  maker: Maker
  onClose: () => void
}

type State = 'form' | 'sent'

export default function CollaborationModal({ maker, onClose }: CollaborationModalProps) {
  const [state, setState] = useState<State>('form')
  const [form, setForm] = useState({ projectName: '', brief: '', timeline: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.projectName || !form.brief || !form.timeline) return
    setState('sent')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(16,20,8,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg border border-divider"
        style={{ background: '#141a0c', borderRadius: 20 }}
      >
        {state === 'form' ? (
          <>
            <div className="p-6 border-b border-divider flex items-start justify-between">
              <div>
                <p className="text-paper/50 text-xs uppercase tracking-widest mb-1" style={{ letterSpacing: '0.1em' }}>
                  Request Collaboration
                </p>
                <h2 className="font-archivo text-paper text-xl">{maker.nameLatin}</h2>
                <p className="font-arabic text-paper/40 text-sm" dir="rtl">{maker.nameArabic}</p>
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

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-paper/50 text-xs uppercase tracking-widest" style={{ letterSpacing: '0.1em' }}>Project Name</span>
                <input
                  type="text"
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  placeholder="e.g. Ramadan 2025 Campaign"
                  required
                  className="bg-ink border border-divider text-paper placeholder-paper/20 px-4 py-3 text-sm focus:outline-none focus:border-volt transition-colors"
                  style={{ borderRadius: 10 }}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-paper/50 text-xs uppercase tracking-widest" style={{ letterSpacing: '0.1em' }}>Brief</span>
                <textarea
                  value={form.brief}
                  onChange={(e) => setForm({ ...form, brief: e.target.value })}
                  placeholder="Describe your project, what you need, and your expectations..."
                  required
                  rows={4}
                  className="bg-ink border border-divider text-paper placeholder-paper/20 px-4 py-3 text-sm focus:outline-none focus:border-volt transition-colors resize-none"
                  style={{ borderRadius: 10 }}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-paper/50 text-xs uppercase tracking-widest" style={{ letterSpacing: '0.1em' }}>Timeline</span>
                <input
                  type="text"
                  value={form.timeline}
                  onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                  placeholder="e.g. March 10–25, 2025"
                  required
                  className="bg-ink border border-divider text-paper placeholder-paper/20 px-4 py-3 text-sm focus:outline-none focus:border-volt transition-colors"
                  style={{ borderRadius: 10 }}
                />
              </label>

              <button
                type="submit"
                className="font-archivo text-ink bg-volt hover:bg-volt-deep transition-colors px-6 py-3 text-sm uppercase tracking-widest mt-2"
                style={{ borderRadius: 10, letterSpacing: '0.1em' }}
              >
                Send Request
              </button>
            </form>
          </>
        ) : (
          <div className="p-10 text-center">
            <div
              className="inline-flex items-center justify-center bg-volt w-14 h-14 mb-6"
              style={{ borderRadius: 14 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l4.5 4.5L19 7" stroke="#101408" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-archivo text-paper text-xl mb-3">Request Sent</h3>
            <p className="text-paper/50 text-sm leading-relaxed mb-8">
              Your collaboration request has been sent to <strong className="text-paper">{maker.nameLatin}</strong>.
              They'll receive a notification and can accept or decline from their dashboard.
            </p>
            <button
              onClick={onClose}
              className="font-archivo text-ink bg-volt hover:bg-volt-deep transition-colors px-6 py-3 text-sm uppercase tracking-widest"
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
