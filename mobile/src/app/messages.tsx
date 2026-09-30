import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t, useLang } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { relativeAr } from '@/lib/constants'
import { displayName } from '@/lib/data'
import type { Conversation } from '@/lib/messages'
import { Avatar, Badge, Empty, Header, Segmented, Spinner, Txt, Verified, tap } from '@/components/ui'
import { RequestsList } from '@/components/requests'

/** Conversations and collaboration requests (opened from the messages button at the top of the tabs). */
export default function Messages() {
  useLang()
  const { c } = useTheme()
  const { session, profile, loading } = useAuth()
  const params = useLocalSearchParams<{ tab?: string }>()
  const me = session?.user.id
  const [section, setSection] = useState<'chats' | 'collab'>(params.tab === 'collab' ? 'collab' : 'chats')
  const [convs, setConvs] = useState<Conversation[] | null>(null)
  const [people, setPeople] = useState<Record<string, Profile>>({})
  const [unread, setUnread] = useState<Record<string, number>>({})
  const [pending, setPending] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { if (params.tab === 'collab') setSection('collab') }, [params.tab])

  const loadList = useCallback(async () => {
    if (!me) return
    supabase.rpc('pending_collab_count').then(({ data }) => setPending(typeof data === 'number' ? data : 0))
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_a.eq.${me},user_b.eq.${me}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
    const list = (data as Conversation[]) || []
    setConvs(list)
    const others = [...new Set(list.map((x) => (x.user_a === me ? x.user_b : x.user_a)))]
    if (others.length) {
      const { data: ps } = await supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).in('id', others)
      const map: Record<string, Profile> = {}
      for (const p of (ps as unknown as Profile[]) || []) map[p.id] = p
      setPeople((cur) => ({ ...cur, ...map }))
    }
    const { data: un } = await supabase.from('messages').select('conversation_id').is('read_at', null).neq('sender_id', me)
    const counts: Record<string, number> = {}
    for (const r of (un as { conversation_id: string }[]) || []) counts[r.conversation_id] = (counts[r.conversation_id] || 0) + 1
    setUnread(counts)
  }, [me])

  useFocusEffect(useCallback(() => { loadList() }, [loadList]))

  // Any new message in my conversations refreshes the list (RLS limits events to my conversations).
  useEffect(() => {
    if (!me) return
    const ch = supabase
      .channel(`convs-${me}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadList())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [me, loadList])

  if (loading) return <View style={{ flex: 1, backgroundColor: c.bg }}><Spinner /></View>

  if (!session || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Header title={t('الرسائل', 'Messages')} />
        <View style={{ paddingHorizontal: 20, gap: 12, paddingTop: 10 }}>
          <Empty title={t('سجّل الدخول لترى رسائلك', 'Sign in to see your messages')} body={t('تحدّث مع باقي أعضاء Makers مباشرة، واستقبل طلبات التعاون.', 'Talk to other Makers members directly and receive collaboration requests.')} action={t('دخول', 'Sign in')} onAction={() => router.push('/login')} />
        </View>
      </View>
    )
  }

  if (profile.status !== 'approved') {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Header title={t('الرسائل', 'Messages')} />
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <Empty title={t('الرسائل متاحة بعد نشر صفحتك', 'Messages open once your page is live')} body={t('عندما يوافق فريق Makers على صفحتك، تستطيع مراسلة باقي الأعضاء.', 'When the Makers team approves your page, you can message other members.')} action={t('أكمل صفحتك', 'Complete your page')} onAction={() => router.push('/edit')} />
        </View>
      </View>
    )
  }

  const refresh = async () => { setRefreshing(true); await loadList(); setRefreshing(false) }
  const otherOf = (x: Conversation) => (x.user_a === me ? x.user_b : x.user_a)
  const tabs = (
    <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
      <Segmented value={section} onChange={setSection} items={[{ key: 'chats', label: t('المحادثات', 'Conversations') }, { key: 'collab', label: t('طلبات التعاون', 'Collab requests'), badge: pending }]} />
    </View>
  )

  if (section === 'collab') {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Header title={t('الرسائل', 'Messages')} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60, paddingTop: 6 }} contentInsetAdjustmentBehavior="never">
          {tabs}
          <View style={{ paddingHorizontal: 20 }}><RequestsList onCount={setPending} /></View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
    <Header title={t('الرسائل', 'Messages')} />
    <FlatList
      style={{ flex: 1 }}
      data={convs || []}
      keyExtractor={(x) => x.id}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingBottom: 60, paddingTop: 6 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accent} />}
      ListHeaderComponent={tabs}
      ListEmptyComponent={convs === null ? <Spinner /> : (
        <View style={{ paddingHorizontal: 20 }}>
          <Empty title={t('لا توجد محادثات بعد', 'No conversations yet')} body={t('افتح صفحة أي عضو في الدليل واضغط «راسِل» لتبدأ محادثة.', 'Open any member page in the directory and tap "Message" to start a conversation.')} action={t('تصفّح الدليل', 'Browse the directory')} onAction={() => router.navigate('/makers')} />
        </View>
      )}
      renderItem={({ item }) => {
        const o = people[otherOf(item)]
        const n = unread[item.id] || 0
        return (
          <Pressable onPress={() => { tap(); router.push(`/chat/${item.id}`) }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: pressed ? c.surface : 'transparent' })}>
            <Avatar url={o?.avatar_url} name={displayName(o)} size={54} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flexShrink: 1 }}><Txt size={16} weight="semi" lines={1}>{o ? displayName(o) : t('عضو', 'Member')}</Txt></View>
                {o?.is_founding ? <Verified size={14} /> : null}
                <View style={{ flex: 1 }} />
                {item.last_message_at ? <Txt size={11} color={c.muted}>{relativeAr(item.last_message_at)}</Txt> : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Txt size={14} color={n ? c.text : c.muted} weight={n ? 'semi' : 'regular'} lines={1}>
                    {item.last_sender === me ? t('أنت: ', 'You: ') : ''}{item.last_message_preview || t('محادثة جديدة', 'New conversation')}
                  </Txt>
                </View>
                {n > 0 && <Badge n={n} />}
              </View>
            </View>
          </Pressable>
        )
      }}
    />
    </View>
  )
}
