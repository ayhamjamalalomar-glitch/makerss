import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'

/** "Didn't get the email?" helper for unconfirmed sign-ups, with a 60 second cooldown. */
export default function ResendConfirm({ email }: { email: string }) {
  const [wait, setWait] = useState(0)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  const resend = async () => {
    setMsg(null)
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/me` } })
    if (error) setMsg(error.status === 429 || /rate|seconds/i.test(error.message) ? t('انتظر دقيقة قبل طلب رسالة جديدة.', 'Wait a minute before asking for another email.') : t('تعذّر إرسال الرسالة. حاول لاحقاً.', 'Could not send the email. Try again later.'))
    else setMsg(t('أرسلنا رسالة تفعيل جديدة.', 'We sent a new activation email.'))
    setWait(60)
  }

  return (
    <div className="flex flex-col gap-1.5 text-[13px]" style={{ color: '#A3A3A0' }}>
      <span>{t('لم تصلك الرسالة؟ تفقّد مجلد الرسائل غير المرغوب فيها (Junk / Spam).', "Didn't get it? Check your Junk or Spam folder.")}</span>
      <button type="button" onClick={resend} disabled={wait > 0 || !email} className="self-start bg-transparent border-0 p-0 underline cursor-pointer disabled:opacity-50 disabled:no-underline" style={{ color: '#F2F2F0' }}>
        {wait > 0 ? t(`أعد الإرسال بعد ${wait} ثانية`, `Resend in ${wait}s`) : t('أعد إرسال رسالة التفعيل', 'Resend activation email')}
      </button>
      {msg && <span style={{ color: '#D4D4D1' }}>{msg}</span>}
    </div>
  )
}
