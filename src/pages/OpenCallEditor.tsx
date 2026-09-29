import { useEffect, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { t, useLang } from '../lib/i18n'
import { COUNTRIES, BUDGETS } from '../lib/constants'
import { useSpecialties } from '../lib/specialties'
import { PROJECT_KINDS } from '../lib/data'
import { PageHeader } from '../components/cine'
import { Btn, Chip, Field, Notice, PageShell, SelectInput, Spinner, TextArea, TextInput } from '../components/mk'

const card = { background: 'var(--c-surface)', border: '1px solid var(--c-border)' } as const

export default function OpenCallEditor() {
  useLang()
  const { go } = useRouter()
  const { profile, loading } = useAuth()
  const specialties = useSpecialties()
  const [title, setTitle] = useState('')
  const [org, setOrg] = useState('')
  const [kind, setKind] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [roles, setRoles] = useState<number[]>([])
  const [remote, setRemote] = useState(false)
  const [country, setCountry] = useState(profile?.country || 'الأردن')
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // The profile can arrive after the first render; default the shoot country to the member's own.
  useEffect(() => { if (profile?.country) setCountry(profile.country) }, [profile?.country])

  if (loading) return <Spinner />
  if (!profile) return <PageShell narrow><Notice>{t('سجّل الدخول لنشر فرصة.', 'Sign in to post an opportunity.')} <Link to="/login" className="font-semibold underline">{t('دخول', 'Sign in')}</Link></Notice></PageShell>
  if (profile.status !== 'approved') return <PageShell narrow><Notice>{t('يمكنك نشر الفرص بعد موافقة فريق Makers على ملفك.', 'You can post opportunities once the Makers team approves your profile.')}</Notice></PageShell>

  if (done) {
    return (
      <PageShell narrow>
        <div className="py-16 text-center flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'var(--c-accent)' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M8 18l7 7L28 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="font-bold text-2xl m-0">{t('وصلتنا فرصتك', 'We got your opportunity')}</h1>
          <p className="m-0 max-w-sm leading-relaxed" style={{ color: 'var(--c-muted)' }}>{t('يراجعها فريق Makers وتُنشر خلال وقت قصير. ستصلك الطلبات في صندوق الوارد.', 'The Makers team will review it and publish it shortly. Applications will arrive in your inbox.')}</p>
          <Link to="/opportunities" className="font-semibold px-8 py-3 rounded-full" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>{t('كل الفرص', 'All opportunities')}</Link>
        </div>
      </PageShell>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (title.trim().length < 3) return setError(t('اكتب عنواناً واضحاً للفرصة.', 'Write a clear title.'))
    if (description.trim().length < 10) return setError(t('اشرح المشروع والمطلوب في سطرين على الأقل.', 'Describe the project and what you need in a couple of lines.'))
    if (!roles.length) return setError(t('اختر دوراً واحداً على الأقل.', 'Choose at least one role.'))
    if (deadline && deadline < new Date().toISOString().slice(0, 10)) return setError(t('آخر موعد في الماضي.', 'The deadline is in the past.'))
    setBusy(true)
    const { error } = await supabase.rpc('create_open_call', {
      p: { title: title.trim(), org: org.trim(), kind, description: description.trim(), role_ids: roles, remote, country: remote ? null : country, city: remote ? null : city.trim(), budget: budget || null, deadline: deadline || null },
    })
    setBusy(false)
    if (error) return setError(error.message.includes('rate') ? t('نشرت فرصاً كثيرة اليوم. حاول غداً.', 'You posted many calls today. Try tomorrow.') : t('تعذّر النشر. تحقق من البيانات.', 'Could not post. Check the details.'))
    setDone(true)
  }

  return (
    <PageShell narrow>
      <PageHeader label="CALL SHEET · DRAFT" title={t('انشر فرصة', 'Post an opportunity')} sub={t('مشروع يحتاج طاقم؟ اكتب التفاصيل، ويراجعها فريقنا قبل النشر.', 'A project that needs a crew? Add the details and our team reviews it before it goes live.')} />

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
          <Field label={t('عنوان الفرصة *', 'Title *')}><TextInput required maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('مثال: مدير تصوير لإعلان رمضان', 'e.g. DOP for a Ramadan commercial')} /></Field>
          <Field label={t('الجهة (اختياري)', 'Company or brand (optional)')}><TextInput maxLength={120} value={org} onChange={(e) => setOrg(e.target.value)} /></Field>
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--c-text-2)' }}>{t('نوع المشروع', 'Project type')}</span>
            <div className="flex flex-wrap gap-2">{PROJECT_KINDS.map((k) => <Chip key={k.key} on={kind === k.key} onClick={() => setKind(kind === k.key ? null : k.key)}>{t(k.ar, k.en)}</Chip>)}</div>
          </div>
          <Field label={t('التفاصيل *', 'Details *')}><TextArea required rows={5} maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('ما المشروع؟ متى وأين التصوير؟ ما الخبرة المطلوبة؟', 'What is the project? When and where is the shoot? What experience do you need?')} /></Field>
        </div>

        <div className="p-5 rounded-2xl flex flex-col gap-3" style={card}>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--c-text-2)' }}>{t('الأدوار المطلوبة *', 'Roles needed *')}</span>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => <Chip key={s.id} on={roles.includes(s.id)} onClick={() => setRoles(roles.includes(s.id) ? roles.filter((x) => x !== s.id) : [...roles, s.id])}>{t(s.name_ar || s.name_en, s.name_en)}</Chip>)}
          </div>
        </div>

        <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
          <div className="flex gap-2">
            <Chip on={!remote} onClick={() => setRemote(false)}>{t('في موقع محدد', 'On location')}</Chip>
            <Chip on={remote} onClick={() => setRemote(true)}>{t('عن بُعد', 'Remote')}</Chip>
          </div>
          {!remote && (
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('الدولة', 'Country')}><SelectInput value={country} onChange={(e) => setCountry(e.target.value)}>{COUNTRIES.map((c) => <option key={c.ar} value={c.ar}>{t(c.ar, c.en)}</option>)}</SelectInput></Field>
              <Field label={t('المدينة', 'City')}><TextInput maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('مثال: عمّان', 'e.g. Amman')} /></Field>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('الميزانية', 'Budget')}>
              <SelectInput value={budget} onChange={(e) => setBudget(e.target.value)}>
                <option value="">{t('حسب الاتفاق', 'Open to discuss')}</option>
                {BUDGETS.slice(1).map((b) => <option key={b.ar} value={b.ar}>{t(b.ar, b.en)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t('آخر موعد للتقديم', 'Apply by')}><TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().slice(0, 10)} dir="ltr" /></Field>
          </div>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex gap-2">
          <Btn type="submit" disabled={busy}>{busy ? t('جارٍ الإرسال…', 'Sending…') : t('أرسل للمراجعة', 'Send for review')}</Btn>
          <Btn type="button" variant="outline" onClick={() => go('/opportunities')}>{t('إلغاء', 'Cancel')}</Btn>
        </div>
      </form>
    </PageShell>
  )
}
