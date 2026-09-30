import { useCallback, useEffect, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { supabase, type ContactRequest } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { BUDGETS, COUNTRIES, PROJECT_TYPES, REMOTE, cityLabel, daysBetween, durationAr, formatDateAr, relativeAr } from '@/lib/constants'
import { label, t } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { Btn, Chip, Empty, Notice, Pill, Sheet, Spinner, Txt, tap } from './ui'

type Filter = 'all' | 'new' | 'accepted' | 'declined'
const META: Record<ContactRequest['status'], { ar: string; en: string; tone: 'blue' | 'green' | 'neutral' | 'amber' }> = {
  new: { ar: 'جديد', en: 'New', tone: 'blue' },
  accepted: { ar: 'مقبول', en: 'Accepted', tone: 'green' },
  declined: { ar: 'اعتذرت', en: 'Declined', tone: 'neutral' },
  expired: { ar: 'انتهت مدته', en: 'Expired', tone: 'amber' },
}
const metaLabel = (s: ContactRequest['status']) => t(META[s].ar, META[s].en)
const ptLabel = (v: string | null) => (v ? label(PROJECT_TYPES, v) : t('طلب تعاون', 'Collaboration request'))
export const requestPlace = (r: Pick<ContactRequest, 'city' | 'country'>) =>
  [cityLabel(r.city), r.country === REMOTE.ar ? t(REMOTE.ar, REMOTE.en) : label(COUNTRIES, r.country)].filter(Boolean).join(t('، ', ', '))

export function Info({ k, v }: { k: string; v: string }) {
  const { c } = useTheme()
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, padding: 12, borderRadius: 12, backgroundColor: c.surfaceAlt, gap: 2 }}>
      <Txt size={11} color={c.muted}>{k}</Txt>
      <Txt size={14} weight="semi">{v}</Txt>
    </View>
  )
}

/** Collaboration requests other people sent me (from my page). */
export function RequestsList({ onCount }: { onCount?: (n: number) => void }) {
  const { session } = useAuth()
  const { c } = useTheme()
  const [items, setItems] = useState<ContactRequest[] | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [sel, setSel] = useState<ContactRequest | null>(null)

  const load = useCallback(async () => {
    if (!session) return
    await supabase.rpc('expire_contact_requests')
    const { data } = await supabase
      .from('contact_requests')
      .select('id, to_id, sender_name, project_type, country, city, budget, start_date, end_date, details, status, responded_at, created_at')
      .eq('to_id', session.user.id)
      .order('created_at', { ascending: false })
    const list = (data as ContactRequest[]) || []
    setItems(list)
    onCount?.(list.filter((r) => r.status === 'new').length)
    setSel((cur) => (cur ? list.find((r) => r.id === cur.id) || null : null))
  }, [session, onCount])

  useEffect(() => { load() }, [load])

  if (items === null) return <Spinner />
  const shown = items.filter((r) => filter === 'all' || r.status === filter)
  const newN = items.filter((r) => r.status === 'new').length

  return (
    <View style={{ gap: 12 }}>
      <Txt size={14} color={c.muted}>{newN === 0 ? t('لا توجد طلبات جديدة', 'No new requests') : newN === 1 ? t('لديك طلب جديد واحد', 'You have 1 new request') : newN === 2 ? t('لديك طلبان جديدان', 'You have 2 new requests') : t(`لديك ${newN} طلبات جديدة`, `You have ${newN} new requests`)}</Txt>
      {items.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {([['all', t('الكل', 'All')], ['new', t('جديد', 'New')], ['accepted', t('مقبول', 'Accepted')], ['declined', t('اعتذرت', 'Declined')]] as [Filter, string][]).map(([k, l]) => <Chip key={k} on={filter === k} onPress={() => setFilter(k)}>{l}</Chip>)}
        </View>
      )}
      {items.length === 0 ? (
        <Empty title={t('لا توجد طلبات بعد', 'No requests yet')} body={t('عندما يطلب أحد التعاون معك من صفحتك، سيظهر الطلب هنا.', 'When someone requests a collaboration from your page, it will show up here.')} />
      ) : shown.length === 0 ? (
        <Empty title={t('لا توجد طلبات في هذا القسم.', 'No requests here.')} />
      ) : shown.map((r) => (
        <Pressable key={r.id} onPress={() => { tap(); setSel(r) }} style={({ pressed }) => ({ padding: 16, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, gap: 6, opacity: pressed ? 0.8 : 1 })}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pill tone={META[r.status].tone}>{metaLabel(r.status)}</Pill>
            <Txt size={12} color={c.muted}>{relativeAr(r.created_at)}</Txt>
          </View>
          <Txt display size={16}>{ptLabel(r.project_type)}</Txt>
          <Txt size={13} color={c.muted}>{[r.sender_name, requestPlace(r)].filter(Boolean).join(' · ')}</Txt>
          {r.start_date ? <Txt size={12} color={c.text2}>{formatDateAr(r.start_date)}{r.end_date ? t(` إلى ${formatDateAr(r.end_date)}`, ` to ${formatDateAr(r.end_date)}`) : ''}</Txt> : null}
        </Pressable>
      ))}
      {sel && <RequestSheet r={sel} onClose={() => setSel(null)} onChanged={load} />}
    </View>
  )
}

