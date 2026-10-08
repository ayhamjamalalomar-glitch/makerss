import { useEffect, useRef, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { getLang, t, useLang } from '../lib/i18n'
import { SITE_URL, listSep } from '../lib/constants'
import { youtubeId } from '../lib/thumbs'
import { displayName, getProject, kindLabel, posterOf, type CreditRow, type Project, projectPath } from '../lib/data'
import { Btn, Modal, PageShell, PageSkeleton, PosterFallback, VerifiedBadge } from '../components/mk'
import ReportButton from '../components/ReportButton'
import { RecBadge } from '../components/cine'
import { motion } from 'framer-motion'
import { useDarkHero } from '../lib/hero'
import { track } from '../lib/track'
import { shareLink } from '../lib/share'
import { useToast } from '../lib/toast'

const vimeoId = (url: string) => url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/)?.[1] || null

const NOT_DIRECTOR = ['creative', 'art', 'photography', 'casting', 'إبداعي', 'فني', 'تصوير', 'كاستينغ']
const isRole = (c: CreditRow, words: string[]) => !!c.role && words.some((w) => c.role!.toLowerCase().includes(w)) && !(words === DIRECTOR && NOT_DIRECTOR.some((x) => c.role!.toLowerCase().includes(x)))
const DIRECTOR = ['مخرج', 'إخراج', 'director']
const WRITER = ['كاتب', 'كتابة', 'سيناريو', 'writer', 'screenplay', 'script']

function CreditName({ c }: { c: CreditRow }) {
  if (c.profile) return <Link to={`/${c.profile.username}`} className="text-sm hover:underline" style={{ color: 'var(--c-accent)' }}>{displayName(c.profile)}</Link>
  return <span className="text-sm" style={{ color: 'var(--c-text)' }}><bdi>{c.display_name}</bdi></span>
}

