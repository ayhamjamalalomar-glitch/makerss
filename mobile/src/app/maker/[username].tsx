import { useEffect, useMemo, useState } from 'react'
import { Linking, Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Award, type Profile } from '@/lib/supabase'
import { COUNTRIES, SITE_URL, cityLabel, contentLabel, listSep, videoLengthLabel } from '@/lib/constants'
import { label, t, useLang } from '@/lib/i18n'
import { alpha, onScreen, useTheme } from '@/lib/theme'
import { useSpecialties, specName, isCreator } from '@/lib/specialties'
import { useAuth } from '@/lib/auth'
import { displayName, formatFollowers, kindLabel, posterOf, projectsForMember, roleOn, totalFollowers, type MemberCard, type Project } from '@/lib/data'
import { track } from '@/lib/track'
import { shareLink } from '@/lib/share'
import { useToast } from '@/lib/toast'
import { Avatar, Btn, Chevron, Empty, Header, IconBtn, Input, Notice, PosterFallback, Segmented, Sheet, Skeleton, Txt, Verified, tap } from '@/components/ui'
import { ReportLink } from '@/components/ReportSheet'

const SOCIAL_LABEL: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', snapchat: 'Snapchat', facebook: 'Facebook', linkedin: 'LinkedIn', vimeo: 'Vimeo', behance: 'Behance', website: 'Website' }

