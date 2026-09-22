Add a real site footer, adapted from a component reference (Designali's footer) to fit this project. That reference used Next.js (`next/link`), the `dicons` icon package, an agency's own nav/social links, and had a bug (its `ThemeToogle` imported from its own file). None of that applies here — this is Vite, not Next.js, and this project doesn't use `dicons`. Everything below is already rewritten for this codebase: React Router-free navigation via the existing `navigate()` prop, `lucide-react` (already installed) for the two icons it has, and small inline SVGs for the three brand icons (Instagram/TikTok/YouTube) since lucide-react doesn't ship brand/logo glyphs.

**1. Create `/src/components/Footer.tsx`:**
```tsx
import { useEffect, useState } from 'react'
import { Mail, ArrowUp, Sun, Moon } from 'lucide-react'
import type { Navigate, Page } from '../App'
import Logo from './Logo'

interface FooterProps {
  navigate: Navigate
}

const columns: { title: string; items: { label: string; page: Page }[] }[] = [
  {
    title: 'Platform',
    items: [
      { label: 'Home', page: { name: 'home' } },
      { label: 'Feed', page: { name: 'feed' } },
      { label: 'Makers', page: { name: 'makers' } },
      { label: 'Creators', page: { name: 'creators' } },
    ],
  },
  {
    title: 'Work',
    items: [
      { label: 'Open Projects', page: { name: 'open-projects' } },
      { label: 'Events', page: { name: 'events' } },
      { label: 'Request an Invitation', page: { name: 'request-invite' } },
    ],
  },
]

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82c-.9-.8-1.46-1.96-1.46-3.24h-3.2v13.86a2.6 2.6 0 1 1-2.6-2.6c.24 0 .48.03.71.08V10.7a5.8 5.8 0 0 0-.71-.04A5.8 5.8 0 1 0 15 16.44V9.36a8.4 8.4 0 0 0 4.6 1.37V7.53a5.13 5.13 0 0 1-3-1.71Z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.3v5.4l5-2.7-5-2.7Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Placeholder handles — replace with the real ones.
const socials = [
  { label: 'Instagram', href: 'https://instagram.com/makers.intime', icon: InstagramIcon },
  { label: 'TikTok', href: 'https://tiktok.com/@makers.intime', icon: TikTokIcon },
  { label: 'YouTube', href: 'https://youtube.com/@makersintime', icon: YouTubeIcon },
]

const linkStyle = 'text-sm text-muted hover:text-paper transition-colors'
const iconBtnStyle =
  'flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted hover:text-orange hover:border-orange/50 hover:-translate-y-0.5 transition-all'

export default function Footer({ navigate }: FooterProps) {
  const [showTop, setShowTop] = useState(false)
  const [light, setLight] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark'
  }, [light])

  return (
    <footer className="border-t border-border" style={{ background: '#0D0A08' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="shrink-0">
          <Logo onClick={() => navigate({ name: 'home' })} />
        </div>
        <p className="font-inter text-sm text-muted leading-relaxed max-w-2xl">
          Makers is an invite-only registry for the people who actually make the work — directors, DOPs, editors,
          stylists, sound, motion. Verified credits, real collaborations, no cold outreach. Built in Amman, built for
          the region.
        </p>
      </div>

      <div className="border-t border-dashed border-border" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 grid grid-cols-2 md:flex md:flex-row gap-8 md:gap-16">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span className="font-inter text-xs uppercase tracking-widest text-muted" style={{ letterSpacing: '0.12em' }}>
              {col.title}
            </span>
            <ul className="flex flex-col gap-2">
              {col.items.map((item) => (
                <li key={item.label}>
                  <button onClick={() => navigate(item.page)} className={linkStyle}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-border" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 flex flex-wrap items-center justify-center gap-4">
        {socials.map((s) => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className={iconBtnStyle}>
            <s.icon className="w-4 h-4" />
          </a>
        ))}
        <a href="mailto:hello@makers.intime" aria-label="Email" className={iconBtnStyle}>
          <Mail size={16} strokeWidth={1.6} />
        </a>

        <div className="w-px h-6 bg-border mx-1" />

        <button onClick={() => setLight(false)} aria-label="Dark mode" aria-pressed={!light} className={iconBtnStyle}>
          <Moon size={16} strokeWidth={1.6} />
        </button>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className={`${iconBtnStyle} ${showTop ? '' : 'opacity-40 pointer-events-none'}`}
        >
          <ArrowUp size={16} strokeWidth={1.6} />
        </button>
        <button onClick={() => setLight(true)} aria-label="Light mode" aria-pressed={light} className={iconBtnStyle}>
          <Sun size={16} strokeWidth={1.6} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 pb-10 text-center">
        <p className="font-inter text-xs text-muted">
          © {new Date().getFullYear()} Makers, by intime. Invite-only registry.
        </p>
      </div>
    </footer>
  )
}
```

**2. In `/src/index.css`, add a light-mode override right after the existing `body { ... }` rule** (this makes the light/dark toggle in the footer actually do something, instead of being a fake button):
```css
/* Footer light/dark toggle — swaps the base surface, brand orange stays constant */
html[data-theme='light'] body {
  background-color: #F5F0EB;
  color: #0D0A08;
}
```
Note: this only swaps the base page surface. Most existing page components set colors via inline hex styles rather than the CSS variables, so this is a real but partial light mode — not a full re-theme of every component. That's a separate, bigger task if it's wanted later.

**3. Wire it into `App.tsx`:**
- Import: `import Footer from './components/Footer'`
- **Critical:** the footer must render *inside* the same wrapper that gets the `main-content` class (the one with `margin-left: 164px` on desktop, to clear the fixed sidebar) — not as a sibling after it. If it's rendered outside that wrapper, its content will visually sit underneath the sidebar and get clipped. Restructure the main content block like this:
```tsx
<div className={`main-content min-h-screen flex flex-col ${page.name === 'home' ? 'pb-24 lg:pb-0' : ''}`}>
  <div className="flex-1">
    {/* ...all the existing page.name === '...' && <Page .../> conditionals stay exactly as they are... */}
  </div>
  <Footer navigate={navigate} />
</div>
```

**4. Remove the old inline footer in `Landing.tsx`** (the `<footer className="border-t px-8 py-8">...MAKERS · FILMMAKERS · CREATORS...</footer>` block near the end of the file, right before the closing `</div></div>` of the component). It's superseded by the new global footer, and leaving it in creates two stacked footers on the Home page. Its nav buttons (`Makers`/`Creators`/`Events`/`Privacy`) also had no `onClick` handlers — dead buttons — so removing it also fixes that.

**Result to verify:** one footer, visible on every page, sitting flush with the rest of the page content (not clipped by or hidden under the sidebar) — logo, brand blurb, two real nav columns that route with `navigate()`, four social icons, a working scroll-to-top (only enabled after scrolling down), and a light/dark toggle that visibly changes the page background. Confirm zero new TypeScript errors and that the Home page shows only one footer, not two.
