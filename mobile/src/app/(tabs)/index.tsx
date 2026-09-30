import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { t, useLang } from '@/lib/i18n'
import { alpha, onScreen, useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { useSpecialties, firstRole, isCreator } from '@/lib/specialties'
import { displayName, formatFollowers, listMembers, listOpenCalls, listProjects, posterOf, topMakers, totalFollowers, type MemberCard, type OpenCall, type Project } from '@/lib/data'
import { Avatar, Btn, Icon, Logo, Section, Skeleton, Txt, Verified, tap } from '@/components/ui'
import { CallCard, CastCard, PosterCard } from '@/components/cards'
import { FilmStrip } from '@/components/FilmStrip'
import { LangToggle, MessagesButton } from '@/components/TopButtons'

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }} decelerationRate="fast">
      {children}
    </ScrollView>
  )
}

function Hero({ members, projects }: { members: MemberCard[] | null; projects: Project[] | null }) {
  const { c } = useTheme()
  const { rtl } = useLang()
  const { session } = useAuth()
  const insets = useSafeAreaInsets()
  // Real faces and real posters only: the strips are built from what is on Makers.
  const faces = useMemo(() => (members || []).map((m) => m.avatar_url).filter(Boolean) as string[], [members])
  const posters = useMemo(() => (projects || []).map((p) => posterOf(p)).filter(Boolean) as string[], [projects])
  const stripA = [...posters, ...faces]
  const stripB = [...faces].reverse().concat(posters)

  return (
    <View style={{ backgroundColor: c.screen, paddingTop: insets.top + 12, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: 40, left: -40, right: -40, gap: 10, opacity: 0.4, transform: [{ rotate: '-7deg' }] }}>
        <FilmStrip images={stripA} height={130} speed={22} />
        <FilmStrip images={stripB} height={130} speed={28} reverse />
      </View>
      <LinearGradient colors={['rgba(5,5,7,0.55)', 'rgba(5,5,7,0.88)', c.bg]} locations={[0, 0.6, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <LinearGradient colors={[alpha(c, 0.22), 'rgba(0,0,0,0)']} start={{ x: 0.9, y: 0 }} end={{ x: 0.3, y: 0.6 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />

      <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={12} color={onScreen.text} align={rtl ? 'right' : 'left'} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LangToggle onDark />
          {session ? <MessagesButton onDark /> : (
            <Pressable onPress={() => { tap(); router.push('/login') }} hitSlop={10} style={{ paddingHorizontal: 14, height: 34, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(243,239,231,0.3)', justifyContent: 'center' }}>
              <Txt size={13} weight="semi" color={onScreen.text}>{t('دخول', 'Sign in')}</Txt>
            </Pressable>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 70, paddingBottom: 34, gap: 16 }}>
        <View>
          <Txt display size={rtl ? 34 : 38} color={onScreen.text}>{t('دليل صناع الإبداع', 'Arab World')}</Txt>
          <Txt display size={rtl ? 34 : 38} color={c.accent}>{t('في العالم العربي', 'Creative Directory')}</Txt>
        </View>
        <Txt size={16} color="rgba(243,239,231,0.78)">{t('مساحة تتعرّف فيها على من يقف خلف الصورة، وتصل إليه مباشرة.', 'A place to meet the people behind the image and reach them directly.')}</Txt>
        <Pressable onPress={() => { tap(); router.push('/search') }} style={({ pressed }) => ({ height: 56, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(243,239,231,0.2)', backgroundColor: 'rgba(243,239,231,0.08)', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, opacity: pressed ? 0.8 : 1 })}>
          <Icon name="search" size={18} color={c.accent} weight="semibold" />
          <Txt size={15} color="rgba(243,239,231,0.7)" lines={1}>{t('ابحث عن مخرج، مصوّر، صانع محتوى…', 'Find a director, DOP, creator…')}</Txt>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {!session && <Btn onPress={() => router.push('/join')}>{t('انضم إلى Makers', 'Join Makers')}</Btn>}
          <Btn variant="outline" onPress={() => router.navigate('/makers')} style={{ borderColor: 'rgba(243,239,231,0.3)' }}>
            <Txt size={15} weight="semi" color={onScreen.text}>{t('تصفّح الصنّاع', 'Browse makers')}</Txt>
          </Btn>
        </View>
      </View>
    </View>
  )
}

export default function Home() {
  useLang()
  const { c } = useTheme()
  const { session, profile } = useAuth()
  const specialties = useSpecialties()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [allProjects, setAllProjects] = useState<Project[] | null>(null)
  const [top, setTop] = useState<{ list: MemberCard[]; ranked: boolean } | null>(null)
  const [calls, setCalls] = useState<OpenCall[] | null>(null)
  const [members, setMembers] = useState<MemberCard[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    await Promise.all([
      // One project per maker: newest work from each of the most recently active makers.
      listProjects({ limit: 80 }).then((list) => {
        setAllProjects(list)
        const seen = new Set<string>()
        setProjects(list.filter((p) => (seen.has(p.owner_id) ? false : (seen.add(p.owner_id), true))).slice(0, 10))
      }).catch(() => { setProjects([]); setAllProjects([]) }),
      topMakers(10).then(setTop).catch(() => setTop({ list: [], ranked: false })),
      listOpenCalls(8).then(setCalls),
      listMembers().then(setMembers),
    ])
  }, [])

  useEffect(() => { load() }, [load])
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const audience = (members || []).filter((m) => totalFollowers(m) > 0).sort((a, b) => totalFollowers(b) - totalFollowers(a)).slice(0, 8)
  const creators = (members || []).filter(isCreator)
  const approved = profile?.status === 'approved'

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 120, gap: 34 }} contentInsetAdjustmentBehavior="never"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accent} />}>
      <Hero members={members} projects={allProjects} />

      <Section title={t('جديد على Makers', 'New on Makers')} sub={t('آخر ما أضافه الصنّاع إلى أعمالهم.', 'The latest work makers added.')} action={t('الكل', 'All')} onAction={() => router.navigate('/projects')}>
        <Rail>
          {projects === null
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ width: 150, aspectRatio: 2 / 3 }} />)
            : projects.map((p) => <PosterCard key={p.id} p={p} />)}
        </Rail>
      </Section>

      <Section
        title={top?.ranked ? t('الأكثر نشاطاً هذا الأسبوع', 'Most active this week') : t('صنّاع على Makers', 'Makers to know')}
        sub={top?.ranked ? t('ترتيب تلقائي حسب النشاط خلال سبعة أيام.', 'Ranked automatically by activity over seven days.') : undefined}
        action={t('الكل', 'All')} onAction={() => router.navigate('/makers')}
      >
        <Rail>
          {top === null
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} style={{ width: 160, aspectRatio: 3 / 4 }} />)
            : top.list.map((m, i) => <CastCard key={m.id} m={m} specialties={specialties} rank={top.ranked ? i + 1 : undefined} />)}
        </Rail>
      </Section>

      {creators.length > 0 && (
        <Section title={t('صنّاع المحتوى', 'Content creators')} sub={t('وجوه وأصوات تصنع جمهورها بنفسها.', 'Voices who build their own audience.')} action={t('الكل', 'All')} onAction={() => router.navigate({ pathname: '/makers', params: { type: 'creator' } })}>
          <Rail>{creators.map((m) => <CastCard key={m.id} m={m} specialties={specialties} />)}</Rail>
        </Section>
      )}

      <Section title={t('فرص مفتوحة', 'Open calls')} sub={t('إنتاجات تبحث عن طاقم الآن.', 'Productions looking for crew right now.')} action={t('الكل', 'All')} onAction={() => router.navigate('/calls')}>
        {calls && calls.length > 0 ? (
          <Rail>{calls.map((x) => <CallCard key={x.id} call={x} specialties={specialties} width={290} />)}</Rail>
        ) : calls ? (
          <View style={{ marginHorizontal: 20, padding: 22, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: c.borderMid, gap: 10 }}>
            <Txt display size={17}>{t('لا توجد فرص منشورة الآن.', 'No open calls right now.')}</Txt>
            <Txt size={14} color={c.muted}>{t('عندك مشروع يحتاج طاقم؟ انشره ويصل إلى صنّاع موثّقين.', 'Have a project that needs a crew? Post it and reach reviewed makers.')}</Txt>
            <Btn small onPress={() => router.push(approved ? '/call/new' : session ? '/status' : '/join')}>{t('انشر فرصة', 'Post an open call')}</Btn>
          </View>
        ) : null}
      </Section>

      {audience.length > 0 && (
        <Section title={t('أكبر الجماهير', 'Biggest audiences')} action={t('الكل', 'All')} onAction={() => router.navigate({ pathname: '/makers', params: { sort: 'audience' } })}>
          <Rail>
            {audience.map((m) => (
              <Pressable key={m.id} onPress={() => { tap(); router.push(`/maker/${m.username}`) }} style={{ width: 132, padding: 14, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', gap: 8 }}>
                <View>
                  <Avatar url={m.avatar_url} name={displayName(m)} size={62} />
                  {m.is_founding && <View style={{ position: 'absolute', bottom: -2, end: -2 }}><Verified size={18} /></View>}
                </View>
                <Txt size={13} weight="semi" center lines={1}>{displayName(m).split(' ')[0]}</Txt>
                <Txt size={11} color={c.muted} center lines={1}>{firstRole(specialties, m)}</Txt>
                <Txt display size={20} color={c.accent} center>{formatFollowers(totalFollowers(m))}</Txt>
              </Pressable>
            ))}
          </Rail>
        </Section>
      )}

      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        <Txt size={14} weight="medium" color={c.accent}>{t('من هي Makers؟', 'Who is Makers?')}</Txt>
        <Txt display size={24}>{t('كل صورة رأيتها صنعها أحد. ضوءٌ ضبطه شخص، ولقطةٌ اختارها آخر، وإيقاعٌ قرّره ثالث في غرفة المونتاج.', 'Every image you have ever seen was made by someone. Light set by one person, a shot chosen by another, a rhythm decided by a third in the edit room.')}</Txt>
        <Txt size={15} color={c.text2}>{t('Makers دليل مواهب الإنتاج في العالم العربي، مساحة تتعرّف فيها على من يقف خلف الصورة، وتصل إليه مباشرة. كل ملف فيه يراجعه فريقنا بعناية.', 'Makers is the talent directory for production across the Arab world, a place to meet the people behind the image and reach them directly. Every profile is carefully reviewed by our team.')}</Txt>
      </View>

      {!approved && (
        <View style={{ marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', backgroundColor: c.screen, padding: 24, gap: 14 }}>
          <LinearGradient colors={[alpha(c, 0.25), 'rgba(0,0,0,0)']} start={{ x: 1, y: 0.5 }} end={{ x: 0.2, y: 0.5 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <Txt display size={25} color={onScreen.text}>{t('نحن في البداية. كن من الأسماء الأولى.', "We're just getting started. Be one of the first names.")}</Txt>
          <Txt size={14} color={onScreen.dim}>{t('سجّل، ابنِ ملفك وأضف أعمالك. يراجع فريقنا كل ملف قبل النشر، ويحصل أوائل المنضمّين على شارة «عضو مؤسس» بشكل دائم.', 'Sign up, build your profile and add your work. Our team reviews every profile before it goes live, and the first makers keep a permanent Founding Member badge.')}</Txt>
          <Btn onPress={() => router.push(session ? '/edit' : '/join')}>{session ? t('أكمل ملفك', 'Finish your profile') : t('انضم إلى Makers', 'Join Makers')}</Btn>
        </View>
      )}

      <Txt size={12} color={c.muted2} center>© Makers, by intime</Txt>
    </ScrollView>
  )
}
