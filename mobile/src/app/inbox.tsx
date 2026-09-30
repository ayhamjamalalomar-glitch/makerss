import { useCallback, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t, useLang } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { relativeAr } from '@/lib/constants'
import { CARD_COLUMNS, displayName, type MemberCard, type OpenCall } from '@/lib/data'
import { memberLine, useSpecialties } from '@/lib/specialties'
import { Avatar, Btn, Chevron, Empty, Header, Notice, Pill, Screen, Segmented, Spinner, Txt, tap } from '@/components/ui'
import { RequestsList } from '@/components/requests'

type Section = 'requests' | 'calls'

export default function Inbox() {
  useLang()
  const params = useLocalSearchParams<{ tab?: string }>()
  const { session, loading } = useAuth()
  const [section, setSection] = useState<Section>(params.tab === 'calls' ? 'calls' : 'requests')

  if (loading) return <Screen header={<Header title={t('الوارد', 'Inbox')} />}><Spinner /></Screen>
  if (!session) return <Screen header={<Header title={t('الوارد', 'Inbox')} />}><Empty title={t('سجّل الدخول', 'Sign in')} action={t('دخول', 'Sign in')} onAction={() => router.push('/login')} /></Screen>

  return (
    <Screen header={<Header title={t('الوارد', 'Inbox')} />}>
      <Segmented value={section} onChange={setSection} items={[{ key: 'requests', label: t('طلبات التعاون', 'Collab requests') }, { key: 'calls', label: t('الفرص والمتقدّمون', 'Calls & applicants') }]} />
      {section === 'requests' ? <RequestsList /> : <CallsInbox />}
    </Screen>
  )
}

interface Application { id: string; call_id: string; applicant_id: string; message: string | null; status: 'new' | 'shortlisted' | 'declined'; created_at: string; applicant?: MemberCard | null }

