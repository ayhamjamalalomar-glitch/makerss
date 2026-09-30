import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { Btn, Chip, Icon, Input, Notice, Sheet, Txt, tap } from './ui'

const REASONS = [
  { key: 'fake', ar: 'حساب أو معلومات غير حقيقية', en: 'Fake account or details' },
  { key: 'stolen', ar: 'عمل منسوب لغير صاحبه', en: 'Work credited to the wrong person' },
  { key: 'offensive', ar: 'محتوى مسيء', en: 'Offensive content' },
  { key: 'spam', ar: 'إزعاج أو إعلانات', en: 'Spam' },
  { key: 'other', ar: 'سبب آخر', en: 'Something else' },
] as const

/** Small "report" link that opens a form. Reports go to the Makers team, never to the reported member. */
export function ReportLink({ type, id }: { type: 'profile' | 'project' | 'call'; id: string }) {
  const { c } = useTheme()
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const close = () => { setOpen(false); setReason(null); setMessage(''); setError(null); setDone(false) }
  const send = async () => {
    if (!reason) return setError(t('اختر سبب البلاغ.', 'Choose a reason.'))
    setBusy(true)
    setError(null)
    const { error } = await supabase.rpc('report_content', { p_type: type, p_id: id, p_reason: reason, p_message: message })
    setBusy(false)
    if (error) return setError(error.message.includes('too many') ? t('أرسلت بلاغات كثيرة اليوم. حاول غداً.', 'You sent many reports today. Try tomorrow.') : t('تعذّر إرسال البلاغ. حاول مرة أخرى.', 'Could not send the report. Try again.'))
    setDone(true)
  }

  return (
    <>
      <Pressable onPress={() => { tap(); setOpen(true) }} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
        <Icon name="flag" size={12} color={c.muted2} />
        <Txt size={12} color={c.muted2}>{t('بلّغ', 'Report')}</Txt>
      </Pressable>
      <Sheet visible={open} onClose={close} title={t('بلّغ فريق Makers', 'Report to the Makers team')}
        footer={session && !done ? <Btn full busy={busy} onPress={send}>{t('أرسل البلاغ', 'Send report')}</Btn> : undefined}>
        {!session ? (
          <View style={{ gap: 12 }}>
            <Notice>{t('سجّل الدخول لترسل بلاغاً.', 'Sign in to send a report.')}</Notice>
            <Btn onPress={() => { close(); router.push('/login') }}>{t('دخول', 'Sign in')}</Btn>
          </View>
        ) : done ? (
          <Notice tone="success">{t('وصل بلاغك إلى الفريق، وسنراجعه بسرية. شكراً لك.', 'Your report reached the team and will be reviewed privately. Thank you.')}</Notice>
        ) : (
          <>
            <Txt size={14} color={c.muted}>{t('يصل البلاغ إلى فريق Makers فقط، ولا يعرف صاحب الصفحة من أرسله.', 'Reports go to the Makers team only. The member never sees who sent it.')}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {REASONS.map((r) => <Chip key={r.key} on={reason === r.key} onPress={() => setReason(r.key)}>{t(r.ar, r.en)}</Chip>)}
            </View>
            <Input multiline maxLength={1000} value={message} onChangeText={setMessage} placeholder={t('تفاصيل تساعدنا (اختياري)', 'Details that help us (optional)')} />
            {error && <Notice tone="error">{error}</Notice>}
          </>
        )}
      </Sheet>
    </>
  )
}
