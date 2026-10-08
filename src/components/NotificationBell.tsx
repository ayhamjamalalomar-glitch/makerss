import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from '../lib/router'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'
import { relativeAr } from '../lib/constants'

// The bell: everything that happened to you on Makers (messages, collaboration, credits,
// reviews, and for the team the review queue). Rows come from public.notifications.

interface Note { id: number; kind: string; payload: Record<string, unknown>; read_at: string | null; created_at: string }

const s = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

function describe(n: Note): { text: string; to: string; icon: string } {
  const p = n.payload || {}
  switch (n.kind) {
    case 'message': {
      const c = Number(p.count) || 1
      return { text: c > 1 ? t(`${c} رسائل جديدة من ${s(p.from)}`, `${c} new messages from ${s(p.from)}`) : t(`${s(p.from)}: ${s(p.body)}`, `${s(p.from)}: ${s(p.body)}`), to: `/messages?c=${s(p.conversation_id)}`, icon: 'msg' }
    }
    case 'collab_request': return { text: t(`طلب تعاون جديد من ${s(p.sender)}`, `New collaboration request from ${s(p.sender)}`), to: '/messages?tab=collab', icon: 'collab' }
    case 'collab_accepted': return { text: t(`${s(p.member)} قبل طلب التعاون`, `${s(p.member)} accepted your request`), to: '/messages', icon: 'ok' }
    case 'collab_declined': return { text: t(`${s(p.member)} اعتذر عن طلب التعاون هذه المرة`, `${s(p.member)} could not take your request this time`), to: '/makers', icon: 'collab' }
    case 'credit_added': return { text: t(`${s(p.by)} أضافك إلى «${s(p.title)}»${p.role ? ` بدور ${s(p.role)}` : ''}`, `${s(p.by)} credited you on "${s(p.title)}"${p.role ? ` as ${s(p.role)}` : ''}`), to: p.slug ? `/${s(p.slug)}` : `/projects/${s(p.work_id)}`, icon: 'credit' }
    case 'call_application': return { text: t(`${s(p.applicant)} قدّم على «${s(p.title)}»`, `${s(p.applicant)} applied to "${s(p.title)}"`), to: '/inbox?tab=calls', icon: 'collab' }
    case 'review_approved': return { text: t('صفحتك منشورة الآن في الدليل', 'Your page is now live in the directory'), to: p.username ? `/${s(p.username)}` : '/me', icon: 'ok' }
    case 'review_rejected': return { text: t('صفحتك تحتاج بعض التعديلات قبل النشر', 'Your page needs a few changes before it goes live'), to: '/me/status', icon: 'warn' }
    case 'call_approved': return { text: t(`فرصتك «${s(p.title)}» منشورة`, `Your open call "${s(p.title)}" is live`), to: `/opportunities/${s(p.call_id)}`, icon: 'ok' }
    case 'call_rejected': return { text: t(`فرصتك «${s(p.title)}» لم تُنشر`, `Your open call "${s(p.title)}" was not published`), to: '/opportunities', icon: 'warn' }
    case 'writing_approved': return { text: t(`كتابتك «${s(p.title)}» منشورة`, `Your writing "${s(p.title)}" is live`), to: `/writing/${s(p.id)}`, icon: 'ok' }
    case 'writing_rejected': return { text: t(`كتابتك «${s(p.title)}» تحتاج تعديلاً`, `Your writing "${s(p.title)}" needs changes`), to: `/writing/${s(p.id)}`, icon: 'warn' }
    case 'writer_trusted': return { text: t('مبارك، كتاباتك تُنشر الآن مباشرة بدون مراجعة. نثق بالتزامك بسياسات Makers وأخلاقيات المهنة.', 'Congratulations, you now publish without review. Keep to the Makers policies and the ethics of the craft.'), to: '/writing/new', icon: 'star' }
    case 'admin_review_needed': return { text: t(`صفحة ${s(p.name)} بانتظار المراجعة`, `${s(p.name)}'s page is waiting for review`), to: '/admin', icon: 'team' }
    case 'admin_call_needed': return { text: t(`فرصة «${s(p.title)}» بانتظار المراجعة`, `Open call "${s(p.title)}" is waiting for review`), to: '/admin', icon: 'team' }
    case 'admin_writing_needed': return { text: t(`كتابة «${s(p.title)}» من ${s(p.owner)} بانتظار المراجعة`, `"${s(p.title)}" by ${s(p.owner)} is waiting for review`), to: '/admin?tab=writings', icon: 'team' }
    case 'admin_report': return { text: t(`بلاغ جديد من ${s(p.by)}`, `New report from ${s(p.by)}`), to: '/admin', icon: 'warn' }
  }
  return { text: t('تحديث جديد', 'New update'), to: '/', icon: 'team' }
}

