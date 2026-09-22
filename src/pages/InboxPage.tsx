import { useCallback, useEffect, useState } from 'react'
import { useRouter } from '../lib/router'
import { supabase, type ContactRequest } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { daysBetween, durationAr, formatDateAr, relativeAr } from '../lib/constants'
import { Btn, Card, PageShell, Pill, Spinner } from '../components/mk'

type Filter = 'all' | 'new' | 'accepted' | 'declined'
const META: Record<ContactRequest['status'], { label: string; tone: 'blue' | 'green' | 'neutral' | 'amber' }> = {
  new: { label: 'جديد', tone: 'blue' },
  accepted: { label: 'مقبول', tone: 'green' },
  declined: { label: 'اعتذرت', tone: 'neutral' },
  expired: { label: 'انتهت مدته', tone: 'amber' },
}

export default function InboxPage() {
  const { session, loading } = useAuth()
  const { go } = useRouter()
  const [items, setItems] = useState<ContactRequest[] | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [sel, setSel] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

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
    if (current?.status === 'accepted') supabase.rpc('contact_request_email', { p_id: current.id }).then(({ data }) => setEmail((data as string) || null))
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
          <h1 className="m-0 text-[28px] md:text-[32px] font-bold">صندوق الطلبات</h1>
          <span className="text-sm" style={{ color: '#5C5C59' }}>{newN === 0 ? 'لا توجد طلبات جديدة' : newN === 1 ? 'لديك طلب جديد واحد' : newN === 2 ? 'لديك طلبان جديدان' : `لديك ${newN} طلبات جديدة`}</span>
        </div>
        <div className="flex gap-1.5 p-1 rounded-full self-start" style={{ background: '#F3F3F2' }}>
          {([['all', 'الكل'], ['new', 'جديد'], ['accepted', 'مقبول'], ['declined', 'اعتذرت']] as [Filter, string][]).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFilter(k)} className="text-[13px] px-4 py-2 rounded-full cursor-pointer" style={{ border: 'none', background: filter === k ? '#fff' : 'transparent', fontWeight: filter === k ? 600 : 400, color: filter === k ? '#111' : '#5C5C59' }}>{l}</button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-10 text-center flex flex-col gap-2">
          <span className="text-lg font-bold">لا توجد طلبات بعد</span>
          <span className="text-sm" style={{ color: '#5C5C59' }}>عندما يطلب أحد التعاون معك من صفحتك، سيظهر الطلب هنا.</span>
        </Card>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="md:w-[340px] shrink-0 flex flex-col gap-2.5">
            {shown.map((r) => (
              <button key={r.id} type="button" onClick={() => setSel(r.id)} className="text-right p-5 rounded-[28px] bg-white cursor-pointer flex flex-col gap-2" style={{ border: r.id === sel ? '1.5px solid #111' : '1px solid #ECECEA' }}>
                <span className="flex justify-between items-center"><Pill tone={META[r.status].tone}>{META[r.status].label}</Pill><span className="text-xs" style={{ color: '#5C5C59' }}>{relativeAr(r.created_at)}</span></span>
                <span className="text-base font-bold">{r.project_type || 'طلب تعاون'}</span>
                <span className="text-[13px]" style={{ color: '#5C5C59' }}>{r.sender_name} · {[r.city, r.country].filter(Boolean).join('، ')}</span>
                {r.start_date && <span className="text-xs" style={{ color: '#3A3A38' }}>{formatDateAr(r.start_date)}{r.end_date ? ` إلى ${formatDateAr(r.end_date)}` : ''}</span>}
              </button>
            ))}
            {shown.length === 0 && <div className="p-8 text-center rounded-[28px] text-sm" style={{ border: '1.5px dashed #CFCFCB', color: '#5C5C59' }}>لا توجد طلبات في هذا القسم.</div>}
          </div>

          {current && (
            <Card className="flex-1 p-6 md:p-9 flex flex-col gap-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-2">
                  <span><Pill tone={META[current.status].tone}>{META[current.status].label}</Pill></span>
                  <span className="text-[24px] md:text-[26px] font-bold">{current.project_type || 'طلب تعاون'}</span>
                  <span className="text-sm" style={{ color: '#5C5C59' }}>من {current.sender_name}</span>
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: '#5C5C59' }}>وصل {relativeAr(current.created_at)}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
                <Info label="تاريخ البدء" value={formatDateAr(current.start_date) || 'غير محدد'} />
                <Info label="تاريخ التسليم" value={formatDateAr(current.end_date) || 'غير محدد'} />
                <Info label="المدة" value={current.start_date && current.end_date ? durationAr(daysBetween(current.start_date, current.end_date)) : 'غير محددة'} />
                <Info label="نوع المشروع" value={current.project_type || 'غير محدد'} />
                <Info label="مكان التصوير" value={[current.city, current.country].filter(Boolean).join('، ') || 'غير محدد'} />
                <Info label="الميزانية" value={current.budget || 'حسب الاتفاق'} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold">تفاصيل المشروع</span>
                <p className="m-0 text-base whitespace-pre-line" style={{ lineHeight: 1.9, color: '#1F1F1E' }}>{current.details}</p>
              </div>
              {current.status === 'new' && (
                <div className="flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid #F0F0EE' }}>
                  <span className="text-[13px]" style={{ color: '#5C5C59' }}>يظهر بريد المرسل بعد قبول الطلب. تنتهي صلاحية الطلب بعد 4 أيام إن لم ترد.</span>
                  <div className="flex gap-2.5">
                    <Btn onClick={() => setStatus('accepted')}>قبول الطلب</Btn>
                    <Btn variant="danger" onClick={() => setStatus('declined')}>اعتذار</Btn>
                  </div>
                </div>
              )}
              {current.status === 'accepted' && (
                <div className="flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid #F0F0EE' }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-5 py-4 rounded-[22px] text-sm" style={{ background: '#E8F5EC', color: '#166534' }}>
                    <span>قبلت هذا الطلب. تواصل مع المرسل على بريده:</span>
                    <span dir="ltr" className="mono text-[13px]">{email || '…'}</span>
                  </div>
                  {email && (
                    <a href={`mailto:${email}?subject=${encodeURIComponent('بخصوص طلب التعاون عبر Makers')}`} className="self-start text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#2563EB', color: '#fff' }}>اكتب رداً عبر البريد</a>
                  )}
                </div>
              )}
              {current.status === 'declined' && <div className="px-5 py-4 rounded-[22px] text-sm" style={{ background: '#F7F7F6', color: '#5C5C59' }}>اعتذرت عن هذا الطلب.</div>}
              {current.status === 'expired' && <div className="px-5 py-4 rounded-[22px] text-sm" style={{ background: '#FEF3C7', color: '#92400E' }}>انتهت مدة هذا الطلب لأنه لم يُرد عليه خلال 4 أيام.</div>}
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
