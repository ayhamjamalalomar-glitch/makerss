import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { t } from '../lib/i18n'
import Link from '../lib/router'
import { Btn, Chip, Modal, Notice, TextArea } from './mk'

const REASONS = [
  { key: 'fake', ar: 'حساب أو معلومات غير حقيقية', en: 'Fake account or details' },
  { key: 'stolen', ar: 'عمل منسوب لغير صاحبه', en: 'Work credited to the wrong person' },
  { key: 'offensive', ar: 'محتوى مسيء', en: 'Offensive content' },
  { key: 'spam', ar: 'إزعاج أو إعلانات', en: 'Spam' },
  { key: 'other', ar: 'سبب آخر', en: 'Something else' },
] as const

/** Small "report" link that opens a form. Reports go to the Makers team, never to the reported member. */
export default function ReportButton({ type, id }: { type: 'profile' | 'project' | 'call'; id: string }) {
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
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-80" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--c-muted-2)' }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 14V2.5M3 2.5h8.5l-1.8 3 1.8 3H3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {t('بلّغ', 'Report')}
      </button>
      {open && (
        <Modal
          title={t('بلّغ فريق Makers', 'Report to the Makers team')}
          onClose={close}
          footer={session && !done ? <><Btn disabled={busy} onClick={send}>{busy ? t('جارٍ الإرسال…', 'Sending…') : t('أرسل البلاغ', 'Send report')}</Btn><Btn variant="outline" onClick={close}>{t('إلغاء', 'Cancel')}</Btn></> : undefined}
        >
          {!session ? (
            <Notice>{t('سجّل الدخول لترسل بلاغاً.', 'Sign in to send a report.')} <Link to="/login" className="font-semibold underline">{t('دخول', 'Sign in')}</Link></Notice>
          ) : done ? (
            <Notice tone="success">{t('وصل بلاغك إلى الفريق، وسنراجعه بسرية. شكراً لك.', 'Your report reached the team and will be reviewed privately. Thank you.')}</Notice>
          ) : (
            <>
              <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('يصل البلاغ إلى فريق Makers فقط، ولا يعرف صاحب الصفحة من أرسله.', 'Reports go to the Makers team only. The member never sees who sent it.')}</span>
              <div className="flex flex-wrap gap-2">
                {REASONS.map((r) => <Chip key={r.key} on={reason === r.key} onClick={() => setReason(r.key)}>{t(r.ar, r.en)}</Chip>)}
              </div>
              <TextArea rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('تفاصيل تساعدنا (اختياري)', 'Details that help us (optional)')} />
              {error && <Notice tone="error">{error}</Notice>}
            </>
          )}
        </Modal>
      )}
    </>
  )
}
