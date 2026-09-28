import { useState } from 'react'
import { supabase, type Profile } from '../lib/supabase'
import { COUNTRIES, BUDGETS, PROJECT_TYPES, REMOTE, formatDateAr } from '../lib/constants'
import { isRtl, t } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import Link from '../lib/router'
import { Btn, Chip, Field, Notice, SelectInput, TextArea, TextInput } from './mk'
import RangeCalendar from './RangeCalendar'

export default function ContactForm({ to, onDone }: { to: Pick<Profile, "id" | "full_name" | "country">; onDone?: () => void }) {
  const { session, profile: viewer } = useAuth()
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t(`أخبر ${first} عن مشروعك، واختر تاريخ البدء وتاريخ التسليم من التقويم.`, `Tell ${first} about your project, and pick a start date and a delivery date on the calendar.`)}</span>
      </div>
      {sent ? (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl text-[15px]" style={{ background: 'rgba(74,222,128,0.12)', color: '#86EFAC' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
          {t(`تم إرسال طلبك إلى ${first}`, `Your request was sent to ${first}`)}{start && end ? t(` (من ${formatDateAr(start)} إلى ${formatDateAr(end)})`, ` (${formatDateAr(start)} to ${formatDateAr(end)})`) : ''}{viewer?.status === 'approved' ? t('. تجده الآن في رسائلكما، والرد يصلك هناك.', '. It is now in your messages together, and the reply will come there.') : t('. ستصلك الإجابة على بريدك الإلكتروني.', '. The reply will reach your email.')}
          {viewer?.status === 'approved' && <Link to="/messages" className="ms-auto shrink-0 font-semibold underline">{t('افتح الرسائل', 'Open messages')}</Link>}
        </div>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={t('الاسم', 'Name')}><TextInput required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('الاسم الكامل', 'Full name')} /></Field>
            <Field label={t('البريد الإلكتروني', 'Email')}><TextInput required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" style={{ textAlign: isRtl() ? 'right' : 'left' }} /></Field>
          </div>
          <Field label={t('تفاصيل المشروع', 'Project details')}><TextArea required rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('ما فكرة المشروع؟ وأين سيكون التصوير؟', 'What is the idea? Where will you shoot?')} /></Field>
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--c-muted)' }}>{t('نوع المشروع', 'Project type')}</span>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map((pt) => <Chip key={pt.ar} on={ptype === pt.ar} onClick={() => setPtype(pt.ar)}>{t(pt.ar, pt.en)}</Chip>)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={t('دولة التصوير', 'Shooting country')}>
              <SelectInput value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => <option key={c.ar} value={c.ar}>{t(c.ar, c.en)}</option>)}
                <option value={REMOTE.ar}>{t(REMOTE.ar, REMOTE.en)}</option>
              </SelectInput>
            </Field>
            <Field label={t('المدينة', 'City')}><TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('مثال: عمّان', 'e.g. Amman')} /></Field>
            <Field label={t('الميزانية (اختياري)', 'Budget (optional)')}>
              <SelectInput value={budget} onChange={(e) => setBudget(e.target.value)}>
                {BUDGETS.map((b) => <option key={b.ar} value={b.ar}>{t(b.ar, b.en)}</option>)}
              </SelectInput>
            </Field>
          </div>
          <RangeCalendar start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <Btn type="submit" disabled={busy} className="px-7">{busy ? t('جارٍ الإرسال…', 'Sending…') : t('أرسل الطلب', 'Send request')}</Btn>
            <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{t(`يصل طلبك إلى صندوق ${first} داخل Makers، وستتلقى الرد على بريدك الإلكتروني.`, `Your request goes to ${first}'s Makers inbox, and the reply comes to your email.`)}</span>
          </div>
        </form>
      )}
    </div>
  )
}
