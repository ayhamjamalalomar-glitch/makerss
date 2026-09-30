import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { COUNTRIES, BUDGETS, PROJECT_TYPES, REMOTE, formatDateAr } from '@/lib/constants'
import { t, useLang } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { displayName } from '@/lib/data'
import { Btn, Chip, Chips, Header, Input, Label, Notice, Screen, SelectField, Spinner, Txt } from '@/components/ui'
import { RangeCalendar } from '@/components/RangeCalendar'

interface Target { id: string; full_name: string | null; name_ar: string | null; country: string | null }

/** Collaboration request, same form as on a maker's page on the website. */
export default function CollabRequest() {
  useLang()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { c } = useTheme()
  const { session, profile: viewer } = useAuth()
  const [to, setTo] = useState<Target | null | undefined>(undefined)
  const [name, setName] = useState('')
  const [email, setEmail] = useState(session?.user.email || '')
  const [details, setDetails] = useState('')
  const [ptype, setPtype] = useState<string | null>(null)
  const [country, setCountry] = useState('الأردن')
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState(BUDGETS[0].ar)
  const [start, setStart] = useState<string | null>(null)
  const [end, setEnd] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase.from('profiles').select('id, full_name, name_ar, country').eq('id', id).maybeSingle().then(({ data }) => {
      const x = (data as Target) || null
      setTo(x)
      if (x?.country) setCountry(x.country)
    })
  }, [id])

  useEffect(() => { if (viewer?.full_name && !name) setName(viewer.full_name) }, [viewer?.full_name]) // eslint-disable-line react-hooks/exhaustive-deps

  if (to === undefined) return <Screen header={<Header />}><Spinner /></Screen>
  if (!to) return <Screen header={<Header />}><Notice tone="error">{t('الصفحة غير موجودة', 'Page not found')}</Notice></Screen>

  const first = displayName(to).split(' ')[0]

  const send = async () => {
    setError(null)
    if (name.trim().length < 2) return setError(t('اكتب اسمك.', 'Write your name.'))
    if (details.trim().length < 10) return setError(t('اكتب تفاصيل المشروع في سطر واحد على الأقل.', 'Describe the project in at least one line.'))
    if (!ptype) return setError(t('اختر نوع المشروع.', 'Choose a project type.'))
    setBusy(true)
    const { error } = await supabase.rpc('send_contact_request', {
      p_to: to.id, p_name: name.trim(), p_email: email.trim(), p_details: details, p_project_type: ptype,
      p_country: country, p_city: city || null, p_budget: budget, p_start: start, p_end: end,
    })
    setBusy(false)
    if (error) {
      const m = error.message
      return setError(
        m.includes('too many') ? t('أرسلت طلبات كثيرة اليوم. حاول غداً.', 'You sent many requests today. Try again tomorrow.')
          : m.includes('recently') ? t('أرسلت طلباً لهذا الشخص مؤخراً. انتظر رده.', 'You recently sent this person a request. Wait for their reply.')
            : m.includes('past') ? t('تاريخ البدء في الماضي.', 'The start date is in the past.')
              : m.includes('sender_email') ? t('تحقق من البريد الإلكتروني.', 'Check the email address.')
                : t('تعذّر إرسال الطلب. تحقق من البيانات وحاول مرة أخرى.', 'Could not send the request. Check the details and try again.'),
      )
    }
    setSent(true)
  }

  if (sent) {
    return (
      <Screen header={<Header />}>
        <View style={{ gap: 14, paddingTop: 20 }}>
          <Txt display size={28}>{t(`تم إرسال طلبك إلى ${first}`, `Your request was sent to ${first}`)}</Txt>
          <Txt size={15} color={c.text2}>
            {start && end ? t(`من ${formatDateAr(start)} إلى ${formatDateAr(end)}. `, `${formatDateAr(start)} to ${formatDateAr(end)}. `) : ''}
            {viewer?.status === 'approved' ? t('تجده الآن في رسائلكما، والرد يصلك هناك.', 'It is now in your messages together, and the reply will come there.') : t('ستصلك الإجابة على بريدك الإلكتروني.', 'The reply will reach your email.')}
          </Txt>
          {viewer?.status === 'approved' ? <Btn onPress={() => { router.back(); router.navigate('/messages') }}>{t('افتح الرسائل', 'Open messages')}</Btn> : <Btn variant="outline" onPress={() => router.back()}>{t('رجوع', 'Back')}</Btn>}
        </View>
      </Screen>
    )
  }

  return (
    <Screen keyboard header={<Header title={t(`اطلب تعاوناً مع ${first}`, `Collaborate with ${first}`)} />}>
      <Txt size={14} color={c.muted}>{t(`أخبر ${first} عن مشروعك، واختر تاريخ البدء وتاريخ التسليم من التقويم.`, `Tell ${first} about your project, and pick a start date and a delivery date on the calendar.`)}</Txt>
      <Input label={t('الاسم', 'Name')} value={name} onChangeText={setName} placeholder={t('الاسم الكامل', 'Full name')} textContentType="name" />
      <Input label={t('البريد الإلكتروني', 'Email')} ltr value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" />
      <Input label={t('تفاصيل المشروع', 'Project details')} multiline value={details} onChangeText={setDetails} maxLength={2000} placeholder={t('ما فكرة المشروع؟ وأين سيكون التصوير؟', 'What is the idea? Where will you shoot?')} />
      <View style={{ gap: 10 }}>
        <Label>{t('نوع المشروع', 'Project type')}</Label>
        <Chips>{PROJECT_TYPES.map((pt) => <Chip key={pt.ar} on={ptype === pt.ar} onPress={() => setPtype(pt.ar)}>{t(pt.ar, pt.en)}</Chip>)}</Chips>
      </View>
      <SelectField label={t('دولة التصوير', 'Shooting country')} value={country} onChange={setCountry}
        options={[...COUNTRIES.map((x) => ({ value: x.ar, label: t(x.ar, x.en) })), { value: REMOTE.ar, label: t(REMOTE.ar, REMOTE.en) }]} />
      <Input label={t('المدينة', 'City')} value={city} onChangeText={setCity} placeholder={t('مثال: عمّان', 'e.g. Amman')} />
      <SelectField label={t('الميزانية (اختياري)', 'Budget (optional)')} value={budget} onChange={setBudget} options={BUDGETS.map((b) => ({ value: b.ar, label: t(b.ar, b.en) }))} />
      <RangeCalendar start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e) }} />
      {error && <Notice tone="error">{error}</Notice>}
      <Btn full busy={busy} onPress={send}>{t('أرسل الطلب', 'Send request')}</Btn>
      <Txt size={12} color={c.muted}>{t(`يصل طلبك إلى صندوق ${first} داخل Makers، وستتلقى الرد على بريدك الإلكتروني.`, `Your request goes to ${first}'s Makers inbox, and the reply comes to your email.`)}</Txt>
    </Screen>
  )
}
