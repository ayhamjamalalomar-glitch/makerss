import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { SITE_URL } from '@/lib/constants'
import { onScreen, useTheme } from '@/lib/theme'
import { Btn, Dir, Input, Notice, Txt } from '@/components/ui'
import { AuthShell } from '@/components/AuthShell'

export default function Login() {
  const { c } = useTheme()
  const { session, profile } = useAuth()
  const [mode, setMode] = useState<'signin' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState(false)

  // Signed in: close this screen and land on the account tab.
  useEffect(() => {
    if (session && profile) {
      if (router.canGoBack()) router.back()
      else router.replace('/account')
    }
  }, [session, profile])

  const submit = async () => {
    setBusy(true)
    setError(null)
    setInfo(null)
    setUnconfirmed(false)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error && /confirm/i.test(error.message)) setUnconfirmed(true)
      if (error) setError(/confirm/i.test(error.message) ? t('فعّل بريدك أولاً من الرسالة التي وصلتك.', 'Activate your email first from the message we sent you.') : t('البريد أو كلمة المرور غير صحيحة.', 'Wrong email or password.'))
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${SITE_URL}/login?reset=1` })
      if (error) setError(error.status === 429 || /rate/i.test(error.message) ? t('أُرسلت رسائل كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول مرة أخرى.', 'Too many emails were sent in a short time. Wait a little and try again.') : t('تعذّر إرسال الرابط. حاول مرة أخرى.', 'Could not send the link. Try again.'))
      else setInfo(t('إن كان هذا البريد مسجّلاً، سيصلك رابط لتعيين كلمة مرور جديدة.', 'If this email is registered, you will get a link to set a new password.'))
    }
    setBusy(false)
  }

  const resend = async () => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: `${SITE_URL}/login` } })
    setInfo(error ? t('تعذّر الإرسال. حاول بعد قليل.', 'Could not send. Try again shortly.') : t('أرسلنا رابط التفعيل مجدداً.', 'We sent the activation link again.'))
  }

  return (
    <Dir>
      <AuthShell title={mode === 'signin' ? t('تسجيل الدخول', 'Sign in') : t('استعادة كلمة المرور', 'Reset password')}>
        <View style={{ gap: 14 }}>
          <Input label={t('البريد', 'Email')} ltr value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" onDark />
          {mode === 'signin' && <Input label={t('كلمة المرور', 'Password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} onDark />}
        </View>
        {error && <Notice tone="error">{error}</Notice>}
        {unconfirmed && <Btn variant="outline" small onPress={resend}><Txt size={13} weight="semi" color={onScreen.text}>{t('أعد إرسال رابط التفعيل', 'Resend the activation link')}</Txt></Btn>}
        {info && <Notice tone="success">{info}</Notice>}
        <Btn full busy={busy} disabled={!email.trim() || (mode === 'signin' && password.length < 6)} onPress={submit}>{mode === 'signin' ? t('دخول', 'Sign in') : t('أرسل الرابط', 'Send link')}</Btn>
        <View style={{ gap: 12 }}>
          {mode === 'signin' ? (
            <>
              <Txt size={14} color={onScreen.dim} onPress={() => setMode('reset')}>{t('نسيت كلمة المرور؟', 'Forgot password?')}</Txt>
              <Txt size={14} color={onScreen.dim}>
                {t('ليس لديك حساب؟ ', 'No account yet? ')}
                <Txt size={14} weight="semi" color={c.accent} onPress={() => router.replace('/join')}>{t('انضم إلى Makers', 'Join Makers')}</Txt>
              </Txt>
            </>
          ) : (
            <Txt size={14} color={onScreen.dim} onPress={() => setMode('signin')}>{t('العودة لتسجيل الدخول', 'Back to sign in')}</Txt>
          )}
        </View>
      </AuthShell>
    </Dir>
  )
}
