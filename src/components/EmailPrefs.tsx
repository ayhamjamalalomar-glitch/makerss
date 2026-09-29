import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../lib/i18n'
import { Card } from './mk'

/** On/off switch for optional emails. Review decisions are always sent. */
export default function EmailPrefs({ userId, email }: { userId: string; email?: string | null }) {
  const [on, setOn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('notification_prefs').select('email_enabled').eq('user_id', userId).maybeSingle()
      .then(({ data }) => setOn(data ? !!(data as { email_enabled: boolean }).email_enabled : true))
  }, [userId])

  const toggle = async () => {
    if (on === null) return
    const next = !on
    setBusy(true)
    setOn(next)
    const { error } = await supabase.from('notification_prefs').upsert({ user_id: userId, email_enabled: next, updated_at: new Date().toISOString() })
    if (error) setOn(!next)
    setBusy(false)
  }

  return (
    <Card className="px-5 py-5 md:px-10 md:py-6 flex items-center justify-between gap-4">
      <span className="flex flex-col gap-1 min-w-0">
        <span className="text-[13px] font-semibold">{t('تنبيهات البريد', 'Email alerts')}</span>
        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>
          {t('طلبات التعاون، المتقدّمون على فرصك، والرسائل غير المقروءة.', 'Collaboration requests, applicants on your calls, and unread messages.')}
          {email && <span dir="ltr" className="block truncate" style={{ textAlign: 'start' }}>{email}</span>}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={!!on}
        aria-label={t('تنبيهات البريد', 'Email alerts')}
        disabled={on === null || busy}
        onClick={toggle}
        className="shrink-0 w-12 h-7 rounded-full flex items-center cursor-pointer disabled:opacity-60"
        style={{ border: 'none', padding: 3, background: on ? 'var(--c-accent)' : 'var(--c-border-mid)', justifyContent: on ? 'flex-end' : 'flex-start', transition: 'background .2s' }}
      >
        <span className="w-[22px] h-[22px] rounded-full" style={{ background: '#fff' }} />
      </button>
    </Card>
  )
}
