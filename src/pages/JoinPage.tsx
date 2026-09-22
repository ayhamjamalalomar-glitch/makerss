import { useEffect, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Notice } from '../components/mk'
import DarkCard, { darkInputStyle, darkRow, darkRowStyle } from '../components/DarkCard'

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30)

export default function JoinPage() {
  const { session, profile } = useAuth()
  const { go } = useRouter()
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
    if (session && profile) go(profile.status === 'draft' || profile.status === 'rejected' ? '/me' : '/me/status')
  }, [session, profile, go])

  useEffect(() => {
    if (!touchedUser) setUsername(slugify(name))
  }, [name, touchedUser])

  useEffect(() => {
    if (username.length < 3) return setAvailable(null)
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc('username_available', { p_username: username })
      setAvailable(!!data)
    }, 350)
    return () => clearTimeout(t)
  }, [username])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (type === 'creator') {
      setError(null)
      setSentTo('interest')
      return
    }
    if (!available) return setError('اختر رابطاً آخر لصفحتك، هذا الرابط غير متاح.')
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim(), username, account_type: 'maker' }, emailRedirectTo: `${window.location.origin}/me` },
    })
    setBusy(false)
    if (error) {
      setError(error.message.includes('registered') ? 'هذا البريد مسجّل مسبقاً. سجّل الدخول بدلاً من ذلك.' : 'تعذّر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.')
      return
    }
    if (data.session) go('/me')
    else setSentTo(email)
  }

  if (sentTo) {
    return (
      <DarkCard>
        <div className="flex flex-col gap-3">
          <h1 className="m-0 text-[28px] md:text-[34px] font-bold" style={{ lineHeight: 1.35 }}>{sentTo === 'interest' ? 'سجّلنا اهتمامك' : 'تحقق من بريدك'}</h1>
          <p className="m-0 text-sm leading-relaxed" style={{ color: '#A3A3A0' }}>
            {sentTo === 'interest'
              ? 'ينضم صنّاع المحتوى في المرحلة القادمة. سنبلغك فور فتح التسجيل.'
              : `أرسلنا رابط التفعيل إلى ${sentTo}. افتح الرابط لتبدأ ببناء صفحتك.`}
          </p>
        </div>
        <Link to="/" className="text-sm font-semibold" style={{ color: '#F2F2F0' }}>العودة إلى الدليل</Link>
      </DarkCard>
    )
  }

  return (
    <DarkCard>
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 text-[28px] md:text-[34px] font-bold" style={{ lineHeight: 1.35 }}>لنبدأ بصفحتك</h1>
        <p className="m-0 text-sm" style={{ color: '#A3A3A0' }}>معلومات قليلة فقط، والباقي تكمله داخل صفحتك.</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-col" style={{ borderTop: '1px solid #2E2E2C' }}>
          <div className={darkRow} style={darkRowStyle}>
            <span className="text-[13px] w-24 shrink-0" style={{ color: '#A3A3A0' }}>أنا</span>
            <div className="flex flex-wrap gap-2">
              {(['maker', 'creator'] as const).map((k) => (
                <button key={k} type="button" aria-pressed={type === k} onClick={() => setType(k)} className="h-[38px] px-4 rounded-full text-[13px] cursor-pointer" style={type === k ? { background: '#F2F2F0', color: '#0B0B0B', border: '1px solid #F2F2F0', fontWeight: 600 } : { background: 'transparent', color: '#A3A3A0', border: '1px solid #3A3A38' }}>
                  {k === 'maker' ? 'صانع إنتاج (Maker)' : 'صانع محتوى'}
                </button>
              ))}
            </div>
          </div>
          <label className={darkRow} style={darkRowStyle}>
            <span className="text-[13px] w-24 shrink-0" style={{ color: '#A3A3A0' }}>الاسم</span>
            <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" style={darkInputStyle} />
          </label>
          {type === 'maker' && (
            <>
              <label className={darkRow} style={darkRowStyle}>
                <span className="text-[13px] w-24 shrink-0" style={{ color: '#A3A3A0' }}>رابط صفحتك</span>
                <span dir="ltr" className="flex-1 flex items-center justify-end mono text-sm min-w-0">
                  <span style={{ color: '#6E6E6B' }}>makerss.net/</span>
                  <input
                    required
                    value={username}
                    onChange={(e) => { setTouchedUser(true); setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
                    placeholder="your-name"
                    style={{ ...darkInputStyle, fontSize: 14, fontFamily: 'inherit', flex: '0 1 150px' }}
                  />
                </span>
              </label>
              <span className="text-xs -mt-4" style={{ color: available === false ? '#FCA5A5' : '#8C8C89' }}>
                {available === false ? 'هذا الرابط محجوز أو غير صالح.' : 'حروف إنجليزية صغيرة وأرقام وشرطات فقط.'}
              </span>
              <label className={darkRow} style={darkRowStyle}>
                <span className="text-[13px] w-24 shrink-0" style={{ color: '#A3A3A0' }}>البريد</span>
                <input required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" style={{ ...darkInputStyle, textAlign: 'right' }} />
              </label>
              <label className={darkRow} style={darkRowStyle}>
                <span className="text-[13px] w-24 shrink-0" style={{ color: '#A3A3A0' }}>كلمة المرور</span>
                <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 أحرف على الأقل" autoComplete="new-password" style={darkInputStyle} />
              </label>
            </>
          )}
        </div>
        <span className="text-[13px] leading-relaxed" style={{ color: '#8C8C89' }}>
          {type === 'maker'
            ? 'مخرج، مصوّر، مونتير، ستايلست وغيرهم. تظهر صفحتك في الدليل بعد أن يراجعها فريق Makers.'
            : 'ينضم صنّاع المحتوى في المرحلة القادمة. سجّل اهتمامك وسنبلغك فور فتح التسجيل.'}
        </span>
        {error && <Notice tone="error">{error}</Notice>}
        <button type="submit" disabled={busy} className="h-[52px] rounded-full text-[15px] font-semibold cursor-pointer disabled:opacity-60" style={{ background: '#2563EB', color: '#fff', border: 'none' }}>
          {busy ? 'جارٍ الإنشاء…' : type === 'maker' ? 'أنشئ صفحتك' : 'سجّل اهتمامي'}
        </button>
        <p className="m-0 text-[13px]" style={{ color: '#8C8C89' }}>
          لديك حساب؟ <Link to="/login" className="underline" style={{ color: '#F2F2F0' }}>سجّل الدخول</Link>
        </p>
      </form>
    </DarkCard>
  )
}
