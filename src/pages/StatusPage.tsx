import { useEffect, useState } from 'react'
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
  const shareText = encodeURIComponent(`صفحتي على Makers: ${link}`)
  const copy = async () => {
    try { await navigator.clipboard.writeText(link) } catch { /* ignore */ }
    setCopied(true)
  }
  const invite = async () => {
    setInviteError(null)
    const { data, error } = await supabase.rpc('create_invite', { p_email: null })
    if (error) return setInviteError('لا توجد دعوات متبقية.')
    setCodes([...codes, data as string])
    refreshProfile()
  }

  return (
    <PageShell narrow>
      {profile.status === 'pending' && (
        <>
          <div className="flex flex-col gap-3 pt-4 md:pt-8">
            <span><Pill tone="blue">قيد المراجعة</Pill></span>
            <h1 className="m-0 text-[30px] md:text-[40px] font-bold" style={{ lineHeight: 1.3 }}>وصلت صفحتك إلى فريق Makers</h1>
            <p className="m-0 text-base" style={{ lineHeight: 1.9, color: '#3A3A38' }}>نراجع كل صفحة بعناية حتى يبقى الدليل موثوقاً. سنرسل لك رسالة على بريدك الإلكتروني فور صدور القرار.</p>
          </div>
          <Card className="px-6 py-6 md:px-8 flex flex-col gap-4">
            <Step state="done" title="أرسلت صفحتك" />
            <Step state="current" title="مراجعة الفريق" sub="نراجع الصفحات حسب ترتيب وصولها" />
            <Step state="todo" title="نشر صفحتك في الدليل" />
          </Card>
          <div className="flex gap-2.5">
            <Link to={profile.username ? `/${profile.username}` : '/me'} className="text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#F3F3F2' }}>معاينة صفحتي</Link>
            <Link to="/me" className="text-sm px-5 py-3 rounded-full" style={{ color: '#2563EB' }}>تعديل الصفحة</Link>
          </div>
        </>
      )}

      {profile.status === 'approved' && (
        <>
          <div className="flex flex-col gap-3 pt-4 md:pt-8">
            <span><Pill tone="green">منشورة</Pill></span>
            <h1 className="m-0 text-[30px] md:text-[40px] font-bold" style={{ lineHeight: 1.3 }}>أهلاً بك في Makers، صفحتك منشورة</h1>
            <p className="m-0 text-base" style={{ lineHeight: 1.9, color: '#3A3A38' }}>
              {profile.is_founding ? 'أنت الآن من الأعضاء المؤسسين. ' : ''}شارك رابط صفحتك في حساباتك حتى يصل إليك أصحاب المشاريع.
            </p>
          </div>
          <Card className="px-5 py-5 md:px-7 md:py-6 flex flex-col gap-3.5">
            <span className="text-[13px] font-semibold">رابط صفحتك</span>
            <div className="flex flex-col md:flex-row gap-2.5">
              <span dir="ltr" className="flex-1 h-[50px] px-5 rounded-full flex items-center mono text-[15px]" style={{ background: '#F7F7F6' }}>{link.replace('https://', '')}</span>
              <Btn onClick={copy}>{copied ? 'تم النسخ' : 'انسخ الرابط'}</Btn>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer" className="text-[13px] px-4 py-2 rounded-full" style={{ border: '1px solid #E3E3E0' }}>مشاركة على واتساب</a>
              <a href={`https://x.com/intent/tweet?text=${shareText}`} target="_blank" rel="noreferrer" className="text-[13px] px-4 py-2 rounded-full" style={{ border: '1px solid #E3E3E0' }}>مشاركة على X</a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer" className="text-[13px] px-4 py-2 rounded-full" style={{ border: '1px solid #E3E3E0' }}>مشاركة على لينكدإن</a>
            </div>
            <span className="text-xs" style={{ color: '#5C5C59' }}>لإنستغرام وتيك توك: الصق الرابط في خانة الرابط داخل البايو.</span>
          </Card>
          <Card className="px-5 py-5 md:px-7 md:py-6 flex flex-col gap-3.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[13px] font-semibold">ادعُ صنّاعاً تثق بعملهم</span>
              <span className="text-xs" style={{ color: '#5C5C59' }}>{profile.invites_remaining > 0 ? `متبقٍّ: ${profile.invites_remaining} من 3` : 'استخدمت كل الدعوات'}</span>
            </div>
            <span className="text-[13px]" style={{ color: '#5C5C59' }}>يمرّ المدعوون بالمراجعة نفسها. أعطِ الرمز لمن تدعوه ليكتبه عند التسجيل.</span>
            <div className="flex flex-wrap gap-2">
              {codes.map((c) => <span key={c} dir="ltr" className="mono text-sm px-4 py-2 rounded-full" style={{ background: '#F3F3F2' }}>{c}</span>)}
              {profile.invites_remaining > 0 && <Btn variant="dashed" onClick={invite} className="!py-2 !px-4 text-[13px]">+ أنشئ رمز دعوة</Btn>}
            </div>
            {inviteError && <span className="text-xs" style={{ color: '#B42318' }}>{inviteError}</span>}
          </Card>
          <div className="flex gap-2.5">
            <Link to={profile.username ? `/${profile.username}` : '/me'} className="text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#F3F3F2' }}>افتح صفحتي</Link>
            <Link to="/" className="text-sm px-5 py-3 rounded-full" style={{ color: '#2563EB' }}>تصفّح الدليل</Link>
          </div>
        </>
      )}

      {profile.status === 'rejected' && (
        <>
          <div className="flex flex-col gap-3 pt-4 md:pt-8">
            <span><Pill tone="red">تحتاج تعديلاً</Pill></span>
            <h1 className="m-0 text-[30px] md:text-[40px] font-bold" style={{ lineHeight: 1.3 }}>لم تُقبل صفحتك هذه المرة</h1>
            <p className="m-0 text-base" style={{ lineHeight: 1.9, color: '#3A3A38' }}>هذا ليس رفضاً نهائياً. عدّل صفحتك حسب ملاحظة الفريق وأرسلها مرة أخرى.</p>
          </div>
          {profile.review_note && (
            <div className="px-6 py-5 md:px-7 rounded-[28px] flex flex-col gap-2" style={{ background: '#FFF8F6', border: '1px solid #F6D6D1' }}>
              <span className="text-[13px] font-semibold" style={{ color: '#B42318' }}>ملاحظة فريق Makers</span>
              <p className="m-0 text-base" style={{ lineHeight: 1.9 }}>{profile.review_note}</p>
            </div>
          )}
          <div className="flex gap-2.5">
            <Link to="/me" className="text-sm font-semibold px-6 py-3 rounded-full" style={{ background: '#2563EB', color: '#fff' }}>عدّل صفحتك</Link>
          </div>
        </>
      )}

      {profile.status === 'suspended' && (
        <div className="flex flex-col gap-3 pt-8">
          <span><Pill>موقوف</Pill></span>
          <h1 className="m-0 text-[30px] font-bold">حسابك موقوف مؤقتاً</h1>
          <p className="m-0" style={{ color: '#3A3A38' }}>تواصل مع فريق Makers إن كنت تعتقد أن هذا خطأ.</p>
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
