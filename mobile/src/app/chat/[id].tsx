import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActionSheetIOS, Alert, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t, getLang, label, useLang } from '@/lib/i18n'
import { F, alpha, useTheme } from '@/lib/theme'
import { BUDGETS, PROJECT_TYPES, formatDateAr } from '@/lib/constants'
import { memberLine, useSpecialties } from '@/lib/specialties'
import { displayName } from '@/lib/data'
import { emit } from '@/lib/events'
import { splitLinks, type Conversation, type Message } from '@/lib/messages'
import { Avatar, Btn, Icon, IconBtn, Notice, Spinner, Txt, Verified, isArabic, tap } from '@/components/ui'
import { requestPlace } from '@/components/requests'

// Western digits in both languages, like every other number in the app.
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString(getLang() === 'en' ? 'en-GB' : 'ar-JO-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
const localDay = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Chat() {
  useLang()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { c, dark } = useTheme()
  const { rtl } = useLang()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const specialties = useSpecialties()
  const me = session?.user.id
  const [conv, setConv] = useState<Conversation | null | undefined>(undefined)
  const [other, setOther] = useState<Profile | null>(null)
  const [msgs, setMsgs] = useState<Message[] | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const typingRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lastTypingSent = useRef(0)
  const otherId = conv ? (conv.user_a === me ? conv.user_b : conv.user_a) : null

  useEffect(() => {
    if (!id) return
    supabase.from('conversations').select('*').eq('id', id).maybeSingle().then(({ data }) => setConv((data as Conversation) || null))
  }, [id])

  useEffect(() => {
    if (!otherId) return
    supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).eq('id', otherId).maybeSingle().then(({ data }) => setOther((data as unknown as Profile) || null))
    supabase.from('blocks').select('blocked').eq('blocked', otherId).then(({ data }) => setBlocked(!!data?.length))
  }, [otherId])

  const markRead = useCallback(async () => {
    if (!id) return
    await supabase.rpc('mark_conversation_read', { p_conv: id })
    emit('messages-read')
  }, [id])

  useEffect(() => {
    if (!id || !me) return
    supabase.from('messages').select('*').eq('conversation_id', id).order('created_at').limit(500).then(({ data }) => {
      setMsgs((data as Message[]) || [])
      markRead()
    })
    const ch = supabase
      .channel(`thread-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        const m = payload.new as Message
        setMsgs((cur) => (cur && !cur.some((x) => x.id === m.id) ? [...cur, m] : cur))
        if (m.sender_id !== me) { markRead(); setOtherTyping(false) }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        const m = payload.new as Message
        setMsgs((cur) => cur?.map((x) => (x.id === m.id ? m : x)) || cur)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id, me, markRead])

  // "Typing…": a short broadcast on the conversation's channel. Nothing is stored.
  useEffect(() => {
    if (!id || !me) return
    let hide: ReturnType<typeof setTimeout> | undefined
    const ch = supabase
      .channel(`typing-${id}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if ((payload as { user?: string })?.user === me) return
        setOtherTyping(true)
        clearTimeout(hide)
        hide = setTimeout(() => setOtherTyping(false), 3500)
      })
      .subscribe()
    typingRef.current = ch
    return () => { clearTimeout(hide); typingRef.current = null; supabase.removeChannel(ch) }
  }, [id, me])

  const onType = (value: string) => {
    setText(value)
    const now = Date.now()
    if (value.trim() && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now
      typingRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user: me } })
    }
  }

  const send = async () => {
    const body = text.trim()
    if (!body || busy || !id || !me) return
    tap()
    setBusy(true)
    setError(null)
    const { data, error } = await supabase.rpc('send_message', { p_conv: id, p_body: body })
    setBusy(false)
    if (error) {
      const m = error.message || ''
      return setError(m.includes('too many') ? t('أرسلت رسائل كثيرة خلال وقت قصير. انتظر قليلاً.', 'You sent many messages in a short time. Wait a moment.')
        : m.includes('blocked') ? t('لا يمكن إرسال رسائل في هذه المحادثة.', 'Messages cannot be sent in this conversation.')
          : t('تعذّر إرسال الرسالة. حاول مرة أخرى.', 'Could not send the message. Try again.'))
    }
    setText('')
    const newId = data as string
    setMsgs((cur) => (cur && !cur.some((x) => x.id === newId) ? [...cur, { id: newId, conversation_id: id, sender_id: me, body, created_at: new Date().toISOString(), read_at: null }] : cur))
  }

  const toggleBlock = async () => {
    if (!otherId) return
    const { error } = await supabase.rpc('set_block', { p_other: otherId, p_value: !blocked })
    if (!error) setBlocked(!blocked)
  }

  const menu = () => {
    const viewLabel = t('افتح صفحته', 'View profile')
    const blockLabel = blocked ? t('إلغاء الحظر', 'Unblock') : t('حظر هذا العضو', 'Block this member')
    const cancel = t('إلغاء', 'Cancel')
    const onPick = (i: number) => {
      if (i === 0 && other?.username) router.push(`/maker/${other.username}`)
      if (i === 1) {
        if (blocked) toggleBlock()
        else Alert.alert(t('حظر هذا العضو؟', 'Block this member?'), t('لن يستطيع مراسلتك، ولن تصلك رسائله.', 'They will not be able to message you.'), [{ text: cancel, style: 'cancel' }, { text: t('حظر', 'Block'), style: 'destructive', onPress: toggleBlock }])
      }
    }
    if (Platform.OS === 'ios') ActionSheetIOS.showActionSheetWithOptions({ options: [viewLabel, blockLabel, cancel], destructiveButtonIndex: blocked ? undefined : 1, cancelButtonIndex: 2, userInterfaceStyle: dark ? 'dark' : 'light' }, onPick)
    else Alert.alert(displayName(other), undefined, [{ text: viewLabel, onPress: () => onPick(0) }, { text: blockLabel, onPress: () => onPick(1) }, { text: cancel, style: 'cancel' }])
  }

  const lastMine = useMemo(() => [...(msgs || [])].reverse().find((m) => m.sender_id === me), [msgs, me])
  // Newest first for the inverted list (it starts at the bottom, like every chat app).
  const rows = useMemo(() => [...(msgs || [])].reverse(), [msgs])

  if (conv === null) return <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 60, padding: 20 }}><Notice tone="error">{t('المحادثة غير موجودة', 'Conversation not found')}</Notice></View>

  const role = memberLine(specialties, other)

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: c.border, backgroundColor: c.bg }}>
        <IconBtn name={rtl ? 'chevronRight' : 'chevronLeft'} label={t('رجوع', 'Back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/messages'))} />
        <Pressable onPress={() => other?.username && router.push(`/maker/${other.username}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar url={other?.avatar_url} name={displayName(other)} size={40} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ flexShrink: 1 }}><Txt size={15} weight="bold" lines={1}>{other ? displayName(other) : ''}</Txt></View>
              {other?.is_founding ? <Verified size={14} /> : null}
            </View>
            <Txt size={12} color={otherTyping ? c.accent : c.muted} lines={1}>{otherTyping ? t('يكتب الآن…', 'Typing…') : role}</Txt>
          </View>
        </Pressable>
        <IconBtn name="more" label={t('خيارات', 'Options')} onPress={menu} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {msgs === null ? <Spinner /> : (
          <FlatList
            inverted
            data={rows}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 4 }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={{ transform: [{ scaleY: -1 }], padding: 30 }}>
                <Txt size={14} color={c.muted} center>{t(`ابدأ المحادثة مع ${displayName(other).split(' ')[0]}. عرّف بنفسك واذكر ما تحتاجه باختصار.`, `Start the conversation with ${displayName(other).split(' ')[0]}. Introduce yourself and say briefly what you need.`)}</Txt>
              </View>
            }
            renderItem={({ item: m, index }) => {
              const mine = m.sender_id === me
              const older = rows[index + 1]
              const newDay = !older || localDay(older.created_at) !== localDay(m.created_at)
              const grouped = !newDay && older?.sender_id === m.sender_id
              return (
                <View>
                  {newDay && (
                    <View style={{ alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999, backgroundColor: c.surfaceAlt, marginVertical: 10 }}>
                      <Txt size={11} color={c.muted} center>{formatDateAr(localDay(m.created_at))}</Txt>
                    </View>
                  )}
                  {m.kind === 'collab' && m.ref_id ? (
                    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginTop: 6 }}><CollabCard id={m.ref_id} me={me as string} /></View>
                  ) : (
                    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginTop: grouped ? 0 : 6 }}>
                      <View style={{
                        maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
                        backgroundColor: mine ? c.accent : c.surface, borderWidth: mine ? 0 : 1, borderColor: c.border,
                        ...(grouped ? {} : mine ? { borderTopEndRadius: 6 } : { borderTopStartRadius: 6 }),
                      }}>
                        <Txt size={15} color={mine ? c.onAccent : c.text} auto selectable>
                          {splitLinks(m.body).map((part, k) => part.href
                            ? <Txt key={k} size={15} color={mine ? c.onAccent : c.accent} style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(part.href!)}>{part.text}</Txt>
                            : part.text)}
                        </Txt>
                        <Txt size={10} color={mine ? 'rgba(11,10,8,0.6)' : c.muted} style={{ textAlign: isArabic(m.body) ? 'left' : 'right', marginTop: 2 }}>{timeOf(m.created_at)}</Txt>
                      </View>
                      {mine && lastMine?.id === m.id && m.read_at ? <Txt size={11} color={c.muted} style={{ marginTop: 3 }}>{t('تمت القراءة', 'Seen')}</Txt> : null}
                    </View>
                  )}
                </View>
              )
            }}
          />
        )}

        <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10), borderTopWidth: 1, borderColor: c.border, gap: 8, backgroundColor: c.bg }}>
          {error && <Notice tone="error">{error}</Notice>}
          {blocked ? (
            <Txt size={14} color={c.muted} center>{t('حظرت هذا العضو. ألغِ الحظر من القائمة لتراسله.', 'You blocked this member. Unblock from the menu to message them.')}</Txt>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <TextInput
                value={text}
                onChangeText={onType}
                multiline
                maxLength={4000}
                placeholder={t('اكتب رسالة…', 'Write a message…')}
                placeholderTextColor={c.muted2}
                keyboardAppearance={dark ? 'dark' : 'light'}
                selectionColor={c.accent}
                style={{
                  flex: 1, minHeight: 44, maxHeight: 140, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, borderRadius: 22,
                  backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, color: c.text, fontFamily: F.body, fontSize: 16,
                  textAlign: text ? (isArabic(text) ? 'right' : 'left') : rtl ? 'right' : 'left',
                }}
              />
              <Pressable onPress={send} disabled={busy || !text.trim()} accessibilityLabel={t('إرسال', 'Send')} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent, opacity: busy || !text.trim() ? 0.4 : 1 }}>
                <Icon name="send" size={18} color={c.onAccent} weight="bold" />
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

interface Collab { id: string; to_id: string; sender_id: string | null; sender_name: string; project_type: string | null; country: string | null; city: string | null; budget: string | null; start_date: string | null; end_date: string | null; details: string; status: 'new' | 'accepted' | 'declined' | 'expired'; created_at: string }

/** A collaboration request shown inside the conversation, with Accept / Decline for the receiver. */
function CollabCard({ id, me }: { id: string; me: string }) {
  const { c } = useTheme()
  const [x, setX] = useState<Collab | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const load = useCallback(() => {
    supabase.rpc('collab_card', { p_id: id }).then(({ data }) => setX(((data as Collab[]) || [])[0] || null))
  }, [id])
  useEffect(load, [load])
  if (x === undefined) return <View style={{ width: '88%', height: 110, borderRadius: 18, backgroundColor: c.surface }} />
  if (!x) return null
  const incoming = x.to_id === me
  const respond = async (status: 'accepted' | 'declined') => {
    setBusy(true)
    await supabase.from('contact_requests').update({ status, responded_at: new Date().toISOString() }).eq('id', x.id)
    setBusy(false)
    load()
  }
  const statusLabel = { new: t('بانتظار الرد', 'Awaiting reply'), accepted: t('مقبول', 'Accepted'), declined: t('اعتذر', 'Declined'), expired: t('انتهت مدته', 'Expired') }[x.status]
  const tone = x.status === 'accepted' ? c.success : x.status === 'new' ? '#FDBA74' : c.muted
  const cells: [string, string][] = [
    [t('البدء', 'Start'), formatDateAr(x.start_date) || t('غير محدد', 'Not set')],
    [t('التسليم', 'Delivery'), formatDateAr(x.end_date) || t('غير محدد', 'Not set')],
    [t('المكان', 'Location'), requestPlace(x) || t('غير محدد', 'Not set')],
    [t('الميزانية', 'Budget'), label(BUDGETS, x.budget || 'حسب الاتفاق')],
  ]
  return (
    <View style={{ width: '88%', borderRadius: 18, overflow: 'hidden', backgroundColor: c.surface, borderWidth: 1, borderColor: alpha(c, 0.35) }}>
      <View style={{ height: 3, backgroundColor: c.accent }} />
      <View style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Txt size={12} weight="bold" color={c.accent}>{`🤝 ${incoming ? t('طلب تعاون وصلك', 'Collaboration request for you') : t('طلب تعاون أرسلته', 'Collaboration request you sent')}`}</Txt>
          <Txt size={11} weight="semi" color={tone}>{statusLabel}</Txt>
        </View>
        <Txt display size={16}>{x.project_type ? label(PROJECT_TYPES, x.project_type) : t('مشروع', 'Project')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {cells.map(([k, v]) => (
            <View key={k} style={{ flexBasis: '47%', flexGrow: 1, padding: 9, borderRadius: 10, backgroundColor: c.surfaceAlt }}>
              <Txt size={11} color={c.muted}>{k}</Txt>
              <Txt size={12} weight="semi">{v}</Txt>
            </View>
          ))}
        </View>
        <Txt size={14} color={c.text2} auto>{x.details}</Txt>
        {incoming && x.status === 'new' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn small busy={busy} onPress={() => respond('accepted')}>{t('قبول', 'Accept')}</Btn>
            <Btn small variant="danger" disabled={busy} onPress={() => respond('declined')}>{t('اعتذار', 'Decline')}</Btn>
          </View>
        )}
        {incoming && x.status === 'accepted' ? <Txt size={12} color={c.muted}>{t('قبلت الطلب. أكمل الحديث هنا في المحادثة.', 'You accepted. Carry on the conversation right here.')}</Txt> : null}
      </View>
    </View>
  )
}
