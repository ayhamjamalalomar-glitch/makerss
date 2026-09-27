import { motion } from 'framer-motion'
import Link, { useRouter } from '../lib/router'
import { useAuth } from '../lib/auth'
import { t } from '../lib/i18n'
import { useUnreadMessages } from '../lib/messages'

const Icon = {
  home: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a.5.5 0 01-.5.5h-4V10H6.5v4.5h-4A.5.5 0 012 14V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>,
  projects: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><rect x="5" y="4" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" /></svg>,
  makers: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="M1 13c0-2.49 2.01-4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="M8.5 13c0-2.49 2.01-4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  calls: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M6 8h4M8 6v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  messages: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 01-11.6 7.1L4 20l1-4A8 8 0 1120 12z" /></svg>,
}

export default function BottomNav() {
  const { path } = useRouter()
  const { profile } = useAuth()
  const approved = profile?.status === 'approved'
  const unread = useUnreadMessages(approved ? profile?.id : undefined)
  const first = path.split('/')[1] || ''

  const items: { key: keyof typeof Icon; to: string; label: string; active: boolean; badge?: number }[] = [
    { key: 'home', to: '/', label: t('الرئيسية', 'Home'), active: first === '' },
    { key: 'projects', to: '/projects', label: t('مشاريع', 'Projects'), active: first === 'projects' },
    { key: 'makers', to: '/makers', label: t('صنّاع', 'Makers'), active: first === 'makers' || (!!first && !['projects', 'opportunities', 'messages', 'inbox', 'me', 'admin'].includes(first)) },
    { key: 'calls', to: '/opportunities', label: t('فرص', 'Open Calls'), active: first === 'opportunities' },
  ]
  if (approved) items.push({ key: 'messages', to: '/messages', label: t('الرسائل', 'Messages'), active: first === 'messages', badge: unread })

  return (
    <div className="fixed bottom-5 inset-x-0 z-50 flex justify-center pointer-events-none px-3">
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="pointer-events-auto flex items-center gap-1 px-2"
        style={{ height: 56, borderRadius: 999, background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4)' }}
      >
        {items.map((item) => (
          <Link key={item.key} to={item.to} aria-label={item.label} className="relative flex items-center justify-center" style={{ height: 40, minWidth: 44, borderRadius: 999, padding: '0 12px' }}>
            {item.active && (
              <motion.div layoutId="active-pill" className="absolute inset-0 rounded-full" style={{ background: '#E85D04' }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
            )}
            <span className="relative z-10 flex items-center justify-center flex-shrink-0" style={{ color: item.active ? '#fff' : 'var(--c-muted)' }}>{Icon[item.key]}</span>
            <motion.span
              initial={false}
              animate={{ width: item.active ? 'auto' : 0, opacity: item.active ? 1 : 0, marginInlineStart: item.active ? 7 : 0 }}
              transition={{ width: { type: 'spring', stiffness: 350, damping: 32 }, opacity: { duration: 0.15, delay: item.active ? 0.06 : 0 } }}
              className="relative z-10 font-semibold whitespace-nowrap overflow-hidden"
              style={{ fontSize: 13, color: '#fff' }}
            >
              {item.label}
            </motion.span>
            {!!item.badge && (
              <span className="absolute z-20 -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: '#E85D04', border: '2px solid var(--c-surface)' }}>{item.badge > 9 ? '9+' : item.badge}</span>
            )}
          </Link>
        ))}
      </motion.nav>
    </div>
  )
}
