import { useEffect, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { SITE_URL } from '@/lib/constants'
import { F, onScreen, useTheme } from '@/lib/theme'
import { Btn, Dir, Input, Label, Notice, Txt, tap } from '@/components/ui'
import { AuthShell } from '@/components/AuthShell'

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30)

export default function Join() {
  const { c } = useTheme()
  const { session, profile } = useAuth()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [touchedUser, setTouchedUser] = useState(false)
  const [type, setType] = useState<'maker' | 'creator'>('maker')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  useEffect(() => {
    if (session && profile) {
      if (router.canGoBack()) router.back()
      router.push('/edit')
    }
  }, [session, profile])

  useEffect(() => { if (!touchedUser) setUsername(slugify(name)) }, [name, touchedUser])

  useEffect(() => {
    if (username.length < 3) return setAvailable(null)
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc('username_available', { p_username: username })
      setAvailable(!!data)
    }, 350)
    return () => clearTimeout(timer)
  }, [username])

  const submit = async () => {
    setError(null)
    if (name.trim().length < 2) return setError(t('اكتب اسمك الكامل.', 'Write your full name.'))
    if (!available) return setError(t('اختر رابطاً آخر لصفحتك، هذا الرابط غير متاح.', 'Choose another link for your page. This one is taken.'))
    if (password.length < 8) return setError(t('كلمة المرور 8 أحرف على الأقل.', 'The password needs at least 8 characters.'))
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim(), username, account_type: type }, emailRedirectTo: `${SITE_URL}/login` },
    })
    setBusy(false)
    if (error) {
      setError(error.status === 429 || /rate/i.test(error.message) ? t('أُرسلت رسائل كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول مرة أخرى.', 'Too many emails were sent in a short time. Wait a little and try again.') : error.message.includes('registered') ? t('هذا البريد مسجّل مسبقاً. سجّل الدخول بدلاً من ذلك.', 'This email is already registered. Sign in instead.') : t('تعذّر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.', 'Could not create the account. Check the details and try again.'))
      return
    }
    // Supabase returns a user with no identities when the email already exists (no email is sent).
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setError(t('هذا البريد مسجّل مسبقاً. سجّل الدخول، أو استخدم «نسيت كلمة المرور» من صفحة الدخول.', 'This email is already registered. Sign in, or use "Forgot password" on the sign-in page.'))
      return
    }
    if (!data.session) setSentTo(email.trim())
  }

  if (sentTo) {
    return (
      <Dir>
        <AuthShell title={t('تحقق من بريدك', 'Check your email')} sub={t(`أرسلنا رابط التفعيل إلى ${sentTo}. افتح الرابط، ثم ارجع إلى التطبيق وسجّل الدخول.`, `We sent an activation link to ${sentTo}. Open it, then come back to the app and sign in.`)}>
          <Btn full onPress={() => router.replace('/login')}>{t('تسجيل الدخول', 'Sign in')}</Btn>
        </AuthShell>
      </Dir>
    )
  }

  return (
    <Dir>
      <AuthShell title={t('لنبدأ بصفحتك', "Let's start your page")} sub={t('معلومات قليلة فقط، والباقي تكمله داخل صفحتك.', 'Just a few details. You finish the rest inside your page.')}>
        <View style={{ gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Label color={onScreen.dim}>{t('أنا', 'I am')}</Label>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['maker', 'creator'] as const).map((k) => (
                <Pressable key={k} onPress={() => { tap(); setType(k) }} style={{ flex: 1, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: type === k ? c.accent : 'transparent', borderWidth: 1, borderColor: type === k ? c.accent : 'rgba(243,239,231,0.25)' }}>
                  <Txt size={13} weight={type === k ? 'semi' : 'regular'} color={type === k ? c.onAccent : onScreen.dim} center>{k === 'maker' ? t('صانع إنتاج', 'Production maker') : t('صانع محتوى', 'Content creator')}</Txt>
                </Pressable>
              ))}
            </View>
          </View>
          <Input onDark label={t('الاسم', 'Name')} value={name} onChangeText={setName} placeholder={t('اسمك الكامل', 'Your full name')} textContentType="name" />
          <View style={{ gap: 8 }}>
            <Label color={onScreen.dim}>{t('رابط صفحتك', 'Your link')}</Label>
            <View style={{ height: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(243,239,231,0.14)', backgroundColor: 'rgba(243,239,231,0.06)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, direction: 'ltr' }}>
              <Txt mono size={14} color={onScreen.faint} style={{ textAlign: 'left' }}>makerss.net/</Txt>
              <TextInput
                value={username}
                onChangeText={(v) => { setTouchedUser(true); setUsername(v.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)) }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="your-name"
                placeholderTextColor={onScreen.faint}
                keyboardAppearance="dark"
                style={{ flex: 1, color: onScreen.text, fontFamily: F.mono, fontSize: 14, height: 50, textAlign: 'left' }}
              />
            </View>
            <Txt size={12} color={available === false ? c.danger : available ? c.success : onScreen.faint}>
              {available === false ? t('هذا الرابط محجوز أو غير صالح.', 'This link is taken or invalid.') : available ? t('الرابط متاح.', 'Link available.') : t('حروف إنجليزية صغيرة وأرقام وشرطات فقط.', 'Lowercase letters, numbers and dashes only.')}
            </Txt>
          </View>
          <Input onDark ltr label={t('البريد', 'Email')} value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          <Input onDark label={t('كلمة المرور', 'Password')} value={password} onChangeText={setPassword} secureTextEntry placeholder={t('8 أحرف على الأقل', 'At least 8 characters')} textContentType="newPassword" autoComplete="new-password" />
        </View>
        <Txt size={13} color={onScreen.dim}>
          {type === 'maker'
            ? t('مخرج، مصوّر، مونتير، ستايلست وغيرهم. تظهر صفحتك في الدليل بعد أن يراجعها فريق Makers.', 'Directors, cinematographers, editors, stylists and more. Your page appears in the directory after the Makers team reviews it.')
            : t('يوتيوبر، تيك توكر، إنستغرامر وغيرهم. أضف حساباتك وعدد متابعيك، وتظهر صفحتك في الدليل بعد أن يراجعها فريق Makers.', 'YouTubers, TikTokers, Instagrammers and more. Add your accounts and follower counts, and your page appears in the directory after the Makers team reviews it.')}
        </Txt>
        {error && <Notice tone="error">{error}</Notice>}
        <Btn full busy={busy} onPress={submit}>{t('أنشئ صفحتك', 'Create your page')}</Btn>
        <Txt size={14} color={onScreen.dim}>
          {t('لديك حساب؟ ', 'Have an account? ')}
          <Txt size={14} weight="semi" color={c.accent} onPress={() => router.replace('/login')}>{t('سجّل الدخول', 'Sign in')}</Txt>
        </Txt>
      </AuthShell>
    </Dir>
  )
}
