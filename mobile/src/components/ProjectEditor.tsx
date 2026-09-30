import { useEffect, useState } from 'react'
import { ActionSheetIOS, Platform, Pressable, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t, useLang } from '@/lib/i18n'
import { F, useTheme } from '@/lib/theme'
import { fetchThumb, quickThumb } from '@/lib/thumbs'
import { pickImage, takePhoto, uploadJpeg, type Picked } from '@/lib/image'
import { CARD_COLUMNS, displayName, getProject, PLATFORMS, PROJECT_KINDS, type MemberCard } from '@/lib/data'
import { useSpecialties, specName } from '@/lib/specialties'
import { Avatar, Btn, Card, Chip, Chips, Header, Icon, Input, Label, Notice, Screen, Spinner, Txt, tap } from './ui'
import { CropSheet } from './CropSheet'

type Crew = { key: string; profile?: MemberCard | null; name?: string; role: string }

function MemberPicker({ exclude, onPick }: { exclude: string[]; onPick: (m: MemberCard) => void }) {
  const { c } = useTheme()
  const [q, setQ] = useState('')
  const [res, setRes] = useState<MemberCard[]>([])
  const excludeKey = exclude.join(',')
  useEffect(() => {
    const s = q.trim().replace(/[%_,()*]/g, ' ')
    if (s.length < 2) return setRes([])
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select(CARD_COLUMNS).eq('status', 'approved').or(`full_name.ilike.%${s}%,name_ar.ilike.%${s}%,username.ilike.%${s}%`).limit(6)
      setRes(((data as unknown as MemberCard[]) || []).filter((m) => !excludeKey.split(',').includes(m.id)))
    }, 200)
    return () => clearTimeout(timer)
  }, [q, excludeKey])
  return (
    <View style={{ gap: 6 }}>
      <Input value={q} onChangeText={setQ} placeholder={t('ابحث عن عضو في Makers بالاسم…', 'Search a Makers member by name…')} autoCorrect={false} />
      {res.length > 0 && (
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
          {res.map((m) => (
            <Pressable key={m.id} onPress={() => { tap(); onPick(m); setQ(''); setRes([]) }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: pressed ? c.surface : 'transparent' })}>
              <Avatar url={m.avatar_url} name={displayName(m)} size={32} />
              <View style={{ flex: 1 }}><Txt size={14} weight="semi" lines={1}>{displayName(m)}</Txt></View>
              <Txt mono size={11} color={c.muted}>{`@${m.username}`}</Txt>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

/** Add or edit a project: poster, video link, type, platforms, and the crew (tagged members or free names). */
export function ProjectEditor({ id }: { id?: string }) {
  useLang()
  const { c, dark } = useTheme()
  const { rtl } = useLang()
  const { profile, loading } = useAuth()
  const specialties = useSpecialties()
  const [ready, setReady] = useState(!id)
  const [denied, setDenied] = useState(false)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<string | null>(null)
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [brand, setBrand] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [url, setUrl] = useState('')
  const [poster, setPoster] = useState<string | null>(null)
  const [videoThumb, setVideoThumb] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [myRole, setMyRole] = useState('')
  const [crew, setCrew] = useState<Crew[]>([])
  const [outsider, setOutsider] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Picked | null>(null)
  // Short link: makerss.net/<slug>. Empty means: make one from the title.
  const [slug, setSlug] = useState('')
  const [savedSlug, setSavedSlug] = useState('')
  const [slugOk, setSlugOk] = useState<boolean | null>(null)

  // Suggest my role from my first specialty
  useEffect(() => {
    if (!id && profile && !myRole && profile.specialty_ids?.[0] && specialties.length) setMyRole(specName(specialties, profile.specialty_ids[0]))
  }, [id, profile, specialties, myRole])

  useEffect(() => {
    if (!id || !profile) return
    getProject(id).then((p) => {
      if (!p) return setDenied(true)
      const staff = profile.role === 'admin' || profile.role === 'reviewer'
      if (p.owner_id !== profile.id && !staff) return setDenied(true)
      setTitle(p.title); setKind(p.kind); setYear(p.year ? String(p.year) : ''); setBrand(p.brand || '')
      setPlatforms(p.platforms || []); setUrl(p.url || ''); setPoster(p.thumb_url); setVideoThumb(p.thumbnail_url)
      setDescription(p.description || '')
      setSlug(p.slug || ''); setSavedSlug(p.slug || '')
      const mine = p.credits?.find((x) => x.profile_id === p.owner_id)
      setMyRole(mine?.role || p.role || '')
      setCrew((p.credits || []).filter((x) => x.profile_id !== p.owner_id).map((x) => ({ key: x.id, profile: x.profile, name: x.display_name || undefined, role: x.role || '' })))
      setReady(true)
    })
  }, [id, profile])

  useEffect(() => {
    const s = slug.trim()
    if (!s || s === savedSlug) return setSlugOk(null)
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc('work_slug_available', { p_slug: s, p_work: id || null })
      setSlugOk(!!data)
    }, 350)
    return () => clearTimeout(timer)
  }, [slug, savedSlug, id])

  // Video thumbnail (YouTube instantly, Vimeo/TikTok via oEmbed)
  useEffect(() => {
    const u = url.trim()
    if (!/^https:\/\//.test(u)) return setVideoThumb(null)
    setVideoThumb(quickThumb(u))
    let alive = true
    fetchThumb(u).then((x) => { if (alive && x) setVideoThumb(x) })
    return () => { alive = false }
  }, [url])

  const header = <Header title={id ? t('تعديل المشروع', 'Edit project') : t('أضف مشروعاً', 'Add a project')} />
  if (loading || (id && !ready && !denied)) return <Screen header={header}><Spinner /></Screen>
  if (!profile) return <Screen header={header}><Notice>{t('سجّل الدخول لإضافة مشروع.', 'Sign in to add a project.')}</Notice></Screen>
  if (profile.status !== 'approved') return <Screen header={header}><Notice>{t('يمكنك إضافة المشاريع بعد موافقة فريق Makers على ملفك.', 'You can add projects once the Makers team approves your profile.')}</Notice></Screen>
  if (denied) return <Screen header={header}><Notice tone="error">{t('لا يمكنك تعديل هذا المشروع.', 'You cannot edit this project.')}</Notice></Screen>

  const choosePoster = () => {
    const lib = async () => { const p = await pickImage(); if (p) setPending(p) }
    const cam = async () => { const p = await takePhoto(); if (p) setPending(p) }
    if (Platform.OS === 'ios') ActionSheetIOS.showActionSheetWithOptions({ options: [t('اختر من الصور', 'Choose from photos'), t('التقط صورة', 'Take a photo'), t('إلغاء', 'Cancel')], cancelButtonIndex: 2 }, (i) => { if (i === 0) lib(); if (i === 1) cam() })
    else lib()
  }
  const uploadPoster = async (bytes: Uint8Array) => {
    setPoster(await uploadJpeg('works', profile.id, 'poster', bytes))
    setPending(null)
  }

  const save = async () => {
    setError(null)
    if (title.trim().length < 1) return setError(t('اكتب اسم المشروع.', 'Enter the project title.'))
    if (url.trim() && !/^https:\/\//.test(url.trim())) return setError(t('رابط الفيديو يجب أن يبدأ بـ https://', 'The video link must start with https://'))
    if (!myRole.trim()) return setError(t('اكتب دورك في المشروع.', 'Enter your role on the project.'))
    const y = year ? Number(year) : null
    if (y !== null && (y < 1950 || y > new Date().getFullYear() + 2)) return setError(t('تحقق من السنة.', 'Check the year.'))
    if (slug.trim() && slug.trim() !== savedSlug && slugOk === false) return setError(t('رابط المشروع محجوز، جرّب رابطاً آخر.', 'That project link is taken. Try another.'))
    setBusy(true)
    const credits = [
      { profile_id: profile.id, role: myRole.trim() },
      ...crew.map((x) => (x.profile ? { profile_id: x.profile.id, role: x.role.trim() } : { name: x.name, role: x.role.trim() })),
    ]
    const { data, error } = await supabase.rpc('save_work', {
      p_id: id || null,
      p: { title: title.trim(), kind, year: y, brand: brand.trim(), platforms, url: url.trim(), thumb_url: poster, thumbnail_url: videoThumb, description: description.trim(), role: myRole.trim(), slug: slug.trim() },
      p_credits: credits,
    })
    setBusy(false)
    if (error?.message.includes('slug')) return setError(t('رابط المشروع محجوز، جرّب رابطاً آخر.', 'That project link is taken. Try another.'))
    if (error || !data) return setError(t('تعذّر الحفظ. تحقق من البيانات وحاول مرة أخرى.', 'Could not save. Check the details and try again.'))
    router.replace(`/project/${data}`)
  }

  const shown = poster || videoThumb
  const rowInput = { flex: 1, height: 42, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceAlt, color: c.text, fontFamily: F.body, fontSize: 15, paddingHorizontal: 12, textAlign: rtl ? 'right' : 'left' } as const

  return (
    <Screen keyboard header={header}>
      <Txt size={14} color={c.muted}>{t('أضف عملاً شاركت فيه، وسمِّ باقي الطاقم ليظهر المشروع في صفحاتهم أيضاً.', 'Add work you were part of, and tag the rest of the crew so it shows on their pages too.')}</Txt>

      <Card>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Pressable onPress={() => { tap(); choosePoster() }} style={{ width: 110, aspectRatio: 2 / 3, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceAlt, borderWidth: shown ? 0 : 1, borderStyle: 'dashed', borderColor: c.borderMid }}>
              {shown ? <Image source={{ uri: shown }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <View style={{ alignItems: 'center', gap: 6, padding: 8 }}><Icon name="photo" size={20} color={c.muted} /><Txt size={11} color={c.muted} center>{t('بوستر المشروع', 'Project poster')}</Txt></View>}
            </Pressable>
            <Txt size={11} color={c.accent} onPress={choosePoster}>{poster ? t('غيّر الصورة', 'Change image') : t('ارفع بوستر', 'Upload poster')}</Txt>
            {poster ? <Txt size={11} color={c.muted} onPress={() => setPoster(null)}>{t('إزالة', 'Remove')}</Txt> : videoThumb ? <Txt size={10} color={c.muted} center>{t('نستخدم صورة الفيديو', 'Using the video frame')}</Txt> : null}
          </View>
          <View style={{ flex: 1, gap: 12 }}>
            <Input label={t('اسم المشروع *', 'Title *')} maxLength={140} value={title} onChangeText={setTitle} placeholder={t('مثال: إعلان رمضان 2026', 'e.g. Ramadan 2026 campaign')} />
            <Input label={t('السنة', 'Year')} keyboardType="number-pad" maxLength={4} value={year} onChangeText={(v) => setYear(v.replace(/\D/g, ''))} />
          </View>
        </View>
        <Input label={t('العميل أو الجهة', 'Brand or studio')} maxLength={120} value={brand} onChangeText={setBrand} />
        <Input label={t('رابط الفيديو', 'Video link')} hint="YouTube · Vimeo · TikTok · Instagram" ltr keyboardType="url" autoCapitalize="none" autoCorrect={false} value={url} onChangeText={setUrl} placeholder="https://" />
        <View style={{ gap: 8 }}>
          <Label hint={slug.trim() && slug.trim() !== savedSlug ? (slugOk === false ? t('محجوز', 'Taken') : slugOk ? t('متاح', 'Available') : '') : undefined}>{t('رابط المشروع على Makers', 'Project link on Makers')}</Label>
          <View style={{ height: 50, borderRadius: 14, borderWidth: 1, borderColor: slugOk === false ? c.danger : c.border, backgroundColor: c.surfaceAlt, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, direction: 'ltr' }}>
            <Txt mono size={13} color={c.muted} style={{ textAlign: 'left' }}>makerss.net/</Txt>
            <TextInput value={slug} onChangeText={(v) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 50))} autoCapitalize="none" autoCorrect={false} placeholder={t('يتولّد من الاسم', 'made from the title')} placeholderTextColor={c.muted2} keyboardAppearance={dark ? 'dark' : 'light'} style={{ flex: 1, height: 50, color: c.text, fontFamily: F.mono, fontSize: 13, textAlign: 'left' }} />
          </View>
        </View>
      </Card>

      <Card>
        <Label>{t('النوع', 'Type')}</Label>
        <Chips>{PROJECT_KINDS.map((k) => <Chip key={k.key} on={kind === k.key} onPress={() => setKind(kind === k.key ? null : k.key)}>{t(k.ar, k.en)}</Chip>)}</Chips>
        <Label>{t('أين عُرض؟', 'Where was it released?')}</Label>
        <Chips>{PLATFORMS.map((pl) => <Chip key={pl} on={platforms.includes(pl)} onPress={() => setPlatforms(platforms.includes(pl) ? platforms.filter((x) => x !== pl) : [...platforms, pl])}>{pl}</Chip>)}</Chips>
        <Input label={t('عن المشروع', 'About the project')} multiline maxLength={2000} value={description} onChangeText={setDescription} placeholder={t('فكرة العمل، أين صُوّر، وما الذي يميّزه.', 'The idea, where it was shot, what makes it stand out.')} />
      </Card>

      <Card>
        <Txt display size={17}>{t('الطاقم', 'Crew')}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar url={profile.avatar_url} name={displayName(profile)} size={36} />
          <Txt size={14} weight="semi">{t('أنت', 'You')}</Txt>
          <TextInput value={myRole} onChangeText={setMyRole} placeholder={t('دورك: مخرج، مدير تصوير…', 'Your role: director, DOP…')} placeholderTextColor={c.muted2} keyboardAppearance={dark ? 'dark' : 'light'} style={rowInput} />
        </View>
        {crew.map((x, i) => (
          <View key={x.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Avatar url={x.profile?.avatar_url} name={x.profile ? displayName(x.profile) : x.name} size={36} />
            <View style={{ maxWidth: '32%' }}><Txt size={14} weight="semi" lines={1}>{x.profile ? displayName(x.profile) : x.name}</Txt></View>
            <TextInput value={x.role} onChangeText={(v) => setCrew(crew.map((y, j) => (j === i ? { ...y, role: v } : y)))} placeholder={t('الدور', 'Role')} placeholderTextColor={c.muted2} keyboardAppearance={dark ? 'dark' : 'light'} style={rowInput} />
            <Pressable hitSlop={8} onPress={() => setCrew(crew.filter((_, j) => j !== i))} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceAlt }}>
              <Icon name="close" size={13} color={c.muted} />
            </Pressable>
          </View>
        ))}
        <MemberPicker exclude={[profile.id, ...crew.map((x) => x.profile?.id || '')]} onPick={(m) => setCrew([...crew, { key: m.id, profile: m, role: m.specialty_ids?.[0] ? specName(specialties, m.specialty_ids[0]) : '' }])} />
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput value={outsider} onChangeText={setOutsider} placeholder={t('أو اكتب اسم شخص ليس على Makers', 'Or type the name of someone not on Makers')} placeholderTextColor={c.muted2} keyboardAppearance={dark ? 'dark' : 'light'} style={rowInput} />
          <Btn small variant="soft" disabled={outsider.trim().length < 2} onPress={() => { setCrew([...crew, { key: `n${Date.now()}`, name: outsider.trim(), role: '' }]); setOutsider('') }}>{t('أضف', 'Add')}</Btn>
        </View>
        <Txt size={12} color={c.muted}>{t('أعضاء Makers الذين تضيفهم سيظهر المشروع في صفحاتهم، ويمكنهم إزالة أسمائهم في أي وقت.', 'Makers members you tag will see the project on their pages, and can remove their name any time.')}</Txt>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}
      <Btn full busy={busy} onPress={save}>{id ? t('احفظ التعديلات', 'Save changes') : t('انشر المشروع', 'Publish project')}</Btn>

      <CropSheet image={pending} aspect={2 / 3} outWidth={1000} title={t('اضبط البوستر', 'Frame the poster')} onCancel={() => setPending(null)} onDone={uploadPoster} />
    </Screen>
  )
}