export default function TitlePage({ id }: { id: string }) {
  useLang()
  const { go } = useRouter()
  const { session } = useAuth()
  const [p, setP] = useState<Project | null | undefined>(undefined)
  const [playing, setPlaying] = useState(false)
  const toast = useToast()
  useDarkHero(!!p)
  const [confirm, setConfirm] = useState<'delete' | 'leave' | null>(null)
  const [busy, setBusy] = useState(false)
  // The Makers player (public/player.html) talks to this page: first play, and full screen on iPhone Safari.
  const [fullScreen, setFullScreen] = useState(false)
  const playerRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== playerRef.current?.contentWindow) return
      const d = e.data as { mk?: string; type?: string; on?: boolean }
      if (d?.mk !== 'player') return
      if (d.type === 'play') track('project', id, 'work')
      if (d.type === 'fullscreen') setFullScreen(!!d.on)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setFullScreen(false)
      playerRef.current?.contentWindow?.postMessage({ mk: 'player-cmd', cmd: 'fsOff' }, window.location.origin)
    }
    window.addEventListener('message', onMsg)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('message', onMsg); window.removeEventListener('keydown', onKey) }
  }, [id])

  useEffect(() => {
    setP(undefined)
    getProject(id).then((x) => {
      setP(x)
      if (x) {
        document.title = `${x.title} | Makers`
        // Show the short link in the address bar so a copied link is makerss.net/al-nahham.
        if (x.slug && window.location.pathname !== `/${x.slug}` && /^\/projects\/[0-9a-f-]{36}$/i.test(window.location.pathname)) window.history.replaceState(window.history.state, '', `/${x.slug}${window.location.search}`)
        track('project', x.id, 'view')
      }
    })
    return () => { document.title = 'Makers · دليل صنّاع الإنتاج العرب' }
  }, [id])

  if (p === undefined) return <PageSkeleton />
  if (p === null) {
    return (
      <PageShell narrow>
        <div className="py-20 flex flex-col gap-4 items-start">
          <h1 className="m-0 text-3xl font-bold">{t('المشروع غير موجود', 'Project not found')}</h1>
          <Link to="/projects" className="font-semibold" style={{ color: 'var(--c-accent)' }}>{t('كل المشاريع', 'All projects')}</Link>
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
  // YouTube plays in the Makers player (no YouTube title, channel or logo). Vimeo keeps its own player, stripped of title and byline.
  const makersPlayer = yt ? `/player.html?v=${yt}${start ? `&t=${start}` : ''}&lang=${getLang()}` : null
  const embed = vm ? `https://player.vimeo.com/video/${vm}?autoplay=1&title=0&byline=0&portrait=0&badge=0&dnt=1` : null
  // Wide frame: a real frame from the video when there is one; otherwise the poster, uncropped, over a blurred copy.
  const frame = yt ? `https://i.ytimg.com/vi/${yt}/maxresdefault.jpg` : p.thumbnail_url && p.thumbnail_url !== p.thumb_url ? p.thumbnail_url : null

  const copy = async () => {
    track('project', p.id, 'share')
    const r = await shareLink(`${SITE_URL}${projectPath(p)}`, `${p.title} | Makers`)
    if (r === 'copied') toast(t('تم نسخ الرابط', 'Link copied'))
    else if (r === 'failed') toast(t('تعذّر نسخ الرابط', 'Could not copy the link'), 'error')
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
    track('project', p.id, 'work')
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
      <div className="relative -mt-16" style={{ background: 'var(--h-bg)', color: 'var(--h-ink)' }}>
        {img && (
          <div className="absolute inset-0 overflow-hidden">
            <img src={img} alt="" aria-hidden="true" className="mk-hero-blur w-full h-full object-cover" style={{ filter: 'blur(44px) saturate(0.8) brightness(0.32)', transform: 'scale(1.15)' }} />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(var(--h-veil-rgb),0.4), rgba(var(--h-veil-rgb),0.2) 50%, rgba(var(--h-veil-rgb),0.85))' }} />
        <div className="relative max-w-[1120px] mx-auto w-full px-4 sm:px-8 pt-24">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => (window.history.length > 1 ? window.history.back() : go('/projects'))} className="inline-flex items-center gap-2 text-sm cursor-pointer hover:opacity-80" style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(var(--h-ink-rgb),0.7)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rtl:-scale-x-100" aria-hidden="true"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              {t('رجوع', 'Back')}
            </button>
            <div className="flex items-center gap-5 text-[13px]">
              {credits.length > 0 && <a href="#full-crew" className="hover:opacity-80" style={{ color: 'rgba(var(--h-ink-rgb),0.7)' }}>{t('الطاقم الكامل', 'Full crew')}</a>}
              <button onClick={copy} className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80" style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(var(--h-ink-rgb),0.7)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 10V2M5 5l3-3 3 3M3 9v4a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t('مشاركة', 'Share')}
              </button>
              <span className="hidden sm:inline"><RecBadge light /></span>
            </div>
          </div>
          <div className="mb-6 flex flex-col gap-2">
            {p.kind && <span className="text-[14px] font-medium" style={{ color: 'var(--c-accent)' }}>{kindLabel(p.kind)}</span>}
            <h1 className="font-display font-black m-0" style={{ fontSize: 'clamp(30px, 5.4vw, 68px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--h-ink)' }}>{p.title}</h1>
            <p className="font-mono text-[12.5px] m-0" style={{ color: 'rgba(var(--h-ink-rgb),0.6)' }}>{[p.year, ...(p.platforms || []).slice(0, 2), p.brand].filter(Boolean).join('  ·  ')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[27.27fr_72.73fr] gap-3">
            <div className="hidden sm:block relative rounded-xl overflow-hidden" style={{ aspectRatio: '2/3' }}>
              {img ? <img src={img} alt={p.title} className="w-full h-full object-cover" /> : <PosterFallback title={p.title} />}
            </div>
            <div className="relative rounded-xl overflow-hidden w-full" style={fullScreen ? { position: 'fixed', inset: 0, zIndex: 200, borderRadius: 0, background: '#000' } : { aspectRatio: '16/9', background: '#161210' }}>
              {makersPlayer ? (
                <iframe ref={playerRef} src={makersPlayer} title={p.title} className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ border: 0 }} />
              ) : playing && embed ? (
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
              <span key={x} className="text-xs px-3 py-1 rounded-full" style={{ border: '1px solid rgba(var(--h-ink-rgb),0.25)', color: 'var(--h-ink)' }}>{x}</span>
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
            {p.owner && row(t('أضافه', 'Added by'), <Link to={`/${p.owner.username}`} className="text-sm hover:underline" style={{ color: 'var(--c-accent)' }}>{displayName(p.owner)}</Link>)}
          </div>
        </div>

        <div className="shrink-0 w-full lg:w-72">
          {isOwner && (
            <div className="flex gap-2 mb-4">
              <Link to={`/projects/${p.id}/edit`} className="flex-1 text-center font-bold px-4 py-3 rounded-xl" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)', fontSize: 14 }}>{t('تعديل', 'Edit')}</Link>
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
              [t('المنصة', 'Platform'), (p.platforms || []).join(listSep())],
              [t('السنة', 'Year'), p.year ? String(p.year) : ''],
              [t('العميل / الجهة', 'Brand / studio'), p.brand || ''],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-2.5" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{k}</span>
                <span className="text-xs font-semibold text-end">{v}</span>
              </div>
            ))}
          </div>
          {!isOwner && <div className="mt-4"><ReportButton type="project" id={p.id} /></div>}
        </div>
      </div>

      {credits.length > 0 && (
        <div id="full-crew" style={{ borderTop: '1px solid var(--c-border)', scrollMarginTop: 70, background: 'var(--h-bg)', color: 'var(--h-ink)' }}>
          <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-16 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-10 md:gap-16 items-start">
            <div className="flex flex-col gap-2 md:sticky md:top-24">
              <h2 className="font-display font-bold m-0" style={{ fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.15 }}>{t('الطاقم الكامل', 'Full crew')}</h2>
              <span className="text-[13px]" style={{ color: 'rgba(var(--h-ink-rgb),0.5)' }}>{t(`${credits.length} في الطاقم`, `${credits.length} credited`)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {credits.map((c, i) => {
                const name = c.profile ? displayName(c.profile) : c.display_name
                const card = (
                  <>
                    <span className="relative shrink-0 w-14 h-14 rounded-full overflow-hidden" style={{ background: 'rgba(var(--h-ink-rgb),0.08)', border: '1px solid rgba(var(--h-ink-rgb),0.12)' }}>
                      {c.profile?.avatar_url ? <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" /> : <span className="w-full h-full flex items-center justify-center text-[18px] font-bold" style={{ color: 'rgba(var(--h-ink-rgb),0.5)' }}>{(name || '').charAt(0)}</span>}
                    </span>
                    <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="font-display font-semibold text-[16px] truncate transition-colors group-hover:text-[color:var(--c-accent)]"><bdi>{name}</bdi></span>
                        {c.profile?.is_founding && <VerifiedBadge size={15} />}
                      </span>
                      <span className="text-[13px] truncate" style={{ color: 'rgba(var(--h-ink-rgb),0.55)' }}>{c.role || t('الطاقم', 'Crew')}</span>
                      {!c.profile && <span className="text-[11px]" style={{ color: 'rgba(var(--h-ink-rgb),0.4)' }}>{t('ليس على Makers بعد', 'Not on Makers yet')}</span>}
                    </span>
                  </>
                )
                const cls = 'group flex items-center gap-4 p-4 rounded-2xl transition-colors'
                const style = { background: 'rgba(var(--h-ink-rgb),0.04)', border: '1px solid rgba(var(--h-ink-rgb),0.08)' }
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: Math.min(i, 10) * 0.05 }}>
                    {c.profile ? <Link to={`/${c.profile.username}`} className={`${cls} hover:border-[color:var(--c-accent)]`} style={style}>{card}</Link> : <div className={cls} style={style}>{card}</div>}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
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
