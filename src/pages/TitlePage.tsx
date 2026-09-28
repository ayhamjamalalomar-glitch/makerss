import { useEffect, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { t, useLang } from '../lib/i18n'
import { SITE_URL } from '../lib/constants'
import { youtubeId } from '../lib/thumbs'
import { displayName, getProject, kindLabel, posterOf, type CreditRow, type Project } from '../lib/data'
import { Btn, Modal, PageShell, PosterFallback, Spinner, VerifiedBadge } from '../components/mk'

const vimeoId = (url: string) => url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/)?.[1] || null

const NOT_DIRECTOR = ['creative', 'art', 'photography', 'casting', 'إبداعي', 'فني', 'تصوير', 'كاستينغ']
const isRole = (c: CreditRow, words: string[]) => !!c.role && words.some((w) => c.role!.toLowerCase().includes(w)) && !(words === DIRECTOR && NOT_DIRECTOR.some((x) => c.role!.toLowerCase().includes(x)))
const DIRECTOR = ['مخرج', 'إخراج', 'director']
const WRITER = ['كاتب', 'كتابة', 'سيناريو', 'writer', 'screenplay', 'script']

function CreditName({ c }: { c: CreditRow }) {
  if (c.profile) return <Link to={`/${c.profile.username}`} className="text-sm hover:underline" style={{ color: '#E85D04' }}>{displayName(c.profile)}</Link>
  return <span className="text-sm" style={{ color: 'var(--c-text)' }}><bdi>{c.display_name}</bdi></span>
}

