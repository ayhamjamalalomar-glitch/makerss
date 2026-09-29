import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import { Pressable, Share, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Btn, Empty, FoundingBadge, Loading, PosterCard, Screen, Txt, tap } from '../../components/ui'
import { SITE_URL } from '../../lib/constants'
import { displayName, formatFollowers, getMember, isCreator, memberLine, posterOf, projectsForMember, totalFollowers, useLoad, useSpecialties } from '../../lib/data'
import { t } from '../../lib/i18n'
import { C, PAD, R } from '../../lib/theme'

type Tab = 'overview' | 'works' | 'about'

export default function MakerProfile() {
  const { username } = useLocalSearchParams<{ username: string }>()
  const { width } = useWindowDimensions()
  const specs = useSpecialties()
  const member = useLoad(() => getMember(String(username)), [username])
  const works = useLoad(async () => (member.data ? projectsForMember(member.data.id) : []), [member.data?.id])
  const [tab, setTab] = useState<Tab>('overview')
  const [bioOpen, setBioOpen] = useState(false)

  if (member.loading) return <Screen><Loading /></Screen>
  const p = member.data
  if (!p || p.status !== 'approved') return <Screen><View style={{ height: 80 }} /><Empty text={t('هذه الصفحة غير متاحة.', 'This page is not available.')} /></Screen>

  const name = displayName(p)
  const creator = isCreator(p)
  const audience = totalFollowers(p)
  const projects = works.data || []
  const featuredIds = (p.featured_work_ids || []).filter((id) => projects.some((x) => x.id === id))
  const featured = (featuredIds.length ? featuredIds.map((id) => projects.find((x) => x.id === id)!) : projects).slice(0, 5)
  const place = [p.city, p.country].filter(Boolean).join(t('، ', ', '))
  const backdrop = p.avatar_url || (projects[0] ? posterOf(projects[0]) : null)
  const cardW = Math.floor((width - PAD * 2 - 24) / 3)

  const badges = [
    p.is_founding && { k: 'f', title: t('عضو مؤسس', 'Founding member'), sub: t('من أوائل صنّاع Makers', 'Among the first on Makers'), accent: true },
    { k: 'v', title: t('ملف موثّق', 'Reviewed profile'), sub: t('راجعه فريق Makers', 'Reviewed by the Makers team') },
    creator && audience > 0 && { k: 'aud', title: t(`${formatFollowers(audience)} متابع`, `${formatFollowers(audience)} followers`), sub: t('على كل المنصات', 'across platforms') },
    projects.length > 0 && { k: 'w', title: t(`${projects.length} عمل`, `${projects.length} credits`), sub: t('على Makers', 'on Makers') },
    p.available && { k: 'av', title: t('متاح للعمل', 'Available for work'), sub: '' },
  ].filter(Boolean) as { k: string; title: string; sub: string; accent?: boolean }[]

  const slate: [string, string][] = [
    [creator ? t('المتابعون', 'Followers') : t('الأعمال', 'Credits'), creator ? formatFollowers(audience) : String(projects.length)],
    [creator ? t('يصنع المحتوى منذ', 'Creating since') : t('في المجال منذ', 'Working since'), p.start_year ? String(p.start_year) : '·'],
    [t('الحالة', 'Status'), p.available ? t('متاح للعمل', 'Available') : t('غير متاح', 'Busy')],
  ]

  const share = () => { tap(); Share.share({ message: `${name} | Makers\n${SITE_URL}/${p.username}`, url: `${SITE_URL}/${p.username}` }).catch(() => {}) }

  return (
    <Screen bleed>
      {/* Hero */}
      <View style={{ height: 320, backgroundColor: C.screen }}>
        {backdrop && <Image source={{ uri: backdrop }} style={[StyleSheet.absoluteFill, { opacity: 0.45 }]} contentFit="cover" blurRadius={24} />}
        <LinearGradient colors={['rgba(5,5,7,0.3)', 'rgba(5,5,7,0.75)', C.bg]} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', bottom: 0, start: PAD, end: PAD, flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
          <View style={{ width: 104, aspectRatio: 3 / 4, borderRadius: R.md, overflow: 'hidden', backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.borderMid }}>
            {p.avatar_url ? <Image source={{ uri: p.avatar_url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Txt v="heavy" size={40} color={C.muted2}>{name.charAt(0)}</Txt></View>}
          </View>
          <View style={{ flex: 1, gap: 4, paddingBottom: 4 }}>
            {p.is_founding && <FoundingBadge small />}
            <Txt v="heavy" size={26} numberOfLines={2}>{name}</Txt>
            <Txt size={13} color={C.text2} numberOfLines={2}>{memberLine(specs, p)}</Txt>
            {!!place && <Txt size={12} color={C.muted}>{place}</Txt>}
          </View>
        </View>
      </View>

      {/* Bio: two lines, tap to read more */}
      {!!p.bio && (
        <Pressable onPress={() => setBioOpen((o) => !o)} style={{ paddingHorizontal: PAD, marginTop: 18 }}>
          <Txt size={14} color={C.text2} numberOfLines={bioOpen ? undefined : 2}>{p.bio}</Txt>
          {p.bio.length > 90 && <Txt v="medium" size={12} color={C.accent} style={{ marginTop: 2 }}>{bioOpen ? t('أقل', 'Less') : t('اقرأ المزيد', 'Read more')}</Txt>}
        </Pressable>
      )}

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: PAD, marginTop: 18 }}>
        <Btn label={t('تواصل للتعاون', 'Request to collaborate')} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/${p.username}`)} style={{ flex: 1 }} />
        <Btn label={t('مشاركة', 'Share')} kind="ghost" onPress={share} />
      </View>

      {/* Slate */}
      <View style={{ flexDirection: 'row', marginHorizontal: PAD, marginTop: 20, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }}>
        {slate.map(([k, v], i) => (
          <View key={k} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderStartWidth: i ? 1 : 0, borderColor: C.border }}>
            <Txt size={10} color={C.muted} numberOfLines={1}>{k}</Txt>
            <Txt v="bold" size={15} numberOfLines={1}>{v}</Txt>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: PAD, marginTop: 24, borderBottomWidth: 1, borderColor: C.border }}>
        {([['overview', t('نظرة عامة', 'Overview')], ['works', t(`الأعمال${projects.length ? ` (${projects.length})` : ''}`, `Works${projects.length ? ` (${projects.length})` : ''}`)], ['about', t('نبذة', 'About')]] as [Tab, string][]).map(([k, label]) => (
          <Pressable key={k} onPress={() => { tap(); setTab(k) }} style={{ paddingVertical: 12, marginEnd: 22, borderBottomWidth: 2, borderColor: tab === k ? C.accent : 'transparent', marginBottom: -1 }}>
            <Txt v={tab === k ? 'bold' : 'body'} size={14} color={tab === k ? C.text : C.muted}>{label}</Txt>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 18 }}>
        {tab === 'overview' && (
          <View style={{ gap: 22 }}>
            <View style={{ paddingHorizontal: PAD, gap: 10 }}>
              {badges.map((b) => (
                <View key={b.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: b.accent ? 'rgba(242,179,61,0.4)' : C.border }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.accent ? C.accent : b.k === 'av' ? C.live : C.text2 }} />
                  <View style={{ flex: 1 }}>
                    <Txt v="bold" size={14} color={b.accent ? C.accent : C.text}>{b.title}</Txt>
                    {!!b.sub && <Txt size={12} color={C.muted}>{b.sub}</Txt>}
                  </View>
                </View>
              ))}
            </View>
            {featured.length > 0 && (
              <View>
                <Txt v="display" size={18} style={{ paddingHorizontal: PAD, marginBottom: 12 }}>{t('أعمال مختارة', 'Featured work')}</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: PAD }}>
                  {featured.map((w) => <PosterCard key={w.id} p={w} width={cardW} />)}
                </View>
              </View>
            )}
          </View>
        )}
        {tab === 'works' && (works.loading ? <Loading /> : projects.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: PAD }}>
            {projects.map((w) => <PosterCard key={w.id} p={w} width={cardW} />)}
          </View>
        ) : <Empty text={t('لا توجد أعمال بعد.', 'No work yet.')} />)}
        {tab === 'about' && (
          <View style={{ paddingHorizontal: PAD }}>
            <Txt size={15} color={C.text2}>{p.about || p.bio || t('لم تُضف نبذة بعد.', 'No about text yet.')}</Txt>
          </View>
        )}
      </View>
    </Screen>
  )
}
