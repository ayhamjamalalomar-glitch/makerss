import { useEffect, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { label, t, useLang } from '../lib/i18n'
import { COUNTRIES, SITE_URL, budgetLabel, cityLabel, formatDateAr, listSep, relativeAr } from '../lib/constants'
import { useSpecialties, specName } from '../lib/specialties'
import { CALL_COLORS, CALL_SELECT, displayName, kindLabel, listOpenCalls, type OpenCall } from '../lib/data'
import { Avatar, Btn, Notice, Pill, Spinner, TextArea, useDialog } from '../components/mk'
import ReportButton from '../components/ReportButton'
import { motion } from 'framer-motion'
import { shareLink } from '../lib/share'
import { useToast } from '../lib/toast'

const box = { background: 'var(--c-surface)', border: '1px solid var(--c-border)' } as const

function placeOf(c: OpenCall) {
  if (c.remote) return t('عن بُعد', 'Remote')
  return [cityLabel(c.city), label(COUNTRIES, c.country)].filter(Boolean).join(listSep())
}

function CallDetail({ id, onClose, applied, onApplied }: { id: string; onClose: () => void; applied: boolean; onApplied: () => void }) {
  const specialties = useSpecialties()
  const { profile } = useAuth()
  const [c, setC] = useState<OpenCall | null | undefined>(undefined)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  useDialog(onClose)

  useEffect(() => {
    supabase.from('open_calls').select(CALL_SELECT).eq('id', id).maybeSingle().then(({ data }) => setC((data as unknown as OpenCall) || null))
  }, [id])

  const apply = async () => {
    setError(null)
    setBusy(true)
    const { error } = await supabase.rpc('apply_open_call', { p_id: id, p_message: msg })
    setBusy(false)
    if (error) return setError(error.message.includes('closed') ? t('هذه الفرصة أُغلقت.', 'This opportunity is closed.') : t('تعذّر إرسال طلبك. حاول مرة أخرى.', 'Could not send your application. Try again.'))
    onApplied()
    toast(t('وصل طلبك إلى صاحب الفرصة', 'Your application was sent'))
  }
  const close = async () => {
    setBusy(true)
    await supabase.rpc('close_open_call', { p_id: id })
    setBusy(false)
    onClose()
  }

  const color = c ? CALL_COLORS[c.kind || 'other'] || 'var(--c-accent)' : 'var(--c-accent)'
  const isOwner = !!c && profile?.id === c.owner_id

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ ...box, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {c === undefined ? <Spinner /> : c === null ? (
          <div className="p-8 flex flex-col gap-4"><span className="font-bold text-lg">{t('الفرصة غير متاحة', 'Opportunity not available')}</span><Btn variant="outline" onClick={onClose}>{t('إغلاق', 'Close')}</Btn></div>
        ) : (
          <>
            <div style={{ height: 4, background: color }} />
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-5 gap-3">
                <div className="flex items-center gap-3">
                  <Avatar url={c.owner?.avatar_url} name={c.owner?.full_name} size={48} rounded={12} />
                  <div>
                    {c.kind && <span className="font-bold text-white px-2 py-0.5 rounded-md inline-block mb-1" style={{ background: color, fontSize: 10 }}>{kindLabel(c.kind)}</span>}
                    <p className="text-sm m-0" style={{ color: 'var(--c-muted)' }}>{c.org || displayName(c.owner)}</p>
                  </div>
                </div>
                <button onClick={onClose} aria-label={t('إغلاق', 'Close')} className="cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--c-muted)' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </button>
              </div>

              {c.status !== 'open' && (
                <div className="mb-4"><Pill tone={c.status === 'pending' ? 'amber' : c.status === 'rejected' ? 'red' : 'neutral'}>
                  {c.status === 'pending' ? t('بانتظار مراجعة الفريق', 'Waiting for team review') : c.status === 'rejected' ? t('لم تُقبل للنشر', 'Not approved') : t('مغلقة', 'Closed')}
                </Pill></div>
              )}
              {c.status === 'rejected' && c.review_note && isOwner && <div className="mb-4"><Notice tone="error">{c.review_note}</Notice></div>}

              <h2 className="font-black mb-2 mt-0" style={{ fontSize: 22 }}>{c.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-5 text-sm" style={{ color: 'var(--c-muted)' }}>
                {placeOf(c) && <span>📍 {placeOf(c)}</span>}
                {c.deadline && <span>⏰ {t('آخر موعد:', 'Deadline:')} {formatDateAr(c.deadline)}</span>}
                <span className="font-bold" style={{ color: 'var(--c-accent)' }}>{c.budget ? budgetLabel(c.budget) : t('الميزانية حسب الاتفاق', 'Budget open to discuss')}</span>
              </div>

              <p dir="auto" className="leading-relaxed mb-6 mt-0 whitespace-pre-line" style={{ fontSize: 14, color: 'var(--c-text-2)' }}>{c.description}</p>

              {c.role_ids.length > 0 && (
                <div className="mb-6">
                  <p className="font-semibold mb-2 mt-0 text-sm">{t('الأدوار المطلوبة', 'Roles needed')}</p>
                  <div className="flex flex-wrap gap-2">
                    {c.role_ids.map((r) => <span key={r} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: 'rgba(var(--c-accent-rgb),0.15)', color: 'var(--c-accent)', border: '1px solid rgba(var(--c-accent-rgb),0.3)' }}>{specName(specialties, r)}</span>)}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-5">
                <button type="button" onClick={async () => {
                  const r = await shareLink(`${SITE_URL}/opportunities/${c.id}`, c.title)
                  if (r === 'copied') toast(t('تم نسخ الرابط', 'Link copied'))
                }} className="inline-flex items-center gap-1.5 text-xs cursor-pointer" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--c-muted)' }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 10V2M5 5l3-3 3 3M3 9v4a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {t('شارك الفرصة', 'Share')}
                </button>
                {!isOwner && c.status === 'open' && <ReportButton type="call" id={c.id} />}
              </div>

              {c.owner && (
                <Link to={`/${c.owner.username}`} className="flex items-center gap-3 p-3 rounded-xl mb-6" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)' }}>
                  <Avatar url={c.owner.avatar_url} name={c.owner.full_name} size={36} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold">{displayName(c.owner)}</span>
                    <span className="block text-xs" style={{ color: 'var(--c-muted)' }}>{t('نشر الفرصة', 'Posted this')} · {relativeAr(c.created_at)}</span>
                  </span>
                </Link>
              )}

              {isOwner ? (
                <div className="flex flex-col gap-3">
                  <Notice>{t(`وصلك ${c.applicants_count} طلب. تجدهم في صندوق الوارد.`, `You have ${c.applicants_count} application${c.applicants_count === 1 ? '' : 's'}. Find them in your inbox.`)}</Notice>
                  <div className="flex gap-2">
                    <Link to="/inbox?tab=calls" className="flex-1 text-center font-bold py-3.5 rounded-xl" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>{t('افتح الطلبات', 'Open applications')}</Link>
                    {(c.status === 'open' || c.status === 'pending') && <Btn variant="outline" disabled={busy} onClick={close}>{t('أغلق الفرصة', 'Close it')}</Btn>}
                  </div>
                </div>
              ) : c.status !== 'open' ? null : applied ? (
                <div className="w-full text-center font-bold py-4 rounded-xl" style={{ border: '2px solid var(--c-accent)', color: 'var(--c-accent)' }}>✓ {t('قدّمت على هذه الفرصة', 'You applied')}</div>
              ) : !profile ? (
                <div className="flex flex-col gap-2">
                  <Link to="/join" className="w-full text-center font-bold py-4 rounded-xl" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>{t('انضم لتقدّم على الفرصة', 'Join to apply')}</Link>
                  <Link to="/login" className="text-center text-sm" style={{ color: 'var(--c-muted)' }}>{t('عندك حساب؟ سجّل الدخول', 'Have an account? Sign in')}</Link>
                </div>
              ) : profile.status !== 'approved' ? (
                <Notice>{t('يمكنك التقديم بعد موافقة فريق Makers على ملفك.', 'You can apply once the Makers team approves your profile.')}</Notice>
              ) : (
                <div className="flex flex-col gap-3">
                  <TextArea rows={3} maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('رسالة قصيرة: لماذا أنت مناسب؟ (اختياري)', 'A short note: why are you a fit? (optional)')} />
                  {error && <Notice tone="error">{error}</Notice>}
                  <button onClick={apply} disabled={busy} className="w-full font-bold py-4 rounded-xl cursor-pointer disabled:opacity-60" style={{ background: 'var(--c-accent)', border: 'none', color: 'var(--c-on-accent)', fontSize: 15 }}>{busy ? t('جارٍ الإرسال…', 'Sending…') : t('قدّم على هذه الفرصة', 'Apply for this project')}</button>
                  <span className="text-xs text-center" style={{ color: 'var(--c-muted)' }}>{t('يصل طلبك مع رابط صفحتك إلى صاحب الفرصة.', 'Your application goes to the poster with a link to your page.')}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function OpenProjects({ openId }: { openId?: string }) {
  useLang()
  const { go } = useRouter()
  const { profile } = useAuth()
  const specialties = useSpecialties()
  const [calls, setCalls] = useState<OpenCall[] | null>(null)
  const [mine, setMine] = useState<OpenCall[]>([])
  const [appliedIds, setAppliedIds] = useState<string[]>([])
  const [role, setRole] = useState<number | 'all'>('all')
  const [remoteOnly, setRemoteOnly] = useState(false)

  const load = () => {
    listOpenCalls(100).then(setCalls)
    if (profile) {
      supabase.from('open_calls').select(CALL_SELECT).eq('owner_id', profile.id).neq('status', 'open').order('created_at', { ascending: false }).then(({ data }) => setMine((data as unknown as OpenCall[]) || []))
      supabase.from('open_call_applications').select('call_id').eq('applicant_id', profile.id).then(({ data }) => setAppliedIds(((data as { call_id: string }[]) || []).map((x) => x.call_id)))
    }
  }
  useEffect(load, [profile?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = (calls || []).filter((c) => (!remoteOnly || c.remote) && (role === 'all' || c.role_ids.includes(role)))
  const usedRoles = specialties.filter((s) => (calls || []).some((c) => c.role_ids.includes(s.id)))
  const canPost = profile?.status === 'approved'

  return (
    <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-black m-0 mb-2" style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{t('فرص مفتوحة', 'Open calls')}</h1>
          <p className="m-0" style={{ fontSize: 15, color: 'var(--c-muted)' }}>{t('إنتاجات تبحث عن صنّاع الآن. قدّم وانضم إلى الطاقم.', 'Productions looking for Makers right now. Apply to join the crew.')}</p>
        </div>
        <Link to={canPost ? '/opportunities/new' : profile ? '/me/status' : '/join'} className="self-start sm:self-auto font-bold px-5 py-2.5 rounded-full text-sm shrink-0" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>+ {t('انشر فرصة', 'Post an opportunity')}</Link>
      </div>

      {mine.length > 0 && (
        <div className="mb-8 flex flex-col gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--c-muted)' }}>{t('فرصك غير المنشورة', 'Your unpublished calls')}</span>
          {mine.map((c) => (
            <button key={c.id} onClick={() => go(`/opportunities/${c.id}`)} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-start cursor-pointer" style={{ ...box, color: 'var(--c-text)' }}>
              <span className="font-semibold text-sm truncate">{c.title}</span>
              <Pill tone={c.status === 'pending' ? 'amber' : c.status === 'rejected' ? 'red' : 'neutral'}>{c.status === 'pending' ? t('بانتظار المراجعة', 'In review') : c.status === 'rejected' ? t('مرفوضة', 'Rejected') : t('مغلقة', 'Closed')}</Pill>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-7">
        <div className="relative">
          <select value={role} onChange={(e) => setRole(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="appearance-none text-sm ps-4 pe-9 rounded-xl cursor-pointer" style={{ ...box, height: 42, fontSize: 13, color: role !== 'all' ? 'var(--c-text)' : 'var(--c-muted)' }}>
            <option value="all">{t('كل الأدوار', 'All roles')}</option>
            {(usedRoles.length ? usedRoles : specialties).map((s) => <option key={s.id} value={s.id}>{t(s.name_ar || s.name_en, s.name_en)}</option>)}
          </select>
        </div>
        <button onClick={() => setRemoteOnly(!remoteOnly)} className="flex items-center gap-2.5 text-sm px-4 rounded-xl cursor-pointer" style={{ ...box, height: 42, borderColor: remoteOnly ? 'var(--c-accent)' : 'var(--c-border)', color: remoteOnly ? 'var(--c-text)' : 'var(--c-muted)', fontSize: 13 }}>
          <span className="w-8 h-4 rounded-full flex items-center" style={{ backgroundColor: remoteOnly ? 'var(--c-accent)' : 'var(--c-border)', padding: 2, justifyContent: remoteOnly ? 'flex-end' : 'flex-start' }}><span className="w-3 h-3 rounded-full" style={{ background: 'var(--c-text)' }} /></span>
          {t('عن بُعد فقط', 'Remote only')}
        </button>
        <span className="text-sm ms-auto" style={{ color: 'var(--c-muted)' }}>{calls ? t(`${filtered.length} فرصة`, `${filtered.length} open`) : ''}</span>
      </div>

      {!calls ? <Spinner /> : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ ...box, borderStyle: 'dashed' }}>
          <p className="m-0" style={{ color: 'var(--c-muted)' }}>{calls.length === 0 ? t('لا توجد فرص منشورة الآن. عندك مشروع يحتاج طاقم؟ انشره هنا.', 'No open calls right now. Have a project that needs a crew? Post it here.') : t('لا فرص تطابق الفلتر.', 'No calls match the filter.')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((c) => {
            const applied = appliedIds.includes(c.id)
            const color = CALL_COLORS[c.kind || 'other'] || 'var(--c-accent)'
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45 }} className="rounded-2xl overflow-hidden transition-colors hover:border-[color:var(--c-border-mid)]" style={box}>
                <div className="flex items-center gap-2 px-5 sm:px-6 py-2.5 text-[12px] font-medium" style={{ background: 'var(--c-surface-alt)', borderBottom: '1px dashed var(--c-border-mid)', color: 'var(--c-accent)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  {kindLabel(c.kind) || t('مشروع', 'Project')}
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <Avatar url={c.owner?.avatar_url} name={c.owner?.full_name} size={52} rounded={12} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {c.remote && <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(5,150,105,0.15)', color: '#34D399', border: '1px solid rgba(5,150,105,0.3)', fontSize: 10 }}>{t('عن بُعد', 'Remote')}</span>}
                      </div>
                      <h2 className="font-display font-bold mb-0.5 mt-0 cursor-pointer hover:text-orange transition-colors" style={{ fontSize: 19 }} onClick={() => go(`/opportunities/${c.id}`)}>{c.title}</h2>
                      <p className="text-sm m-0" style={{ color: 'var(--c-muted)' }}>{[c.org || displayName(c.owner), placeOf(c)].filter(Boolean).join(' · ')}</p>
                    </div>
                    <button onClick={() => go(`/opportunities/${c.id}`)} className="hidden sm:block shrink-0 font-bold px-5 py-2.5 rounded-xl cursor-pointer" style={{ background: applied ? 'transparent' : 'var(--c-accent)', border: applied ? '1.5px solid var(--c-accent)' : 'none', color: applied ? 'var(--c-accent)' : 'var(--c-on-accent)', fontSize: 13 }}>
                      {applied ? `✓ ${t('قدّمت', 'Applied')}` : t('قدّم الآن', 'Apply now')}
                    </button>
                  </div>
                  <p dir="auto" className="mt-4 mb-0 leading-relaxed" style={{ fontSize: 13, color: 'var(--c-text-2)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <div className="flex flex-wrap gap-1.5">
                      {c.role_ids.map((r) => <span key={r} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', fontSize: 11 }}>{specName(specialties, r)}</span>)}
                    </div>
                    <div className="flex items-center gap-4 ms-auto flex-wrap">
                      {c.deadline && <span className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--c-muted)' }}>{t('آخر موعد', 'Deadline')} {formatDateAr(c.deadline)}</span>}
                      <span className="font-semibold" style={{ color: 'var(--c-accent)', fontSize: 12 }}>{budgetLabel(c.budget)}</span>
                      <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>{t(`${c.applicants_count} متقدّم`, `${c.applicants_count} applicant${c.applicants_count === 1 ? '' : 's'}`)}</span>
                      <span style={{ fontSize: 11, color: 'var(--c-muted-2)' }}>{relativeAr(c.created_at)}</span>
                    </div>
                  </div>
                  <button onClick={() => go(`/opportunities/${c.id}`)} className="sm:hidden w-full font-bold py-3 rounded-xl mt-4 cursor-pointer" style={{ background: applied ? 'transparent' : 'var(--c-accent)', border: applied ? '1.5px solid var(--c-accent)' : 'none', color: applied ? 'var(--c-accent)' : 'var(--c-on-accent)', fontSize: 14 }}>
                    {applied ? `✓ ${t('قدّمت', 'Applied')}` : t('قدّم الآن', 'Apply now')}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="mt-8 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ background: 'linear-gradient(135deg, rgba(var(--c-accent-rgb),0.12) 0%, rgba(13,10,8,0) 100%)', border: '1px solid rgba(var(--c-accent-rgb),0.25)' }}>
        <div>
          <h3 className="font-black mb-1 mt-0" style={{ fontSize: 18 }}>{t('عندك مشروع يحتاج طاقم؟', 'Have a project to crew up?')}</h3>
          <p className="m-0" style={{ fontSize: 14, color: 'var(--c-muted)' }}>{t('انشر مشروعك وتواصل مع صنّاع موثّقين في العالم العربي.', 'Post your production and connect with reviewed Makers across the Arab world.')}</p>
        </div>
        <Link to={canPost ? '/opportunities/new' : profile ? '/me/status' : '/join'} className="shrink-0 font-bold px-8 py-3.5 rounded-full whitespace-nowrap" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)', fontSize: 14 }}>{t('انشر فرصة', 'Post a project')}</Link>
      </div>

      {openId && (
        <CallDetail
          id={openId}
          applied={appliedIds.includes(openId)}
          onClose={() => { go('/opportunities'); load() }}
          onApplied={() => setAppliedIds([...appliedIds, openId])}
        />
      )}
    </div>
  )
}
