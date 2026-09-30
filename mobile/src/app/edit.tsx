import { useCallback, useEffect, useState } from 'react'
import { ActionSheetIOS, Alert, Platform, Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { supabase, type Award, type Profile, type Work } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { COUNTRIES, CONTENT_TYPES, MAX_CONTENT_TYPES, SITE_URL, VIDEO_LENGTHS, cityLabel, detectPlatform, listSep, platformLabel, videoLengthLabel } from '@/lib/constants'
import { label, t, useLang } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { isCreator, memberLine, specName, useSpecialties } from '@/lib/specialties'
import { computeProgress } from '@/lib/progress'
import { fetchThumb, quickThumb } from '@/lib/thumbs'
import { pickImage, takePhoto, uploadJpeg, type Picked } from '@/lib/image'
import { useToast } from '@/lib/toast'
import { Btn, Card, Chip, Chips, Header, Icon, Input, Label, Notice, Pill, PosterFallback, Screen, SelectField, Sheet, Spinner, Toggle, Txt, tap } from '@/components/ui'
import { CropSheet } from '@/components/CropSheet'
import { ProgressTimeline } from '@/components/Progress'

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', followers: true },
  { key: 'youtube', label: 'YouTube', followers: true },
  { key: 'tiktok', label: 'TikTok', followers: true },
  { key: 'snapchat', label: 'Snapchat', followers: true },
  { key: 'facebook', label: 'Facebook', followers: true },
  { key: 'x', label: 'X', followers: true },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'website', label: 'Website' },
]

type SheetKind = null | 'spec' | 'work' | 'award' | 'username' | 'socials'

