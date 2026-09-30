import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t, useLang } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { COUNTRIES, BUDGETS } from '@/lib/constants'
import { useSpecialties, specName } from '@/lib/specialties'
import { PROJECT_KINDS } from '@/lib/data'
import { Btn, Card, Chip, Chips, Header, Input, Label, Notice, Screen, SelectField, Spinner, Txt } from '@/components/ui'
import { DateField } from '@/components/RangeCalendar'

export default function NewCall() {
  useLang()
  const { c } = useTheme()
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
  const [deadline, setDeadline] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => { if (profile?.country) setCountry(profile.country) }, [profile?.country])

  if (loading) return <Screen header={<Header />}><Spinner /></Screen>
  if (!profile) return <Screen header={<Header />}><Notice>{t('سجّل الدخول لنشر فرصة.', 'Sign in to post an opportunity.')}</Notice><Btn onPress={() => router.push('/login')}>{t('دخول', 'Sign in')}</Btn></Screen>
  if (profile.status !== 'approved') return <Screen header={<Header />}><Notice>{t('يمكنك نشر الفرص بعد موافقة فريق Makers على ملفك.', 'You can post opportunities once the Makers team approves your profile.')}</Notice></Screen>

  if (done) {
    return (
      <Screen header={<Header />}>
        <View style={{ gap: 14, paddingTop: 30 }}>
          <Txt display size={28}>{t('وصلتنا فرصتك', 'We got your opportunity')}</Txt>
          <Txt size={15} color={c.text2}>{t('يراجعها فريق Makers وتُنشر خلال وقت قصير. ستصلك الطلبات في صندوق الوارد.', 'The Makers team will review it and publish it shortly. Applications will arrive in your inbox.')}</Txt>
          <Btn onPress={() => { router.back(); router.navigate('/calls') }}>{t('كل الفرص', 'All opportunities')}</Btn>
        </View>
      </Screen>
    )
  }

  const submit = async () => {
    setError(null)
    if (title.trim().length < 3) return setError(t('اكتب عنواناً واضحاً للفرصة.', 'Write a clear title.'))
    if (description.trim().length < 10) return setError(t('اشرح المشروع والمطلوب في سطرين على الأقل.', 'Describe the project and what you need in a couple of lines.'))
    if (!roles.length) return setError(t('اختر دوراً واحداً على الأقل.', 'Choose at least one role.'))
    setBusy(true)
    const { error } = await supabase.rpc('create_open_call', {
      p: { title: title.trim(), org: org.trim(), kind, description: description.trim(), role_ids: roles, remote, country: remote ? null : country, city: remote ? null : city.trim(), budget: budget || null, deadline: deadline || null },
    })
    setBusy(false)
    if (error) return setError(error.message.includes('rate') ? t('نشرت فرصاً كثيرة اليوم. حاول غداً.', 'You posted many calls today. Try tomorrow.') : t('تعذّر النشر. تحقق من البيانات.', 'Could not post. Check the details.'))
    setDone(true)
  }

  return (
    <Screen keyboard header={<Header title={t('انشر فرصة', 'Post an opportunity')} />}>
      <Txt size={14} color={c.muted}>{t('مشروع يحتاج طاقم؟ اكتب التفاصيل، ويراجعها فريقنا قبل النشر.', 'A project that needs a crew? Add the details and our team reviews it before it goes live.')}</Txt>
      <Card>
        <Input label={t('عنوان الفرصة *', 'Title *')} maxLength={140} value={title} onChangeText={setTitle} placeholder={t('مثال: مدير تصوير لإعلان رمضان', 'e.g. DOP for a Ramadan commercial')} />
        <Input label={t('الجهة (اختياري)', 'Company or brand (optional)')} maxLength={120} value={org} onChangeText={setOrg} />
        <Label>{t('نوع المشروع', 'Project type')}</Label>
        <Chips>{PROJECT_KINDS.map((k) => <Chip key={k.key} on={kind === k.key} onPress={() => setKind(kind === k.key ? null : k.key)}>{t(k.ar, k.en)}</Chip>)}</Chips>
        <Input label={t('التفاصيل *', 'Details *')} multiline maxLength={3000} value={description} onChangeText={setDescription} placeholder={t('ما المشروع؟ متى وأين التصوير؟ ما الخبرة المطلوبة؟', 'What is the project? When and where is the shoot? What experience do you need?')} />
      </Card>
      <Card>
        <Label hint={roles.length ? String(roles.length) : undefined}>{t('الأدوار المطلوبة *', 'Roles needed *')}</Label>
        <Chips>{specialties.map((s) => <Chip key={s.id} on={roles.includes(s.id)} onPress={() => setRoles(roles.includes(s.id) ? roles.filter((x) => x !== s.id) : [...roles, s.id])}>{specName(specialties, s.id)}</Chip>)}</Chips>
      </Card>
      <Card>
        <Chips>
          <Chip on={!remote} onPress={() => setRemote(false)}>{t('في موقع محدد', 'On location')}</Chip>
          <Chip on={remote} onPress={() => setRemote(true)}>{t('عن بُعد', 'Remote')}</Chip>
        </Chips>
        {!remote && (
          <>
            <SelectField label={t('الدولة', 'Country')} value={country} onChange={setCountry} options={COUNTRIES.map((x) => ({ value: x.ar, label: t(x.ar, x.en) }))} />
            <Input label={t('المدينة', 'City')} maxLength={60} value={city} onChangeText={setCity} placeholder={t('مثال: عمّان', 'e.g. Amman')} />
          </>
        )}
        <SelectField label={t('الميزانية', 'Budget')} value={budget} onChange={setBudget}
          options={[{ value: '', label: t('حسب الاتفاق', 'Open to discuss') }, ...BUDGETS.slice(1).map((b) => ({ value: b.ar, label: t(b.ar, b.en) }))]} />
        <DateField label={t('آخر موعد للتقديم', 'Apply by')} value={deadline} onChange={setDeadline} />
      </Card>
      {error && <Notice tone="error">{error}</Notice>}
      <Btn full busy={busy} onPress={submit}>{t('أرسل للمراجعة', 'Send for review')}</Btn>
    </Screen>
  )
}
