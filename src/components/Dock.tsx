import type { ReactNode } from 'react'
import Link, { useRouter } from '../lib/router'
import { useAuth } from '../lib/auth'
import { computeProgress, useMyCounts } from '../lib/progress'
import { Avatar, Ring } from './mk'

const LogoMark = ({ size = 24 }: { size?: number }) => (
  <span className="flex items-center justify-center text-white font-bold" style={{ width: size, height: size, borderRadius: size * 0.3, background: '#FF4500', fontSize: size * 0.54 }}>M</span>
)

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
)
const InboxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 13l2.5-7h11L20 13" /><path d="M4 13v5h16v-5h-5l-1 2h-4l-1-2z" /></svg>
)
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
)
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
)

function Badge({ n }: { n: number }) {
  if (!n) return null
  return (
    <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold text-white flex items-center justify-center" style={{ background: '#2563EB' }}>{n}</span>
  )
}

export default function Dock() {
  const { session, profile } = useAuth()
  const { path } = useRouter()
  const counts = useMyCounts(session?.user.id)
  const progress = computeProgress(profile, counts.works)
  const signedIn = !!session

  const meTip = !signedIn
    ? 'تسجيل الدخول'
    : profile?.status === 'approved'
      ? 'صفحتي'
      : progress.count === 5
        ? 'صفحتك جاهزة للإرسال'
        : `${progress.count} من 5 · أكمل صفحتك`

  const items: { to: string; label: string; icon: ReactNode; key: string; badge?: number; show: boolean }[] = [
    { to: '/', label: 'الدليل', icon: <LogoMark />, key: 'dir', show: true },
    { to: signedIn ? '/me#add' : '/join', label: signedIn ? 'أضف عملاً' : 'انضم', icon: <PlusIcon />, key: 'add', show: true },
    { to: '/inbox', label: 'الطلبات', icon: <InboxIcon />, key: 'inbox', badge: counts.newRequests, show: signedIn && profile?.status === 'approved' },
    { to: '/admin', label: 'الإدارة', icon: <ShieldIcon />, key: 'admin', show: signedIn && (profile?.role === 'admin' || profile?.role === 'reviewer') },
  ]

  const me = signedIn ? (
    <Ring value={profile?.status === 'approved' ? 1 : progress.ratio} size={52} stroke={3}>
      <Avatar url={profile?.avatar_url} name={profile?.full_name} size={40} />
    </Ring>
  ) : (
    <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#F3F3F2' }}><UserIcon /></span>
  )
  const meTo = !signedIn ? '/login' : profile?.status === 'approved' ? `/${profile?.username || 'me'}` : '/me'
  const active = (key: string) =>
    (key === 'dir' && path === '/') || (key === 'inbox' && path.startsWith('/inbox')) || (key === 'add' && path.startsWith('/me')) || (key === 'admin' && path.startsWith('/admin'))

  return (
    <>
      {/* desktop: floating vertical pill */}
      <nav aria-label="التنقل" className="hidden md:flex fixed top-6 right-6 z-40 flex-col items-center gap-3.5 p-3 bg-white" style={{ width: 72, borderRadius: 36, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        {items.filter((i) => i.show).map((i) => (
          <Link key={i.key} to={i.to} aria-label={i.label} className="dk w-12 h-12 rounded-full items-center justify-center" style={{ background: active(i.key) ? '#E9E9E7' : '#F3F3F2', color: '#111' }}>
            {i.icon}
            <Badge n={i.badge || 0} />
            <span className="tip">{i.label}</span>
          </Link>
        ))}
        <Link to={meTo} aria-label={meTip} className="dk items-center justify-center">
          {me}
          <span className="tip">{meTip}</span>
        </Link>
      </nav>

      {/* mobile: bottom capsule with labels */}
      <nav aria-label="التنقل" className="md:hidden fixed bottom-4 right-4 left-4 z-40 h-[72px] px-2 bg-white flex items-center justify-around" style={{ borderRadius: 36, boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}>
        {items.filter((i) => i.show).map((i) => (
          <Link key={i.key} to={i.to} className="relative flex flex-col items-center gap-0.5 w-16" style={{ color: active(i.key) ? '#111' : '#5C5C59' }}>
            <span className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F3F3F2' }}>
              {i.key === 'dir' ? <LogoMark size={20} /> : i.icon}
              <Badge n={i.badge || 0} />
            </span>
            <span className="text-[10px]" style={{ fontWeight: active(i.key) ? 600 : 500 }}>{i.label}</span>
          </Link>
        ))}
        <Link to={meTo} className="flex flex-col items-center gap-0.5 w-16" style={{ color: '#5C5C59' }}>
          {signedIn ? (
            <Ring value={profile?.status === 'approved' ? 1 : progress.ratio} size={38} stroke={2.5}>
              <Avatar url={profile?.avatar_url} name={profile?.full_name} size={30} />
            </Ring>
          ) : (
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F3F3F2' }}><UserIcon /></span>
          )}
          <span className="text-[10px] font-medium">{signedIn ? 'صفحتي' : 'دخول'}</span>
        </Link>
      </nav>
    </>
  )
}

export { LogoMark }