export default function EditProfile() {
  useLang()
  const { c } = useTheme()
  const { session, profile, loading, refreshProfile } = useAuth()
  const specialties = useSpecialties()
  const toast = useToast()
  const [works, setWorks] = useState<Work[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [photo, setPhoto] = useState<Picked | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) { setName(profile.full_name || ''); setBio(profile.bio || '') }
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadLists = useCallback(async () => {
    if (!session) return
    const [w, a] = await Promise.all([
      supabase.from('works').select('*').eq('owner_id', session.user.id).order('sort').order('created_at'),
      supabase.from('awards').select('*').eq('owner_id', session.user.id).order('year'),
    ])
    setWorks((w.data as Work[]) || [])
    setAwards((a.data as Award[]) || [])
  }, [session])
  useEffect(() => { loadLists() }, [loadLists])

  if (loading) return <Screen header={<Header />}><Spinner /></Screen>
  if (!session || !profile) return <Screen header={<Header />}><Notice>{t('سجّل الدخول لتعدّل صفحتك.', 'Sign in to edit your page.')}</Notice><Btn onPress={() => router.push('/login')}>{t('دخول', 'Sign in')}</Btn></Screen>

  const update = async (patch: Partial<Profile>, done?: string) => {
    const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id)
    if (error) toast(t('تعذّر الحفظ', 'Could not save'), 'error')
    else toast(done || t('تم الحفظ', 'Saved'))
    await refreshProfile()
    return !error
  }

  const progress = computeProgress(profile, works.length)
  const hasSpec = progress.steps[2].done
  const creator = isCreator(profile)
  const role = memberLine(specialties, profile)
  const vlen = videoLengthLabel(profile.video_length)
  const status = profile.status
  const approved = status === 'approved'

  const choosePhoto = () => {
    const fromLibrary = async () => { const p = await pickImage(); if (p) setPhoto(p) }
    const fromCamera = async () => { const p = await takePhoto(); if (p) setPhoto(p) }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: [t('اختر من الصور', 'Choose from photos'), t('التقط صورة', 'Take a photo'), t('إلغاء', 'Cancel')], cancelButtonIndex: 2 }, (i) => { if (i === 0) fromLibrary(); if (i === 1) fromCamera() })
    } else fromLibrary()
  }
  const savePhoto = async (bytes: Uint8Array) => {
    const url = await uploadJpeg('avatars', profile.id, 'avatar', bytes)
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
    if (error) throw error
    await refreshProfile()
    setPhoto(null)
    toast(t('تم تحديث صورتك', 'Photo updated'))
  }

  const submit = async () => {
    setSaving(true)
    const ok = await update({ status: 'pending' }, t('أُرسلت صفحتك للمراجعة', 'Sent for review'))
    setSaving(false)
    if (ok) router.replace('/status')
  }

  const openStep = (key: string) => (key === 'photo' ? choosePhoto() : key === 'spec' ? setSheet('spec') : key === 'works' ? setSheet('work') : key === 'accounts' ? setSheet('socials') : null)

  const deleteWork = (w: Work) => Alert.alert(t('حذف العمل؟', 'Delete this work?'), t(`سيُحذف «${w.title}» من صفحتك ومن صفحة المشاريع. لا يمكن التراجع.`, `"${w.title}" will be removed from your page and the projects page. This cannot be undone.`), [
    { text: t('إلغاء', 'Cancel'), style: 'cancel' },
    { text: t('احذف', 'Delete'), style: 'destructive', onPress: async () => { await supabase.from('works').delete().eq('id', w.id); loadLists(); toast(t('حُذف العمل', 'Work deleted')) } },
  ])

  return (
    <Screen keyboard header={<Header title={t('صفحتي', 'My page')} right={profile.username ? <Btn small variant="soft" onPress={() => router.push(`/maker/${profile.username}`)}>{t('معاينة', 'Preview')}</Btn> : undefined} />}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => { tap(); setSheet('username') }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt mono size={12} color={c.muted} style={{ textAlign: 'left' }}>{`${SITE_URL.replace('https://', '')}/${profile.username || '…'}`}</Txt>
          <Txt size={12} color={c.accent}>{t('تعديل', 'Edit')}</Txt>
        </Pressable>
        {approved ? <Pill tone="green">{t('منشورة', 'Live')}</Pill> : status === 'pending' ? <Pill tone="blue">{t('قيد المراجعة', 'In review')}</Pill> : status === 'rejected' ? <Pill tone="red">{t('تحتاج تعديلاً', 'Needs changes')}</Pill> : progress.count === 5 ? <Pill tone="green">{t('جاهزة للإرسال', 'Ready to send')}</Pill> : <Pill tone="amber">{t('قيد الإكمال', 'In progress')}</Pill>}
      </View>

      {status === 'rejected' && <Notice tone="error">{t('راجع ملاحظة الفريق في صفحة الحالة، ثم عدّل صفحتك وأرسلها مجدداً.', 'Read the team note on the status page, then update your page and send it again.')}</Notice>}

      {!approved && (
        <Card style={{ borderColor: c.borderMid }}>
          <ProgressTimeline progress={progress} onStep={openStep} />
          {status === 'pending' ? <Txt size={13} color={c.muted}>{t('صفحتك قيد المراجعة. تعديلاتك تُحفظ مباشرة.', 'Your page is in review. Your edits save right away.')}</Txt>
            : progress.count === 5 ? <Btn full busy={saving} onPress={submit}>{t('أرسل للمراجعة', 'Send for review')}</Btn>
              : <Txt size={13} color={c.muted}>{t('أكمل الخطوات الخمس لإرسال صفحتك للمراجعة. اضغط أي خطوة لتكملها.', 'Complete the five steps to send your page for review. Tap any step to finish it.')}</Txt>}
        </Card>
      )}

      <Card>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Pressable onPress={() => { tap(); choosePhoto() }} style={{ width: 120, aspectRatio: 3 / 4, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: profile.avatar_url ? c.border : 'transparent', borderWidth: profile.avatar_url ? 0 : 1.5, borderStyle: 'dashed', borderColor: c.border }}>
            {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <Txt size={13} color={c.muted} center>{t('+ صورتك', '+ Your photo')}</Txt>}
            {profile.avatar_url ? <View style={{ position: 'absolute', bottom: 6, end: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(5,5,7,0.7)', alignItems: 'center', justifyContent: 'center' }}><Icon name="camera" size={14} color="#fff" /></View> : null}
          </Pressable>
          <View style={{ flex: 1, gap: 10 }}>
            <Input label={t('الاسم', 'Name')} value={name} onChangeText={setName} onEndEditing={() => name.trim() && name !== profile.full_name && update({ full_name: name.trim() })} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Txt size={13} weight="semi">{profile.available ? t('متاح للعمل', 'Available for work') : t('غير متاح حالياً', 'Not available right now')}</Txt>
              </View>
              <Toggle value={!!profile.available} onChange={(v) => update({ available: v }, v ? t('صرت متاحاً للعمل', 'Marked as available') : t('صرت غير متاح حالياً', 'Marked as not available'))} />
            </View>
          </View>
        </View>
      </Card>

      <Card onPress={() => setSheet('spec')}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>{creator ? t('المحتوى والدولة', 'Content & country') : t('التخصص والدولة', 'Role & country')}</Label>
          {!hasSpec ? <Pill tone="amber">{t('فارغ', 'Empty')}</Pill> : <Txt size={12} color={c.accent}>{t('تعديل', 'Edit')}</Txt>}
        </View>
        {hasSpec ? (
          <Txt size={15} color={c.text2}>{[role, vlen, [cityLabel(profile.city), label(COUNTRIES, profile.country)].filter(Boolean).join(listSep())].filter(Boolean).join(' · ')}</Txt>
        ) : <Txt size={14} color={c.muted}>{creator ? t('اختر نوع محتواك ودولتك.', 'Choose your content type and country.') : t('اختر تخصصك ودولتك.', 'Choose your role and country.')}</Txt>}
        <Txt mono size={12} color={c.muted}>
          {profile.start_year ? (creator ? t(`يصنع المحتوى منذ ${profile.start_year}`, `Creating since ${profile.start_year}`) : t(`يعمل في المجال منذ ${profile.start_year}`, `In the industry since ${profile.start_year}`)) : t('أضف سنة البدء من هنا', 'Add your start year here')}
        </Txt>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Label>{t('نبذة', 'About')}</Label>{!progress.steps[3].done && <Pill tone="amber">{t('فارغ', 'Empty')}</Pill>}</View>
          <Txt size={12} color={c.muted}>{`${bio.length}/400`}</Txt>
        </View>
        <Input multiline maxLength={400} value={bio} onChangeText={setBio} onEndEditing={() => bio !== (profile.bio || '') && update({ bio: bio.trim() })} placeholder={t('عرّف بنفسك في سطرين: ما الذي تقدّمه، ولماذا يطلبك الناس؟', 'Introduce yourself in two lines: what you do, and why people hire you.')} />
        <Txt size={12} color={c.muted}>{t('النص الطويل عنك تكتبه من تبويب «نبذة» في صفحتك.', 'Write your long story from the About tab on your page.')}</Txt>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>{creator ? t('أبرز محتواك (اختياري)', 'Your best content (optional)') : t('أعمالك ومشاريعك', 'Your work & projects')}</Label>
          {!approved && !creator ? <Txt mono size={12} color={c.muted}>{t(`${Math.min(works.length, 3)} من 3`, `${Math.min(works.length, 3)} of 3`)}</Txt> : null}
        </View>
        {works.map((w) => {
          const img = w.thumb_url || w.thumbnail_url || quickThumb(w.url)
          return (
            <View key={w.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => router.push(`/project/${w.id}`)} style={{ width: 96, height: 60, borderRadius: 10, overflow: 'hidden', backgroundColor: c.surfaceAlt }}>
                {img ? <Image source={{ uri: img }} style={{ flex: 1 }} contentFit="cover" /> : <PosterFallback />}
              </Pressable>
              <View style={{ flex: 1, gap: 1 }}>
                <Txt size={14} weight="semi" lines={1}>{w.title}</Txt>
                {w.role ? <Txt size={12} color={c.muted} lines={1}>{w.role}</Txt> : null}
                {approved ? <Txt size={12} color={c.accent} onPress={() => router.push(`/project/edit/${w.id}`)}>{t('أضف البوستر والطاقم', 'Add poster & crew')}</Txt> : null}
              </View>
              <Pressable hitSlop={8} onPress={() => deleteWork(w)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="trash" size={14} color={c.muted} />
              </Pressable>
            </View>
          )
        })}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(works.length < 6 || approved) && <Btn small variant="outline" icon="plus" onPress={() => setSheet('work')}>{t('أضف عملاً برابط', 'Add work by link')}</Btn>}
          {approved && <Btn small icon="film" onPress={() => router.push('/project/new')}>{t('مشروع كامل مع الطاقم', 'Full project with crew')}</Btn>}
        </View>
        <Txt size={12} color={c.muted}>
          {creator
            ? t('أضف روابط لأفضل فيديوهاتك أو حملاتك، حتى يرى أصحاب المشاريع أسلوبك.', 'Add links to your best videos or campaigns so brands can see your style.')
            : t('أضف روابط لأعمال تظهر فيها مساهمتك، واكتب دورك تحت كل عمل.', 'Add links to work that shows your contribution, and write your role under each one.')}
        </Txt>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>{t('الجوائز والاعتمادات (اختياري)', 'Awards & credits (optional)')}</Label>
          <Txt size={13} weight="semi" color={c.accent} onPress={() => setSheet('award')}>{t('+ أضف', '+ Add')}</Txt>
        </View>
        {awards.length === 0 && <Txt size={13} color={c.muted}>{t('أضف جوائزك أو اعتماداتك إن وُجدت، وستظهر في صفحتك تلقائياً.', 'Add any awards or credits, and they will appear on your page automatically.')}</Txt>}
        {awards.map((a) => (
          <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
            <Txt size={14} weight="semi">{a.rank}</Txt>
            <View style={{ flex: 1 }}><Txt size={13} color={c.text2} lines={1}>{a.org || ''}</Txt></View>
            <Txt mono size={12} color={c.muted}>{a.year ? String(a.year) : ''}</Txt>
            <Pressable hitSlop={8} onPress={async () => { await supabase.from('awards').delete().eq('id', a.id); loadLists() }}><Icon name="close" size={14} color={c.muted} /></Pressable>
          </View>
        ))}
      </Card>

      <Card onPress={() => setSheet('socials')}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>{t('حساباتك', 'Your accounts')}</Label>
          <Txt size={12} color={c.accent}>{t('تعديل', 'Edit')}</Txt>
        </View>
        <Txt size={13} color={c.muted}>
          {Object.keys(profile.socials || {}).length
            ? Object.keys(profile.socials || {}).map((k) => SOCIALS.find((s) => s.key === k)?.label || k).join(' · ')
            : creator ? t('أضف حساباً واحداً على الأقل مع عدد المتابعين.', 'Add at least one account with its follower count.') : t('اختياري: روابط حساباتك وعدد المتابعين.', 'Optional: links to your accounts and follower counts.')}
        </Txt>
      </Card>

      <SpecSheet visible={sheet === 'spec'} profile={profile} onClose={() => setSheet(null)} onSave={async (patch) => { if (await update(patch)) setSheet(null) }} />
      <UsernameSheet visible={sheet === 'username'} profile={profile} onClose={() => setSheet(null)} onSaved={async () => { await refreshProfile(); setSheet(null); toast(t('تم حفظ الرابط', 'Link saved')) }} />
      <WorkSheet visible={sheet === 'work'} ownerId={profile.id} count={works.length} onClose={() => setSheet(null)} onSaved={() => { loadLists(); setSheet(null); toast(t('أُضيف العمل', 'Work added')) }} />
      <AwardSheet visible={sheet === 'award'} ownerId={profile.id} onClose={() => setSheet(null)} onSaved={() => { loadLists(); setSheet(null) }} />
      <SocialsSheet visible={sheet === 'socials'} profile={profile} required={creator} onClose={() => setSheet(null)} onSave={async (socials, followers) => { if (await update({ socials, followers }, t('تم حفظ الحسابات', 'Accounts saved'))) setSheet(null) }} />
      <CropSheet image={photo} aspect={3 / 4} outWidth={900} title={t('صورتك', 'Your photo')} onCancel={() => setPhoto(null)} onDone={savePhoto} />
    </Screen>
  )
}

function SpecSheet({ visible, profile, onClose, onSave }: { visible: boolean; profile: Profile; onClose: () => void; onSave: (p: Partial<Profile>) => void }) {
  const specialties = useSpecialties()
  const [ids, setIds] = useState<number[]>(profile.specialty_ids || [])
  const [other, setOther] = useState(profile.other_specialty || '')
  const [vlen, setVlen] = useState<string>(profile.video_length || '')
  const [country, setCountry] = useState(profile.country || '')
  const [city, setCity] = useState(profile.city || '')
  const [year, setYear] = useState(profile.start_year ? String(profile.start_year) : '')
  const [suggest, setSuggest] = useState('')
  const [kinds, setKinds] = useState<string[]>(profile.content_types || [])
  const creator = isCreator(profile)
  const isVideo = creator || ids.some((id) => specialties.find((s) => s.id === id)?.is_video)
  const toggle = (id: number) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < 2 ? [...ids, id] : ids)
  const toggleKind = (k: string) => setKinds(kinds.includes(k) ? kinds.filter((x) => x !== k) : kinds.length < MAX_CONTENT_TYPES ? [...kinds, k] : kinds)

  const save = async () => {
    if (!creator && suggest.trim()) await supabase.from('specialty_suggestions').insert({ profile_id: profile.id, name: suggest.trim() })
    const y = parseInt(year, 10)
    onSave({
      ...(creator ? { content_types: kinds } : { specialty_ids: ids, other_specialty: other.trim() || null }),
      video_length: isVideo && vlen ? (vlen as Profile['video_length']) : null,
      country: country || null,
      city: city.trim() || null,
      start_year: y >= 1950 && y <= new Date().getFullYear() ? y : null,
    })
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={creator ? t('المحتوى والدولة', 'Content & country') : t('التخصص والدولة', 'Role & country')} footer={<Btn full onPress={save}>{t('حفظ', 'Save')}</Btn>}>
      {creator ? (
        <>
          <Label hint={t(`${kinds.length} من ${MAX_CONTENT_TYPES}`, `${kinds.length} of ${MAX_CONTENT_TYPES}`)}>{t('نوع المحتوى', 'Content type')}</Label>
          <Chips>{CONTENT_TYPES.map((k) => <Chip key={k.key} on={kinds.includes(k.key)} dim={!kinds.includes(k.key) && kinds.length >= MAX_CONTENT_TYPES} onPress={() => toggleKind(k.key)}>{t(k.ar, k.en)}</Chip>)}</Chips>
        </>
      ) : (
        <>
          <Label hint={t(`${ids.length} من 2`, `${ids.length} of 2`)}>{t('التخصص', 'Role')}</Label>
          <Chips>{specialties.map((s) => <Chip key={s.id} on={ids.includes(s.id)} dim={!ids.includes(s.id) && ids.length >= 2} onPress={() => toggle(s.id)}>{specName(specialties, s.id)}</Chip>)}</Chips>
          <Input value={other} onChangeText={setOther} placeholder={t('تخصص آخر (اكتبه هنا)', 'Another role (type it here)')} />
          <Input value={suggest} onChangeText={setSuggest} placeholder={t('اقترح تخصصاً لإضافته للقائمة', 'Suggest a role to add to the list')} />
        </>
      )}
      {isVideo && (
        <>
          <Label>{t('نوع الفيديو', 'Video type')}</Label>
          <Chips>{VIDEO_LENGTHS.map((v) => <Chip key={v.key} on={vlen === v.key} onPress={() => setVlen(v.key)}>{t(v.ar, v.en)}</Chip>)}</Chips>
        </>
      )}
      <SelectField label={t('الدولة', 'Country')} value={country} onChange={setCountry} placeholder={t('اختر الدولة', 'Choose a country')} options={COUNTRIES.map((x) => ({ value: x.ar, label: t(x.ar, x.en) }))} />
      <Input label={t('المدينة', 'City')} value={city} onChangeText={setCity} placeholder={t('مثال: عمّان', 'e.g. Amman')} />
      <Input label={creator ? t('سنة بدء صناعة المحتوى', 'Year you started creating') : t('سنة البدء في المجال', 'Year you started')} keyboardType="number-pad" value={year} onChangeText={(v) => setYear(v.replace(/\D/g, '').slice(0, 4))} placeholder="2017" />
    </Sheet>
  )
}

function UsernameSheet({ visible, profile, onClose, onSaved }: { visible: boolean; profile: Profile; onClose: () => void; onSaved: () => void }) {
  const { c } = useTheme()
  const [value, setValue] = useState(profile.username || '')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const same = value === (profile.username || '')

  useEffect(() => {
    if (same || value.length < 3) return setAvailable(null)
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc('username_available', { p_username: value })
      setAvailable(!!data)
    }, 350)
    return () => clearTimeout(timer)
  }, [value, same])

  const save = async () => {
    if (same) return onClose()
    if (!available) return setError(t('هذا الرابط غير متاح، جرّب رابطاً آخر.', 'This link is not available, try another.'))
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ username: value }).eq('id', profile.id)
    setBusy(false)
    if (error) return setError(t('تعذّر حفظ الرابط. جرّب رابطاً آخر.', 'Could not save the link. Try another.'))
    onSaved()
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={t('رابط صفحتك', 'Your page link')} footer={<Btn full busy={busy} onPress={save}>{t('حفظ', 'Save')}</Btn>}>
      <Input ltr value={value} autoCapitalize="none" autoCorrect={false} onChangeText={(v) => { setError(null); setValue(v.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)) }} />
      <Txt mono size={12} color={c.muted} style={{ textAlign: 'left' }}>{`makerss.net/${value}`}</Txt>
      <Txt size={12} color={available === false ? c.danger : available ? c.success : c.muted}>
        {available === false ? t('هذا الرابط محجوز أو غير صالح.', 'This link is taken or invalid.') : available ? t('الرابط متاح.', 'Link available.') : t('حروف إنجليزية صغيرة وأرقام وشرطات فقط. إذا غيّرت الرابط، يتوقف الرابط القديم عن العمل.', 'Lowercase letters, numbers and dashes only. If you change it, the old link stops working.')}
      </Txt>
      {error && <Notice tone="error">{error}</Notice>}
    </Sheet>
  )
}

