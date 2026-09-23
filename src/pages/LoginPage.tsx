import { useEffect, useState } from 'react'
import { isRtl, t } from '../lib/i18n'
import Link, { useRouter } from '../lib/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Notice } from '../components/mk'
import ResendConfirm from '../components/ResendConfirm'
import DarkCard, { darkInputStyle, darkRow, darkRowStyle } from '../components/DarkCard'

export default function LoginPage() {
  const params = new URLSearchParams(window.location.search)
  const next = params.get('next')
  const { session, profile } = useAuth()
  const { go } = useRouter()
  const [mode, setMode] = useState<'signin' | 'reset' | 'update'>(params.get('reset') ? 'update' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState(false)

  useEffect(() => {
    if (mode !== 'update' && session && profile) {
      if (next && next.startsWith('/')) go(next)
      else if (profile.role === 'admin' || profile.role === 'reviewer') go('/admin')
      else go(profile.status === 'approved' && profile.username ? `/${profile.username}` : profile.status === 'pending' ? '/me/status' : '/me')
    }
  }, [session, profile, mode, next, go])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    setUnconfirmed(false)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error && /confirm/i.test(error.message)) setUnconfirmed(true)
      if (error) setError(error.message.includes('confirmed') ? t('فعّل بريدك أولاً من الرسالة التي وصلتك.', 'Activate your email first from the message we sent you.') : t('البريد أو كلمة المرور غير صحيحة.', 'Wrong email or password.'))
    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login?reset=1` })
      if (error) setError(error.status === 429 || /rate/i.test(error.message) ? t('أُرسلت رسائل كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول مرة أخرى.', 'Too many emails were sent in a short time. Wait a little and try again.') : t('تعذّر إرسال الرابط. حاول مرة أخرى.', 'Could not send the link. Try again.'))
      else setInfo(t('إن كان هذا البريد مسجّلاً، سيصلك رابط لتعيين كلمة مرور جديدة.', 'If this email is registered, you will get a link to set a new password.'))
    } else {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) setError(t('تعذّر تحديث كلمة المرور. اطلب رابطاً جديداً.', 'Could not update the password. Request a new link.'))
      else {
        setInfo(t('تم تحديث كلمة المرور.', 'Password updated.'))
        setMode('signin')
      }
    }
    setBusy(false)
  }

  const title = mode === 'signin' ? t('تسجيل الدخول', 'Sign in') : mode === 'reset' ? t('استعادة كلمة المرور', 'Reset password') : t('كلمة مرور جديدة', 'New password')

  return (
    <DarkCard>
      <h1 className="m-0 text-[28px] md:text-[34px] font-bold">{title}</h1>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col" style={{ borderTop: '1px solid #2E2E2C' }}>
          {mode !== 'update' && (
            <label className={darkRow} style={darkRowStyle}>
              <span className="text-[13px] w-24 shrink-0" style={{ color: '#A3A3A0' }}>{t('البريد', 'Email')}</span>
              <input required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" autoComplete="email" style={{ ...darkInputStyle, textAlign: isRtl() ? 'right' : 'left' }} />
            </label>
          )}
          {mode !== 'reset' && (
            <label className={darkRow} style={darkRowStyle}>
              <span className="text-[13px] w-24 shrink-0" style={{ color: '#A3A3A0' }}>{t('كلمة المرور', 'Password')}</span>
              <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} style={darkInputStyle} />
            </label>
          )}
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        {unconfirmed && <ResendConfirm email={email} />}
        {info && <Notice tone="success">{info}</Notice>}
        <button type="submit" disabled={busy} className="h-[52px] rounded-full text-[15px] font-semibold cursor-pointer disabled:opacity-60" style={{ background: '#2563EB', color: '#fff', border: 'none' }}>
          {busy ? t('لحظة…', 'One moment…') : mode === 'signin' ? t('دخول', 'Sign in') : mode === 'reset' ? t('أرسل الرابط', 'Send link') : t('حفظ كلمة المرور', 'Save password')}
        </button>
        <div className="flex flex-col gap-2 text-[13px]" style={{ color: '#8C8C89' }}>
          {mode === 'signin' ? (
            <>
              <button type="button" onClick={() => setMode('reset')} className="text-start bg-transparent border-0 p-0 cursor-pointer" style={{ color: '#D4D4D1' }}>{t('نسيت كلمة المرور؟', 'Forgot password?')}</button>
              <span>{t('ليس لديك حساب؟', 'No account yet?')} <Link to="/join" className="underline" style={{ color: '#F2F2F0' }}>{t('انضم إلى Makers', 'Join Makers')}</Link></span>
            </>
          ) : (
            <button type="button" onClick={() => setMode('signin')} className="text-start bg-transparent border-0 p-0 cursor-pointer" style={{ color: '#D4D4D1' }}>{t('العودة لتسجيل الدخول', 'Back to sign in')}</button>
          )}
        </div>
      </form>
    </DarkCard>
  )
}
