import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { t, useLang } from '@/lib/i18n'
import { alpha, useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useSpecialties, specName } from '@/lib/specialties'
import { CALL_SELECT, listOpenCalls, type OpenCall } from '@/lib/data'
import { Btn, Chip, Empty, IconBtn, Pill, Skeleton, TabTitle, Txt, tap } from '@/components/ui'
import { CallCard } from '@/components/cards'
import { LinearGradient } from 'expo-linear-gradient'

export default function Calls() {
  useLang()
  const { c } = useTheme()
  const { profile } = useAuth()
  const specialties = useSpecialties()
  const [calls, setCalls] = useState<OpenCall[] | null>(null)
  const [mine, setMine] = useState<OpenCall[]>([])
  const [appliedIds, setAppliedIds] = useState<string[]>([])
  const [role, setRole] = useState<number | 'all'>('all')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    await Promise.all([
      listOpenCalls(100).then(setCalls),
      profile ? supabase.from('open_calls').select(CALL_SELECT).eq('owner_id', profile.id).neq('status', 'open').order('created_at', { ascending: false }).then(({ data }) => setMine((data as unknown as OpenCall[]) || [])) : null,
      profile ? supabase.from('open_call_applications').select('call_id').eq('applicant_id', profile.id).then(({ data }) => setAppliedIds(((data as { call_id: string }[]) || []).map((x) => x.call_id))) : null,
    ])
  }, [profile])

  // Reload when coming back from a call (applied, closed, posted).
  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = (calls || []).filter((x) => (!remoteOnly || x.remote) && (role === 'all' || x.role_ids.includes(role)))
  const usedRoles = specialties.filter((s) => (calls || []).some((x) => x.role_ids.includes(s.id)))
  const canPost = profile?.status === 'approved'
  const post = () => router.push(canPost ? '/call/new' : profile ? '/status' : '/join')
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 120 }} contentInsetAdjustmentBehavior="never"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accent} />}>
      <TabTitle title={t('فرص مفتوحة', 'Open calls')} sub={t('إنتاجات تبحث عن صنّاع الآن. قدّم وانضم إلى الطاقم.', 'Productions looking for Makers right now. Apply to join the crew.')}
        right={<IconBtn name="plus" label={t('انشر فرصة', 'Post an opportunity')} onPress={post} bg={c.accent} color={c.onAccent} />} />

      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        {mine.length > 0 && (
          <View style={{ gap: 8 }}>
            <Txt size={13} weight="semi" color={c.muted}>{t('فرصك غير المنشورة', 'Your unpublished calls')}</Txt>
            {mine.map((x) => (
              <Pressable key={x.id} onPress={() => { tap(); router.push(`/call/${x.id}`) }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
                <View style={{ flex: 1 }}><Txt size={14} weight="semi" lines={1}>{x.title}</Txt></View>
                <Pill tone={x.status === 'pending' ? 'amber' : x.status === 'rejected' ? 'red' : 'neutral'}>{x.status === 'pending' ? t('بانتظار المراجعة', 'In review') : x.status === 'rejected' ? t('مرفوضة', 'Rejected') : t('مغلقة', 'Closed')}</Pill>
              </Pressable>
            ))}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
          <Chip on={remoteOnly} onPress={() => setRemoteOnly(!remoteOnly)}>{t('عن بُعد فقط', 'Remote only')}</Chip>
          <Chip on={role === 'all'} onPress={() => setRole('all')}>{t('كل الأدوار', 'All roles')}</Chip>
          {usedRoles.map((s) => <Chip key={s.id} on={role === s.id} onPress={() => setRole(role === s.id ? 'all' : s.id)}>{specName(specialties, s.id)}</Chip>)}
        </ScrollView>

        {calls === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} style={{ height: 210 }} />)
        ) : filtered.length === 0 ? (
          <Empty
            title={calls.length === 0 ? t('لا توجد فرص منشورة الآن', 'No open calls right now') : t('لا فرص تطابق الفلتر', 'No calls match the filter')}
            body={calls.length === 0 ? t('عندك مشروع يحتاج طاقم؟ انشره هنا.', 'Have a project that needs a crew? Post it here.') : undefined}
            action={calls.length === 0 ? t('انشر فرصة', 'Post an opportunity') : undefined}
            onAction={calls.length === 0 ? post : undefined}
          />
        ) : (
          filtered.map((x) => <CallCard key={x.id} call={x} specialties={specialties} applied={appliedIds.includes(x.id)} />)
        )}

        <View style={{ borderRadius: 22, overflow: 'hidden', padding: 22, gap: 10, borderWidth: 1, borderColor: alpha(c, 0.25) }}>
          <LinearGradient colors={[alpha(c, 0.14), 'rgba(0,0,0,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <Txt display size={19}>{t('عندك مشروع يحتاج طاقم؟', 'Have a project to crew up?')}</Txt>
          <Txt size={14} color={c.muted}>{t('انشر مشروعك وتواصل مع صنّاع موثّقين في العالم العربي.', 'Post your production and connect with reviewed Makers across the Arab world.')}</Txt>
          <Btn small onPress={post}>{t('انشر فرصة', 'Post a project')}</Btn>
        </View>
      </View>
    </ScrollView>
  )
}
