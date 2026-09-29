import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Pressable, Share, StyleSheet, View } from 'react-native'
import { Avatar, Btn, Empty, Loading, Screen, Tag, Txt, tap } from '../../components/ui'
import { SITE_URL } from '../../lib/constants'
import { displayName, frameOf, getProject, kindLabel, posterOf, useLoad } from '../../lib/data'
import { t } from '../../lib/i18n'
import { C, PAD, R } from '../../lib/theme'

export default function ProjectPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const res = useLoad(() => getProject(String(id)), [id])

  if (res.loading) return <Screen><Loading /></Screen>
  const p = res.data
  if (!p) return <Screen><View style={{ height: 80 }} /><Empty text={t('هذا المشروع غير متاح.', 'This project is not available.')} /></Screen>

  const poster = posterOf(p)
  const frame = frameOf(p) || poster
  const meta = [kindLabel(p.kind), p.year, p.brand].filter(Boolean).join(' · ')
  const crew = p.credits || []
  const share = () => { tap(); Share.share({ message: `${p.title} | Makers\n${SITE_URL}/projects/${p.id}`, url: `${SITE_URL}/projects/${p.id}` }).catch(() => {}) }

  return (
    <Screen bleed>
      {/* Frame: the video's own still, poster on top of it */}
      <View style={{ aspectRatio: 16 / 11, backgroundColor: C.screen }}>
        {frame && <Image source={{ uri: frame }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />}
        <LinearGradient colors={['rgba(5,5,7,0.35)', 'transparent', C.bg]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        {!!p.url && (
          <Pressable onPress={() => { tap(); WebBrowser.openBrowserAsync(p.url!) }} style={{ position: 'absolute', top: '38%', alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={t('شاهد', 'Watch')}>
            <Txt v="heavy" size={22} color={C.onAccent} style={{ marginStart: 4, writingDirection: 'ltr' }}>▶</Txt>
          </Pressable>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: PAD, marginTop: -70 }}>
        <View style={{ width: 100, aspectRatio: 2 / 3, borderRadius: R.md, overflow: 'hidden', backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.borderMid }}>
          {poster ? <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 }}><Txt v="display" size={12} color={C.text2} style={{ textAlign: 'center' }}>{p.title}</Txt></View>}
        </View>
        <View style={{ flex: 1, justifyContent: 'flex-end', gap: 6, paddingBottom: 4 }}>
          {!!p.kind && <Tag label={kindLabel(p.kind)} />}
          <Txt v="heavy" size={24} numberOfLines={3}>{p.title}</Txt>
          {!!meta && <Txt size={12} color={C.muted}>{meta}</Txt>}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: PAD, marginTop: 18 }}>
        {!!p.url && <Btn label={t('شاهد العمل', 'Watch')} onPress={() => WebBrowser.openBrowserAsync(p.url!)} style={{ flex: 1 }} />}
        <Btn label={t('مشاركة', 'Share')} kind="ghost" onPress={share} style={p.url ? undefined : { flex: 1 }} />
      </View>

      {!!p.description && <Txt size={15} color={C.text2} style={{ paddingHorizontal: PAD, marginTop: 20 }}>{p.description}</Txt>}

      {!!p.platforms?.length && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: PAD, marginTop: 16 }}>
          {p.platforms.map((pl) => <View key={pl} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill, borderWidth: 1, borderColor: C.border }}><Txt size={12} color={C.text2}>{pl}</Txt></View>)}
        </View>
      )}

      <Txt v="display" size={19} style={{ paddingHorizontal: PAD, marginTop: 30, marginBottom: 10 }}>{t('الطاقم', 'Full crew')}</Txt>
      {crew.length ? crew.map((c) => {
        const name = c.profile ? displayName(c.profile) : c.display_name || ''
        const row = (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 10 }}>
            <Avatar uri={c.profile?.avatar_url} name={name} size={42} />
            <View style={{ flex: 1 }}>
              <Txt v="bold" size={14} numberOfLines={1}>{name}</Txt>
              {!!c.role && <Txt size={12} color={C.muted} numberOfLines={1}>{c.role}</Txt>}
            </View>
            {c.status === 'confirmed' && <Txt size={11} color={C.live}>{t('مؤكَّد', 'Confirmed')}</Txt>}
          </View>
        )
        return c.profile?.username ? (
          <Pressable key={c.id} onPress={() => { tap(); router.push(`/maker/${c.profile!.username}`) }} style={({ pressed }) => ({ backgroundColor: pressed ? C.surface : 'transparent' })}>{row}</Pressable>
        ) : <View key={c.id}>{row}</View>
      }) : <Txt size={14} color={C.muted} style={{ paddingHorizontal: PAD }}>{t('لم يُضف الطاقم بعد.', 'No crew added yet.')}</Txt>}
    </Screen>
  )
}
