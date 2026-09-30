import { useCallback, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { Image } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { t, useLang } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { SITE_URL } from '@/lib/constants'
import { displayName } from '@/lib/data'
import { computeProgress } from '@/lib/progress'
import { memberLine, useSpecialties } from '@/lib/specialties'
import { shareLink } from '@/lib/share'
import { useToast } from '@/lib/toast'
import { Badge, Btn, Group, H, Logo, Pill, Row, Spinner, Txt, Verified } from '@/components/ui'
import { ProgressTimeline } from '@/components/Progress'
import { StatsCard } from '@/components/StatsCard'

export default function Account() {
  useLang()
  const { c } = useTheme()
  const { rtl } = useLang()
  const insets = useSafeAreaInsets()
  const { session, profile, loading, refreshProfile, signOut } = useAuth()
  const specialties = useSpecialties()
  const toast = useToast()
  const [works, setWorks] = useState(0)
  const [newRequests, setNewRequests] = useState(0)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadCounts = useCallback(async () => {
    if (!session) return
    const [w, r] = await Promise.all([
      supabase.from('works').select('id', { count: 'exact', head: true }).eq('owner_id', session.user.id),
      supabase.from('contact_requests').select('id', { count: 'exact', head: true }).eq('to_id', session.user.id).eq('status', 'new'),
    ])
    setWorks(w.count ?? 0)
    setNewRequests(r.count ?? 0)
  }, [session])

  useFocusEffect(useCallback(() => { loadCounts(); refreshProfile() }, [loadCounts])) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <View style={{ flex: 1, backgroundColor: c.bg }}><Spinner /></View>

  if (!session) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 120, gap: 22 }}>
        <Logo size={14} align={rtl ? 'right' : 'left'} />
        <View style={{ gap: 10, paddingTop: 20 }}>
          <H size={30}>{t('صفحتك على Makers', 'Your page on Makers')}</H>
          <Txt size={15} color={c.text2}>{t('ابنِ صفحتك، أضف أعمالك، واستقبل طلبات التعاون من أصحاب المشاريع مباشرة.', 'Build your page, add your work, and get collaboration requests from productions directly.')}</Txt>
        </View>
        <View style={{ gap: 10 }}>
          <Btn full onPress={() => router.push('/join')}>{t('انضم إلى Makers', 'Join Makers')}</Btn>
          <Btn full variant="outline" onPress={() => router.push('/login')}>{t('لدي حساب، سجّل الدخول', 'I have an account, sign in')}</Btn>
        </View>
        <Group>
          <Row icon="gear" title={t('الإعدادات', 'Settings')} sub={t('اللغة والمظهر', 'Language and appearance')} onPress={() => router.push('/settings')} />
          <Row icon="globe" title={t('افتح الموقع', 'Open the website')} value="makerss.net" onPress={() => WebBrowser.openBrowserAsync(SITE_URL)} />
        </Group>
      </ScrollView>
    )
  }

  if (!profile) return <View style={{ flex: 1, backgroundColor: c.bg }}><Spinner /></View>

  const progress = computeProgress(profile, works)
  const status = profile.status
  const approved = status === 'approved'
  const staff = profile.role === 'admin' || profile.role === 'reviewer'
  const link = `${SITE_URL}/${profile.username}`
  const statusPill =
    approved ? <Pill tone="green">{t('منشورة', 'Live')}</Pill>
      : status === 'pending' ? <Pill tone="blue">{t('قيد المراجعة', 'In review')}</Pill>
        : status === 'rejected' ? <Pill tone="red">{t('تحتاج تعديلاً', 'Needs changes')}</Pill>
          : status === 'suspended' ? <Pill>{t('موقوف', 'Suspended')}</Pill>
            : progress.count === 5 ? <Pill tone="green">{t('جاهزة للإرسال', 'Ready to send')}</Pill> : <Pill tone="amber">{t('قيد الإكمال', 'In progress')}</Pill>

  const submit = async () => {
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ status: 'pending' }).eq('id', profile.id)
    setBusy(false)
    if (error) return toast(t('تعذّر الإرسال', 'Could not send'), 'error')
    await refreshProfile()
    router.push('/status')
  }

  const confirmSignOut = () => Alert.alert(t('تسجيل الخروج؟', 'Sign out?'), undefined, [
    { text: t('إلغاء', 'Cancel'), style: 'cancel' },
    { text: t('خروج', 'Sign out'), style: 'destructive', onPress: () => signOut() },
  ])

  const refresh = async () => { setRefreshing(true); await Promise.all([loadCounts(), refreshProfile()]); setRefreshing(false) }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 120, gap: 18 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accent} />}>
      <Pressable onPress={() => profile.username && router.push(`/maker/${profile.username}`)} style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <View style={{ width: 84, aspectRatio: 3 / 4, borderRadius: 14, overflow: 'hidden', backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <Txt display size={34} color={c.muted2} center style={{ lineHeight: 48 }}>{displayName(profile).charAt(0)}</Txt>}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flexShrink: 1 }}><H size={22} lines={2}>{displayName(profile)}</H></View>
            {profile.is_founding ? <Verified size={18} /> : null}
          </View>
          {memberLine(specialties, profile) ? <Txt size={13} color={c.text2} lines={1}>{memberLine(specialties, profile)}</Txt> : null}
          <Txt mono size={11} color={c.muted} style={{ textAlign: rtl ? 'right' : 'left' }}>{`makerss.net/${profile.username || ''}`}</Txt>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {statusPill}
            {profile.available ? <Pill tone="green">{t('متاح للعمل', 'Available')}</Pill> : null}
          </View>
        </View>
      </Pressable>

      {!approved && status !== 'suspended' && (
        <View style={{ padding: 16, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderMid, gap: 14 }}>
          <ProgressTimeline progress={progress} onStep={() => router.push('/edit')} />
          {status === 'pending' ? (
            <Btn variant="soft" full onPress={() => router.push('/status')}>{t('صفحتك قيد المراجعة', 'Your page is in review')}</Btn>
          ) : progress.count === 5 ? (
            <Btn full busy={busy} onPress={submit}>{t('أرسل للمراجعة', 'Send for review')}</Btn>
          ) : (
            <Btn full onPress={() => router.push('/edit')}>{t('أكمل صفحتك', 'Complete your page')}</Btn>
          )}
          {status === 'rejected' && <Txt size={13} color={c.danger}>{t('راجع ملاحظة الفريق في صفحة الحالة، ثم عدّل صفحتك وأرسلها مجدداً.', 'Read the team note on the status page, then update your page and send it again.')}</Txt>}
        </View>
      )}

      {approved && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn style={{ flex: 1 }} icon="pencil" onPress={() => router.push('/edit')}>{t('عدّل صفحتي', 'Edit my page')}</Btn>
          <Btn variant="outline" icon="share" onPress={async () => { const r = await shareLink(link, t('صفحتي على Makers', 'My page on Makers')); if (r === 'copied') toast(t('تم نسخ الرابط', 'Link copied')) }}>{t('شارك', 'Share')}</Btn>
        </View>
      )}

      {approved && <StatsCard />}

      <Group>
        {approved ? <Row icon="person" title={t('صفحتي كما يراها الناس', 'My page as others see it')} onPress={() => router.push(`/maker/${profile.username}`)} /> : null}
        {!approved ? <Row icon="pencil" title={t('عدّل صفحتي', 'Edit my page')} onPress={() => router.push('/edit')} /> : null}
        <Row icon="tray" title={t('الوارد', 'Inbox')} sub={t('طلبات التعاون والمتقدّمون على فرصك', 'Collaboration requests and applicants')} onPress={() => router.push('/inbox')} right={newRequests > 0 ? <Badge n={newRequests} /> : undefined} />
        {status !== 'draft' ? <Row icon="info" title={t('حالة صفحتي', 'My page status')} onPress={() => router.push('/status')} /> : null}
      </Group>

      {approved && (
        <Group title={t('أضف', 'Create')}>
          <Row icon="film" title={t('أضف مشروعاً', 'Add a project')} sub={t('مع البوستر والطاقم', 'With poster and crew')} onPress={() => router.push('/project/new')} />
          <Row icon="megaphone" title={t('انشر فرصة', 'Post an opportunity')} sub={t('يراجعها الفريق قبل النشر', 'Reviewed before it goes live')} onPress={() => router.push('/call/new')} />
        </Group>
      )}

      <Group>
        <Row icon="gear" title={t('الإعدادات', 'Settings')} sub={t('اللغة، المظهر، الإشعارات، الحساب', 'Language, appearance, notifications, account')} onPress={() => router.push('/settings')} />
        {staff ? <Row icon="sparkles" title={t('لوحة الإدارة', 'Admin panel')} sub={t('تفتح على الموقع', 'Opens on the website')} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/admin`)} /> : null}
        <Row icon="logout" title={t('تسجيل الخروج', 'Sign out')} danger onPress={confirmSignOut} />
      </Group>

    </ScrollView>
  )
}
