import { useEffect, useState } from 'react'
import Link from '../lib/router'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Award, type Profile, type Work } from '../lib/supabase'
import { COUNTRIES, BUDGETS, cityLabel, PROJECT_TYPES, REMOTE, SITE_URL, formatDateAr, videoLengthLabel } from '../lib/constants'
import { isRtl, label, t } from '../lib/i18n'
import { roleLine, useSpecialties } from '../lib/specialties'
import { useAuth } from '../lib/auth'
import WorkThumb from '../components/WorkThumb'
import { Avatar, Btn, Card, Chip, Corners, Field, Notice, PageShell, Pill, SelectInput, Spinner, TextArea, TextInput } from '../components/mk'
import RangeCalendar from '../components/RangeCalendar'


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
          <h1 className="m-0 text-3xl font-bold">{t('الصفحة غير موجودة', 'Page not found')}</h1>
          <p className="m-0" style={{ color: '#5C5C59' }}>{t('ربما تغيّر الرابط أو لم تُنشر الصفحة بعد.', 'The link may have changed, or the page is not published yet.')}</p>
          <Link to="/" className="font-semibold" style={{ color: '#2563EB' }}>{t('العودة إلى الدليل', 'Back to the directory')}</Link>
        </div>
      </PageShell>
    )
  }

  const isOwner = session?.user.id === p.id
  const role = roleLine(specialties, p.specialty_ids, p.other_specialty)
  const place = [cityLabel(p.city), label(COUNTRIES, p.country)].filter(Boolean).join(t('، ', ', '))
  const years = p.start_year ? new Date().getFullYear() - p.start_year : null
  const vlen = videoLengthLabel(p.video_length)
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
        <Notice>{t('هذه معاينة لصفحتك. لن تظهر للزوار قبل موافقة فريق Makers.', 'This is a preview of your page. Visitors will see it once the Makers team approves it.')} <Link to="/me" className="font-semibold underline">{t('عد إلى التعديل', 'Back to editing')}</Link></Notice>
      )}

      <Card className="p-4 md:p-10 flex flex-col-reverse md:flex-row gap-5 md:gap-10 md:items-center">
        <div className="flex-1 flex flex-col gap-3 md:gap-3.5 px-1.5 md:px-0">
          <span className="text-[13px]" style={{ color: '#5C5C59' }}>{[role, place].filter(Boolean).join(' · ')}</span>
          <h1 className="m-0 text-[38px] md:text-[60px] font-bold" style={{ lineHeight: 1.15, letterSpacing: '-0.02em' }}>{p.full_name}</h1>
          {(p.start_year || vlen) && (
            <span className="text-[13px] mono" style={{ color: '#3A3A38' }}>
              {[p.start_year ? t(`يعمل في المجال منذ ${p.start_year}`, `In the industry since ${p.start_year}`) : '', vlen || ''].filter(Boolean).join(' · ')}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {isOwner ? (
              <Link to="/me" className="hidden md:inline-block text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#111', color: '#fff' }}>{t('تعديل الملف الشخصي', 'Edit profile')}</Link>
            ) : (
              <a href="#contact" className="hidden md:inline-block text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#2563EB', color: '#fff' }}>{t('اطلب تعاوناً', 'Request a collaboration')}</a>
            )}
            <button type="button" onClick={copy} className="hidden md:flex items-center gap-2 text-[13px] font-semibold px-4 py-3 rounded-full cursor-pointer bg-white" style={{ border: '1px solid #E3E3E0' }}>
              {copied ? t('تم نسخ الرابط', 'Link copied') : t('انسخ الرابط', 'Copy link')}
            </button>
            <span className="flex items-center gap-2 text-[13px] px-3.5 py-2 rounded-full" style={{ background: '#F3F3F2' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: p.available ? '#16A34A' : '#BDBDB9' }} />
              {p.available ? t('متاح للعمل', 'Available for work') : t('غير متاح حالياً', 'Not available right now')}
            </span>
            {p.status === 'approved' && <Pill tone="green">{t('موثّق', 'Verified')}</Pill>}
            {p.is_founding && <Pill>{t('عضو مؤسس', 'Founding member')}</Pill>}
          </div>
          <div className="flex md:hidden gap-2 mt-2">
            {isOwner ? (
              <Link to="/me" className="flex-1 text-center text-[15px] font-semibold py-3.5 rounded-full" style={{ background: '#111', color: '#fff' }}>{t('تعديل الملف الشخصي', 'Edit profile')}</Link>
            ) : (
              <a href="#contact" className="flex-1 text-center text-[15px] font-semibold py-3.5 rounded-full" style={{ background: '#2563EB', color: '#fff' }}>{t('اطلب تعاوناً', 'Request a collaboration')}</a>
            )}
            <button type="button" onClick={copy} className="text-[13px] font-semibold px-4 rounded-full cursor-pointer bg-white" style={{ border: '1px solid #E3E3E0' }}>{copied ? t('تم النسخ', 'Copied') : t('انسخ الرابط', 'Copy link')}</button>
          </div>
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {socials.map(([k, v]) => (
                <a key={k} href={v.startsWith('http') ? v : '#'} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-full" style={{ border: '1px solid #E3E3E0' }} dir="ltr">
                  {k}{p.followers?.[k] ? ` · ${Number(p.followers[k]).toLocaleString('en')}` : ''}
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
        <Stat value={years !== null ? t(`+${years}`, `${years}+`) : '·'} label={t('سنوات في المجال', 'Years in the industry')} />
        <Stat value={String(awards.length)} label={t('جوائز واعتمادات', 'Awards & credits')} />
        <Stat value={String(works.length)} label={t('أعمال في الصفحة', 'Works on page')} />
      </div>

      {p.bio && (
        <Card className="px-5 py-6 md:px-10 md:py-9 flex flex-col gap-3">
          <span className="text-[13px] font-semibold">{t('نبذة', 'About')}</span>
          <p dir="auto" className="m-0 text-base md:text-lg whitespace-pre-line" style={{ lineHeight: 1.95, color: "#1F1F1E" }}>{p.bio}</p>
        </Card>
      )}

      {works.length > 0 && (
        <Card className="px-5 py-6 md:px-10 md:py-9 flex flex-col gap-5">
          <span className="text-[13px] font-semibold">{t('أعمال مختارة', 'Selected work')}</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {works.map((w, i) => (
              <a key={w.id} href={w.url || '#'} target="_blank" rel="noreferrer" className="flex md:flex-col gap-3.5 md:gap-3 items-center md:items-stretch">
                <WorkThumb work={w} index={i} className="w-28 h-[72px] md:w-auto md:h-[170px] rounded-[18px] md:rounded-[24px]" />
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
          <span className="text-[13px] font-semibold pt-4 pb-1.5">{t('الجوائز والاعتمادات', 'Awards & credits')}</span>
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
  const [budget, setBudget] = useState(BUDGETS[0].ar)
  const [start, setStart] = useState<string | null>(null)
  const [end, setEnd] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const first = (to.full_name || '').split(' ')[0]

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (details.trim().length < 10) return setError(t('اكتب تفاصيل المشروع في سطر واحد على الأقل.', 'Describe the project in at least one line.'))
    if (!ptype) return setError(t('اختر نوع المشروع.', 'Choose a project type.'))
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
        m.includes('too many') ? t('أرسلت طلبات كثيرة اليوم. حاول غداً.', 'You sent many requests today. Try again tomorrow.')
          : m.includes('recently') ? t('أرسلت طلباً لهذا الشخص مؤخراً. انتظر رده.', 'You recently sent this person a request. Wait for their reply.')
            : m.includes('past') ? t('تاريخ البدء في الماضي.', 'The start date is in the past.')
              : m.includes('sender_email') ? t('تحقق من البريد الإلكتروني.', 'Check the email address.')
                : t('تعذّر إرسال الطلب. تحقق من البيانات وحاول مرة أخرى.', 'Could not send the request. Check the details and try again.'),
      )
      return
    }
    setSent(true)
  }

  return (
    <Card dark className="p-5 md:p-10 flex flex-col gap-6" style={{ scrollMarginTop: 24 }}>
      <div id="contact" className="flex flex-col gap-1.5">
        <span className="text-[22px] md:text-[26px] font-bold">{t(`اطلب تعاوناً مع ${first}`, `Request a collaboration with ${first}`)}</span>
        <span className="text-sm" style={{ color: '#A3A3A0' }}>{t(`أخبر ${first} عن مشروعك، واختر تاريخ البدء وتاريخ التسليم من التقويم.`, `Tell ${first} about your project, and pick a start date and a delivery date on the calendar.`)}</span>
      </div>
      {sent ? (
        <div className="flex items-center gap-3 px-5 py-4 rounded-[24px] text-[15px]" style={{ background: '#14321F', color: '#86EFAC' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
          {t(`تم إرسال طلبك إلى ${first}`, `Your request was sent to ${first}`)}{start && end ? t(` (من ${formatDateAr(start)} إلى ${formatDateAr(end)})`, ` (${formatDateAr(start)} to ${formatDateAr(end)})`) : ''}{t('. ستصلك الإجابة على بريدك الإلكتروني.', '. The reply will reach your email.')}
        </div>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={t('الاسم', 'Name')} dark><TextInput dark required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('الاسم الكامل', 'Full name')} /></Field>
            <Field label={t('البريد الإلكتروني', 'Email')} dark><TextInput dark required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" style={{ textAlign: isRtl() ? 'right' : 'left' }} /></Field>
          </div>
          <Field label={t('تفاصيل المشروع', 'Project details')} dark><TextArea dark required rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('ما فكرة المشروع؟ وأين سيكون التصوير؟', 'What is the idea? Where will you shoot?')} /></Field>
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold" style={{ color: '#A3A3A0' }}>{t('نوع المشروع', 'Project type')}</span>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map((pt) => <Chip key={pt.ar} dark on={ptype === pt.ar} onClick={() => setPtype(pt.ar)}>{t(pt.ar, pt.en)}</Chip>)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={t('دولة التصوير', 'Shooting country')} dark>
              <SelectInput dark value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => <option key={c.ar} value={c.ar}>{t(c.ar, c.en)}</option>)}
                <option value={REMOTE.ar}>{t(REMOTE.ar, REMOTE.en)}</option>
              </SelectInput>
            </Field>
            <Field label={t('المدينة', 'City')} dark><TextInput dark value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('مثال: عمّان', 'e.g. Amman')} /></Field>
            <Field label={t('الميزانية (اختياري)', 'Budget (optional)')} dark>
              <SelectInput dark value={budget} onChange={(e) => setBudget(e.target.value)}>
                {BUDGETS.map((b) => <option key={b.ar} value={b.ar}>{t(b.ar, b.en)}</option>)}
              </SelectInput>
            </Field>
          </div>
          <RangeCalendar start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <Btn type="submit" disabled={busy} className="px-7">{busy ? t('جارٍ الإرسال…', 'Sending…') : t('أرسل الطلب', 'Send request')}</Btn>
            <span className="text-xs" style={{ color: '#A3A3A0' }}>{t(`يصل طلبك إلى صندوق ${first} داخل Makers، وستتلقى الرد على بريدك الإلكتروني.`, `Your request goes to ${first}'s Makers inbox, and the reply comes to your email.`)}</span>
          </div>
        </form>
      )}
    </Card>
  )
}