const ICON: Record<string, string> = {
  msg: 'M3.5 5.5h13v8h-7l-4 3v-3h-2z',
  collab: 'M7 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM2.5 16c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5M13.5 9.5a2 2 0 100-4 2 2 0 000 4zM13 11.5c2.2 0 4 1.8 4 4',
  ok: 'M4.5 10.5l3.5 3.5 7.5-8',
  warn: 'M10 3.5l7 12.5H3zM10 8.5v3.5M10 14.2v.3',
  credit: 'M5 3.5h10v13H5zM7.5 7h5M7.5 10h5M7.5 13h3',
  star: 'M10 3l2.1 4.4 4.9.6-3.6 3.3 1 4.8L10 13.7 5.6 16.1l1-4.8L3 8l4.9-.6z',
  team: 'M10 3.5l6 2.5v4c0 3.5-2.6 5.8-6 6.5-3.4-.7-6-3-6-6.5V6z',
}

export default function NotificationBell({ userId, clear }: { userId: string; clear?: boolean }) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [list, setList] = useState<Note[] | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const openRef = useRef(false)
  openRef.current = open

  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc('unread_notifications_count')
    setCount(typeof data === 'number' ? data : 0)
  }, [])

  const load = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('id, kind, payload, read_at, created_at').order('created_at', { ascending: false }).limit(40)
    setList((data as Note[]) || [])
  }, [])

  useEffect(() => {
    refresh()
    const ch = supabase
      .channel(`notes-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => { refresh(); if (openRef.current) load() })
      .subscribe()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(refresh, 90_000)
    return () => { supabase.removeChannel(ch); window.removeEventListener('focus', onFocus); window.clearInterval(timer) }
  }, [userId, refresh, load])

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const toggle = async () => {
    if (open) return setOpen(false)
    setOpen(true)
    await load()
    if (count > 0) {
      await supabase.rpc('mark_notifications_read', { p_ids: null })
      setCount(0)
    }
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-label={t('الإشعارات', 'Notifications')}
        aria-expanded={open}
        className="relative flex items-center justify-center rounded-full cursor-pointer"
        style={{ width: 38, height: 38, background: clear ? 'rgba(243,239,231,0.08)' : 'var(--c-surface-alt)', border: `1px solid ${clear ? 'rgba(243,239,231,0.18)' : 'var(--c-border-mid)'}`, color: clear ? '#F3EFE7' : 'var(--c-text)' }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.8a5 5 0 00-5 5v3.1L3.6 14h12.8L15 10.9V7.8a5 5 0 00-5-5zM8 16.2a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {count > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-bold flex items-center justify-center" style={{ background: 'var(--c-rec)', color: '#fff', boxShadow: '0 0 0 2px var(--c-bg)' }}>{count > 99 ? '99+' : count}</span>
        )}
      </button>
      <AnimatePresence>
        {open && <Panel list={list} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}

function Panel({ list, onClose }: { list: Note[] | null; onClose: () => void }) {
  useEscape(onClose)
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-[68px] sm:top-auto sm:end-0 sm:mt-2 sm:w-[380px] rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: '0 20px 50px var(--c-shadow)', zIndex: 100, maxHeight: 'min(560px, calc(100vh - 90px))' }}
      role="dialog"
      aria-label={t('الإشعارات', 'Notifications')}
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <span className="font-display font-bold text-[15px]">{t('الإشعارات', 'Notifications')}</span>
        <button type="button" onClick={onClose} aria-label={t('إغلاق', 'Close')} className="w-7 h-7 rounded-full cursor-pointer text-sm" style={{ background: 'var(--c-surface-alt)', border: 'none', color: 'var(--c-muted)' }}>×</button>
      </div>
      <div className="overflow-y-auto flex-1">
        {list === null ? (
          <div className="p-6 text-sm text-center" style={{ color: 'var(--c-muted)' }}>{t('جارٍ التحميل…', 'Loading…')}</div>
        ) : list.length === 0 ? (
          <div className="p-8 flex flex-col items-center gap-2 text-center">
            <span className="font-semibold text-sm">{t('لا توجد إشعارات بعد', 'No notifications yet')}</span>
            <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{t('هنا تصلك الرسائل وطلبات التعاون وكل جديد على أعمالك.', 'Messages, collaboration requests and news about your work land here.')}</span>
          </div>
        ) : (
          list.map((n) => {
            const d = describe(n)
            return (
              <Link key={n.id} to={d.to} onClick={onClose} className="flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]" style={{ borderBottom: '1px solid var(--c-border)', background: n.read_at ? 'transparent' : 'rgba(var(--c-accent-rgb),0.06)' }}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--c-surface-alt)', color: d.icon === 'warn' ? '#F87171' : d.icon === 'ok' ? 'var(--c-live)' : 'var(--c-accent)' }}>
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d={ICON[d.icon] || ICON.team} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span dir="auto" className="text-[13px] leading-relaxed" style={{ color: 'var(--c-text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.text}</span>
                  <span className="text-[11px]" style={{ color: 'var(--c-muted)' }}>{relativeAr(n.created_at)}</span>
                </span>
                {!n.read_at && <span className="w-2 h-2 rounded-full shrink-0 mt-2 ms-auto" style={{ background: 'var(--c-accent)' }} />}
              </Link>
            )
          })
        )}
      </div>
    </motion.div>
  )
}

function useEscape(onClose: () => void) {
  const fn = useRef(onClose)
  fn.current = onClose
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') fn.current() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])
}