function CallsInbox() {
  const { c } = useTheme()
  const { session } = useAuth()
  const specialties = useSpecialties()
  const [calls, setCalls] = useState<OpenCall[] | null>(null)
  const [apps, setApps] = useState<Application[]>([])
  const [mine, setMine] = useState<(Application & { call?: OpenCall | null })[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session) return
    const uid = session.user.id
    const { data } = await supabase.from('open_calls').select('*').eq('owner_id', uid).order('created_at', { ascending: false })
    const list = (data as OpenCall[]) || []
    setCalls(list)
    setSel((cur) => cur || list[0]?.id || null)
    if (list.length) {
      const { data: a } = await supabase.from('open_call_applications').select(`*, applicant:profiles!open_call_applications_applicant_id_fkey(${CARD_COLUMNS})`).in('call_id', list.map((x) => x.id)).order('created_at', { ascending: false })
      setApps((a as unknown as Application[]) || [])
    }
    const { data: m } = await supabase.from('open_call_applications').select('*, call:open_calls(*)').eq('applicant_id', uid).order('created_at', { ascending: false })
    setMine((m as unknown as (Application & { call?: OpenCall | null })[]) || [])
  }, [session])

  useEffect(() => { load() }, [load])

  if (calls === null) return <Spinner />

  const current = calls.find((x) => x.id === sel) || null
  const currentApps = apps.filter((a) => a.call_id === sel)
  const setStatus = async (appId: string, status: Application['status']) => {
    setBusy(appId)
    await supabase.rpc('set_application_status', { p_id: appId, p_status: status })
    setBusy(null)
    load()
  }
  const message = async (uid: string) => {
    setBusy(uid)
    const { data } = await supabase.rpc('start_conversation', { p_other: uid })
    setBusy(null)
    if (data) router.push(`/chat/${data}`)
  }
  const callTone = (s: OpenCall['status']) => (s === 'open' ? 'green' : s === 'pending' ? 'amber' : s === 'rejected' ? 'red' : 'neutral') as 'green' | 'amber' | 'red' | 'neutral'
  const callLabel = (s: OpenCall['status']) => (s === 'open' ? t('منشورة', 'Live') : s === 'pending' ? t('قيد المراجعة', 'In review') : s === 'rejected' ? t('مرفوضة', 'Rejected') : t('مغلقة', 'Closed'))
  const appLabel = (s: Application['status']) => (s === 'shortlisted' ? t('في القائمة المختصرة', 'Shortlisted') : s === 'declined' ? t('لم يُختر', 'Not selected') : t('جديد', 'New'))

  return (
    <View style={{ gap: 14 }}>
      <Btn small icon="plus" onPress={() => router.push('/call/new')}>{t('انشر فرصة', 'Post an opportunity')}</Btn>
      {calls.length === 0 ? (
        <Empty title={t('لم تنشر فرصاً بعد', 'You have not posted any calls')} body={t('انشر فرصة لمشروعك، وستصلك طلبات الصنّاع هنا.', 'Post a call for your project and applications will arrive here.')} />
      ) : (
        <>
          {calls.map((x) => {
            const on = x.id === sel
            return (
              <Pressable key={x.id} onPress={() => { tap(); setSel(x.id) }} style={{ padding: 16, borderRadius: 18, backgroundColor: c.surface, borderWidth: on ? 1.5 : 1, borderColor: on ? c.accent : c.border, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Pill tone={callTone(x.status)}>{callLabel(x.status)}</Pill>
                  <Txt size={12} color={c.muted}>{relativeAr(x.created_at)}</Txt>
                </View>
                <Txt display size={16}>{x.title}</Txt>
                <Txt size={13} color={c.muted}>{t(`${apps.filter((a) => a.call_id === x.id).length} متقدّم`, `${apps.filter((a) => a.call_id === x.id).length} applicants`)}</Txt>
              </Pressable>
            )
          })}
          {current && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt display size={18}>{t('المتقدّمون', 'Applicants')}</Txt>
                <Txt size={13} weight="semi" color={c.accent} onPress={() => router.push(`/call/${current.id}`)}>{t('عرض الفرصة', 'View call')}</Txt>
              </View>
              {current.status === 'rejected' && current.review_note ? <Notice tone="error">{current.review_note}</Notice> : null}
              {currentApps.length === 0 ? (
                <Empty title={current.status === 'pending' ? t('ستصلك الطلبات بعد نشر الفرصة.', 'Applications arrive once the call is live.') : t('لا يوجد متقدّمون بعد.', 'No applicants yet.')} />
              ) : currentApps.map((a) => (
                <View key={a.id} style={{ padding: 14, borderRadius: 16, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, gap: 10 }}>
                  <Pressable onPress={() => a.applicant?.username && router.push(`/maker/${a.applicant.username}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar url={a.applicant?.avatar_url} name={displayName(a.applicant)} size={44} />
                    <View style={{ flex: 1 }}>
                      <Txt size={15} weight="bold" lines={1}>{displayName(a.applicant)}</Txt>
                      <Txt size={12} color={c.muted} lines={1}>{memberLine(specialties, a.applicant)}</Txt>
                    </View>
                    <Pill tone={a.status === 'shortlisted' ? 'green' : a.status === 'declined' ? 'neutral' : 'blue'}>{appLabel(a.status)}</Pill>
                  </Pressable>
                  {a.message ? <Txt size={14} color={c.text2} auto>{a.message}</Txt> : null}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Btn small busy={busy === a.applicant_id} onPress={() => message(a.applicant_id)}>{t('راسِل', 'Message')}</Btn>
                    {a.status !== 'shortlisted' && <Btn small variant="outline" disabled={busy === a.id} onPress={() => setStatus(a.id, 'shortlisted')}>{t('أضف للقائمة المختصرة', 'Shortlist')}</Btn>}
                    {a.status !== 'declined' && <Btn small variant="danger" disabled={busy === a.id} onPress={() => setStatus(a.id, 'declined')}>{t('لم يُختر', 'Not a fit')}</Btn>}
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {mine.length > 0 && (
        <View style={{ gap: 8, paddingTop: 6 }}>
          <Txt display size={18}>{t('طلباتك على فرص الآخرين', 'Your applications')}</Txt>
          {mine.map((a) => (
            <Pressable key={a.id} onPress={() => { tap(); router.push(`/call/${a.call_id}`) }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderColor: c.border }}>
              <View style={{ flex: 1 }}><Txt size={14} weight="semi" lines={1}>{a.call?.title || t('فرصة', 'Call')}</Txt></View>
              <Pill tone={a.status === 'shortlisted' ? 'green' : a.status === 'declined' ? 'neutral' : 'blue'}>{a.status === 'new' ? t('أُرسل', 'Sent') : appLabel(a.status)}</Pill>
              <Chevron />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}
