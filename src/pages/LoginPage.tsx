import { useEffect, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Notice } from '../components/mk'
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
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message.includes('confirmed') ? 'فعّل بريدك أولاً من الرسالة التي وصلتك.' : 'البريد أو كلمة المرور غير صحيحة.')
    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login?reset=1` })
      if (error) setError(error.status === 429 || /rate/i.test(error.message) ? 'أُرسلت رسائل كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول مرة أخرى.' : 'تعذّر إرسال الرابط. حاول مرة أخرى.')
      else setInfo('إن كان هذا البريد مسجّلاً، سيصلك رابط لتعيين كلمة مرور جديدة.')
    } else {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) setError('تعذّر تحديث كلمة المرور. اطلب رابطاً جديداً.')
      else {
        setInfo('تم تحديث كلمة المرور.')
        setMode('signin')
      }
    }
    setBusy(false)
  }

  const title = mode === 'signin' ? 'تسجيل الدخول' : mode === 'reset' ? 'استعادة كلمة المرور' : 'كلمة مرور جديدة'

  return (
    <DarkCard>
      <h1 className="m-0 text-[28px] md:text-[34px] font-bold">{title}</h1>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col" style={{ borderTop: '1px solid #2E2E2C' }}>
          {mode !== 'update' && (
            <label className={darkRow} style={darkRowStyle}>
              <span className="text-[13px] w-24 shrink-0" style={{ color: '#A3A3A0' }}>البريد</span>
              <input required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" autoComplete="email" style={{ ...darkInputStyle, textAlign: 'right' }} />
            </label>
          )}
          {mode !== 'reset' && (
            <label className={darkRow} style={darkRowStyle}>
              <span className="text-[13px] w-24 shrink-0" style={{ color: '#A3A3A0' }}>كلمة المرور</span>
              <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} style={darkInputStyle} />
            </label>
          )}
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        {info && <Notice tone="success">{info}</Notice>}
        <button type="submit" disabled={busy} className="h-[52px] rounded-full text-[15px] font-semibold cursor-pointer disabled:opacity-60" style={{ background: '#2563EB', color: '#fff', border: 'none' }}>
          {busy ? 'لحظة…' : mode === 'signin' ? 'دخول' : mode === 'reset' ? 'أرسل الرابط' : 'حفظ كلمة المرور'}
        </button>
        <div className="flex flex-col gap-2 text-[13px]" style={{ color: '#8C8C89' }}>
          {mode === 'signin' ? (
            <>
              <button type="button" onClick={() => setMode('reset')} className="text-right bg-transparent border-0 p-0 cursor-pointer" style={{ color: '#D4D4D1' }}>نسيت كلمة المرور؟</button>
              <span>ليس لديك حساب؟ <Link to="/join" className="underline" style={{ color: '#F2F2F0' }}>انضم إلى Makers</Link></span>
            </>
          ) : (
            <button type="button" onClick={() => setMode('signin')} className="text-right bg-transparent border-0 p-0 cursor-pointer" style={{ color: '#D4D4D1' }}>العودة لتسجيل الدخول</button>
          )}
        </div>
      </form>
    </DarkCard>
  )
}
