// Sends the emails waiting in public.email_outbox through Resend.
// Called every minute by pg_cron (see migration email_notifications) with a shared secret.
// Needs RESEND_API_KEY on the function; until it is set the queue simply waits.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SITE = 'https://makerss.net'

type Payload = Record<string, unknown>
interface Row { id: number; kind: string; to_email: string; payload: Payload }
interface Mail { subject: string; ar: Block; en: Block; optional?: boolean }
interface Block { title: string; lines: string[]; quote?: string; cta: string; link: string }

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const s = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v))

const PROJECT_TYPES: Record<string, string> = {
  'إعلان تجاري': 'Commercial', 'فيلم قصير': 'Short film', 'فيلم وثائقي': 'Documentary',
  'محتوى سوشال': 'Social content', 'فيديو كليب': 'Music video', 'غير ذلك': 'Other',
}

function render(kind: string, p: Payload): Mail | null {
  const name = s(p.name)
  const hi = (n: string) => (n ? `مرحباً ${n}،` : 'مرحباً،')
  const hiEn = (n: string) => (n ? `Hi ${n},` : 'Hi,')
  switch (kind) {
    case 'collab_request': {
      const type = s(p.project_type)
      const dates = [s(p.start), s(p.end)].filter(Boolean).join(' → ')
      return {
        subject: `طلب تعاون جديد من ${s(p.sender)} | New collaboration request`,
        optional: true,
        ar: { title: 'وصلك طلب تعاون', lines: [hi(name), `أرسل لك ${s(p.sender)} طلب تعاون على Makers${type ? ` (${type})` : ''}.`, dates ? `المواعيد: ${dates}` : ''], quote: s(p.details), cta: 'افتح الطلب', link: '/messages?tab=collab' },
        en: { title: 'New collaboration request', lines: [hiEn(name), `${s(p.sender)} sent you a collaboration request on Makers${type ? ` (${PROJECT_TYPES[type] || type})` : ''}.`, dates ? `Dates: ${dates}` : ''], cta: 'Open the request', link: '/messages?tab=collab' },
      }
    }
    case 'collab_accepted': {
      const member = s(p.member)
      const inApp = p.member_sender === true
      return {
        subject: `${member} قبل طلب التعاون | ${member} accepted your request`,
        ar: { title: 'تم قبول طلبك', lines: [hi(s(p.sender)), `قبل ${member} طلب التعاون الذي أرسلته على Makers.`, inApp ? 'تابع الحديث معه في رسائلك على Makers.' : 'سيتواصل معك قريباً على بريدك الإلكتروني.'], cta: inApp ? 'افتح الرسائل' : 'افتح صفحته', link: inApp ? '/messages' : `/${s(p.username)}` },
        en: { title: 'Your request was accepted', lines: [hiEn(s(p.sender)), `${member} accepted the collaboration request you sent on Makers.`, inApp ? 'Carry on the conversation in your Makers messages.' : 'They will reach you by email soon.'], cta: inApp ? 'Open messages' : 'View their page', link: inApp ? '/messages' : `/${s(p.username)}` },
      }
    }
    case 'collab_declined': {
      const member = s(p.member)
      return {
        subject: `رد على طلب التعاون | Update on your request`,
        ar: { title: 'رد على طلبك', lines: [hi(s(p.sender)), `اعتذر ${member} عن طلب التعاون هذه المرة.`, 'في Makers صنّاع آخرون قد يناسبون مشروعك.'], cta: 'تصفّح الصنّاع', link: '/makers' },
        en: { title: 'An update on your request', lines: [hiEn(s(p.sender)), `${member} could not take on your request this time.`, 'Other makers on Makers may be a great fit for your project.'], cta: 'Browse makers', link: '/makers' },
      }
    }
    case 'review_approved':
      return {
        subject: 'صفحتك منشورة الآن على Makers | Your page is live',
        ar: { title: 'صفحتك منشورة', lines: [hi(name), 'راجع فريق Makers صفحتك، وهي الآن ظاهرة في الدليل.', p.founding ? 'وأنت من الأعضاء المؤسسين، والشارة تبقى معك دائماً.' : '', 'شارك رابط صفحتك في حساباتك حتى يصل إليك أصحاب المشاريع.'], cta: 'افتح صفحتك', link: `/${s(p.username)}` },
        en: { title: 'Your page is live', lines: [hiEn(name), 'The Makers team reviewed your page and it is now in the directory.', p.founding ? 'You are a founding member, and the badge stays with you.' : '', 'Share your link on your accounts so clients can find you.'], cta: 'Open your page', link: `/${s(p.username)}` },
      }
    case 'review_rejected':
      return {
        subject: 'صفحتك تحتاج تعديلاً | Your page needs a few changes',
        ar: { title: 'صفحتك تحتاج تعديلاً', lines: [hi(name), 'راجع فريق Makers صفحتك، وهي تحتاج بعض التعديلات قبل النشر. هذا ليس رفضاً نهائياً.'], quote: s(p.note), cta: 'عدّل صفحتك', link: '/me' },
        en: { title: 'Your page needs a few changes', lines: [hiEn(name), 'The Makers team reviewed your page and it needs a few changes before it goes live. This is not final.'], cta: 'Edit your page', link: '/me' },
      }
    case 'call_application':
      return {
        subject: `متقدّم جديد على «${s(p.title)}» | New applicant`,
        optional: true,
        ar: { title: 'متقدّم جديد', lines: [hi(name), `قدّم ${s(p.applicant)} على فرصتك «${s(p.title)}».`], quote: s(p.message), cta: 'افتح الطلبات', link: '/inbox?tab=calls' },
        en: { title: 'New applicant', lines: [hiEn(name), `${s(p.applicant)} applied to your open call "${s(p.title)}".`], cta: 'Open applications', link: '/inbox?tab=calls' },
      }
    case 'call_approved':
      return {
        subject: `فرصتك منشورة: ${s(p.title)} | Your open call is live`,
        ar: { title: 'فرصتك منشورة', lines: [hi(name), `راجع الفريق فرصتك «${s(p.title)}» وهي الآن منشورة. ستصلك الطلبات في صندوق الوارد.`], cta: 'افتح الفرصة', link: `/opportunities/${s(p.call_id)}` },
        en: { title: 'Your open call is live', lines: [hiEn(name), `Your open call "${s(p.title)}" is reviewed and live. Applications will arrive in your inbox.`], cta: 'View the call', link: `/opportunities/${s(p.call_id)}` },
      }
    case 'call_rejected':
      return {
        subject: `فرصتك لم تُنشر: ${s(p.title)} | Your open call was not published`,
        ar: { title: 'فرصتك لم تُنشر', lines: [hi(name), `لم ينشر الفريق فرصتك «${s(p.title)}».`], quote: s(p.note), cta: 'الفرص', link: '/opportunities' },
        en: { title: 'Your open call was not published', lines: [hiEn(name), `The team did not publish your open call "${s(p.title)}".`], cta: 'Open calls', link: '/opportunities' },
      }
    case 'unread_messages': {
      const n = Number(p.count) || 1
      const who = (Array.isArray(p.senders) ? p.senders : []).map(s).filter(Boolean).join('، ')
      return {
        subject: `رسائل جديدة على Makers | New messages on Makers`,
        optional: true,
        ar: { title: 'لديك رسائل جديدة', lines: [hi(name), n === 1 ? `وصلتك رسالة لم تقرأها بعد${who ? ` من ${who}` : ''}.` : `وصلتك رسائل لم تقرأها بعد (${n})${who ? ` من ${who}` : ''}.`], cta: 'افتح الرسائل', link: '/messages' },
        en: { title: 'You have new messages', lines: [hiEn(name), `You have ${n} unread message${n === 1 ? '' : 's'}${who ? ` from ${who}` : ''}.`], cta: 'Open messages', link: '/messages' },
      }
    }
    case 'admin_review_needed':
      return {
        subject: `صفحة بانتظار المراجعة: ${name}`,
        ar: { title: 'صفحة جديدة بانتظار المراجعة', lines: [`أرسل ${name}${p.creator ? ' (صانع محتوى)' : ''} صفحته للمراجعة.`], cta: 'افتح لوحة الإدارة', link: '/admin' },
        en: { title: 'A page is waiting for review', lines: [`${name} sent their page for review.`], cta: 'Open admin', link: '/admin' },
      }
    case 'admin_call_needed':
      return {
        subject: `فرصة بانتظار المراجعة: ${s(p.title)}`,
        ar: { title: 'فرصة جديدة بانتظار المراجعة', lines: [`نشر ${s(p.owner)} فرصة «${s(p.title)}» وهي بانتظار المراجعة.`], cta: 'افتح لوحة الإدارة', link: '/admin' },
        en: { title: 'An open call is waiting for review', lines: [`${s(p.owner)} posted "${s(p.title)}".`], cta: 'Open admin', link: '/admin' },
      }
    case 'writing_approved':
      return {
        subject: `كتابتك منشورة: ${s(p.title)} | Your writing is live`,
        ar: { title: 'كتابتك منشورة', lines: [hi(name), `راجع فريق Makers «${s(p.title)}» وهي الآن منشورة في صفحتك وفي قسم الكتابات.`], cta: 'افتح الكتابة', link: `/writing/${s(p.id)}` },
        en: { title: 'Your writing is live', lines: [hiEn(name), `The Makers team reviewed "${s(p.title)}" and it is now live on your page and in Writing.`], cta: 'Open it', link: `/writing/${s(p.id)}` },
      }
    case 'writing_rejected':
      return {
        subject: `كتابتك تحتاج تعديلاً: ${s(p.title)} | Your writing needs changes`,
        ar: { title: 'كتابتك تحتاج تعديلاً', lines: [hi(name), `راجع فريق Makers «${s(p.title)}»، وهي تحتاج بعض التعديلات قبل النشر.`], quote: s(p.note), cta: 'عدّل الكتابة', link: `/writing/${s(p.id)}/edit` },
        en: { title: 'Your writing needs changes', lines: [hiEn(name), `The Makers team reviewed "${s(p.title)}" and it needs a few changes before it goes live.`], cta: 'Edit it', link: `/writing/${s(p.id)}/edit` },
      }
    case 'writer_trusted':
      return {
        subject: 'مبارك، كتاباتك تُنشر الآن مباشرة | You now publish directly',
        ar: {
          title: 'مبارك، كتاباتك تُنشر مباشرة',
          lines: [
            hi(name),
            'راجع فريق Makers أول خمس كتابات نشرتها، ومن اليوم تُنشر كتاباتك فور إرسالها بدون مراجعة مسبقة.',
            'هذه ثقة نعتز بها، ونحثّك على الالتزام بسياسات Makers وأخلاقيات المهنة: انشر أعمالك أنت فقط، واذكر مصادرك، واحترم حقوق الآخرين وخصوصيتهم، وابتعد عن الإساءة والمحتوى المضلّل.',
            'وتبقى أي كتابة قابلة للمراجعة إذا وصلنا بلاغ عنها.',
          ],
          cta: 'اكتب جديدك', link: '/writing/new',
        },
        en: {
          title: 'Congratulations, you now publish directly',
          lines: [
            hiEn(name),
            'The Makers team reviewed your first five writings. From today what you publish goes live right away, with no review first.',
            "We value this trust, and we ask you to keep to the Makers policies and the ethics of the craft: publish only your own work, credit your sources, respect other people's rights and privacy, and stay away from abuse and misleading content.",
            'Any writing can still be reviewed if it is reported.',
          ],
          cta: 'Write something new', link: '/writing/new',
        },
      }
    case 'admin_writing_needed':
      return {
        subject: `كتابة بانتظار المراجعة: ${s(p.title)}`,
        ar: { title: 'كتابة جديدة بانتظار المراجعة', lines: [`أرسل ${s(p.owner)} «${s(p.title)}» للمراجعة.`], cta: 'افتح لوحة الإدارة', link: '/admin?tab=writings' },
        en: { title: 'A writing is waiting for review', lines: [`${s(p.owner)} sent "${s(p.title)}".`], cta: 'Open admin', link: '/admin?tab=writings' },
      }
    case 'admin_report':
      return {
        subject: 'بلاغ جديد على Makers',
        ar: { title: 'بلاغ جديد', lines: [`وصل بلاغ جديد من ${s(p.by)}.`], cta: 'افتح البلاغات', link: '/admin' },
        en: { title: 'New report', lines: [`${s(p.by)} sent a new report.`], cta: 'Open reports', link: '/admin' },
      }
  }
  return null
}

