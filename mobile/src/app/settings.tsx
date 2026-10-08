import { useEffect, useState } from 'react'
import { Alert, View } from 'react-native'
import Constants from 'expo-constants'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { reopenAfterLangChange, t, useLang, type Lang } from '@/lib/i18n'
import { useTheme, type ThemeMode } from '@/lib/theme'
import { SITE_URL } from '@/lib/constants'
import { pushSupported, registerPush } from '@/lib/push'
import { deleteMyAccount } from '@/lib/account'
import { useToast } from '@/lib/toast'
import { Btn, Group, Header, Row, Screen, Segmented, Sheet, Input, Notice, Toggle, Txt } from '@/components/ui'

export default function Settings() {
  const { c, mode, setMode } = useTheme()
  const { lang, setLang } = useLang()
  const { session, profile } = useAuth()
  const toast = useToast()
  const [emailOn, setEmailOn] = useState<boolean | null>(null)
  const [pushOn, setPushOn] = useState<boolean | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const uid = session?.user.id

  useEffect(() => {
    if (!uid) return
    supabase.from('notification_prefs').select('email_enabled, push_enabled').eq('user_id', uid).maybeSingle().then(({ data }) => {
      const d = data as { email_enabled: boolean; push_enabled: boolean } | null
      setEmailOn(d ? !!d.email_enabled : true)
      setPushOn(d ? !!d.push_enabled : true)
    })
  }, [uid])

  const pickLang = (l: Lang) => {
    if (l === lang) return
    reopenAfterLangChange('/settings')
    setLang(l)
    // Pushes are written in the language the device registered with.
    if (uid) registerPush(false)
  }

  const setPref = async (patch: { email_enabled?: boolean; push_enabled?: boolean }) => {
    if (!uid) return
    const { error } = await supabase.from('notification_prefs').upsert({ user_id: uid, ...patch, updated_at: new Date().toISOString() })
    if (error) toast(t('تعذّر الحفظ', 'Could not save'), 'error')
    return !error
  }

  const togglePush = async (v: boolean) => {
    setPushOn(v)
    if (v && pushSupported()) {
      const r = await registerPush(true)
      if (r === 'denied') {
        setPushOn(false)
        return Alert.alert(t('الإشعارات مغلقة', 'Notifications are off'), t('فعّل إشعارات Makers من إعدادات الجهاز.', 'Turn on Makers notifications in the device settings.'))
      }
    }
    if (!(await setPref({ push_enabled: v }))) setPushOn(!v)
  }
  const toggleEmail = async (v: boolean) => {
    setEmailOn(v)
    if (!(await setPref({ email_enabled: v }))) setEmailOn(!v)
  }

  const resetPassword = async () => {
    const email = session?.user.email
    if (!email) return
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/login?reset=1` })
    toast(error ? t('تعذّر الإرسال. حاول بعد قليل.', 'Could not send. Try again shortly.') : t('أرسلنا رابط تغيير كلمة المرور إلى بريدك', 'We emailed you a link to change your password'), error ? 'error' : 'ok')
  }

  const word = t('احذف', 'DELETE')
  const doDelete = async () => {
    if (!uid) return
    setBusy(true)
    const r = await deleteMyAccount(uid)
    setBusy(false)
    if (r === 'staff') return Alert.alert(t('حساب إداري', 'Team account'), t('حسابات فريق Makers تُحذف من لوحة الإدارة فقط.', 'Makers team accounts can only be removed from the admin panel.'))
    if (r === 'failed') return toast(t('تعذّر حذف الحساب. حاول مرة أخرى.', 'Could not delete the account. Try again.'), 'error')
    setDeleting(false)
    toast(t('حُذف حسابك', 'Your account was deleted'))
    router.replace('/')
  }

  return (
    <Screen header={<Header title={t('الإعدادات', 'Settings')} />}>
      <Group title={t('اللغة', 'Language')}>
        <View style={{ padding: 12 }}>
          <Segmented value={lang} onChange={pickLang} items={[{ key: 'ar', label: 'العربية' }, { key: 'en', label: 'English' }]} />
        </View>
      </Group>

      <Group title={t('المظهر', 'Appearance')}>
        <View style={{ padding: 12 }}>
          <Segmented value={mode} onChange={(m: ThemeMode) => setMode(m)} items={[{ key: 'dark', label: t('داكن', 'Dark') }, { key: 'light', label: t('فاتح', 'Light') }, { key: 'system', label: t('حسب الجهاز', 'System') }]} />
        </View>
      </Group>

      {session && (
        <Group title={t('الإشعارات', 'Notifications')}>
          <Row icon="bell" title={t('إشعارات التطبيق', 'App notifications')} sub={pushSupported() ? t('الرسائل، طلبات التعاون، قرار المراجعة، والفرص.', 'Messages, collaboration requests, review decisions and calls.') : t('تعمل في نسخة التطبيق الكاملة، وليس في Expo Go.', 'Works in the full app build, not in Expo Go.')} right={<Toggle value={!!pushOn} disabled={pushOn === null} onChange={togglePush} />} />
          <Row icon="envelope" title={t('تنبيهات البريد', 'Email alerts')} sub={session.user.email || undefined} right={<Toggle value={!!emailOn} disabled={emailOn === null} onChange={toggleEmail} />} />
        </Group>
      )}

      {session && (
        <Group title={t('الحساب', 'Account')}>
          <Row icon="envelope" title={t('البريد', 'Email')} value={session.user.email || ''} />
          <Row icon="link" title={t('تغيير كلمة المرور', 'Change password')} sub={t('نرسل لك رابطاً على بريدك', 'We email you a link')} onPress={resetPassword} />
          <Row icon="trash" title={t('حذف الحساب', 'Delete account')} sub={t('يحذف صفحتك وأعمالك ورسائلك نهائياً', 'Removes your page, work and messages for good')} danger onPress={() => { setConfirmText(''); setDeleting(true) }} />
        </Group>
      )}

      <Group title={t('عن Makers', 'About Makers')}>
        <Row icon="globe" title={t('الموقع', 'Website')} value="makerss.net" onPress={() => WebBrowser.openBrowserAsync(SITE_URL)} />
        <Row icon="info" title={t('الإصدار', 'Version')} value={Constants.expoConfig?.version || '1.0.0'} />
      </Group>

      <Txt size={12} color={c.muted2} center>© Makers</Txt>

      <Sheet visible={deleting} onClose={() => setDeleting(false)} title={t('حذف الحساب', 'Delete account')}
        footer={<Btn full variant="danger" busy={busy} disabled={confirmText.trim().toUpperCase() !== word.toUpperCase()} onPress={doDelete}>{t('احذف حسابي نهائياً', 'Delete my account for good')}</Btn>}>
        <Notice tone="error">{t('سيُحذف حسابك وصفحتك في الدليل وأعمالك وصورك ورسائلك وطلباتك نهائياً، ولا يمكن استرجاعها.', 'Your account, directory page, work, photos, messages and requests will be deleted for good. This cannot be undone.')}</Notice>
        {profile?.is_founding ? <Txt size={14} color={c.text2}>{t('ستفقد أيضاً شارة «عضو مؤسس».', 'You will also lose your Founding Member badge.')}</Txt> : null}
        <Input label={t(`اكتب «${word}» للتأكيد`, `Type "${word}" to confirm`)} value={confirmText} onChangeText={setConfirmText} autoCapitalize="characters" autoCorrect={false} />
      </Sheet>
    </Screen>
  )
}
