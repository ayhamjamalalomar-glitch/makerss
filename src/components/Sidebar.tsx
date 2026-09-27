import { motion } from 'framer-motion'
import type { Page, Navigate } from '../App'
import { useLang } from '../LangContext'

interface NavBarProps {
  page: Page
  navigate: Navigate
}

const NAV_LABELS: Record<string, { ar: string; en: string }> = {
  home: { ar: 'الرئيسية', en: 'Home' },
  titles: { ar: 'مشاريع', en: 'Projects' },
  makers: { ar: 'صنّاع', en: 'Makers' },
  'open-projects': { ar: 'فرص', en: 'Open Calls' },
}

const NAV_ITEMS: { labelKey: string; page: Page['name']; icon: React.ReactNode }[] = [
  {
    labelKey: 'home',
    page: 'home',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path d="M2 6.5L8 2l6 4.5V14a.5.5 0 01-.5.5h-4V10H6.5v4.5h-4A.5.5 0 012 14V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    labelKey: 'titles',
    page: 'titles',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="1" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="5" y="4" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    labelKey: 'makers',
    page: 'makers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1 13c0-2.49 2.01-4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8.5 13c0-2.49 2.01-4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    labelKey: 'open-projects',
    page: 'open-projects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M6 8h4M8 6v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Sidebar({ page, navigate }: NavBarProps) {
  const activePage = page.name
  const lang = useLang()

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="fixed bottom-5 left-1/2 z-50 flex items-center gap-1 px-2"
      style={{
        transform: 'translateX(-50%)',
        height: 56,
        borderRadius: 999,
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const label = NAV_LABELS[item.labelKey]?.[lang] ?? item.labelKey
        const isActive =
          activePage === item.page ||
          ((activePage === 'maker' || activePage === 'creators') && item.page === 'makers')

        return (
          <motion.button
            key={item.labelKey}
            onClick={() => navigate({ name: item.page } as Page)}
            whileTap={{ scale: 0.94 }}
            className="relative flex items-center justify-center"
            style={{
              height: 40,
              minWidth: 44,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              padding: '0 12px',
            }}
            aria-label={label}
          >
            {/* Active pill background */}
            {isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: '#E85D04', borderRadius: 999 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            {/* Icon */}
            <span
              className="relative z-10 flex items-center justify-center flex-shrink-0"
              style={{ color: isActive ? 'var(--c-text)' : 'var(--c-muted-2)' }}
            >
              {item.icon}
            </span>

            {/* Animated label */}
            <motion.span
              initial={false}
              animate={{
                width: isActive ? 'auto' : 0,
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? 7 : 0,
                paddingRight: isActive ? 2 : 0,
              }}
              transition={{
                width: { type: 'spring', stiffness: 350, damping: 32 },
                opacity: { duration: 0.15, delay: isActive ? 0.06 : 0 },
                marginLeft: { type: 'spring', stiffness: 350, damping: 32 },
              }}
              className="relative z-10 font-arabic font-semibold whitespace-nowrap overflow-hidden"
              style={{ fontSize: 13, color: 'var(--c-text)', direction: 'rtl' }}
            >
              {label}
            </motion.span>
          </motion.button>
        )
      })}
    </motion.nav>
  )
}