function WorkSheet({ visible, ownerId, count, onClose, onSaved }: { visible: boolean; ownerId: string; count: number; onClose: () => void; onSaved: () => void }) {
  const { c } = useTheme()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [role, setRole] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setError(null)
    if (!/^https?:\/\//i.test(url.trim())) return setError(t('الصق رابطاً يبدأ بـ https://', 'Paste a link starting with https://'))
    if (!title.trim()) return setError(t('اكتب اسم العمل.', 'Write the name of the work.'))
    const y = parseInt(year, 10)
    setBusy(true)
    const thumb = await fetchThumb(url.trim())
    const { error } = await supabase.from('works').insert({
      owner_id: ownerId, url: url.trim(), title: title.trim(), role: role.trim() || null,
      year: y > 1950 && y <= new Date().getFullYear() + 1 ? y : null, platform: detectPlatform(url), thumbnail_url: thumb, sort: count,
    })
    setBusy(false)
    if (error) return setError(t('تعذّر الحفظ. حاول مرة أخرى.', 'Could not save. Try again.'))
    setUrl(''); setTitle(''); setRole(''); setYear('')
    onSaved()
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={t('أضف عملاً', 'Add work')} footer={<Btn full busy={busy} onPress={save}>{t('حفظ', 'Save')}</Btn>}>
      <Input label={t('رابط العمل', 'Work link')} hint={url ? platformLabel(detectPlatform(url)) : undefined} ltr value={url} onChangeText={setUrl} placeholder="https://vimeo.com/..." keyboardType="url" autoCapitalize="none" autoCorrect={false} />
      <Txt size={12} color={c.muted}>{t('يقبل روابط Vimeo وYouTube وInstagram وTikTok وBehance.', 'Accepts Vimeo, YouTube, Instagram, TikTok and Behance links.')}</Txt>
      <Input label={t('اسم العمل', 'Title')} value={title} onChangeText={setTitle} placeholder={t('مثال: فيلم قصير عن المدينة', 'e.g. A short film about the city')} />
      <Input label={t('دورك في العمل', 'Your role')} value={role} onChangeText={setRole} placeholder={t('مثال: إخراج', 'e.g. Director')} />
      <Input label={t('السنة', 'Year')} keyboardType="number-pad" value={year} onChangeText={(v) => setYear(v.replace(/\D/g, '').slice(0, 4))} placeholder="2025" />
      {error && <Notice tone="error">{error}</Notice>}
    </Sheet>
  )
}