export default function TitlePage({ id }: { id: string }) {
  useLang()
  const { go } = useRouter()
  const { session } = useAuth()
  const [p, setP] = useState<Project | null | undefined>(undefined)
  const [playing, setPlaying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState<'delete' | 'leave' | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setP(undefined)
    getProject(id).then((x) => {
      setP(x)
      if (x) document.title = `${x.title} | Makers`
    })
    return () => { document.title = 'Makers · دليل صنّاع الإنتاج العرب' }
  }, [id])

  if (p === undefined) return <Spinner />
  if (p === null) {
    return (
      <PageShell narrow>
        <div className="py-20 flex flex-col gap-4 items-start">
          <h1 className="m-0 text-3xl font-bold">{t('المشروع غير موجود', 'Project not found')}</h1>
          <Link to="/projects" className="font-semibold" style={{ color: '#E85D04' }}>{t('كل المشاريع', 'All projects')}</Link>
        </div>
      </PageShell>
    )
  }

  const credits = p.credits || []
  const img = posterOf(p)
  const me = session?.user.id
  const isOwner = me === p.owner_id
  const tagged = !!me && !isOwner && credits.some((c) => c.profile_id === me)
  const director = credits.find((c) => isRole(c, DIRECTOR))
  const writer = credits.find((c) => c !== director && isRole(c, WRITER))
  const rest = credits.filter((c) => c !== director && c !== writer).slice(0, 4)
  const yt = p.url ? youtubeId(p.url) : null
  const vm = p.url ? vimeoId(p.url) : null
  const start = p.url ? Number(p.url.match(/[?&#]t=(\d+)/)?.[1] || 0) : 0
  const embed = yt ? `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0${start ? `&start=${start}` : ''}` : vm ? `https://player.vimeo.com/video/${vm}?autoplay=1` : null
  // Wide frame: a real frame from the video when there is one; otherwise the poster, uncropped, over a blurred copy.
  const frame = yt ? `https://i.ytimg.com/vi/${yt}/maxresdefault.jpg` : p.thumbnail_url && p.thumbnail_url !== p.thumb_url ? p.thumbnail_url : null

  const copy = async () => {
    try { await navigator.clipboard.writeText(`${SITE_URL}/projects/${p.id}`) } catch { /* blocked */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }
  const doDelete = async () => {
    setBusy(true)
    const { error } = await supabase.from('works').delete().eq('id', p.id)
    setBusy(false)
    if (!error) go('/projects')
  }
  const doLeave = async () => {
    setBusy(true)
    await supabase.rpc('remove_my_credit', { p_work: p.id })
    setBusy(false)
    setConfirm(null)
    getProject(id).then(setP)
  }

  const onPlay = () => {
    if (embed) setPlaying(true)
    else if (p.url) window.open(p.url, '_blank', 'noopener')
  }

  const row = (labelText: string, content: React.ReactNode) => (
    <div className="flex items-start gap-4 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
      <span className="font-bold text-sm shrink-0" style={{ width: 90 }}>{labelText}</span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">{content}</div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div style={{ borderBottom: '1px solid var(--c-border)' }}><div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-3 flex items-center justify-between">
        <button onClick={() => (window.history.length > 1 ? window.history.back() : go('/projects'))} className="inline-flex items-center gap-2 text-sm cursor-pointer" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--c-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rtl:-scale-x-100"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          {t('رجوع', 'Back')}
        </button>
        <div className="flex items-center gap-5">
          {credits.length > 0 && <a href="#full-crew" className="text-xs" style={{ color: 'var(--c-muted)' }}>{t('الطاقم الكامل', 'Full crew')}</a>}
          <button onClick={copy} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--c-muted)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" /><path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            {copied ? t('تم نسخ الرابط', 'Link copied') : t('مشاركة', 'Share')}
          </button>
        </div>
      </div></div>

      <div className="relative" style={{ background: '#0D0A08' }}>
        {img && (
          <div className="absolute inset-0 overflow-hidden">
            <img src={img} alt="" className="w-full h-full object-cover" style={{ filter: 'blur(40px) brightness(0.3)', transform: 'scale(1.1)' }} />
          </div>
        )}
        <div className="relative max-w-[1120px] mx-auto w-full px-4 sm:px-8 pt-8">
          <div className="mb-4 pt-4 sm:pt-0">
            <h1 className="font-black leading-none mb-2 mt-0" style={{ fontSize: 'clamp(24px, 4vw, 48px)', letterSpacing: '-0.02em', color: 'white' }}>{p.title}</h1>
            <p className="text-sm m-0" style={{ color: 'rgba(255,255,255,0.6)' }}>{[p.year, kindLabel(p.kind), ...(p.platforms || []).slice(0, 2), p.brand].filter(Boolean).join(' · ')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[27.27fr_72.73fr] gap-3">
            <div className="hidden sm:block relative rounded-xl overflow-hidden" style={{ aspectRatio: '2/3' }}>
              {img ? <img src={img} alt={p.title} className="w-full h-full object-cover" /> : <PosterFallback title={p.title} />}
            </div>
            <div className="relative rounded-xl overflow-hidden w-full" style={{ aspectRatio: '16/9', background: '#161210' }}>
              {playing && embed ? (
                <iframe src={embed} title={p.title} className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ border: 0 }} />
              ) : (
                <button onClick={onPlay} disabled={!p.url} className="absolute inset-0 w-full h-full p-0 group" style={{ border: 'none', background: 'none', cursor: p.url ? 'pointer' : 'default' }}>
                  {frame ? (
                    <img src={frame} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" onError={(e) => { if (yt && !e.currentTarget.src.includes('hqdefault')) e.currentTarget.src = `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` }} />
                  ) : img ? (
                    <>
                      <img src={img} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(28px) brightness(0.45)', transform: 'scale(1.15)' }} />
                      <img src={img} alt="" className="relative h-full mx-auto object-contain" />
                    </>
                  ) : <PosterFallback title="" />}
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
                  {p.url && (
                    <div className="absolute bottom-3 start-4 flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.9)' }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l7 4-7 4V3z" fill="#0D0A08" /></svg>
                      </div>
                      <span className="hidden sm:block text-start">
                        <span className="block font-bold" style={{ fontSize: 14, color: '#fff' }}>{t('شاهد العمل', 'Watch')}</span>
                        <span className="block text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{embed ? t('يعمل هنا مباشرة', 'Plays right here') : t('يفتح في صفحة جديدة', 'Opens in a new tab')}</span>
                      </span>
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-5 pb-5">
            {[kindLabel(p.kind), ...(p.platforms || [])].filter(Boolean).map((x) => (
              <span key={x} className="text-xs px-3 py-1 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.25)', color: '#F5F0EB' }}>{x}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="flex-1 min-w-0">
          {p.description && <p dir="auto" className="leading-relaxed mb-6 mt-0 whitespace-pre-line" style={{ fontSize: 15, color: 'var(--c-text-2)' }}>{p.description}</p>}
          <div style={{ borderTop: '1px solid var(--c-border)' }}>
            {director && row(t('إخراج', 'Director'), <CreditName c={director} />)}
            {writer && row(t('كتابة', 'Writer'), <CreditName c={writer} />)}
            {rest.length > 0 && row(t('الطاقم', 'Crew'), rest.map((c, i) => <span key={c.id} className="flex items-center gap-1"><CreditName c={c} />{i < rest.length - 1 && <span style={{ color: 'var(--c-muted)' }}>·</span>}</span>))}
            {p.owner && row(t('أضافه', 'Added by'), <Link to={`/${p.owner.username}`} className="text-sm hover:underline" style={{ color: '#E85D04' }}>{displayName(p.owner)}</Link>)}
          </div>
        </div>

        <div className="shrink-0 w-full lg:w-72">
          {isOwner && (
            <div className="flex gap-2 mb-4">
              <Link to={`/projects/${p.id}/edit`} className="flex-1 text-center font-bold px-4 py-3 rounded-xl" style={{ background: '#E85D04', color: '#fff', fontSize: 14 }}>{t('تعديل', 'Edit')}</Link>
              <button onClick={() => setConfirm('delete')} className="px-4 py-3 rounded-xl cursor-pointer text-sm" style={{ background: 'transparent', border: '1px solid rgba(248,113,113,0.35)', color: '#F87171' }}>{t('حذف', 'Delete')}</button>
            </div>
          )}
          {tagged && (
            <button onClick={() => setConfirm('leave')} className="w-full mb-4 px-4 py-3 rounded-xl cursor-pointer text-sm" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}>{t('أزل اسمي من هذا المشروع', 'Remove me from this project')}</button>
          )}
          <div className="flex flex-col">
            {[
              [t('صنّاع في الطاقم', 'Makers credited'), String(credits.length)],
              [t('النوع', 'Type'), kindLabel(p.kind)],
              [t('المنصة', 'Platform'), (p.platforms || []).join('، ')],
              [t('السنة', 'Year'), p.year ? String(p.year) : ''],
              [t('العميل / الجهة', 'Brand / studio'), p.brand || ''],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-2.5" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{k}</span>
                <span className="text-xs font-semibold text-end">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {credits.length > 0 && (
        <div id="full-crew" style={{ borderTop: '1px solid var(--c-border)', scrollMarginTop: 70 }}><div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-8">
          <h2 className="font-bold flex items-center gap-2 mt-0 mb-6" style={{ fontSize: 20 }}>
            <span className="inline-block w-1 rounded-full" style={{ background: '#E85D04', height: 22 }} />
            {t('الطاقم الكامل', 'Full crew')}
            <span style={{ color: 'var(--c-muted)' }}>{credits.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            {credits.map((c) => {
              const inner = (
                <>
                  <span className="relative shrink-0">
                    <span className="block rounded-full overflow-hidden" style={{ width: 64, height: 64, border: '2px solid var(--c-border)', background: 'var(--c-surface-alt)' }}>
                      {c.profile?.avatar_url ? <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <span className="w-full h-full flex items-center justify-center font-bold" style={{ color: 'var(--c-muted)', fontSize: 22 }}>{(c.profile ? displayName(c.profile) : c.display_name || '').charAt(0)}</span>}
                    </span>
                    {c.profile?.is_founding && <span className="absolute -bottom-1 -end-1"><VerifiedBadge size={20} /></span>}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold group-hover:text-orange transition-colors mb-0.5" style={{ fontSize: 15 }}><bdi>{c.profile ? displayName(c.profile) : c.display_name}</bdi></span>
                    <span className="block text-sm" style={{ color: 'var(--c-muted)' }}>{c.role}</span>
                    {!c.profile && <span className="block text-[11px] mt-0.5" style={{ color: 'var(--c-muted-2)' }}>{t('ليس عضواً في Makers بعد', 'Not on Makers yet')}</span>}
                  </span>
                </>
              )
              return c.profile ? (
                <Link key={c.id} to={`/${c.profile.username}`} className="flex items-center gap-4 py-5 group" style={{ borderBottom: '1px solid var(--c-border)' }}>{inner}</Link>
              ) : (
                <div key={c.id} className="flex items-center gap-4 py-5" style={{ borderBottom: '1px solid var(--c-border)' }}>{inner}</div>
              )
            })}
          </div>
        </div></div>
      )}

      {confirm && (
        <Modal
          title={confirm === 'delete' ? t('حذف المشروع؟', 'Delete this project?') : t('إزالة اسمك؟', 'Remove your name?')}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <Btn variant={confirm === 'delete' ? 'danger' : 'primary'} disabled={busy} onClick={confirm === 'delete' ? doDelete : doLeave}>{confirm === 'delete' ? t('احذف نهائياً', 'Delete for good') : t('أزل اسمي', 'Remove me')}</Btn>
              <Btn variant="outline" onClick={() => setConfirm(null)}>{t('إلغاء', 'Cancel')}</Btn>
            </>
          }
        >
          <p className="m-0 text-sm" style={{ color: 'var(--c-muted)' }}>
            {confirm === 'delete'
              ? t('سيُحذف المشروع وكل أسماء الطاقم المرتبطة به. لا يمكن التراجع.', 'The project and all its crew credits will be deleted. This cannot be undone.')
              : t('لن يظهر هذا المشروع في صفحتك، ولن يظهر اسمك في طاقمه.', 'This project will leave your page and your name will leave its crew.')}
          </p>
        </Modal>
      )}
    </div>
  )
}