function block(b: Block, dir: 'rtl' | 'ltr') {
  const align = dir === 'rtl' ? 'right' : 'left'
  const font = dir === 'rtl' ? "'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif" : "Inter, Helvetica, Arial, sans-serif"
  const lines = b.lines.filter(Boolean).map((l) => `<p style="margin:0 0 10px;font-size:15px;line-height:1.8;color:#C8B8A8">${esc(l)}</p>`).join('')
  const quote = b.quote ? `<div style="margin:14px 0 4px;padding:14px 16px;border-radius:12px;background:#1D1917;color:#F5F0EB;font-size:14px;line-height:1.8;white-space:pre-line">${esc(b.quote)}</div>` : ''
  return `<div dir="${dir}" style="text-align:${align};font-family:${font}">
    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.4;color:#F5F0EB">${esc(b.title)}</h1>
    ${lines}${quote}
    <div style="margin-top:22px"><a href="${SITE}${esc(b.link)}" style="display:inline-block;background:#E85D04;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:999px">${esc(b.cta)}</a></div>
  </div>`
}

function html(m: Mail) {
  const footerAr = m.optional ? 'لإيقاف رسائل التنبيه، افتح «صفحتي» على Makers.' : ''
  const footerEn = m.optional ? 'To stop these emails, open "My page" on Makers.' : ''
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0D0A08">
  <div style="max-width:560px;margin:0 auto;padding:32px 18px">
    <div style="font-family:'Arial Black',Arial,sans-serif;font-weight:900;font-size:13px;line-height:1.05;letter-spacing:0.04em;color:#F5F0EB;text-align:left;direction:ltr">MAKERS<br>FILMMAKERS<br>CREATORS</div>
    <div style="margin-top:22px;background:#161210;border:1px solid #2C2420;border-radius:16px;padding:28px 24px">
      ${block(m.ar, 'rtl')}
      <div style="height:1px;background:#2C2420;margin:26px 0"></div>
      ${block(m.en, 'ltr')}
    </div>
    <p dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:11px;color:#7A6E66;text-align:center;margin:18px 0 4px">${esc(footerAr)}</p>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#7A6E66;text-align:center;margin:0 0 4px">${esc(footerEn)}</p>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#5A4E47;text-align:center;margin:10px 0 0">© Makers, by intime · <a href="${SITE}" style="color:#7A6E66">makerss.net</a></p>
  </div></body></html>`
}

const text = (m: Mail) => [m.ar, m.en].map((b) => [b.title, ...b.lines.filter(Boolean), b.quote || '', `${b.cta}: ${SITE}${b.link}`].filter(Boolean).join('\n')).join('\n\n')

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { data: ok } = await db.rpc('email_worker_check', { p_secret: req.headers.get('x-worker-secret') || '' })
  if (ok !== true) return json({ error: 'forbidden' }, 403)

  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return json({ skipped: 'RESEND_API_KEY is not set' })
  const from = Deno.env.get('EMAIL_FROM') || 'Makers <hello@makerss.net>'

  const { data: rows, error } = await db.rpc('claim_emails', { p_limit: 40 })
  if (error) return json({ error: error.message }, 500)

  let sent = 0
  let failed = 0
  for (const row of (rows as Row[]) || []) {
    const mail = render(row.kind, row.payload || {})
    if (!mail) {
      await db.from('email_outbox').update({ sent_at: new Date().toISOString(), last_error: `unknown kind ${row.kind}` }).eq('id', row.id)
      continue
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [row.to_email], subject: mail.subject, html: html(mail), text: text(mail) }),
    })
    if (res.ok) {
      sent++
      await db.from('email_outbox').update({ sent_at: new Date().toISOString(), last_error: null }).eq('id', row.id)
    } else {
      failed++
      await db.from('email_outbox').update({ claimed_at: null, last_error: `${res.status} ${(await res.text()).slice(0, 300)}` }).eq('id', row.id)
    }
  }
  return json({ sent, failed })
})