function AwardSheet({ visible, ownerId, onClose, onSaved }: { visible: boolean; ownerId: string; onClose: () => void; onSaved: () => void }) {
  const [rank, setRank] = useState('')
  const [org, setOrg] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const save = async () => {
    if (!rank.trim()) return setError(t('اكتب اسم الجائزة أو الاعتماد.', 'Write the award or credit name.'))
    const y = parseInt(year, 10)
    const { error } = await supabase.from('awards').insert({ owner_id: ownerId, rank: rank.trim(), org: org.trim() || null, year: y > 1950 ? y : null })
    if (error) return setError(t('تعذّر الحفظ.', 'Could not save.'))
    setRank(''); setOrg(''); setYear('')
    onSaved()
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={t('أضف جائزة أو اعتماداً', 'Add an award or credit')} footer={<Btn full onPress={save}>{t('حفظ', 'Save')}</Btn>}>
      <Input label={t('الجائزة أو الاعتماد', 'Award or credit')} value={rank} onChangeText={setRank} placeholder={t('مثال: المركز الأول', 'e.g. First place')} />
      <Input label={t('الجهة أو المسابقة', 'Organizer or festival')} value={org} onChangeText={setOrg} placeholder={t('اسم المهرجان أو الجهة', 'Festival or organizer name')} />
      <Input label={t('السنة', 'Year')} keyboardType="number-pad" value={year} onChangeText={(v) => setYear(v.replace(/\D/g, '').slice(0, 4))} placeholder="2024" />
      {error && <Notice tone="error">{error}</Notice>}
    </Sheet>
  )
}

