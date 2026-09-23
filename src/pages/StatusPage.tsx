import { useEffect, useState } from 'react'
import { t } from '../lib/i18n'
import Link, { useRouter } from '../lib/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { SITE_URL } from '../lib/constants'
import { Btn, Card, PageShell, Pill, Spinner } from '../components/mk'

export default function StatusPage() {
  const { session, profile, loading, refreshProfile } = useAuth()
  const { go } = useRouter()
  const [copied, setCopied] = useState(false)
  const [codes, setCodes] = useState<string[]>([])
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !session) go('/login?next=/me/status')
    if (profile && profile.status === 'draft') go('/me')
  }, [loading, session, profile, go])

  useEffect(() => {
    if (profile?.status === 'approved') {
      supabase.from('invites').select('code').order('created_at').then(({ data }) => setCodes((data || []).map((r) => r.code)))
    }
  }, [profile?.status])

  if (loading || !profile) return <PageShell narrow><Spinner /></PageShell>

  const link = `${SITE_URL}/${profile.username}`
  const shareText = encodeURIComponent(t(`صفحتي على Makers: ${link}`, `My page on Makers: ${link}`))
  const copy = async () => {
    try { await navigator.clipboard.writeText(link) } catch { /* ignore */ }
    setCopied(true)
  }
  const invite = async () => {
    setInviteError(null)
    const { data, error } = await supabase.rpc('create_invite', { p_email: null })
    if (error) return setInviteError(t('لا توجد دعوات متبقية.', 'No invites left.'))
    setCodes([...codes, data as string])
    refreshProfile()
  }

  return (
    <PageShell narrow>
      {profile.status === 'pending' && (
        <>
          <div className="flex flex-col gap-3 pt-4 md:pt-8">
            <span><Pill tone="blue">{t('قيد المراجعة', 'In review')}</Pill></span>
            <h1 className="m-0 text-[30px] md:text-[40px] font-bold" style={{ lineHeight: 1.3 }}>{t('وصلت صفحتك إلى فريق Makers', 'Your page reached the Makers team')}</h1>
            <p className="m-0 text-base" style={{ lineHeight: 1.9, color: '#3A3A38' }}>{t('نراجع كل صفحة بعناية حتى يبقى الدليل موثوقاً. سنرسل لك رسالة على بريدك الإلكتروني فور صدور القرار.', 'We review every page carefully so the directory stays trustworthy. We will email you as soon as there is a decision.')}</p>
          </div>
          <Card className="px-6 py-6 md:px-8 flex flex-col gap-4">
            <Step state="done" title={t('أرسلت صفحتك', 'You sent your page')} />
            <Step state="current" title={t('مراجعة الفريق', 'Team review')} sub={t('نراجع الصفحات حسب ترتيب وصولها', 'Pages are reviewed in the order they arrive')} />
            <Step state="todo" title={t('نشر صفحتك في الدليل', 'Your page goes live in the directory')} />
          </Card>
          <div className="flex gap-2.5">
            <Link to={profile.username ? `/${profile.username}` : '/me'} className="text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#F3F3F2' }}>{t('معاينة صفحتي', 'Preview my page')}</Link>
            <Link to="/me" className="text-sm px-5 py-3 rounded-full" style={{ color: '#2563EB' }}>{t('تعديل الصفحة', 'Edit page')}</Link>
          </div>
        </>
      )}

      {profile.status === 'approved' && (
        <>
          <div className="flex flex-col gap-3 pt-4 md:pt-8">
            <span><Pill tone="green">{t('منشورة', 'Live')}</Pill></span>
            <h1 className="m-0 text-[30px] md:text-[40px] font-bold" style={{ lineHeight: 1.3 }}>{t('أهلاً بك في Makers، صفحتك منشورة', 'Welcome to Makers, your page is live')}</h1>
            <p className="m-0 text-base" style={{ lineHeight: 1.9, color: '#3A3A38' }}>
              {profile.is_founding ? t('أنت الآن من الأعضاء المؤسسين. ', 'You are now a founding member. ') : ''}{t('شارك رابط صفحتك في حساباتك حتى يصل إليك أصحاب المشاريع.', 'Share your link on your accounts so clients can find you.')}
            </p>
          </div>
          <Card className="px-5 py-5 md:px-7 md:py-6 flex flex-col gap-3.5">
            <span className="text-[13px] font-semibold">{t('رابط صفحتك', 'Your page link')}</span>
            <div className="flex flex-col md:flex-row gap-2.5">
              <span dir="ltr" className="flex-1 h-[50px] px-5 rounded-full flex items-center mono text-[15px]" style={{ background: '#F7F7F6' }}>{link.replace('https://', '')}</span>
              <Btn onClick={copy}>{copied ? t('تم النسخ', 'Copied') : t('انسخ الرابط', 'Copy link')}</Btn>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer" className="text-[13px] px-4 py-2 rounded-full" style={{ border: '1px solid #E3E3E0' }}>{t('مشاركة على واتساب', 'Share on WhatsApp')}</a>
              <a href={`https://x.com/intent/tweet?text=${shareText}`} target="_blank" rel="noreferrer" className="text-[13px] px-4 py-2 rounded-full" style={{ border: '1px solid #E3E3E0' }}>{t('مشاركة على X', 'Share on X')}</a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer" className="text-[13px] px-4 py-2 rounded-full" style={{ border: '1px solid #E3E3E0' }}>{t('مشاركة على لينكدإن', 'Share on LinkedIn')}</a>
            </div>
            <span className="text-xs" style={{ color: '#5C5C59' }}>{t('لإنستغرام وتيك توك: الصق الرابط في خانة الرابط داخل البايو.', 'For Instagram and TikTok: paste the link in your bio link field.')}</span>
          </Card>
          <Card className="px-5 py-5 md:px-7 md:py-6 flex flex-col gap-3.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[13px] font-semibold">{t('ادعُ صنّاعاً تثق بعملهم', 'Invite makers whose work you trust')}</span>
              <span className="text-xs" style={{ color: '#5C5C59' }}>{profile.invites_remaining > 0 ? t(`متبقٍّ: ${profile.invites_remaining} من 3`, `${profile.invites_remaining} of 3 left`) : t('استخدمت كل الدعوات', 'All invites used')}</span>
            </div>
            <span className="text-[13px]" style={{ color: '#5C5C59' }}>{t('يمرّ المدعوون بالمراجعة نفسها. أعطِ الرمز لمن تدعوه ليكتبه عند التسجيل.', 'Invitees go through the same review. Give them the code to enter when they sign up.')}</span>
            <div className="flex flex-wrap gap-2">
              {codes.map((c) => <span key={c} dir="ltr" className="mono text-sm px-4 py-2 rounded-full" style={{ background: '#F3F3F2' }}>{c}</span>)}
              {profile.invites_remaining > 0 && <Btn variant="dashed" onClick={invite} className="!py-2 !px-4 text-[13px]">{t('+ أنشئ رمز دعوة', '+ Create invite code')}</Btn>}
            </div>
            {inviteError && <span className="text-xs" style={{ color: '#B42318' }}>{inviteError}</span>}
          </Card>
          <div className="flex gap-2.5">
            <Link to={profile.username ? `/${profile.username}` : '/me'} className="text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#F3F3F2' }}>{t('افتح صفحتي', 'Open my page')}</Link>
            <Link to="/" className="text-sm px-5 py-3 rounded-full" style={{ color: '#2563EB' }}>{t('تصفّح الدليل', 'Browse the directory')}</Link>
          </div>
        </>
      )}

      {profile.status === 'rejected' && (
        <>
          <div className="flex flex-col gap-3 pt-4 md:pt-8">
            <span><Pill tone="red">{t('تحتاج تعديلاً', 'Needs changes')}</Pill></span>
            <h1 className="m-0 text-[30px] md:text-[40px] font-bold" style={{ lineHeight: 1.3 }}>{t('لم تُقبل صفحتك هذه المرة', 'Your page was not approved this time')}</h1>
            <p className="m-0 text-base" style={{ lineHeight: 1.9, color: '#3A3A38' }}>{t('هذا ليس رفضاً نهائياً. عدّل صفحتك حسب ملاحظة الفريق وأرسلها مرة أخرى.', 'This is not final. Update your page based on the team note and send it again.')}</p>
          </div>
          {profile.review_note && (
            <div className="px-6 py-5 md:px-7 rounded-[28px] flex flex-col gap-2" style={{ background: '#FFF8F6', border: '1px solid #F6D6D1' }}>
              <span className="text-[13px] font-semibold" style={{ color: '#B42318' }}>{t('ملاحظة فريق Makers', 'Note from the Makers team')}</span>
              <p className="m-0 text-base" style={{ lineHeight: 1.9 }}>{profile.review_note}</p>
            </div>
          )}
          <div className="flex gap-2.5">
            <Link to="/me" className="text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#2563EB', color: '#fff' }}>{t('عدّل صفحتك', 'Edit your page')}</Link>
          </div>
        </>
      )}

      {profile.status === 'suspended' && (
        <div className="flex flex-col gap-3 pt-8">
          <span><Pill>{t('موقوف', 'Suspended')}</Pill></span>
          <h1 className="m-0 text-[30px] font-bold">{t('حسابك موقوف مؤقتاً', 'Your account is temporarily suspended')}</h1>
          <p className="m-0" style={{ color: '#3A3A38' }}>{t('تواصل مع فريق Makers إن كنت تعتقد أن هذا خطأ.', 'Contact the Makers team if you think this is a mistake.')}</p>
        </div>
      )}
    </PageShell>
  )
}

function Step({ state, title, sub }: { state: 'done' | 'current' | 'todo'; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3.5">
      {state === 'done' && (
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: '#111' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
        </span>
      )}
      {state === 'current' && <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ border: '2px solid #2563EB' }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#2563EB' }} /></span>}
      {state === 'todo' && <span className="w-7 h-7 rounded-full" style={{ border: '2px solid #CFCFCB' }} />}
      <span className="flex flex-col">
        <span className="text-[15px]" style={{ fontWeight: state === 'todo' ? 400 : 600, color: state === 'todo' ? '#5C5C59' : undefined }}>{title}</span>
        {sub && <span className="text-[13px]" style={{ color: '#5C5C59' }}>{sub}</span>}
      </span>
    </div>
  )
}
