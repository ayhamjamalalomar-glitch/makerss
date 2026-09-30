// Sends the pushes waiting in public.push_outbox through the Expo push service.
// Called every minute by pg_cron (job push-worker) with the same shared secret as the email worker.
// Text follows the language each device registered with. Dead tokens are removed.
import { createClient } from 'npm:@supabase/supabase-js@2'

type Payload = Record<string, unknown>
interface Row { id: number; user_id: string; kind: string; payload: Payload; tokens: { token: string; lang: 'ar' | 'en' }[] }
interface Push { title: string; body: string; url: string }

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v))

function render(kind: string, p: Payload, ar: boolean): Push | null {
  const t = (a: string, e: string) => (ar ? a : e)
  switch (kind) {
    case 'message':
      return { title: s(p.from) || t('رسالة جديدة', 'New message'), body: s(p.body), url: `/chat/${s(p.conversation_id)}` }
    case 'collab_request':
      return { title: t('طلب تعاون جديد', 'New collaboration request'), body: t(`من ${s(p.sender)}`, `From ${s(p.sender)}`), url: '/inbox' }
    case 'collab_accepted':
      return { title: t('تم قبول طلبك', 'Your request was accepted'), body: t(`قبل ${s(p.member)} طلب التعاون.`, `${s(p.member)} accepted your request.`), url: '/messages' }
    case 'collab_declined':
      return { title: t('رد على طلبك', 'An update on your request'), body: t(`اعتذر ${s(p.member)} هذه المرة.`, `${s(p.member)} could not take it this time.`), url: '/makers' }
    case 'review_approved':
      return { title: t('صفحتك منشورة', 'Your page is live'), body: t('راجع الفريق صفحتك وهي الآن في الدليل.', 'The team reviewed your page. It is now in the directory.'), url: '/account' }
    case 'review_rejected':
      return { title: t('صفحتك تحتاج تعديلاً', 'Your page needs changes'), body: t('افتح ملاحظة الفريق وعدّل صفحتك.', 'Open the team note and update your page.'), url: '/status' }
    case 'call_application':
      return { title: t('متقدّم جديد', 'New applicant'), body: t(`${s(p.applicant)} قدّم على «${s(p.title)}».`, `${s(p.applicant)} applied to "${s(p.title)}".`), url: '/inbox' }
    case 'call_approved':
      return { title: t('فرصتك منشورة', 'Your open call is live'), body: s(p.title), url: `/call/${s(p.call_id)}` }
    case 'call_rejected':
      return { title: t('فرصتك لم تُنشر', 'Your open call was not published'), body: s(p.title), url: '/calls' }
  }
  return null
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { data: ok } = await db.rpc('email_worker_check', { p_secret: req.headers.get('x-worker-secret') || '' })
  if (ok !== true) return json({ error: 'forbidden' }, 403)

  const { data, error } = await db.rpc('claim_pushes', { p_limit: 100 })
  if (error) return json({ error: error.message }, 500)
  const rows = (data as Row[]) || []

  const messages: { to: string; title: string; body: string; sound: string; data: { url: string }; rowId: number }[] = []
  for (const row of rows) {
    for (const tk of row.tokens || []) {
      const push = render(row.kind, row.payload || {}, tk.lang !== 'en')
      if (push) messages.push({ to: tk.token, title: push.title, body: push.body, sound: 'default', data: { url: push.url }, rowId: row.id })
    }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' }
  const access = Deno.env.get('EXPO_ACCESS_TOKEN')
  if (access) headers.Authorization = `Bearer ${access}`

  let sent = 0
  const dead: string[] = []
  const failedRows = new Set<number>()
  // The Expo push API takes up to 100 messages per request.
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100)
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(batch.map(({ rowId: _r, ...m }) => m)),
    })
    if (!res.ok) {
      batch.forEach((m) => failedRows.add(m.rowId))
      continue
    }
    const out = await res.json() as { data?: { status: string; details?: { error?: string } }[] }
    ;(out.data || []).forEach((ticket, k) => {
      if (ticket.status === 'ok') sent++
      else if (ticket.details?.error === 'DeviceNotRegistered') dead.push(batch[k].to)
    })
  }

  if (dead.length) await db.from('push_tokens').delete().in('token', dead)
  const done = rows.map((r) => r.id).filter((id) => !failedRows.has(id))
  if (done.length) await db.from('push_outbox').update({ sent_at: new Date().toISOString() }).in('id', done)
  if (failedRows.size) await db.from('push_outbox').update({ claimed_at: null, last_error: 'expo push request failed' }).in('id', [...failedRows])

  return json({ rows: rows.length, sent, removed: dead.length })
})
