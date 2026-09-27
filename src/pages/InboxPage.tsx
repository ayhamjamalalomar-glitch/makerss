import { useCallback, useEffect, useState } from 'react'
import { useRouter } from '../lib/router'
import { supabase, type ContactRequest } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { BUDGETS, COUNTRIES, cityLabel, PROJECT_TYPES, REMOTE, daysBetween, durationAr, formatDateAr, relativeAr } from '../lib/constants'
import { label, t } from '../lib/i18n'
import { Btn, Card, PageShell, Pill, Spinner } from '../components/mk'

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

export default function InboxPage() {
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

  if (loading || items === null) return <PageShell><Spinner /></PageShell>

  const shown = items.filter((r) => filter === 'all' || r.status === filter)
  const newN = items.filter((r) => r.status === 'new').length

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:px-2">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[28px] md:text-[32px] font-bold">{t('صندوق الطلبات', 'Requests inbox')}</h1>
          <span className="text-sm" style={{ color: '#5C5C59' }}>{newN === 0 ? t('لا توجد طلبات جديدة', 'No new requests') : newN === 1 ? t('لديك طلب جديد واحد', 'You have 1 new request') : newN === 2 ? t('لديك طلبان جديدان', 'You have 2 new requests') : t(`لديك ${newN} طلبات جديدة`, `You have ${newN} new requests`)}</span>
        </div>
        <div className="flex gap-1.5 p-1 rounded-full self-start" style={{ background: '#F3F3F2' }}>
          {([['all', t('الكل', 'All')], ['new', t('جديد', 'New')], ['accepted', t('مقبول', 'Accepted')], ['declined', t('اعتذرت', 'Declined')]] as [Filter, string][]).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFilter(k)} className="text-[13px] px-4 py-2 rounded-full cursor-pointer" style={{ border: 'none', background: filter === k ? '#fff' : 'transparent', fontWeight: filter === k ? 600 : 400, color: filter === k ? '#111' : '#5C5C59' }}>{l}</button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-10 text-center flex flex-col gap-2">
          <span className="text-lg font-bold">{t('لا توجد طلبات بعد', 'No requests yet')}</span>
          <span className="text-sm" style={{ color: '#5C5C59' }}>{t('عندما يطلب أحد التعاون معك من صفحتك، سيظهر الطلب هنا.', 'When someone requests a collaboration from your page, it will show up here.')}</span>
        </Card>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="md:w-[340px] shrink-0 flex flex-col gap-2.5">
            {shown.map((r) => (
              <button key={r.id} type="button" onClick={() => setSel(r.id)} className="text-start p-5 rounded-[28px] bg-white cursor-pointer flex flex-col gap-2" style={{ border: r.id === sel ? '1.5px solid #111' : '1px solid #ECECEA' }}>
                <span className="flex justify-between items-center"><Pill tone={META[r.status].tone}>{metaLabel(r.status)}</Pill><span className="text-xs" style={{ color: '#5C5C59' }}>{relativeAr(r.created_at)}</span></span>
                <span className="text-base font-bold">{ptLabel(r.project_type)}</span>
                <span className="text-[13px]" style={{ color: '#5C5C59' }}>{r.sender_name} · {place(r)}</span>
                {r.start_date && <span className="text-xs" style={{ color: '#3A3A38' }}>{formatDateAr(r.start_date)}{r.end_date ? t(` إلى ${formatDateAr(r.end_date)}`, ` to ${formatDateAr(r.end_date)}`) : ''}</span>}
              </button>
            ))}
            {shown.length === 0 && <div className="p-8 text-center rounded-[28px] text-sm" style={{ border: '1.5px dashed #CFCFCB', color: '#5C5C59' }}>{t('لا توجد طلبات في هذا القسم.', 'No requests here.')}</div>}
          </div>

          {current && (
            <Card className="flex-1 p-6 md:p-9 flex flex-col gap-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-2">
                  <span><Pill tone={META[current.status].tone}>{metaLabel(current.status)}</Pill></span>
                  <span className="text-[24px] md:text-[26px] font-bold">{ptLabel(current.project_type)}</span>
                  <span className="text-sm" style={{ color: '#5C5C59' }}>{t('من', 'From')} {current.sender_name}</span>
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: '#5C5C59' }}>{t('وصل', 'Received')} {relativeAr(current.created_at)}</span>
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
                <p className="m-0 text-base whitespace-pre-line" style={{ lineHeight: 1.9, color: '#1F1F1E' }}>{current.details}</p>
              </div>
              {current.status === 'new' && (
                <div className="flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid #F0F0EE' }}>
                  <span className="text-[13px]" style={{ color: '#5C5C59' }}>{t('يظهر بريد المرسل بعد قبول الطلب. تنتهي صلاحية الطلب بعد 4 أيام إن لم ترد.', 'The sender\'s email appears once you accept. Requests expire after 4 days without a reply.')}</span>
                  <div className="flex gap-2.5">
                    <Btn onClick={() => setStatus('accepted')}>{t('قبول الطلب', 'Accept request')}</Btn>
                    <Btn variant="danger" onClick={() => setStatus('declined')}>{t('اعتذار', 'Decline')}</Btn>
                  </div>
                </div>
              )}
              {current.status === 'accepted' && (
                <div className="flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid #F0F0EE' }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-5 py-4 rounded-[22px] text-sm" style={{ background: '#E8F5EC', color: '#166534' }}>
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
                      }} className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full cursor-pointer disabled:opacity-60" style={{ background: '#2563EB', color: '#fff', border: 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 01-11.6 7.1L4 20l1-4A8 8 0 1120 12z" /></svg>
                        {t('رُدّ برسالة', 'Reply by message')}
                      </button>
                    )}
                    {email && (
                      <a href={`mailto:${email}?subject=${encodeURIComponent(t('بخصوص طلب التعاون عبر Makers', 'About your collaboration request on Makers'))}`} className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full" style={member ? { background: '#fff', color: '#111', border: '1px solid #111' } : { background: '#2563EB', color: '#fff' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                        {t('رُدّ عبر البريد', 'Reply by email')}
                      </a>
                    )}
                  </div>
                  {email && !member && <span className="text-xs" style={{ color: '#5C5C59' }}>{t('المرسل ليس عضواً منشوراً في Makers، لذلك الرد متاح عبر البريد فقط.', 'The sender is not a live Makers member, so you can reply by email only.')}</span>}
                </div>
              )}
              {current.status === 'declined' && <div className="px-5 py-4 rounded-[22px] text-sm" style={{ background: '#F7F7F6', color: '#5C5C59' }}>{t('اعتذرت عن هذا الطلب.', 'You declined this request.')}</div>}
              {current.status === 'expired' && <div className="px-5 py-4 rounded-[22px] text-sm" style={{ background: '#FEF3C7', color: '#92400E' }}>{t('انتهت مدة هذا الطلب لأنه لم يُرد عليه خلال 4 أيام.', 'This request expired because it was not answered within 4 days.')}</div>}
            </Card>
          )}
        </div>
      )}
    </PageShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 md:p-[18px] rounded-[22px] flex flex-col gap-1" style={{ background: '#F7F7F6' }}>
      <span className="text-xs" style={{ color: '#5C5C59' }}>{label}</span>
      <span className="text-sm md:text-[15px] font-semibold">{value}</span>
    </div>
  )
}
