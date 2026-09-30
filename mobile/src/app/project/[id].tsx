import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t, useLang } from '@/lib/i18n'
import { onScreen, useTheme } from '@/lib/theme'
import { listSep } from '@/lib/constants'
import { displayName, getProject, kindLabel, posterOf, projectLink, type CreditRow, type Project } from '@/lib/data'
import { track } from '@/lib/track'
import { shareLink } from '@/lib/share'
import { useToast } from '@/lib/toast'
import { Btn, Empty, Header, IconBtn, PosterFallback, Skeleton, Txt, Verified, tap } from '@/components/ui'
import { VideoFrame } from '@/components/VideoFrame'
import { ReportLink } from '@/components/ReportSheet'

const DIRECTOR = ['مخرج', 'إخراج', 'director']
const WRITER = ['كاتب', 'كتابة', 'سيناريو', 'writer', 'screenplay', 'script']
const NOT_DIRECTOR = ['creative', 'art', 'photography', 'casting', 'إبداعي', 'فني', 'تصوير', 'كاستينغ']
const isRole = (cr: CreditRow, words: string[]) => !!cr.role && words.some((w) => cr.role!.toLowerCase().includes(w)) && !(words === DIRECTOR && NOT_DIRECTOR.some((x) => cr.role!.toLowerCase().includes(x)))

