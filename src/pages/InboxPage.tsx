import { useCallback, useEffect, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase, type ContactRequest } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { BUDGETS, COUNTRIES, cityLabel, PROJECT_TYPES, REMOTE, daysBetween, durationAr, formatDateAr, relativeAr } from '../lib/constants'
import { label, t } from '../lib/i18n'
import { Avatar, Btn, Card, PageShell, Pill, Spinner } from '../components/mk'
import { CARD_COLUMNS, displayName, type MemberCard, type OpenCall } from '../lib/data'
import { useSpecialties, roleLine } from '../lib/specialties'

type Filter = 'all' | 'new' | 'accepted' | 'declined'
const META: Record<ContactRequest['status'], { ar: string; en: string; tone: 'blue' | 'green' | 'neutral' | 'amber' }> = {
  new: { ar: 'جديد', en: 'New', tone: 'blue' },
  accepted: { ar: 'مقبول', en: 'Accepted', tone: 'green' },
  declined: { ar: 'اعتذرت', en: 'Declined', tone: 'neutral' },
  expired: { ar: 'انتهت مدته', en: 'Expired', tone: 'amber' },
}
const metaLabel = (s: ContactRequest['status']) => t(META[s].ar, META[s].en)
const ptLabel = (v: string | null) => (v ? label(PROJECT_TYPES, v) : t('طلب تعاون', 'Collaboration request'))
const place = (r: ContactRequest) => [cityLabel(r.city), r.country === REMOTE.ar ? t(REMOTE.ar, REMOTE.en) : label(COUNTRIES, r.country)].filter(Boolean).join(t('، ', ', '))

type Section = 'requests' | 'calls'

export default function InboxPage() {
  const [section, setSection] = useState<Section>(() => (new URLSearchParams(window.location.search).get('tab') === 'calls' ? 'calls' : 'requests'))
  const pick = (k: Section) => { setSection(k); window.history.replaceState(null, '', k === 'calls' ? '/inbox?tab=calls' : '/inbox') }
  return (
    <PageShell>
      <div className="flex gap-1.5 p-1 rounded-full self-start" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)' }}>
        {([['requests', t('طلبات التعاون', 'Collaboration requests')], ['calls', t('الفرص والمتقدّمون', 'Open calls & applicants')]] as [Section, string][]).map(([k, l]) => (
          <button key={k} type="button" onClick={() => pick(k)} className="text-[13px] px-4 py-2 rounded-full cursor-pointer" style={{ border: 'none', background: section === k ? '#E85D04' : 'transparent', fontWeight: section === k ? 600 : 400, color: section === k ? '#fff' : 'var(--c-muted)' }}>{l}</button>
        ))}
      </div>
      {section === 'requests' ? <RequestsInbox /> : <CallsInbox />}
    </PageShell>
  )
}