function SocialsSheet({ visible, profile, required, onClose, onSave }: { visible: boolean; profile: Profile; required?: boolean; onClose: () => void; onSave: (s: Record<string, string>, f: Record<string, number>) => void }) {
  const { c } = useTheme()
  const [socials, setSocials] = useState<Record<string, string>>(profile.socials || {})
  const [followers, setFollowers] = useState<Record<string, string>>(Object.fromEntries(Object.entries(profile.followers || {}).map(([k, v]) => [k, String(v)])))
  const save = () => {
    const s = Object.fromEntries(Object.entries(socials).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v))
    const f = Object.fromEntries(Object.entries(followers).filter(([, v]) => v && !isNaN(Number(v))).map(([k, v]) => [k, Number(v)]))
    onSave(s, f)
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={t('حساباتك', 'Your accounts')} footer={<Btn full onPress={save}>{t('حفظ الحسابات', 'Save accounts')}</Btn>}>
      <Txt size={13} color={c.muted}>{required ? t('أضف حساباً واحداً على الأقل مع عدد المتابعين.', 'Add at least one account with its follower count.') : t('اختياري، أدخل عدد المتابعين يدوياً.', 'Optional, enter follower counts manually.')}</Txt>
      {SOCIALS.map((s) => (
        <View key={s.key} style={{ gap: 6 }}>
          <Label>{s.label}</Label>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Input ltr value={socials[s.key] || ''} onChangeText={(v) => setSocials({ ...socials, [s.key]: v })} placeholder="https://" autoCapitalize="none" autoCorrect={false} keyboardType="url" /></View>
            {s.followers && <View style={{ width: 118 }}><Input keyboardType="number-pad" value={followers[s.key] || ''} onChangeText={(v) => setFollowers({ ...followers, [s.key]: v.replace(/\D/g, '') })} placeholder={t('المتابعون', 'Followers')} /></View>}
          </View>
        </View>
      ))}
    </Sheet>
  )
}
