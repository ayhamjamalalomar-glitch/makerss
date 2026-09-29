import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { Btn, CallCard, CastCard, Empty, Loading, PosterCard, Rail, Screen, SectionHeader, Txt, Wordmark } from '../../components/ui'
import { SITE_URL } from '../../lib/constants'
import { listOpenCalls, newOnMakers, topMakers, useLoad } from '../../lib/data'
import { t } from '../../lib/i18n'
import { C, PAD, R } from '../../lib/theme'
import * as WebBrowser from 'expo-web-browser'

export default function Home() {
  const [refreshing, setRefreshing] = useState(false)
  const latest = useLoad(() => newOnMakers(10))
  const top = useLoad(() => topMakers(10))
  const calls = useLoad(() => listOpenCalls(3))

  const refresh = useCallback(() => {
    setRefreshing(true)
    latest.reload(); top.reload(); calls.reload()
    setTimeout(() => setRefreshing(false), 700)
  }, [latest, top, calls])

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={{ paddingHorizontal: PAD, paddingTop: 6, paddingBottom: 26 }}>
        <Wordmark size={12} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 26 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.rec }} />
          <Txt v="mono" size={11} color={C.muted} style={{ letterSpacing: 1.2, writingDirection: 'ltr' }}>REC · ARAB WORLD CREATIVE DIRECTORY</Txt>
        </View>
        <Txt v="heavy" size={34} style={{ marginTop: 10 }}>{t('دليل صناع الإبداع', 'The creative directory')}</Txt>
        <Txt v="heavy" size={34} color={C.accent}>{t('في العالم العربي', 'of the Arab world')}</Txt>
        <Txt size={15} color={C.text2} style={{ marginTop: 10 }}>{t('مساحة تتعرّف فيها على من يقف خلف الصورة، وتصل إليه مباشرة.', 'Meet the people behind the image and reach them directly.')}</Txt>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <Btn label={t('تصفّح الصنّاع', 'Browse makers')} onPress={() => router.push('/makers')} />
          <Btn label={t('انضم إلى Makers', 'Join Makers')} kind="ghost" onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/join`)} />
        </View>
      </View>

      <SectionHeader title={t('جديد على Makers', 'New on Makers')} subtitle={t('آخر ما أضافه الصنّاع إلى أعمالهم.', 'The latest work added by makers.')} onSeeAll={() => router.push('/projects')} />
      {latest.loading ? <Loading /> : latest.data?.length ? (
        <Rail>{latest.data.map((p) => <PosterCard key={p.id} p={p} />)}</Rail>
      ) : <Empty text={t('لا توجد مشاريع بعد.', 'No projects yet.')} />}

      <View style={{ height: 34 }} />
      <SectionHeader title={top.data?.ranked ? t('الأكثر نشاطاً هذا الأسبوع', 'Most active this week') : t('صنّاع Makers', 'Makers')} subtitle={top.data?.ranked ? t('ترتيب تلقائي حسب النشاط خلال سبعة أيام.', 'Ranked automatically by activity over seven days.') : undefined} onSeeAll={() => router.push('/makers')} />
      {top.loading ? <Loading /> : top.data?.list.length ? (
        <Rail>{top.data.list.map((m, i) => <CastCard key={m.id} m={m} rank={top.data?.ranked ? i + 1 : undefined} />)}</Rail>
      ) : <Empty text={t('لا يوجد صنّاع بعد.', 'No makers yet.')} />}

      <View style={{ height: 34 }} />
      <SectionHeader title={t('فرص مفتوحة', 'Open calls')} subtitle={t('إنتاجات تبحث عن طاقم الآن.', 'Productions looking for crew right now.')} onSeeAll={() => router.push('/opportunities')} />
      {calls.loading ? <Loading /> : calls.data?.length ? (
        <View style={{ gap: 12 }}>{calls.data.map((c) => <CallCard key={c.id} c={c} />)}</View>
      ) : <Empty text={t('لا توجد فرص مفتوحة حالياً.', 'No open calls right now.')} />}

      <View style={{ marginHorizontal: PAD, marginTop: 40, padding: 22, borderRadius: R.xl, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, gap: 10 }}>
        <Txt v="mono" size={11} color={C.accent} style={{ letterSpacing: 1.2, writingDirection: 'ltr' }}>WHO IS MAKERS</Txt>
        <Txt v="display" size={20}>{t('كل صورة رأيتها صنعها أحد.', 'Every image you have ever seen was made by someone.')}</Txt>
        <Txt size={14} color={C.text2}>{t('Makers دليل مواهب الإنتاج في العالم العربي، مساحة تتعرّف فيها على من يقف خلف الصورة، وتصل إليه مباشرة. كل ملف فيه يراجعه فريقنا بعناية.', 'Makers is the talent directory for production across the Arab world, a place to meet the people behind the image and reach them directly. Every profile is carefully reviewed by our team.')}</Txt>
      </View>
    </Screen>
  )
}