export default function ProjectScreen() {
  useLang()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const toast = useToast()
  const [p, setP] = useState<Project | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    getProject(id).then((x) => {
      setP(x)
      if (x) track('project', x.id, 'view')
    })
  }, [id])
  useEffect(() => { setP(undefined); load() }, [load])

  if (p === undefined) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><Header /><View style={{ padding: 20, gap: 14 }}><Skeleton style={{ height: 34, width: '70%' }} /><Skeleton style={{ aspectRatio: 16 / 9 }} /></View></View>
  }
  if (p === null) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><Header /><View style={{ padding: 20 }}><Empty title={t('المشروع غير موجود', 'Project not found')} action={t('كل المشاريع', 'All projects')} onAction={() => router.replace('/projects')} /></View></View>
  }

  const credits = p.credits || []
  const img = posterOf(p)
  const me = session?.user.id
  const isOwner = me === p.owner_id
  const tagged = !!me && !isOwner && credits.some((x) => x.profile_id === me)
  const director = credits.find((x) => isRole(x, DIRECTOR))
  const writer = credits.find((x) => x !== director && isRole(x, WRITER))

  const share = async () => {
    track('project', p.id, 'share')
    const r = await shareLink(projectLink(p), `${p.title} | Makers`)
    if (r === 'copied') toast(t('تم نسخ الرابط', 'Link copied'))
  }
  const doDelete = () => Alert.alert(t('حذف المشروع؟', 'Delete this project?'), t('سيُحذف المشروع وكل أسماء الطاقم المرتبطة به. لا يمكن التراجع.', 'The project and all its crew credits will be deleted. This cannot be undone.'), [
    { text: t('إلغاء', 'Cancel'), style: 'cancel' },
    { text: t('احذف نهائياً', 'Delete for good'), style: 'destructive', onPress: async () => {
      setBusy(true)
      const { error } = await supabase.from('works').delete().eq('id', p.id)
      setBusy(false)
      if (!error) { toast(t('حُذف المشروع', 'Project deleted')); router.back() }
    } },
  ])
  const doLeave = () => Alert.alert(t('إزالة اسمك؟', 'Remove your name?'), t('لن يظهر هذا المشروع في صفحتك، ولن يظهر اسمك في طاقمه.', 'This project will leave your page and your name will leave its crew.'), [
    { text: t('إلغاء', 'Cancel'), style: 'cancel' },
    { text: t('أزل اسمي', 'Remove me'), style: 'destructive', onPress: async () => {
      setBusy(true)
      await supabase.rpc('remove_my_credit', { p_work: p.id })
      setBusy(false)
      load()
    } },
  ])

  const facts = [
    [t('صنّاع في الطاقم', 'Makers credited'), String(credits.length)],
    [t('النوع', 'Type'), kindLabel(p.kind)],
    [t('المنصة', 'Platform'), (p.platforms || []).join(listSep())],
    [t('السنة', 'Year'), p.year ? String(p.year) : ''],
    [t('العميل / الجهة', 'Brand / studio'), p.brand || ''],
  ].filter(([, v]) => v && v !== '0')

  const CreditName = ({ cr }: { cr: CreditRow }) => cr.profile
    ? <Txt size={15} weight="semi" color={c.accent} onPress={() => router.push(`/maker/${cr.profile!.username}`)}>{displayName(cr.profile)}</Txt>
    : <Txt size={15}>{cr.display_name || ''}</Txt>

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} contentInsetAdjustmentBehavior="never">
        <View style={{ backgroundColor: c.screen, overflow: 'hidden' }}>
          {img ? <Image source={{ uri: img }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} contentFit="cover" blurRadius={44} /> : null}
          <LinearGradient colors={['rgba(5,5,7,0.5)', 'rgba(5,5,7,0.3)', 'rgba(5,5,7,0.9)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <Header transparent light right={<IconBtn name="share" label={t('مشاركة', 'Share')} onPress={share} color={onScreen.text} bg="rgba(5,5,7,0.55)" />} />
          <View style={{ paddingHorizontal: 20, paddingBottom: 22, gap: 14 }}>
            <View style={{ gap: 4 }}>
              {p.kind ? <Txt size={14} weight="medium" color={c.accent}>{kindLabel(p.kind)}</Txt> : null}
              <Txt display size={32} color={onScreen.text}>{p.title}</Txt>
              <Txt mono size={12} color={onScreen.dim}>{[p.year, ...(p.platforms || []).slice(0, 2), p.brand].filter(Boolean).join('  ·  ')}</Txt>
            </View>
            <VideoFrame url={p.url} thumbnail={p.thumbnail_url} poster={p.thumb_url} title={p.title} onPlay={() => track('project', p.id, 'work')} />
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
              <View style={{ width: 96, aspectRatio: 2 / 3, borderRadius: 10, overflow: 'hidden' }}>
                {img ? <Image source={{ uri: img }} style={{ flex: 1 }} contentFit="cover" /> : <PosterFallback />}
              </View>
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[kindLabel(p.kind), ...(p.platforms || [])].filter(Boolean).map((x) => (
                  <View key={x} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                    <Txt size={12} color={onScreen.text}>{x}</Txt>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          {isOwner && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn style={{ flex: 1 }} icon="pencil" onPress={() => router.push(`/project/edit/${p.id}`)}>{t('تعديل', 'Edit')}</Btn>
              <Btn variant="danger" disabled={busy} onPress={doDelete}>{t('حذف', 'Delete')}</Btn>
            </View>
          )}
          {tagged && <Btn variant="soft" full disabled={busy} onPress={doLeave}>{t('أزل اسمي من هذا المشروع', 'Remove me from this project')}</Btn>}

          {p.description ? <Txt size={15} color={c.text2} auto selectable>{p.description}</Txt> : null}

          <View style={{ borderTopWidth: 1, borderColor: c.border }}>
            {director && <CreditLine k={t('إخراج', 'Director')}><CreditName cr={director} /></CreditLine>}
            {writer && <CreditLine k={t('كتابة', 'Writer')}><CreditName cr={writer} /></CreditLine>}
            {p.owner && <CreditLine k={t('أضافه', 'Added by')}><Txt size={15} weight="semi" color={c.accent} onPress={() => router.push(`/maker/${p.owner!.username}`)}>{displayName(p.owner)}</Txt></CreditLine>}
            {facts.map(([k, v]) => <CreditLine key={k} k={k}><Txt size={14}>{v}</Txt></CreditLine>)}
          </View>
        </View>

        {credits.length > 0 && (
          <View style={{ backgroundColor: c.screen, paddingHorizontal: 20, paddingVertical: 28, gap: 16 }}>
            <View style={{ gap: 2 }}>
              <Txt display size={26} color={onScreen.text}>{t('الطاقم الكامل', 'Full crew')}</Txt>
              <Txt size={13} color={onScreen.faint}>{t(`${credits.length} في الطاقم`, `${credits.length} credited`)}</Txt>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {credits.map((cr) => {
                const name = cr.profile ? displayName(cr.profile) : cr.display_name || ''
                return (
                  <Pressable key={cr.id} disabled={!cr.profile} onPress={() => { tap(); router.push(`/maker/${cr.profile!.username}`) }} style={({ pressed }) => ({ flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(243,239,231,0.05)', borderWidth: 1, borderColor: 'rgba(243,239,231,0.09)', opacity: pressed ? 0.8 : 1 })}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: 'rgba(243,239,231,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                      {cr.profile?.avatar_url ? <Image source={{ uri: cr.profile.avatar_url }} style={{ width: 44, height: 44 }} contentFit="cover" /> : <Txt display size={16} color={onScreen.faint} center style={{ lineHeight: 24 }}>{name.charAt(0)}</Txt>}
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ flexShrink: 1 }}><Txt display weight="semi" size={14} color={onScreen.text} lines={1}>{name}</Txt></View>
                        {cr.profile?.is_founding ? <Verified size={13} /> : null}
                      </View>
                      <Txt size={12} color={onScreen.dim} lines={1}>{cr.role || t('الطاقم', 'Crew')}</Txt>
                      {!cr.profile ? <Txt size={10} color={onScreen.faint}>{t('ليس على Makers بعد', 'Not on Makers yet')}</Txt> : null}
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        {!isOwner && <View style={{ padding: 20 }}><ReportLink type="project" id={p.id} /></View>}
      </ScrollView>
    </View>
  )
}

function CreditLine({ k, children }: { k: string; children: React.ReactNode }) {
  const { c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderColor: c.border }}>
      <View style={{ width: 110 }}><Txt size={13} weight="bold" color={c.text2}>{k}</Txt></View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  )
}
