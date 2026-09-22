import type { Navigate } from '../App'

interface AboutProps {
  navigate: Navigate
}

const SERVICES = [
  {
    num: '01',
    name: 'Influencer Campaigns',
    desc: "End-to-end influencer campaign management — from creator selection and brief development to delivery, reporting, and rights clearance. We've run campaigns across Jordan, Saudi Arabia, Egypt, and the UAE.",
  },
  {
    num: '02',
    name: 'Talent Management',
    desc: 'Representation and career development for select content creators and on-screen talent. Brand partnerships, contract negotiation, and long-term strategy.',
  },
  {
    num: '03',
    name: 'Content Production',
    desc: 'Full-service branded content production — scripting, crew, shoot, post-production, and delivery — for brands who need more than a brief passed to a creator.',
  },
]

export default function About({ navigate }: AboutProps) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-divider" style={{ backgroundColor: '#0a0f05' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-20">
          <span
            className="inline-block font-inter text-ink bg-volt text-xs uppercase px-3 py-1.5 mb-8"
            style={{ borderRadius: 100, letterSpacing: '0.14em', fontWeight: 700 }}
          >
            About intime
          </span>
          <h1
            className="font-archivo text-paper mb-8"
            style={{ fontSize: 'clamp(32px, 5.5vw, 60px)', letterSpacing: '-0.025em', lineHeight: 1.08 }}
          >
            The Agency<br />Behind the Platform
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <p className="font-inter text-paper/55 leading-relaxed" style={{ fontSize: 15 }}>
              intime is a creative media and talent agency based in Amman, Jordan. We work with brands,
              broadcasters, and emerging creators across the Arab world — building campaigns, managing talent,
              and producing content that reflects the region authentically.
            </p>
            <p className="font-inter text-paper/55 leading-relaxed" style={{ fontSize: 15 }}>
              <strong className="text-paper font-semibold">Makers</strong> is our platform — built to give
              the production community a dedicated, trusted space to find each other and collaborate.
              It is intentionally open to all verified professionals, independent of agency affiliation.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-5xl mx-auto px-6 lg:px-12 py-20">
        <div className="mb-12">
          <p className="font-inter text-paper/25 text-xs uppercase tracking-widest mb-3" style={{ letterSpacing: '0.16em', fontWeight: 600 }}>
            Supporting Services
          </p>
          <h2 className="font-archivo text-paper" style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', letterSpacing: '-0.02em' }}>
            What intime Does
          </h2>
        </div>
        <div className="divide-y divide-divider">
          {SERVICES.map((service) => (
            <div key={service.name} className="py-10 flex flex-col md:flex-row gap-6 md:gap-10 group">
              <span className="font-archivo text-volt/35 text-sm w-10 flex-shrink-0 pt-1 group-hover:text-volt transition-colors">
                {service.num}
              </span>
              <div className="flex-1">
                <h3 className="font-archivo text-paper text-xl mb-3 group-hover:text-volt transition-colors">
                  {service.name}
                </h3>
                <p className="font-inter text-paper/50 text-sm leading-relaxed max-w-xl">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 lg:px-12 pb-20">
        <div
          className="border border-volt/20 p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
          style={{ borderRadius: 24, background: '#0f1608' }}
        >
          <div>
            <p className="font-archivo text-paper text-2xl mb-2 leading-tight">Ready to Find Your Crew?</p>
            <p className="font-inter text-paper/40 text-sm">Makers is where the work happens.</p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <button
              onClick={() => navigate({ name: 'browse' })}
              className="font-archivo text-ink bg-volt hover:bg-volt-deep active:scale-95 transition-all px-7 py-3.5 text-xs uppercase tracking-widest"
              style={{ borderRadius: 10, letterSpacing: '0.1em' }}
            >
              Browse Makers
            </button>
            <button
              onClick={() => navigate({ name: 'request-invite' })}
              className="font-archivo text-volt border border-volt/30 hover:border-volt/60 active:scale-95 transition-all px-7 py-3.5 text-xs uppercase tracking-widest"
              style={{ borderRadius: 10, background: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}
            >
              Get Invited
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
