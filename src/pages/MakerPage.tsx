import { useEffect, useState } from 'react'
import Link from '../lib/router'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Award, type Profile, type Work } from '../lib/supabase'
import { ARAB_COUNTRIES, BUDGETS, PROJECT_TYPES, SITE_URL, formatDateAr, VIDEO_LENGTHS } from '../lib/constants'
import { roleLine, useSpecialties } from '../lib/specialties'
import { useAuth } from '../lib/auth'
import { Avatar, Btn, Card, Chip, Corners, Field, Notice, PageShell, Pill, SelectInput, Spinner, TextArea, TextInput } from '../components/mk'
import RangeCalendar from '../components/RangeCalendar'

const WORK_TONES = ['#232220', '#5E4A38', '#37414C', '#4A3F52', '#3F4A3C', '#52463A']

export default function MakerPage({ username }: { username: string }) {
  const specialties = useSpecialties()
  const { session } = useAuth()
  const [p, setP] = useState<Profile | null | undefined>(undefined)
  const [works, setWorks] = useState<Work[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setP(undefined)
    supabase
      .from('profiles')
      .select(PUBLIC_PROFILE_COLUMNS)
      .ilike('username', username)
      .maybeSingle()
      .then(async ({ data }) => {
        const prof = (data as unknown as Profile) || null
        setP(prof)
        if (prof) {
          document.title = `${prof.full_name} | Makers`
          const [w, a] = await Promise.all([
            supabase.from('works').select('*').eq('owner_id', prof.id).order('sort').order('created_at'),
            supabase.from('awards').select('*').eq('owner_id', prof.id).order('year', { ascending: true }),
          ])
          setWorks((w.data as Work[]) || [])
          setAwards((a.data as Award[]) || [])
        }
      })
  }, [username])

  if (p === undefined) return <PageShell><Spinner /></PageShell>
  if (p === null) {
    return (
      <PageShell narrow>
        <div className="py-20 flex flex-col gap-4 items-start">
          <h1 className="m-0 text-3xl font-bold">الصفحة غير موجودة</h1>
          <p className="m-0" style={{ color: '#5C5C59' }}>ربما تغيّر الرابط أو لم تُنشر الصفحة بعد.</p>
          <Link to="/" className="font-semibold" style={{ color: '#2563EB' }}>العودة إلى الدليل</Link>
        </div>
      </PageShell>
    )
  }

  const isOwner = session?.user.id === p.id
  const role = roleLine(specialties, p.specialty_ids, p.other_specialty)
  const place = [p.city, p.country].filter(Boolean).join('، ')
  const years = p.start_year ? new Date().getFullYear() - p.start_year : null
  const vlen = VIDEO_LENGTHS.find((v) => v.key === p.video_length)?.label
  const link = `${SITE_URL}/${p.username}`
  const socials = Object.entries(p.socials || {}).filter(([, v]) => v)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      /* clipboard may be blocked */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <PageShell>
      {p.status !== 'approved' && isOwner && (
        <Notice>هذه معاينة لصفحتك. لن تظهر للزوار قبل موافقة فريق Makers. <Link to="/me" className="font-semibold underline">عد إلى التعديل</Link></Notice>
      )}

      <Card className="p-4 md:p-10 flex flex-col-reverse md:flex-row gap-5 md:gap-10 md:items-center">
        <div className="flex-1 flex flex-col gap-3 md:gap-3.5 px-1.5 md:px-0">
          <span className="text-[13px]" style={{ color: '#5C5C59' }}>{[role, place].filter(Boolean).join(' · ')}</span>
          <h1 className="m-0 text-[38px] md:text-[60px] font-bold" style={{ lineHeight: 1.15, letterSpacing: '-0.02em' }}>{p.full_name}</h1>
          {(p.start_year || vlen) && (
            <span className="text-[13px] mono" style={{ color: '#3A3A38' }}>
              {[p.start_year ? `يعمل في المجال منذ ${p.start_year}` : '', vlen || ''].filter(Boolean).join(' · ')}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {isOwner ? (
              <Link to="/me" className="hidden md:inline-block text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#111', color: '#fff' }}>تعديل الملف الشخصي</Link>
            ) : (
              <a href="#contact" className="hidden md:inline-block text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#2563EB', color: '#fff' }}>اطلب تعاوناً</a>
            )}
            <button type="button" onClick={copy} className="hidden md:flex items-center gap-2 text-[13px] font-semibold px-4 py-3 rounded-full cursor-pointer bg-white" style={{ border: '1px solid #E3E3E0' }}>
              {copied ? 'تم نسخ الرابط' : 'انسخ الرابط'}
            </button>
            <span className="flex items-center gap-2 text-[13px] px-3.5 py-2 rounded-full" style={{ background: '#F3F3F2' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: p.available ? '#16A34A' : '#BDBDB9' }} />
              {p.available ? 'متاح للعمل' : 'غير متاح حالياً'}
            </span>
            {p.status === 'approved' && <Pill tone="green">موثّق</Pill>}
            {p.is_founding && <Pill>عضو مؤسس</Pill>}
          </div>
          <div className="flex md:hidden gap-2 mt-2">
            {isOwner ? (
              <Link to="/me" className="flex-1 text-center text-[15px] font-semibold py-3.5 rounded-full" style={{ background: '#111', color: '#fff' }}>تعديل الملف الشخصي</Link>
            ) : (
              <a href="#contact" className="flex-1 text-center text-[15px] font-semibold py-3.5 rounded-full" style={{ background: '#2563EB', color: '#fff' }}>اطلب تعاوناً</a>
            )}
            <button type="button" onClick={copy} className="text-[13px] font-semibold px-4 rounded-full cursor-pointer bg-white" style={{ border: '1px solid #E3E3E0' }}>{copied ? 'تم النسخ' : 'انسخ الرابط'}</button>
          </div>
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {socials.map(([k, v]) => (
                <a key={k} href={v.startsWith('http') ? v : '#'} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-full" style={{ border: '1px solid #E3E3E0' }} dir="ltr">
                  {k}{p.followers?.[k] ? ` · ${Number(p.followers[k]).toLocaleString('ar')}` : ''}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="relative w-full md:w-[220px] h-[380px] md:h-[270px] shrink-0 rounded-[24px] md:rounded-[28px] overflow-hidden bw flex items-center justify-center" style={{ background: '#DADADA' }}>
          {p.avatar_url ? <img src={p.avatar_url} alt={p.full_name || ''} className="w-full h-full object-cover" /> : <span className="text-7xl font-semibold" style={{ color: '#A8A8A8' }}>{(p.full_name || 'م').charAt(0)}</span>}
          <Corners size={20} inset={14} color={p.avatar_url ? '#FFFFFF' : '#111111'} />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Stat value={years !== null ? `+${years}` : '·'} label="سنوات في المجال" />
        <Stat value={String(awards.length)} label="جوائز واعتمادات" />
        <Stat value={String(works.length)} label="أعمال في الصفحة" />
      </div>

      {p.bio && (
        <Card className="px-5 py-6 md:px-10 md:py-9 flex flex-col gap-3">
          <span className="text-[13px] font-semibold">نبذة</span>
          <p className="m-0 text-base md:text-lg" style={{ lineHeight: 1.95, color: '#1F1F1E' }}>{p.bio}</p>
        </Card>
      )}

      {works.length > 0 && (
        <Card className="px-5 py-6 md:px-10 md:py-9 flex flex-col gap-5">
          <span className="text-[13px] font-semibold">أعمال مختارة</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {works.map((w, i) => (
              <a key={w.id} href={w.url || '#'} target="_blank" rel="noreferrer" className="flex md:flex-col gap-3.5 md:gap-3 items-center md:items-stretch">
                <span className="relative w-24 h-[72px] md:w-auto md:h-[170px] rounded-[18px] md:rounded-[24px] shrink-0 flex items-end p-2 md:p-4" style={{ background: WORK_TONES[i % WORK_TONES.length] }}>
                  <Corners size={12} inset={10} color="#FFFFFF" w={1.5} />
                  <span className="mono text-[10px] md:text-[11px] text-white px-1 md:px-2" dir="ltr">{[w.platform, w.year].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="flex flex-col gap-1 px-1">
                  <span className="text-[15px] font-semibold">{w.title}</span>
                  {w.role && <span className="text-[13px]" style={{ color: '#5C5C59' }}>{w.role}</span>}
                </span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {awards.length > 0 && (
        <Card className="px-5 md:px-10 py-3 md:py-4 flex flex-col">
          <span className="text-[13px] font-semibold pt-4 pb-1.5">الجوائز والاعتمادات</span>
          {awards.map((a) => (
            <div key={a.id} className="flex items-center gap-3 md:gap-4 py-4" style={{ borderBottom: '1px solid #F0F0EE' }}>
              <span className="text-[15px] md:text-base font-semibold whitespace-nowrap">{a.rank}</span>
              <span className="hidden md:block flex-1 mt-2" style={{ borderBottom: '2px dotted #C9C9C5' }} />
              <span className="flex-1 md:flex-none text-sm" style={{ color: '#3A3A38' }}>{a.org}</span>
              <span className="mono text-xs w-9" style={{ color: '#5C5C59' }}>{a.year || ''}</span>
            </div>
          ))}
        </Card>
      )}

      {!isOwner && p.status === 'approved' && <ContactForm to={p} />}
    </PageShell>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card className="p-4 md:p-7 flex flex-col gap-1 md:gap-1.5">
      <span className="text-[26px] md:text-[40px] font-bold mono">{value}</span>
      <span className="text-[11px] md:text-[13px]" style={{ color: '#5C5C59' }}>{label}</span>
    </Card>
  )
}

function ContactForm({ to }: { to: Profile }) {
  const { session } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(session?.user.email || '')
  const [details, setDetails] = useState('')
  const [ptype, setPtype] = useState<string | null>(null)
  const [country, setCountry] = useState(to.country || 'الأردن')
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState(BUDGETS[0])
  const [start, setStart] = useState<string | null>(null)
  const [end, setEnd] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const first = (to.full_name || '').split(' ')[0]

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (details.trim().length < 10) return setError('اكتب تفاصيل المشروع في سطر واحد على الأقل.')
    if (!ptype) return setError('اختر نوع المشروع.')
    setBusy(true)
    const { error } = await supabase.rpc('send_contact_request', {
      p_to: to.id,
      p_name: name,
      p_email: email,
      p_details: details,
      p_project_type: ptype,
      p_country: country,
      p_city: city || null,
      p_budget: budget,
      p_start: start,
      p_end: end,
    })
    setBusy(false)
    if (error) {
      const m = error.message
      setError(
        m.includes('too many') ? 'أرسلت طلبات كثيرة اليوم. حاول غداً.'
          : m.includes('recently') ? 'أرسلت طلباً لهذا الشخص مؤخراً. انتظر رده.'
            : m.includes('past') ? 'تاريخ البدء في الماضي.'
              : m.includes('sender_email') ? 'تحقق من البريد الإلكتروني.'
                : 'تعذّر إرسال الطلب. تحقق من البيانات وحاول مرة أخرى.',
      )
      return
    }
    setSent(true)
  }

  return (
    <Card dark className="p-5 md:p-10 flex flex-col gap-6" style={{ scrollMarginTop: 24 }}>
      <div id="contact" className="flex flex-col gap-1.5">
        <span className="text-[22px] md:text-[26px] font-bold">اطلب تعاوناً مع {first}</span>
        <span className="text-sm" style={{ color: '#A3A3A0' }}>أخبر {first} عن مشروعك، واختر تاريخ البدء وتاريخ التسليم من التقويم.</span>
      </div>
      {sent ? (
        <div className="flex items-center gap-3 px-5 py-4 rounded-[24px] text-[15px]" style={{ background: '#14321F', color: '#86EFAC' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
          تم إرسال طلبك إلى {first}{start && end ? ` (من ${formatDateAr(start)} إلى ${formatDateAr(end)})` : ''}. ستصلك الإجابة على بريدك الإلكتروني.
        </div>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="الاسم" dark><TextInput dark required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" /></Field>
            <Field label="البريد الإلكتروني" dark><TextInput dark required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" style={{ textAlign: 'right' }} /></Field>
          </div>
          <Field label="تفاصيل المشروع" dark><TextArea dark required rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="ما فكرة المشروع؟ وأين سيكون التصوير؟" /></Field>
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold" style={{ color: '#A3A3A0' }}>نوع المشروع</span>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map((t) => <Chip key={t} dark on={ptype === t} onClick={() => setPtype(t)}>{t}</Chip>)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="دولة التصوير" dark>
              <SelectInput dark value={country} onChange={(e) => setCountry(e.target.value)}>
                {ARAB_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                <option>تصوير عن بُعد أو بدون تصوير</option>
              </SelectInput>
            </Field>
            <Field label="المدينة" dark><TextInput dark value={city} onChange={(e) => setCity(e.target.value)} placeholder="مثال: عمّان" /></Field>
            <Field label="الميزانية (اختياري)" dark>
              <SelectInput dark value={budget} onChange={(e) => setBudget(e.target.value)}>
                {BUDGETS.map((b) => <option key={b}>{b}</option>)}
              </SelectInput>
            </Field>
          </div>
          <RangeCalendar start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <Btn type="submit" disabled={busy} className="px-7">{busy ? 'جارٍ الإرسال…' : 'أرسل الطلب'}</Btn>
            <span className="text-xs" style={{ color: '#A3A3A0' }}>يصل طلبك إلى صندوق {first} داخل Makers، وستتلقى الرد على بريدك الإلكتروني.</span>
          </div>
        </form>
      )}
    </Card>
  )
}
