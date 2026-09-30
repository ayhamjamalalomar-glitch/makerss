import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t, useLang } from '@/lib/i18n'
import { alpha, useTheme } from '@/lib/theme'
import { SITE_URL, budgetLabel, formatDateAr, relativeAr } from '@/lib/constants'
import { useSpecialties, specName } from '@/lib/specialties'
import { CALL_COLORS, CALL_SELECT, displayName, kindLabel, type OpenCall } from '@/lib/data'
import { shareLink } from '@/lib/share'
import { useToast } from '@/lib/toast'
import { Avatar, Btn, Chevron, Empty, Header, IconBtn, Input, Notice, Pill, Screen, Spinner, Txt, tap } from '@/components/ui'
import { placeOfCall } from '@/components/cards'
import { ReportLink } from '@/components/ReportSheet'

export default function CallScreen() {
  useLang()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { c } = useTheme()
  const { profile } = useAuth()
  const specialties = useSpecialties()
  const toast = useToast()
  const [call, setCall] = useState<OpenCall | null | undefined>(undefined)
  const [applied, setApplied] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    supabase.from('open_calls').select(CALL_SELECT).eq('id', id).maybeSingle().then(({ data }) => setCall((data as unknown as OpenCall) || null))
    if (profile) supabase.from('open_call_applications').select('id').eq('call_id', id).eq('applicant_id', profile.id).then(({ data }) => setApplied(!!data?.length))
  }, [id, profile])
  useEffect(() => { load() }, [load])

  if (call === undefined) return <Screen header={<Header />}><Spinner /></Screen>
  if (call === null) return <Screen header={<Header />}><Empty title={t('الفرصة غير متاحة', 'Opportunity not available')} action={t('كل الفرص', 'All opportunities')} onAction={() => router.navigate('/calls')} /></Screen>

  const color = CALL_COLORS[call.kind || 'other'] || c.accent
  const isOwner = profile?.id === call.owner_id

  const apply = async () => {
    setError(null)
    setBusy(true)
    const { error } = await supabase.rpc('apply_open_call', { p_id: call.id, p_message: msg })
    setBusy(false)
    if (error) return setError(error.message.includes('closed') ? t('هذه الفرصة أُغلقت.', 'This opportunity is closed.') : t('تعذّر إرسال طلبك. حاول مرة أخرى.', 'Could not send your application. Try again.'))
    setApplied(true)
    toast(t('وصل طلبك إلى صاحب الفرصة', 'Your application was sent'))
  }
  const close = () => Alert.alert(t('إغلاق الفرصة؟', 'Close this call?'), t('لن يتمكن أحد من التقديم عليها بعد الإغلاق.', 'Nobody can apply once it is closed.'), [
    { text: t('إلغاء', 'Cancel'), style: 'cancel' },
    { text: t('أغلق الفرصة', 'Close it'), style: 'destructive', onPress: async () => {
      setBusy(true)
      await supabase.rpc('close_open_call', { p_id: call.id })
      setBusy(false)
      load()
    } },
  ])
  const share = async () => {
    const r = await shareLink(`${SITE_URL}/opportunities/${call.id}`, call.title)
    if (r === 'copied') toast(t('تم نسخ الرابط', 'Link copied'))
  }

  return (
    <Screen keyboard header={<Header right={<IconBtn name="share" label={t('شارك الفرصة', 'Share')} onPress={share} />} />}>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: color }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar url={call.owner?.avatar_url} name={displayName(call.owner)} size={50} radius={12} />
        <View style={{ flex: 1, gap: 2 }}>
          {call.kind ? <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: color }}><Txt size={11} weight="bold" color="#fff">{kindLabel(call.kind)}</Txt></View> : null}
          <Txt size={14} color={c.muted}>{call.org || displayName(call.owner)}</Txt>
        </View>
      </View>

      {call.status !== 'open' && (
        <Pill tone={call.status === 'pending' ? 'amber' : call.status === 'rejected' ? 'red' : 'neutral'}>
          {call.status === 'pending' ? t('بانتظار مراجعة الفريق', 'Waiting for team review') : call.status === 'rejected' ? t('لم تُقبل للنشر', 'Not approved') : t('مغلقة', 'Closed')}
        </Pill>
      )}
      {call.status === 'rejected' && call.review_note && isOwner ? <Notice tone="error">{call.review_note}</Notice> : null}

      <Txt display size={26}>{call.title}</Txt>
      <View style={{ gap: 4 }}>
        {placeOfCall(call) ? <Txt size={14} color={c.muted}>{`📍 ${placeOfCall(call)}`}</Txt> : null}
        {call.deadline ? <Txt size={14} color={c.muted}>{`⏰ ${t('آخر موعد:', 'Deadline:')} ${formatDateAr(call.deadline)}`}</Txt> : null}
        <Txt size={14} weight="bold" color={c.accent}>{call.budget ? budgetLabel(call.budget) : t('الميزانية حسب الاتفاق', 'Budget open to discuss')}</Txt>
      </View>

      <Txt size={15} color={c.text2} auto selectable>{call.description}</Txt>

      {call.role_ids.length > 0 && (
        <View style={{ gap: 8 }}>
          <Txt size={14} weight="semi">{t('الأدوار المطلوبة', 'Roles needed')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {call.role_ids.map((r) => (
              <View key={r} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: alpha(c, 0.15), borderWidth: 1, borderColor: alpha(c, 0.3) }}>
                <Txt size={13} weight="semi" color={c.accent}>{specName(specialties, r)}</Txt>
              </View>
            ))}
          </View>
        </View>
      )}

      {call.owner && (
        <Pressable onPress={() => { tap(); router.push(`/maker/${call.owner!.username}`) }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
          <Avatar url={call.owner.avatar_url} name={displayName(call.owner)} size={38} />
          <View style={{ flex: 1 }}>
            <Txt size={14} weight="semi">{displayName(call.owner)}</Txt>
            <Txt size={12} color={c.muted}>{`${t('نشر الفرصة', 'Posted this')} · ${relativeAr(call.created_at)}`}</Txt>
          </View>
          <Chevron />
        </Pressable>
      )}

      {isOwner ? (
        <View style={{ gap: 10 }}>
          <Notice>{t(`وصلك ${call.applicants_count} طلب. تجدهم في صندوق الوارد.`, `You have ${call.applicants_count} application${call.applicants_count === 1 ? '' : 's'}. Find them in your inbox.`)}</Notice>
          <Btn full onPress={() => router.push({ pathname: '/inbox', params: { tab: 'calls' } })}>{t('افتح الطلبات', 'Open applications')}</Btn>
          {(call.status === 'open' || call.status === 'pending') && <Btn full variant="outline" disabled={busy} onPress={close}>{t('أغلق الفرصة', 'Close it')}</Btn>}
        </View>
      ) : call.status !== 'open' ? null : applied ? (
        <View style={{ padding: 16, borderRadius: 14, borderWidth: 2, borderColor: c.accent }}><Txt size={15} weight="bold" color={c.accent} center>{`✓ ${t('قدّمت على هذه الفرصة', 'You applied')}`}</Txt></View>
      ) : !profile ? (
        <View style={{ gap: 10 }}>
          <Btn full onPress={() => router.push('/join')}>{t('انضم لتقدّم على الفرصة', 'Join to apply')}</Btn>
          <Btn full variant="ghost" onPress={() => router.push('/login')}>{t('عندك حساب؟ سجّل الدخول', 'Have an account? Sign in')}</Btn>
        </View>
      ) : profile.status !== 'approved' ? (
        <Notice>{t('يمكنك التقديم بعد موافقة فريق Makers على ملفك.', 'You can apply once the Makers team approves your profile.')}</Notice>
      ) : (
        <View style={{ gap: 10 }}>
          <Input multiline maxLength={2000} value={msg} onChangeText={setMsg} placeholder={t('رسالة قصيرة: لماذا أنت مناسب؟ (اختياري)', 'A short note: why are you a fit? (optional)')} />
          {error && <Notice tone="error">{error}</Notice>}
          <Btn full busy={busy} onPress={apply}>{t('قدّم على هذه الفرصة', 'Apply for this project')}</Btn>
          <Txt size={12} color={c.muted} center>{t('يصل طلبك مع رابط صفحتك إلى صاحب الفرصة.', 'Your application goes to the poster with a link to your page.')}</Txt>
        </View>
      )}

      {!isOwner && call.status === 'open' && <ReportLink type="call" id={call.id} />}
    </Screen>
  )
}