function RequestsInbox() {
  const { session, loading } = useAuth()
  const { go } = useRouter()
  const [items, setItems] = useState<ContactRequest[] | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [sel, setSel] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [member, setMember] = useState<string | null>(null)
  const [chatBusy, setChatBusy] = useState(false)

  useEffect(() => {
    if (!loading && !session) go('/login?next=/inbox')
  }, [loading, session, go])

  const load = useCallback(async () => {
    if (!session) return
    await supabase.rpc('expire_contact_requests')
    const { data } = await supabase
      .from('contact_requests')
      .select('id, to_id, sender_name, project_type, country, city, budget, start_date, end_date, details, status, responded_at, created_at')
      .eq('to_id', session.user.id)
      .order('created_at', { ascending: false })
    const list = (data as ContactRequest[]) || []
    setItems(list)
    setSel((cur) => cur || list[0]?.id || null)
  }, [session])

  useEffect(() => {
    load()
  }, [load])

  const current = items?.find((r) => r.id === sel) || null

  useEffect(() => {
    setEmail(null)
    setMember(null)
    if (current?.status === 'accepted') {
      supabase.rpc('contact_request_email', { p_id: current.id }).then(({ data }) => setEmail((data as string) || null))
      supabase.rpc('contact_request_sender_member', { p_id: current.id }).then(({ data }) => setMember((data as string) || null))
    }
  }, [current?.id, current?.status])

  const setStatus = async (status: 'accepted' | 'declined') => {
    if (!current) return
    await supabase.from('contact_requests').update({ status, responded_at: new Date().toISOString() }).eq('id', current.id)
    load()
  }

  if (loading || items === null) return <Spinner />

  const shown = items.filter((r) => filter === 'all' || r.status === filter)
  const newN = items.filter((r) => r.status === 'new').length

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:px-2">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[28px] md:text-[32px] font-bold">{t('صندوق الطلبات', 'Requests inbox')}</h1>
          <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{newN === 0 ? t('لا توجد طلبات جديدة', 'No new requests') : newN === 1 ? t('لديك طلب جديد واحد', 'You have 1 new request') : newN === 2 ? t('لديك طلبان جديدان', 'You have 2 new requests') : t(`لديك ${newN} طلبات جديدة`, `You have ${newN} new requests`)}</span>
        </div>
        <div className="flex gap-1.5 p-1 rounded-full self-start" style={{ background: 'var(--c-surface-alt)' }}>
          {([['all', t('الكل', 'All')], ['new', t('جديد', 'New')], ['accepted', t('مقبول', 'Accepted')], ['declined', t('اعتذرت', 'Declined')]] as [Filter, string][]).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFilter(k)} className="text-[13px] px-4 py-2 rounded-full cursor-pointer" style={{ border: 'none', background: filter === k ? '#E85D04' : 'transparent', fontWeight: filter === k ? 600 : 400, color: filter === k ? '#fff' : 'var(--c-muted)' }}>{l}</button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-10 text-center flex flex-col gap-2">
          <span className="text-lg font-bold">{t('لا توجد طلبات بعد', 'No requests yet')}</span>
          <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('عندما يطلب أحد التعاون معك من صفحتك، سيظهر الطلب هنا.', 'When someone requests a collaboration from your page, it will show up here.')}</span>
        </Card>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="md:w-[340px] shrink-0 flex flex-col gap-2.5">
            {shown.map((r) => (
              <button key={r.id} type="button" onClick={() => setSel(r.id)} className="text-start p-5 rounded-2xl bg-[var(--c-surface)] cursor-pointer flex flex-col gap-2" style={{ border: r.id === sel ? '1.5px solid var(--c-border-mid)' : '1px solid var(--c-border)' }}>
                <span className="flex justify-between items-center"><Pill tone={META[r.status].tone}>{metaLabel(r.status)}</Pill><span className="text-xs" style={{ color: 'var(--c-muted)' }}>{relativeAr(r.created_at)}</span></span>
                <span className="text-base font-bold">{ptLabel(r.project_type)}</span>
                <span className="text-[13px]" style={{ color: 'var(--c-muted)' }}>{r.sender_name} · {place(r)}</span>
                {r.start_date && <span className="text-xs" style={{ color: 'var(--c-text-2)' }}>{formatDateAr(r.start_date)}{r.end_date ? t(` إلى ${formatDateAr(r.end_date)}`, ` to ${formatDateAr(r.end_date)}`) : ''}</span>}
              </button>
            ))}
            {shown.length === 0 && <div className="p-8 text-center rounded-2xl text-sm" style={{ border: '1.5px dashed var(--c-border)', color: 'var(--c-muted)' }}>{t('لا توجد طلبات في هذا القسم.', 'No requests here.')}</div>}
          </div>

          {current && (
            <Card className="flex-1 p-6 md:p-9 flex flex-col gap-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-2">
                  <span><Pill tone={META[current.status].tone}>{metaLabel(current.status)}</Pill></span>
                  <span className="text-[24px] md:text-[26px] font-bold">{ptLabel(current.project_type)}</span>
                  <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('من', 'From')} {current.sender_name}</span>
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--c-muted)' }}>{t('وصل', 'Received')} {relativeAr(current.created_at)}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
                <Info label={t('تاريخ البدء', 'Start date')} value={formatDateAr(current.start_date) || t('غير محدد', 'Not set')} />
                <Info label={t('تاريخ التسليم', 'Delivery date')} value={formatDateAr(current.end_date) || t('غير محدد', 'Not set')} />
                <Info label={t('المدة', 'Duration')} value={current.start_date && current.end_date ? durationAr(daysBetween(current.start_date, current.end_date)) : t('غير محددة', 'Not set')} />
                <Info label={t('نوع المشروع', 'Project type')} value={current.project_type ? label(PROJECT_TYPES, current.project_type) : t('غير محدد', 'Not set')} />
                <Info label={t('مكان التصوير', 'Location')} value={place(current) || t('غير محدد', 'Not set')} />
                <Info label={t('الميزانية', 'Budget')} value={label(BUDGETS, current.budget || 'حسب الاتفاق')} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">{t('تفاصيل المشروع', 'Project details')}</span>
                <p className="m-0 text-base whitespace-pre-line" style={{ lineHeight: 1.9, color: 'var(--c-text)' }}>{current.details}</p>
              </div>
              {current.status === 'new' && (
                <div className="flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid var(--c-surface-alt)' }}>
                  <span className="text-[13px]" style={{ color: 'var(--c-muted)' }}>{t('يظهر بريد المرسل بعد قبول الطلب. تنتهي صلاحية الطلب بعد 4 أيام إن لم ترد.', 'The sender\'s email appears once you accept. Requests expire after 4 days without a reply.')}</span>
                  <div className="flex gap-2.5">
                    <Btn onClick={() => setStatus('accepted')}>{t('قبول الطلب', 'Accept request')}</Btn>
                    <Btn variant="danger" onClick={() => setStatus('declined')}>{t('اعتذار', 'Decline')}</Btn>
                  </div>
                </div>
              )}
              {current.status === 'accepted' && (
                <div className="flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid var(--c-surface-alt)' }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-5 py-4 rounded-xl text-sm" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}>
                    <span>{t('قبلت هذا الطلب. تواصل مع المرسل على بريده:', 'You accepted this request. Reach the sender at:')}</span>
                    <span dir="ltr" className="mono text-[13px]">{email || '…'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {member && (
                      <button type="button" disabled={chatBusy} onClick={async () => {
                        setChatBusy(true)
                        const { data } = await supabase.rpc('start_conversation', { p_other: member })
                        setChatBusy(false)
                        if (data) go(`/messages?c=${data}`)
                      }} className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full cursor-pointer disabled:opacity-60" style={{ background: '#E85D04', color: '#fff', border: 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 01-11.6 7.1L4 20l1-4A8 8 0 1120 12z" /></svg>
                        {t('رُدّ برسالة', 'Reply by message')}
                      </button>
                    )}
                    {email && (
                      <a href={`mailto:${email}?subject=${encodeURIComponent(t('بخصوص طلب التعاون عبر Makers', 'About your collaboration request on Makers'))}`} className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full" style={member ? { background: 'var(--c-surface)', color: 'var(--c-text)', border: '1px solid var(--c-border-mid)' } : { background: '#E85D04', color: '#fff' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                        {t('رُدّ عبر البريد', 'Reply by email')}
                      </a>
                    )}
                  </div>
                  {email && !member && <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{t('المرسل ليس عضواً منشوراً في Makers، لذلك الرد متاح عبر البريد فقط.', 'The sender is not a live Makers member, so you can reply by email only.')}</span>}
                </div>
              )}
              {current.status === 'declined' && <div className="px-5 py-4 rounded-xl text-sm" style={{ background: 'var(--c-surface-alt)', color: 'var(--c-muted)' }}>{t('اعتذرت عن هذا الطلب.', 'You declined this request.')}</div>}
              {current.status === 'expired' && <div className="px-5 py-4 rounded-xl text-sm" style={{ background: 'rgba(251,191,36,0.14)', color: '#FBBF24' }}>{t('انتهت مدة هذا الطلب لأنه لم يُرد عليه خلال 4 أيام.', 'This request expired because it was not answered within 4 days.')}</div>}
            </Card>
          )}
        </div>
      )}
    </>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 md:p-[18px] rounded-xl flex flex-col gap-1" style={{ background: 'var(--c-surface-alt)' }}>
      <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{label}</span>
      <span className="text-sm md:text-[15px] font-semibold">{value}</span>
    </div>
  )
}