function socialHref(key: string, v: string) {
  if (/^https?:\/\//i.test(v)) return v
  const h = v.replace(/^@/, '')
  const base: Record<string, string> = { instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/@', youtube: 'https://youtube.com/@', x: 'https://x.com/', snapchat: 'https://snapchat.com/add/', facebook: 'https://facebook.com/', vimeo: 'https://vimeo.com/', behance: 'https://behance.net/' }
  return base[key] ? base[key] + h : null
}

type Tab = 'overview' | 'credits' | 'about'

export default function MakerProfile() {
  useLang()
  const { username } = useLocalSearchParams<{ username: string }>()
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const specialties = useSpecialties()
  const { session, profile: viewer } = useAuth()
  const toast = useToast()
  const [p, setP] = useState<Profile | null | undefined>(undefined)
  const [projects, setProjects] = useState<Project[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [msgBusy, setMsgBusy] = useState(false)
  const [pickOpen, setPickOpen] = useState(false)
  const [pick, setPick] = useState<string[]>([])
  const [aboutOpen, setAboutOpen] = useState(false)
  const [aboutDraft, setAboutDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!username) return
    setP(undefined)
    supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).ilike('username', username).maybeSingle().then(async ({ data }) => {
      const prof = (data as unknown as Profile) || null
      setP(prof)
      if (!prof) return
      if (prof.status === 'approved') track('profile', prof.id, 'view')
      const [list, a] = await Promise.all([projectsForMember(prof.id), supabase.from('awards').select('*').eq('owner_id', prof.id).order('year', { ascending: false })])
      setProjects(list)
      setAwards((a.data as Award[]) || [])
    })
  }, [username])

  const workedWith = useMemo(() => {
    if (!p) return []
    const map = new Map<string, MemberCard>()
    for (const pr of projects) {
      if (pr.owner && pr.owner.id !== p.id && pr.owner.status === 'approved') map.set(pr.owner.id, pr.owner)
      for (const cr of pr.credits || []) if (cr.profile && cr.profile.id !== p.id) map.set(cr.profile.id, cr.profile)
    }
    return [...map.values()].slice(0, 8)
  }, [projects, p])

  if (p === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Header />
        <View style={{ padding: 20, gap: 14 }}>
          <Skeleton style={{ width: 170, aspectRatio: 3 / 4 }} />
          <Skeleton style={{ height: 34, width: '70%' }} />
          <Skeleton style={{ height: 16, width: '40%' }} />
        </View>
      </View>
    )
  }
  if (p === null) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Header />
        <View style={{ padding: 20 }}>
          <Empty title={t('الصفحة غير موجودة', 'Page not found')} body={t('ربما تغيّر الرابط أو لم تُنشر الصفحة بعد.', 'The link may have changed, or the page is not published yet.')} action={t('تصفّح الصنّاع', 'Browse makers')} onAction={() => router.navigate('/makers')} />
        </View>
      </View>
    )
  }

  const isOwner = session?.user.id === p.id
  const canMessage = !isOwner && viewer?.status === 'approved' && p.status === 'approved'
  const creator = isCreator(p)
  const specs = creator ? [] : (p.specialty_ids || []).map((id) => specName(specialties, id)).filter(Boolean)
  const kinds = creator ? (p.content_types || []).map(contentLabel).filter(Boolean) : []
  const audience = totalFollowers(p)
  const place = [cityLabel(p.city), label(COUNTRIES, p.country)].filter(Boolean).join(t('، ', ', '))
  const vlen = videoLengthLabel(p.video_length)
  const followers = Object.entries(p.followers || {}).filter(([, n]) => Number(n) > 0)
  const socials: [string, string][] = [
    ...Object.entries(p.socials || {}).filter(([, v]) => v),
    ...followers.filter(([k]) => !(p.socials || {})[k]).map(([k]) => [k, ''] as [string, string]),
  ]
  const altName = p.full_name && p.name_ar && p.full_name.trim() !== p.name_ar.trim() ? t(p.full_name, p.name_ar) : ''
  const featuredIds = (p.featured_work_ids || []).filter((id) => projects.some((x) => x.id === id))
  const featured = (featuredIds.length ? featuredIds.map((id) => projects.find((x) => x.id === id)!) : projects).slice(0, 5)
  const badges = [
    p.is_founding && { key: 'f', icon: '★', title: t('عضو مؤسس', 'Founding member'), sub: t('من أوائل صنّاع Makers', 'Among the first on Makers'), accent: true },
    p.status === 'approved' && { key: 'v', icon: '✓', title: t('ملف موثّق', 'Reviewed profile'), sub: t('راجعه فريق Makers', 'Reviewed by the Makers team') },
    creator && audience > 0 && { key: 'aud', icon: '📣', title: t(`${formatFollowers(audience)} متابع`, `${formatFollowers(audience)} followers`), sub: t('على كل المنصات', 'across platforms') },
    projects.length > 0 && { key: 'w', icon: '🎬', title: t(`${projects.length} عمل`, `${projects.length} credit${projects.length === 1 ? '' : 's'}`), sub: t('على Makers', 'on Makers') },
    awards.length > 0 && { key: 'a', icon: '🏆', title: t(`${awards.length} جائزة`, `${awards.length} award${awards.length === 1 ? '' : 's'}`), sub: awards[0]?.org || '' },
  ].filter(Boolean) as { key: string; icon: string; title: string; sub: string; accent?: boolean }[]
  const backdrop = p.avatar_url || (projects[0] ? posterOf(projects[0]) : null)
  const slate: [string, string][] = [
    [creator ? t('المتابعون', 'Followers') : t('الأعمال', 'Credits'), creator ? formatFollowers(audience) : String(projects.length)],
    [creator ? t('يصنع المحتوى منذ', 'Creating since') : t('في المجال منذ', 'Working since'), p.start_year ? String(p.start_year) : '·'],
    [t('المكان', 'Based in'), place || '·'],
    [t('الحالة', 'Status'), p.available ? t('متاح للعمل', 'Available') : t('غير متاح', 'Busy')],
  ]

  const saveProfile = async (patch: Partial<Profile>) => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update(patch).eq('id', p.id)
    setSaving(false)
    if (!error) setP({ ...p, ...patch })
    else toast(t('تعذّر الحفظ', 'Could not save'), 'error')
    return !error
  }
  const startChat = async () => {
    track('profile', p.id, 'message')
    setMsgBusy(true)
    const { data, error } = await supabase.rpc('start_conversation', { p_other: p.id })
    setMsgBusy(false)
    if (!error && data) router.push(`/chat/${data}`)
  }
  const share = async () => {
    track('profile', p.id, 'share')
    const r = await shareLink(`${SITE_URL}/${p.username}`, `${displayName(p)} | Makers`)
    if (r === 'copied') toast(t('تم نسخ الرابط', 'Link copied'))
  }
  const openProject = (id: string) => { track('profile', p.id, 'work'); router.push(`/project/${id}`) }
  const col = (width - 40 - 24) / 3

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 60 }} contentInsetAdjustmentBehavior="never">
        {/* opening titles */}
        <View style={{ backgroundColor: c.screen, overflow: 'hidden' }}>
          {backdrop ? <Image source={{ uri: backdrop }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} contentFit="cover" blurRadius={40} /> : null}
          <LinearGradient colors={['rgba(5,5,7,0.55)', 'rgba(5,5,7,0.72)', c.bg]} locations={[0, 0.65, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <Header transparent light right={<IconBtn name="share" label={t('شارك الصفحة', 'Share page')} onPress={share} color={onScreen.text} bg="rgba(5,5,7,0.55)" />} />
          <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20, gap: 16 }}>
            {p.status !== 'approved' && isOwner && <Notice>{t('هذه معاينة لصفحتك. لن تظهر للزوار قبل موافقة فريق Makers.', 'This is a preview of your page. Visitors will see it once the Makers team approves it.')}</Notice>}
            <View style={{ width: 180, aspectRatio: 3 / 4, borderRadius: 16, overflow: 'hidden', backgroundColor: c.surfaceAlt, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 18 } }}>
              {p.avatar_url ? <Image source={{ uri: p.avatar_url }} style={{ flex: 1 }} contentFit="cover" transition={300} /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Txt display size={64} color={c.muted2} center style={{ lineHeight: 90 }}>{displayName(p).charAt(0)}</Txt></View>}
              {p.is_founding && (
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 6, backgroundColor: c.accent }}>
                  <Txt size={11} weight="semi" color={c.onAccent} center>{t('عضو مؤسس', 'Founding member')}</Txt>
                </View>
              )}
            </View>
            <View style={{ gap: 4 }}>
              <Txt size={14} weight="medium" color={c.accent}>{creator ? [t('صانع محتوى', 'Content creator'), ...kinds].join(' · ') : [...specs, ...(p.other_specialty ? [p.other_specialty] : [])].join(' · ')}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Txt display size={34} color={onScreen.text}>{displayName(p)}</Txt>
                {p.is_founding ? <Verified size={24} /> : null}
              </View>
              {altName ? <Txt size={15} color={onScreen.dim}>{altName}</Txt> : null}
            </View>
            {/* the slate: facts in cells, like a clapperboard */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: onScreen.line, backgroundColor: 'rgba(5,5,7,0.35)' }}>
              {slate.map(([k, v], i) => (
                <View key={k} style={{ width: '50%', paddingHorizontal: 14, paddingVertical: 10, gap: 2, borderStartWidth: i % 2 ? 1 : 0, borderTopWidth: i > 1 ? 1 : 0, borderColor: onScreen.line }}>
                  <Txt size={11} color={onScreen.faint}>{k}</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {i === 3 && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.available ? c.live : onScreen.faint }} />}
                    <Txt display weight="semi" size={15} color={onScreen.text} lines={1}>{v}</Txt>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {isOwner ? (
                <>
                  <Btn onPress={() => router.push('/edit')}>{t('تعديل الملف الشخصي', 'Edit profile')}</Btn>
                  {p.status === 'approved' && <Btn variant="outline" style={{ borderColor: 'rgba(243,239,231,0.3)' }} onPress={() => router.push('/project/new')}><Txt size={15} weight="semi" color={onScreen.text}>{t('+ أضف مشروعاً', '+ Add a project')}</Txt></Btn>}
                </>
              ) : p.status === 'approved' ? (
                <Btn onPress={() => { track('profile', p.id, 'contact'); router.push({ pathname: '/collab/[id]', params: { id: p.id } }) }}>{t('اطلب تعاوناً', 'Request collaboration')}</Btn>
              ) : null}
              {canMessage && <Btn variant="outline" busy={msgBusy} style={{ borderColor: 'rgba(243,239,231,0.3)' }} onPress={startChat}><Txt size={15} weight="semi" color={onScreen.text}>{t('راسِل', 'Message')}</Txt></Btn>}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 6, gap: 24 }}>
          <Segmented value={tab} onChange={setTab} items={[{ key: 'overview', label: t('نظرة عامة', 'Overview') }, { key: 'credits', label: t(`الأعمال (${projects.length})`, `Credits (${projects.length})`) }, { key: 'about', label: t('نبذة', 'About') }]} />

          {tab === 'overview' && (
            <>
              {(p.bio || p.about) ? (
                <Pressable onPress={() => setTab('about')} style={{ gap: 4 }}>
                  <Txt size={15} color={c.text2} lines={3} auto>{p.bio || p.about}</Txt>
                  <Txt size={13} weight="semi" color={c.accent}>{t('اقرأ المزيد', 'Read more')}</Txt>
                </Pressable>
              ) : null}

              {badges.length > 0 && (
                <View style={{ gap: 10 }}>
                  <Txt display size={18}>{t('الشارات', 'Badges')}</Txt>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {badges.map((b) => (
                      <View key={b.key} style={{ maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderStartWidth: b.accent ? 3 : 1, borderStartColor: b.accent ? c.accent : c.border }}>
                        <Txt size={16}>{b.icon}</Txt>
                        <View style={{ flexShrink: 1 }}>
                          <Txt size={13} weight="bold" lines={1}>{b.title}</Txt>
                          {b.sub ? <Txt size={11} color={c.muted} lines={1}>{b.sub}</Txt> : null}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt display size={18}>{t('أعمال مختارة', 'Featured work')}</Txt>
                  {isOwner && projects.length > 0 ? <Txt size={13} weight="semi" color={c.accent} onPress={() => { setPick(featuredIds); setPickOpen(true) }}>{t('اختر أعمالك المميزة', 'Choose featured work')}</Txt> : null}
                </View>
                {projects.length === 0 ? (
                  <Empty title={isOwner ? t('أضف أول مشروع لك', 'Add your first project') : t('لم تُضف مشاريع بعد.', 'No projects added yet.')} body={isOwner ? t('ليظهر هنا وفي صفحة المشاريع.', 'It shows here and on the projects page.') : undefined} action={isOwner && p.status === 'approved' ? t('أضف مشروعاً', 'Add a project') : undefined} onAction={() => router.push('/project/new')} />
                ) : featured.map((pr) => {
                  const img = posterOf(pr)
                  return (
                    <Pressable key={pr.id} onPress={() => { tap(); openProject(pr.id) }} style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: 10, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.8 : 1 })}>
                      <View style={{ width: 64, height: 96, borderRadius: 10, overflow: 'hidden' }}>
                        {img ? <Image source={{ uri: img }} style={{ flex: 1 }} contentFit="cover" /> : <PosterFallback />}
                      </View>
                      <View style={{ flex: 1, gap: 3, justifyContent: 'center' }}>
                        <Txt display size={15} lines={2}>{pr.title}</Txt>
                        <Txt size={12} color={c.accent} lines={1}>{roleOn(pr, p.id)}</Txt>
                        <Txt size={11} color={c.muted} lines={1}>{[pr.year, kindLabel(pr.kind), pr.brand].filter(Boolean).join(' · ')}</Txt>
                      </View>
                      <View style={{ justifyContent: 'center' }}><Chevron /></View>
                    </Pressable>
                  )
                })}
                {projects.length > featured.length && <Txt size={14} weight="semi" color={c.accent} onPress={() => setTab('credits')}>{t(`كل الأعمال (${projects.length})`, `All ${projects.length} credits`)}</Txt>}
              </View>

              {awards.length > 0 && (
                <View style={{ gap: 10 }}>
                  <Txt display size={18}>{t('الجوائز والاعتمادات', 'Awards & recognition')}</Txt>
                  <View style={{ borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
                    {awards.map((a, i) => (
                      <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderColor: c.border }}>
                        <Txt size={14} weight="semi">{a.rank}</Txt>
                        <View style={{ flex: 1 }}><Txt size={13} color={c.muted} lines={1}>{a.org || ''}</Txt></View>
                        <Txt size={12} color={c.muted2}>{a.year ? String(a.year) : ''}</Txt>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {socials.length > 0 && (
                <View style={{ gap: 10 }}>
                  <Txt display size={18}>{t('الحضور على السوشال', 'Social reach')}</Txt>
                  <View style={{ borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
                    {socials.map(([k, v], i) => {
                      const href = v ? socialHref(k, v) : null
                      const n = Number(p.followers?.[k] || 0)
                      return (
                        <Pressable key={k} disabled={!href} onPress={() => { if (href) { track('profile', p.id, 'social'); Linking.openURL(href) } }} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderColor: c.border }}>
                          <Txt size={14} color={c.text2}>{SOCIAL_LABEL[k] || k}</Txt>
                          <Txt size={14} weight="semi">{n > 0 ? formatFollowers(n) : href ? '↗' : ''}</Txt>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              )}

              {workedWith.length > 0 && (
                <View style={{ gap: 10 }}>
                  <Txt display size={18}>{t('عمل مع', 'Worked with')}</Txt>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                    {workedWith.map((m) => (
                      <Pressable key={m.id} onPress={() => { tap(); router.push(`/maker/${m.username}`) }} style={{ width: 72, alignItems: 'center', gap: 6 }}>
                        <Avatar url={m.avatar_url} name={displayName(m)} size={56} />
                        <Txt size={11} weight="semi" center lines={1}>{displayName(m).split(' ')[0]}</Txt>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          {tab === 'credits' && (
            projects.length === 0 ? <Empty title={t('لم تُضف مشاريع بعد.', 'No projects added yet.')} /> : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {projects.map((pr) => {
                  const img = posterOf(pr)
                  return (
                    <Pressable key={pr.id} onPress={() => { tap(); openProject(pr.id) }} style={{ width: col, gap: 5 }}>
                      <View style={{ width: col, aspectRatio: 2 / 3, borderRadius: 12, overflow: 'hidden', backgroundColor: c.surface }}>
                        {img ? <Image source={{ uri: img }} style={{ flex: 1 }} contentFit="cover" /> : <PosterFallback title={pr.title} size={11} />}
                        {p.featured_work_ids?.includes(pr.id) ? <View style={{ position: 'absolute', top: 6, start: 6, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: c.accent }}><Txt size={9} weight="bold" color={c.onAccent}>{t('مختار', 'Featured')}</Txt></View> : null}
                      </View>
                      <Txt size={12} weight="semi" lines={1}>{pr.title}</Txt>
                      <Txt size={10} color={c.accent} lines={1}>{roleOn(pr, p.id)}</Txt>
                    </Pressable>
                  )
                })}
              </View>
            )
          )}

          {tab === 'about' && (
            <View style={{ gap: 14 }}>
              {isOwner ? <Txt size={13} weight="semi" color={c.accent} onPress={() => { setAboutDraft(p.about || p.bio || ''); setAboutOpen(true) }}>{t('عدّل النبذة', 'Edit about')}</Txt> : null}
              {p.about || p.bio ? <Txt size={16} color={c.text2} auto selectable style={{ lineHeight: 30 }}>{p.about || p.bio}</Txt> : <Txt size={14} color={c.muted}>{isOwner ? t('اكتب قصتك: من أنت، ماذا صنعت، وما الذي يميّز شغلك.', 'Tell your story: who you are, what you have made, and what sets your work apart.') : t('لا توجد نبذة بعد.', 'No bio yet.')}</Txt>}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  creator ? [t('نوع المحتوى', 'Content'), kinds.join(listSep())] : [t('التخصص', 'Specialty'), specs.join(listSep()) || p.other_specialty || ''],
                  [t('المكان', 'Based in'), place],
                  [creator ? t('يصنع المحتوى منذ', 'Creating since') : t('في المجال منذ', 'Working since'), p.start_year ? String(p.start_year) : ''],
                  [t('نوع الفيديو', 'Format'), vlen || ''],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <View key={k} style={{ flexBasis: '47%', flexGrow: 1, padding: 12, borderRadius: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, gap: 2 }}>
                    <Txt size={11} color={c.muted}>{k}</Txt>
                    <Txt size={13} weight="semi">{v}</Txt>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!isOwner && p.status === 'approved' && <ReportLink type="profile" id={p.id} />}
        </View>
      </ScrollView>

      <Sheet visible={pickOpen} onClose={() => setPickOpen(false)} title={t('أعمالك المختارة (حتى 5)', 'Your featured work (up to 5)')}
        footer={<Btn full busy={saving} onPress={async () => { if (await saveProfile({ featured_work_ids: pick })) setPickOpen(false) }}>{t('حفظ', 'Save')}</Btn>}>
        <Txt size={14} color={c.muted}>{t(`اخترت ${pick.length} من 5. تظهر بالترتيب الذي تختاره.`, `${pick.length} of 5 chosen. They show in the order you pick.`)}</Txt>
        {projects.map((pr) => {
          const on = pick.includes(pr.id)
          const img = posterOf(pr)
          return (
            <Pressable key={pr.id} disabled={!on && pick.length >= 5} onPress={() => { tap(); setPick(on ? pick.filter((x) => x !== pr.id) : [...pick, pr.id]) }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: on ? c.accent : c.border, backgroundColor: on ? alpha(c, 0.12) : c.surfaceAlt, opacity: !on && pick.length >= 5 ? 0.4 : 1 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.accent : 'transparent', borderWidth: on ? 0 : 1, borderColor: c.borderMid }}>
                {on ? <Txt size={12} weight="bold" color={c.onAccent} center>{String(pick.indexOf(pr.id) + 1)}</Txt> : null}
              </View>
              <View style={{ width: 30, height: 44, borderRadius: 5, overflow: 'hidden' }}>{img ? <Image source={{ uri: img }} style={{ flex: 1 }} /> : <PosterFallback />}</View>
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="semi" lines={1}>{pr.title}</Txt>
                <Txt size={12} color={c.muted} lines={1}>{[pr.year, roleOn(pr, p.id)].filter(Boolean).join(' · ')}</Txt>
              </View>
            </Pressable>
          )
        })}
      </Sheet>

      <Sheet visible={aboutOpen} onClose={() => setAboutOpen(false)} title={t('نبذة عنك', 'About you')}
        footer={<Btn full busy={saving} onPress={async () => { if (await saveProfile({ about: aboutDraft.trim() || null })) setAboutOpen(false) }}>{t('حفظ', 'Save')}</Btn>}>
        <Input multiline maxLength={5000} value={aboutDraft} onChangeText={setAboutDraft} placeholder={t('قصتك، أهم أعمالك، الجوائز، طريقة شغلك…', 'Your story, key work, awards, how you work…')} style={{ minHeight: 260 }} />
        <Txt size={12} color={c.muted}>{`${aboutDraft.length}/5000 · `}{t('النبذة القصيرة في ملفك تظهر في سطرين، وهذه تظهر كاملة في تبويب «نبذة».', 'Your short bio shows in two lines; this full text shows in the About tab.')}</Txt>
      </Sheet>
    </View>
  )
}

