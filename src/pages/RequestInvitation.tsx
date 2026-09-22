import { useState } from 'react'
import type { Navigate } from '../App'

interface RequestInvitationProps {
  navigate: Navigate
}

const SPECIALTIES = ['Director', 'Photographer/DOP', 'Video Editor', 'Motion Graphics Designer', 'Sound Engineer', 'Makeup Artist', 'Stylist/Fashion Manager', 'Social Media Manager', 'Paid Ads Manager', 'Scriptwriter', 'Set Designer', 'Production Manager', 'Other']
const CITIES = ['Amman', 'Cairo', 'Beirut', 'Dubai', 'Riyadh', 'Baghdad', 'Damascus', 'Ramallah', 'Other']

export default function RequestInvitation({ navigate }: RequestInvitationProps) {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', specialty: '', city: '', portfolio: '', referrer: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.specialty || !form.city) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: '#E85D04' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M8 18l7 7L28 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-inter font-bold text-paper text-2xl mb-3">Application Received</h1>
          <p className="font-inter text-muted text-base leading-relaxed mb-8">
            Your invitation request is in. The Makers community reviews applications and you'll hear back within 7–14 days.
          </p>
          <button
            onClick={() => navigate({ name: 'home' })}
            className="font-inter font-semibold text-paper px-10 py-3.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
            style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 14 }}
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-8 py-12 max-w-xl">
      <div className="mb-10">
        <span
          className="inline-flex items-center gap-2 font-inter font-bold text-paper text-xs px-3 py-1.5 rounded-full mb-6"
          style={{ background: '#E85D04', letterSpacing: '0.1em' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
          INVITE ONLY
        </span>
        <h1 className="font-inter font-bold text-paper mb-3" style={{ fontSize: 'clamp(24px, 4vw, 38px)', letterSpacing: '-0.02em' }}>
          Request an Invitation
        </h1>
        <p className="font-inter text-muted text-sm leading-relaxed">
          Makers is a verified, invite-only platform. Tell us about yourself — a verified Maker will review your application.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {[
          { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name', required: true },
          { label: 'Portfolio Link', key: 'portfolio', type: 'url', placeholder: 'https://', required: false },
          { label: 'Referred By', key: 'referrer', type: 'text', placeholder: 'Name of the Maker who referred you', required: false },
        ].map((field) => (
          <label key={field.key} className="flex flex-col gap-2">
            <span className="font-inter text-muted text-xs uppercase tracking-widest" style={{ letterSpacing: '0.12em', fontWeight: 600 }}>
              {field.label}{field.required && <span style={{ color: '#E85D04' }}> *</span>}
            </span>
            <input
              type={field.type}
              value={form[field.key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
              className="px-5 py-4 rounded-xl font-inter text-sm w-full"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 14 }}
            />
          </label>
        ))}

        {[
          { label: 'Primary Specialty', key: 'specialty', options: SPECIALTIES, required: true },
          { label: 'City', key: 'city', options: CITIES, required: true },
        ].map((field) => (
          <label key={field.key} className="flex flex-col gap-2">
            <span className="font-inter text-muted text-xs uppercase tracking-widest" style={{ letterSpacing: '0.12em', fontWeight: 600 }}>
              {field.label}<span style={{ color: '#E85D04' }}> *</span>
            </span>
            <div className="relative">
              <select
                value={form[field.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                required={field.required}
                className="w-full px-5 py-4 rounded-xl font-inter text-sm appearance-none"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: form[field.key as keyof typeof form] ? 'var(--c-text)' : 'var(--c-muted-2)', fontSize: 14 }}
              >
                <option value="" disabled>Select {field.label.toLowerCase()}</option>
                {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--c-muted-2)' }}>
                <path d="M3.5 5.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </label>
        ))}

        <p className="font-inter text-muted text-xs leading-relaxed">
          No referrer? You can still apply. Applications without referrers take slightly longer to review.
        </p>

        <button
          type="submit"
          className="font-inter font-bold text-paper py-4 rounded-full hover:opacity-90 active:scale-[0.98] transition-all mt-2"
          style={{ background: '#E85D04', border: 'none', cursor: 'pointer', fontSize: 14 }}
        >
          Submit Application →
        </button>
      </form>
    </div>
  )
}