interface Application { id: string; call_id: string; applicant_id: string; message: string | null; status: 'new' | 'shortlisted' | 'declined'; created_at: string; applicant?: MemberCard | null }

function CallsInbox() {
  const { session, loading } = useAuth()
  const { go } = useRouter()
  const specialties = useSpecialties()
  const [calls, setCalls] = useState<OpenCall[] | null>(null)
  const [apps, setApps] = useState<Application[]>([])
  const [mine, setMine] = useState<(Application & { call?: OpenCall | null })[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !session) go('/login?next=/inbox')
  }, [loading, session, go])

  const load = useCallback(async () => {
    if (!session) return
    const uid = session.user.id
    const { data } = await supabase.from('open_calls').select('*').eq('owner_id', uid).order('created_at', { ascending: false })
    const list = (data as OpenCall[]) || []
    setCalls(list)
    setSel((cur) => cur || list[0]?.id || null)
    if (list.length) {
      const { data: a } = await supabase.from('open_call_applications').select(`*, applicant:profiles!open_call_applications_applicant_id_fkey(${CARD_COLUMNS})`).in('call_id', list.map((c) => c.id)).order('created_at', { ascending: false })
      setApps((a as unknown as Application[]) || [])
    }
    const { data: m } = await supabase.from('open_call_applications').select('*, call:open_calls(*)').eq('applicant_id', uid).order('created_at', { ascending: false })
    setMine((m as unknown as (Application & { call?: OpenCall | null })[]) || [])
  }, [session])

  useEffect(() => { load() }, [load])

  if (loading || calls === null) return <Spinner />

  const current = calls.find((c) => c.id === sel) || null
  const currentApps = apps.filter((a) => a.call_id === sel)
  const setStatus = async (id: string, status: Application['status']) => {
    setBusy(id)
    await supabase.rpc('set_application_status', { p_id: id, p_status: status })
    setBusy(null)
    load()
  }
  const message = async (uid: string) => {
    setBusy(uid)
    const { data } = await supabase.rpc('start_conversation', { p_other: uid })
    setBusy(null)
    if (data) go(`/messages?c=${data}`)
  }
  const callTone = (s: OpenCall['status']) => (s === 'open' ? 'green' : s === 'pending' ? 'amber' : s === 'rejected' ? 'red' : 'neutral') as 'green' | 'amber' | 'red' | 'neutral'
  const callLabel = (s: OpenCall['status']) => (s === 'open' ? t('منشورة', 'Live') : s === 'pending' ? t('قيد المراجعة', 'In review') : s === 'rejected' ? t('مرفوضة', 'Rejected') : t('مغلقة', 'Closed'))
  const appLabel = (s: Application['status']) => (s === 'shortlisted' ? t('في القائمة المختصرة', 'Shortlisted') : s === 'declined' ? t('لم يُختر', 'Not selected') : t('جديد', 'New'))

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:px-2">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[28px] md:text-[32px] font-bold">{t('الفرص والمتقدّمون', 'Open calls & applicants')}</h1>
          <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('الفرص التي نشرتها ومن تقدّم عليها.', 'Calls you posted and who applied.')}</span>
        </div>
        <Link to="/opportunities/new" className="self-start text-sm font-semibold px-5 py-2.5 rounded-full" style={{ background: '#E85D04', color: '#fff' }}>+ {t('انشر فرصة', 'Post an opportunity')}</Link>
      </div>

      {calls.length === 0 ? (
        <Card className="p-10 text-center flex flex-col gap-2">
          <span className="text-lg font-bold">{t('لم تنشر فرصاً بعد', 'You have not posted any calls')}</span>
          <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('انشر فرصة لمشروعك، وستصلك طلبات الصنّاع هنا.', 'Post a call for your project and applications will arrive here.')}</span>
        </Card>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="md:w-[320px] shrink-0 flex flex-col gap-2.5">
            {calls.map((c) => (
              <button key={c.id} type="button" onClick={() => setSel(c.id)} className="text-start p-5 rounded-2xl cursor-pointer flex flex-col gap-2" style={{ background: 'var(--c-surface)', color: 'var(--c-text)', border: c.id === sel ? '1.5px solid #E85D04' : '1px solid var(--c-border)' }}>
                <span className="flex justify-between items-center gap-2"><Pill tone={callTone(c.status)}>{callLabel(c.status)}</Pill><span className="text-xs" style={{ color: 'var(--c-muted)' }}>{relativeAr(c.created_at)}</span></span>
                <span className="text-base font-bold">{c.title}</span>
                <span className="text-[13px]" style={{ color: 'var(--c-muted)' }}>{t(`${apps.filter((a) => a.call_id === c.id).length} متقدّم`, `${apps.filter((a) => a.call_id === c.id).length} applicants`)}</span>
              </button>
            ))}
          </div>
          {current && (
            <Card className="flex-1 p-6 md:p-8 flex flex-col gap-5">
              <div className="flex justify-between items-start gap-3">
                <div className="flex flex-col gap-2">
                  <span><Pill tone={callTone(current.status)}>{callLabel(current.status)}</Pill></span>
                  <span className="text-[22px] font-bold">{current.title}</span>
                </div>
                <Link to={`/opportunities/${current.id}`} className="text-xs whitespace-nowrap" style={{ color: '#E85D04' }}>{t('عرض الفرصة', 'View call')}</Link>
              </div>
              {current.status === 'rejected' && current.review_note && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.12)', color: '#FCA5A5' }}>{current.review_note}</div>}
              {currentApps.length === 0 ? (
                <div className="p-8 text-center rounded-2xl text-sm" style={{ border: '1.5px dashed var(--c-border)', color: 'var(--c-muted)' }}>{current.status === 'pending' ? t('ستصلك الطلبات بعد نشر الفرصة.', 'Applications arrive once the call is live.') : t('لا يوجد متقدّمون بعد.', 'No applicants yet.')}</div>
              ) : currentApps.map((a) => (
                <div key={a.id} className="p-4 rounded-xl flex flex-col gap-3" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)' }}>
                  <div className="flex items-center gap-3">
                    <Avatar url={a.applicant?.avatar_url} name={a.applicant?.full_name} size={44} />
                    <div className="flex-1 min-w-0">
                      <Link to={`/${a.applicant?.username}`} className="block font-bold truncate hover:underline">{displayName(a.applicant)}</Link>
                      <span className="block text-xs truncate" style={{ color: 'var(--c-muted)' }}>{roleLine(specialties, a.applicant?.specialty_ids, a.applicant?.other_specialty)}</span>
                    </div>
                    <Pill tone={a.status === 'shortlisted' ? 'green' : a.status === 'declined' ? 'neutral' : 'blue'}>{appLabel(a.status)}</Pill>
                  </div>
                  {a.message && <p dir="auto" className="m-0 text-sm whitespace-pre-line" style={{ color: 'var(--c-text-2)', lineHeight: 1.8 }}>{a.message}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Btn className="!py-2 !px-4 text-[13px]" disabled={busy === a.applicant_id} onClick={() => message(a.applicant_id)}>{t('راسِل', 'Message')}</Btn>
                    {a.status !== 'shortlisted' && <Btn variant="outline" className="!py-2 !px-4 text-[13px]" disabled={busy === a.id} onClick={() => setStatus(a.id, 'shortlisted')}>{t('أضف للقائمة المختصرة', 'Shortlist')}</Btn>}
                    {a.status !== 'declined' && <Btn variant="danger" className="!py-2 !px-4 text-[13px]" disabled={busy === a.id} onClick={() => setStatus(a.id, 'declined')}>{t('لم يُختر', 'Not a fit')}</Btn>}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {mine.length > 0 && (
        <Card className="p-6 md:p-8 flex flex-col gap-3">
          <span className="text-lg font-bold">{t('طلباتك على فرص الآخرين', 'Your applications')}</span>
          {mine.map((a) => (
            <Link key={a.id} to={`/opportunities/${a.call_id}`} className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <span className="text-sm font-semibold truncate">{a.call?.title || t('فرصة', 'Call')}</span>
              <Pill tone={a.status === 'shortlisted' ? 'green' : a.status === 'declined' ? 'neutral' : 'blue'}>{a.status === 'new' ? t('أُرسل', 'Sent') : appLabel(a.status)}</Pill>
            </Link>
          ))}
        </Card>
      )}
    </>
  )
}