function RequestSheet({ r, onClose, onChanged }: { r: ContactRequest; onClose: () => void; onChanged: () => void }) {
  const { c } = useTheme()
  const [email, setEmail] = useState<string | null>(null)
  const [member, setMember] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setEmail(null)
    setMember(null)
    if (r.status === 'accepted') {
      supabase.rpc('contact_request_email', { p_id: r.id }).then(({ data }) => setEmail((data as string) || null))
      supabase.rpc('contact_request_sender_member', { p_id: r.id }).then(({ data }) => setMember((data as string) || null))
    }
  }, [r.id, r.status])

  const setStatus = async (status: 'accepted' | 'declined') => {
    setBusy(true)
    await supabase.from('contact_requests').update({ status, responded_at: new Date().toISOString() }).eq('id', r.id)
    setBusy(false)
    onChanged()
  }
  const chat = async () => {
    if (!member) return
    setBusy(true)
    const { data } = await supabase.rpc('start_conversation', { p_other: member })
    setBusy(false)
    if (data) { onClose(); router.push(`/chat/${data}`) }
  }

  return (
    <Sheet visible onClose={onClose} title={ptLabel(r.project_type)}
      footer={r.status === 'new' ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn style={{ flex: 1 }} busy={busy} onPress={() => setStatus('accepted')}>{t('قبول الطلب', 'Accept request')}</Btn>
          <Btn variant="danger" disabled={busy} onPress={() => setStatus('declined')}>{t('اعتذار', 'Decline')}</Btn>
        </View>
      ) : r.status === 'accepted' ? (
        <View style={{ gap: 10 }}>
          {member && <Btn full icon="chat" busy={busy} onPress={chat}>{t('رُدّ برسالة', 'Reply by message')}</Btn>}
          {email && <Btn full variant={member ? 'outline' : 'primary'} icon="envelope" onPress={() => Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(t('بخصوص طلب التعاون عبر Makers', 'About your collaboration request on Makers'))}`)}>{t('رُدّ عبر البريد', 'Reply by email')}</Btn>}
        </View>
      ) : undefined}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pill tone={META[r.status].tone}>{metaLabel(r.status)}</Pill>
        <Txt size={12} color={c.muted}>{t('وصل', 'Received')} {relativeAr(r.created_at)}</Txt>
      </View>
      <Txt size={14} color={c.muted}>{t('من', 'From')} {r.sender_name}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Info k={t('تاريخ البدء', 'Start date')} v={formatDateAr(r.start_date) || t('غير محدد', 'Not set')} />
        <Info k={t('تاريخ التسليم', 'Delivery date')} v={formatDateAr(r.end_date) || t('غير محدد', 'Not set')} />
        <Info k={t('المدة', 'Duration')} v={r.start_date && r.end_date ? durationAr(daysBetween(r.start_date, r.end_date)) : t('غير محددة', 'Not set')} />
        <Info k={t('مكان التصوير', 'Location')} v={requestPlace(r) || t('غير محدد', 'Not set')} />
        <Info k={t('الميزانية', 'Budget')} v={label(BUDGETS, r.budget || 'حسب الاتفاق')} />
      </View>
      <Txt size={13} weight="semi">{t('تفاصيل المشروع', 'Project details')}</Txt>
      <Txt size={15} auto selectable>{r.details}</Txt>
      {r.status === 'new' && <Txt size={13} color={c.muted}>{t('يظهر بريد المرسل بعد قبول الطلب. تنتهي صلاحية الطلب بعد 4 أيام إن لم ترد.', "The sender's email appears once you accept. Requests expire after 4 days without a reply.")}</Txt>}
      {r.status === 'accepted' && (
        <Notice tone="success">
          <Txt size={14} color={c.success}>{t('قبلت هذا الطلب. تواصل مع المرسل على بريده:', 'You accepted this request. Reach the sender at:')}</Txt>
          <Txt size={14} weight="semi" color={c.success} selectable style={{ textAlign: 'left', writingDirection: 'ltr' }}>{email || '…'}</Txt>
          {email && !member ? <Txt size={12} color={c.muted}>{t('المرسل ليس عضواً منشوراً في Makers، لذلك الرد متاح عبر البريد فقط.', 'The sender is not a live Makers member, so you can reply by email only.')}</Txt> : null}
        </Notice>
      )}
      {r.status === 'declined' && <Notice>{t('اعتذرت عن هذا الطلب.', 'You declined this request.')}</Notice>}
      {r.status === 'expired' && <Notice>{t('انتهت مدة هذا الطلب لأنه لم يُرد عليه خلال 4 أيام.', 'This request expired because it was not answered within 4 days.')}</Notice>}
    </Sheet>
  )
}
