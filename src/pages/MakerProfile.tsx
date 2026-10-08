import { useEffect, useMemo, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Award, type Profile } from '../lib/supabase'
import { COUNTRIES, SITE_URL, cityLabel, contentLabel, listSep, videoLengthLabel } from '../lib/constants'
import { label, t, useLang } from '../lib/i18n'
import { useSpecialties, specName, isCreator } from '../lib/specialties'
import { useAuth } from '../lib/auth'
import { displayName, formatFollowers, kindLabel, posterOf, projectPath, projectsForMember, roleOn, totalFollowers, type MemberCard, type Project } from '../lib/data'
import ContactForm from '../components/ContactForm'
import ReportButton from '../components/ReportButton'
import { track } from '../lib/track'
import { shareLink } from '../lib/share'
import { useToast } from '../lib/toast'
import { Btn, Corners, Modal, Notice, PageShell, PosterFallback, SectionHeader, Skeleton, TextArea, VerifiedBadge } from '../components/mk'
import { RecBadge } from '../components/cine'
import { useDarkHero } from '../lib/hero'
import { motion } from 'framer-motion'
import TitlePage from './TitlePage'
import { WritingCard } from '../components/writing'
import { useIsWriter, listWritings, type Writing } from '../lib/writings'

const SOCIAL_LABEL: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', snapchat: 'Snapchat', facebook: 'Facebook', linkedin: 'LinkedIn', vimeo: 'Vimeo', behance: 'Behance', website: 'Website' }

function socialHref(key: string, v: string) {
  if (/^https?:\/\//i.test(v)) return v
  const h = v.replace(/^@/, '')
  const base: Record<string, string> = { instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/@', youtube: 'https://youtube.com/@', x: 'https://x.com/', snapchat: 'https://snapchat.com/add/', facebook: 'https://facebook.com/', vimeo: 'https://vimeo.com/', behance: 'https://behance.net/' }
  return base[key] ? base[key] + h : null
}

type Tab = 'overview' | 'credits' | 'writing' | 'about'

const box = { background: 'var(--c-surface)', border: '1px solid var(--c-border)' } as const
const eyebrow = { letterSpacing: '0.12em', fontWeight: 600, fontSize: 11, color: 'var(--c-muted)', textTransform: 'uppercase' } as const

export default function MakerProfile({ username }: { username: string }) {
  useLang()
  const specialties = useSpecialties()
  const { session, profile: viewer } = useAuth()
  const { go } = useRouter()
  const [p, setP] = useState<Profile | null | undefined>(undefined)
  const [projects, setProjects] = useState<Project[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [contactOpen, setContactOpen] = useState(false)
  const [msgBusy, setMsgBusy] = useState(false)
  const toast = useToast()
  const [tab, setTab] = useState<Tab>(() => (new URLSearchParams(window.location.search).get('tab') === 'writing' ? 'writing' : 'overview'))
  const [writings, setWritings] = useState<Writing[]>([])
  const viewerWriter = useIsWriter()
  const [pickOpen, setPickOpen] = useState(false)
  const [pick, setPick] = useState<string[]>([])
  const [aboutOpen, setAboutOpen] = useState(false)
  const [aboutDraft, setAboutDraft] = useState('')
  const [saving, setSaving] = useState(false)
  // makerss.net/<name> is a member, or else a project's short link (makerss.net/al-nahham).
  const [workId, setWorkId] = useState<string | null>(null)
  useDarkHero(p !== undefined && p !== null)

  useEffect(() => {
    setP(undefined)
    setWorkId(null)
    supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).ilike('username', username).maybeSingle().then(async ({ data }) => {
      const prof = (data as unknown as Profile) || null
      if (!prof) {
        const { data: w } = await supabase.from('works').select('id').eq('slug', username.toLowerCase()).maybeSingle()
        if (w) return setWorkId((w as { id: string }).id)
      }
      setP(prof)
      if (!prof) return
      document.title = `${prof.full_name} | Makers`
      if (prof.status === 'approved') track('profile', prof.id, 'view')
      const [list, a, ws] = await Promise.all([
        projectsForMember(prof.id),
        supabase.from('awards').select('*').eq('owner_id', prof.id).order('year', { ascending: false }),
        // The owner also sees their own writings in review; everyone else sees published ones.
        (async () => { const { data: { session: s } } = await supabase.auth.getSession(); return listWritings({ owner: prof.id, all: s?.user.id === prof.id, limit: 100 }).catch(() => [] as Writing[]) })(),
      ])
      setProjects(list)
      setWritings(ws)
      setAwards((a.data as Award[]) || [])
    })
    return () => { document.title = 'Makers · دليل صنّاع الإنتاج العرب' }
  }, [username])

  const workedWith = useMemo(() => {
    if (!p) return []
    const map = new Map<string, MemberCard>()
    for (const pr of projects) {
      if (pr.owner && pr.owner.id !== p.id && pr.owner.status === 'approved') map.set(pr.owner.id, pr.owner)
      for (const c of pr.credits || []) if (c.profile && c.profile.id !== p.id) map.set(c.profile.id, c.profile)
    }
    return [...map.values()].slice(0, 8)
  }, [projects, p])

  if (workId) return <TitlePage id={workId} />

  if (p === undefined) {
    return (
      <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 pt-10 flex flex-col sm:flex-row gap-7" aria-busy="true">
        <Skeleton className="w-full sm:w-[180px] h-[240px] rounded-2xl shrink-0" />
        <div className="flex-1 flex flex-col gap-3 pt-2">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-9 w-64 rounded-full mt-4" />
        </div>
      </div>
    )
  }
  if (p === null) {
    return (
      <PageShell narrow>
        <div className="py-20 flex flex-col gap-4 items-start">
          <h1 className="m-0 text-3xl font-bold">{t('الصفحة غير موجودة', 'Page not found')}</h1>
          <p className="m-0" style={{ color: 'var(--c-muted)' }}>{t('ربما تغيّر الرابط أو لم تُنشر الصفحة بعد.', 'The link may have changed, or the page is not published yet.')}</p>
          <Link to="/makers" className="font-semibold" style={{ color: 'var(--c-accent)' }}>{t('تصفّح الصنّاع', 'Browse makers')}</Link>
        </div>
      </PageShell>
    )
  }

  const isOwner = session?.user.id === p.id
  const canMessage = !isOwner && viewer?.status === 'approved' && p.status === 'approved'
  const creator = isCreator(p)
  const specs = creator ? [] : (p.specialty_ids || []).map((id) => ({ id, name: specName(specialties, id) })).filter((s) => s.name)
  const kinds = creator ? (p.content_types || []).map((k) => ({ key: k, name: contentLabel(k) })).filter((k) => k.name) : []
  const audience = totalFollowers(p)
  const place = [cityLabel(p.city), label(COUNTRIES, p.country)].filter(Boolean).join(t('، ', ', '))
  const vlen = videoLengthLabel(p.video_length)
  const followers = Object.entries(p.followers || {}).filter(([, n]) => Number(n) > 0)
  const socials: [string, string][] = [
    ...Object.entries(p.socials || {}).filter(([, v]) => v),
    ...followers.filter(([k]) => !(p.socials || {})[k]).map(([k]) => [k, ''] as [string, string]),
  ]
  const altName = p.full_name && p.name_ar && p.full_name.trim() !== p.name_ar.trim() ? t(p.full_name, p.name_ar) : ''
  const featuredIds = (p.featured_work_ids || []).filter((id) => projects.some((x) => x.id === id))
  const featured = (featuredIds.length ? featuredIds.map((id) => projects.find((x) => x.id === id)!) : projects).slice(0, 5)
  const badges = [
    p.is_founding && { key: 'f', icon: '★', title: t('عضو مؤسس', 'Founding member'), sub: t('من أوائل صنّاع Makers', 'Among the first on Makers'), accent: true },
    p.status === 'approved' && { key: 'v', icon: '✓', title: t('ملف موثّق', 'Reviewed profile'), sub: t('راجعه فريق Makers', 'Reviewed by the Makers team') },
    creator && audience > 0 && { key: 'aud', icon: '📣', title: t(`${formatFollowers(audience)} متابع`, `${formatFollowers(audience)} followers`), sub: t('على كل المنصات', 'across platforms') },
    projects.length > 0 && { key: 'w', icon: '🎬', title: t(`${projects.length} عمل`, `${projects.length} credit${projects.length === 1 ? '' : 's'}`), sub: t('على Makers', 'on Makers') },
    awards.length > 0 && { key: 'a', icon: '🏆', title: t(`${awards.length} جائزة`, `${awards.length} award${awards.length === 1 ? '' : 's'}`), sub: awards[0]?.org || '' },
    p.available && { key: 'av', icon: '●', title: t('متاح للعمل', 'Available for work'), sub: '' },
  ].filter(Boolean) as { key: string; icon: string; title: string; sub: string; accent?: boolean }[]
  const backdrop = p.avatar_url || (projects[0] ? posterOf(projects[0]) : null)
  const slate: [string, string][] = [
    [creator ? t('المتابعون', 'Followers') : t('الأعمال', 'Credits'), creator ? formatFollowers(audience) : String(projects.length)],
    [creator ? t('يصنع المحتوى منذ', 'Creating since') : t('في المجال منذ', 'Working since'), p.start_year ? String(p.start_year) : '·'],
    [t('المكان', 'Based in'), place || '·'],
    [t('الحالة', 'Status'), p.available ? t('متاح للعمل', 'Available') : t('غير متاح', 'Busy')],
  ]
  const saveProfile = async (patch: Partial<Profile>) => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update(patch).eq('id', p.id)
    setSaving(false)
    if (!error) setP({ ...p, ...patch })
  }

  const startChat = async () => {
    track('profile', p.id, 'message')
    setMsgBusy(true)
    const { data, error } = await supabase.rpc('start_conversation', { p_other: p.id })
    setMsgBusy(false)
    if (!error && data) go(`/messages?c=${data}`)
  }
  const copy = async () => {
    track('profile', p.id, 'share')
    const r = await shareLink(`${SITE_URL}/${p.username}`, `${displayName(p)} | Makers`)
    if (r === 'copied') toast(t('تم نسخ الرابط', 'Link copied'))
    else if (r === 'failed') toast(t('تعذّر نسخ الرابط', 'Could not copy the link'), 'error')
  }

  return (
    <div className="min-h-screen">
      {/* HERO: opening titles */}
      <section className="relative -mt-16 overflow-hidden" style={{ background: 'var(--h-bg)', color: 'var(--h-ink)' }}>
        {backdrop && <img src={backdrop} alt="" aria-hidden="true" className="mk-hero-blur absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(48px) saturate(0.7) brightness(0.45)', transform: 'scale(1.2)' }} />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(var(--h-veil-rgb),0.55), rgba(var(--h-veil-rgb),0.7) 60%, var(--h-bg))' }} />
        <div className="relative max-w-[1120px] mx-auto w-full px-4 sm:px-8 pt-24 pb-10">
          {p.status !== 'approved' && isOwner && (
            <div className="mb-5"><Notice>{t('هذه معاينة لصفحتك. لن تظهر للزوار قبل موافقة فريق Makers.', 'This is a preview of your page. Visitors will see it once the Makers team approves it.')} <Link to="/me" className="font-semibold underline">{t('عد إلى التعديل', 'Back to editing')}</Link></Notice></div>
          )}
          <div className="flex items-center justify-between mb-8">
            <Link to="/makers" className="inline-flex items-center gap-2 text-sm hover:opacity-80" style={{ color: 'rgba(var(--h-ink-rgb),0.7)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rtl:-scale-x-100" aria-hidden="true"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              {t('كل الصنّاع', 'All makers')}
            </Link>
            <RecBadge light />
          </div>

          <div className="flex flex-col sm:flex-row gap-7 sm:gap-10 items-start sm:items-end">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }} className="relative shrink-0 w-[200px] sm:w-[230px] rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4', background: 'var(--c-surface-alt)', boxShadow: '0 30px 80px var(--c-shadow)' }}>
              {p.avatar_url ? <img src={p.avatar_url} alt={displayName(p)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-display font-black" style={{ fontSize: 72, color: 'var(--c-muted-2)' }}>{displayName(p).charAt(0)}</div>}
              <Corners size={16} inset={10} color="rgba(243,239,231,0.7)" w={1.5} />
              {p.is_founding && (
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>
                  <svg width="9" height="9" viewBox="0 0 8 8" fill="none" aria-hidden="true"><path d="M1.5 4L3 5.5L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  {t('عضو مؤسس', 'Founding member')}
                </div>
              )}
            </motion.div>

            <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="m-0 text-[15px] font-medium" style={{ color: 'var(--c-accent)' }}>
                {creator
                  ? [t('صانع محتوى', 'Content creator'), ...kinds.map((k) => k.name)].join(' · ')
                  : specs.map((s) => s.name).concat(p.other_specialty ? [p.other_specialty] : []).join(' · ')}
              </motion.p>
              <h1 className="font-display font-black m-0" style={{ fontSize: 'clamp(34px, 5.6vw, 70px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                <motion.span className="inline-flex items-center gap-3 flex-wrap" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}>
                  {displayName(p)}
                  {p.is_founding && <VerifiedBadge size={30} title={t('عضو مؤسس', 'Founding member')} />}
                </motion.span>
              </h1>
              {altName && <p className="m-0 -mt-2 text-[15px]" style={{ color: 'rgba(var(--h-ink-rgb),0.6)' }}><bdi>{altName}</bdi></p>}

              {/* the slate: facts in cells, like a clapperboard */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 rounded-xl overflow-hidden mt-2" style={{ border: '1px solid rgba(var(--h-ink-rgb),0.16)', background: 'rgba(var(--h-veil-rgb),0.35)', backdropFilter: 'blur(8px)' }}>
                {slate.map(([k, v], i) => (
                  <div key={k} className="flex flex-col gap-1 px-4 py-3" style={{ borderInlineStart: i % 2 ? '1px solid rgba(var(--h-ink-rgb),0.16)' : undefined, borderTop: i > 1 ? '1px solid rgba(var(--h-ink-rgb),0.16)' : undefined }}>
                    <span className="text-[11px]" style={{ color: 'rgba(var(--h-ink-rgb),0.5)' }}>{k}</span>
                    <span className="font-display font-semibold text-[15px] truncate flex items-center gap-2">
                      {i === 3 && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.available ? 'var(--c-live)' : 'rgba(var(--h-ink-rgb),0.35)', boxShadow: p.available ? '0 0 10px var(--c-live)' : 'none' }} />}
                      {v}
                    </span>
                  </div>
                ))}
              </motion.div>

              <div className="flex flex-wrap gap-2 mt-1">
                {isOwner ? (
                  <>
                    <Link to="/me" className="font-semibold px-5 rounded-full inline-flex items-center hover:brightness-110" style={{ height: 44, background: 'var(--c-accent)', color: 'var(--c-on-accent)', fontSize: 14 }}>{t('تعديل الملف الشخصي', 'Edit profile')}</Link>
                    {p.status === 'approved' && <Link to="/projects/new" className="font-semibold px-5 rounded-full inline-flex items-center" style={{ height: 44, border: '1px solid rgba(var(--h-ink-rgb),0.3)', fontSize: 14 }}>{t('+ أضف مشروعاً', '+ Add a project')}</Link>}
                  </>
                ) : p.status === 'approved' && (
                  <button onClick={() => { track('profile', p.id, 'contact'); setContactOpen(true) }} className="font-semibold px-6 rounded-full hover:brightness-110 cursor-pointer" style={{ height: 44, background: 'var(--c-accent)', border: 'none', color: 'var(--c-on-accent)', fontSize: 14 }}>{t('اطلب تعاوناً', 'Request collaboration')}</button>
                )}
                {canMessage && (
                  <button onClick={startChat} disabled={msgBusy} className="font-semibold px-5 rounded-full cursor-pointer disabled:opacity-60 hover:bg-white/10" style={{ height: 44, background: 'transparent', border: '1px solid rgba(var(--h-ink-rgb),0.3)', color: 'var(--h-ink)', fontSize: 14 }}>{t('راسِل', 'Message')}</button>
                )}
                <button onClick={copy} className="font-semibold px-5 rounded-full cursor-pointer inline-flex items-center gap-2 hover:bg-white/10" style={{ height: 44, background: 'transparent', border: '1px solid rgba(var(--h-ink-rgb),0.18)', color: 'rgba(var(--h-ink-rgb),0.8)', fontSize: 14 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 10V2M5 5l3-3 3 3M3 9v4a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {t('شارك الصفحة', 'Share page')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-[1120px] mx-auto w-full px-4 sm:px-8">
          <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" style={{ borderBottom: '1px solid var(--c-border)' }}>
            {([['overview', t('نظرة عامة', 'Overview')], ['credits', t(`الأعمال (${projects.length})`, `Credits (${projects.length})`)], ...(writings.length || (isOwner && viewerWriter) ? [['writing', t(`كتابات (${writings.length})`, `Writing (${writings.length})`)]] : []), ['about', t('نبذة', 'About')]] as [Tab, string][]).map(([id, text]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className="font-medium px-5 py-3.5 relative cursor-pointer shrink-0 transition-colors" style={{ background: 'none', border: 'none', color: tab === id ? 'var(--c-text)' : 'var(--c-muted)', fontSize: 14 }}>
                {text}
                {tab === id && <motion.div layoutId="profile-tab" className="absolute bottom-0 inset-x-3 h-[2px] rounded-full" style={{ background: 'var(--c-accent)' }} />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="flex-1 min-w-0 w-full flex flex-col gap-10">
            {tab === 'overview' && (
              <>
                {badges.length > 0 && (
                  <section>
                    <SectionHeader title={t('الشارات', 'Badges')} />
                    <div className="flex flex-wrap gap-2.5">
                      {badges.map((b) => (
                        <span key={b.key} className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ ...box, borderInlineStart: b.accent ? '3px solid var(--c-accent)' : undefined }}>
                          <span style={{ fontSize: 16 }}>{b.icon}</span>
                          <span className="flex flex-col">
                            <span className="font-bold" style={{ fontSize: 13 }}>{b.title}</span>
                            {b.sub && <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{b.sub}</span>}
                          </span>
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <SectionHeader
                    title={t('أعمال مختارة', 'Featured work')}
                    action={isOwner && projects.length > 0 ? <button onClick={() => { setPick(featuredIds); setPickOpen(true) }} className="text-xs font-semibold cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--c-accent)' }}>{t('اختر أعمالك المميزة', 'Choose featured work')}</button> : undefined}
                  />
                  {projects.length === 0 ? (
                    <div className="rounded-xl p-6 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ ...box, borderStyle: 'dashed' }}>
                      <span style={{ color: 'var(--c-muted)' }}>{isOwner ? t('أضف أول مشروع لك ليظهر هنا وفي صفحة المشاريع.', 'Add your first project to show it here and on the projects page.') : t('لم تُضف مشاريع بعد.', 'No projects added yet.')}</span>
                      {isOwner && p.status === 'approved' && <Link to="/projects/new" className="font-bold px-4 py-2 rounded-full self-start" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)', fontSize: 13 }}>{t('أضف مشروعاً', 'Add a project')}</Link>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {featured.map((pr) => {
                        const img = posterOf(pr)
                        return (
                          <Link key={pr.id} to={projectPath(pr)} onClick={() => track('profile', p.id, 'work')} className="flex gap-3 p-3 rounded-xl group" style={box}>
                            <div className="shrink-0 rounded-lg overflow-hidden" style={{ width: 72, height: 96 }}>
                              {img ? <img src={img} alt={pr.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <PosterFallback title="" />}
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                              <p className="font-bold group-hover:text-orange transition-colors leading-tight mb-1 mt-0" style={{ fontSize: 14 }}>{pr.title}</p>
                              <p className="m-0" style={{ fontSize: 12, color: 'var(--c-accent)' }}>{roleOn(pr, p.id)}</p>
                              <p className="m-0" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{[pr.year, kindLabel(pr.kind), pr.brand].filter(Boolean).join(' · ')}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                  {projects.length > featured.length && (
                    <button onClick={() => setTab('credits')} className="mt-4 text-sm font-semibold cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--c-accent)', padding: 0 }}>{t(`كل الأعمال (${projects.length})`, `All ${projects.length} credits`)}</button>
                  )}
                </section>

                {awards.length > 0 && (
                  <section>
                    <SectionHeader title={t('الجوائز والاعتمادات', 'Awards & recognition')} />
                    <div className="rounded-xl overflow-hidden" style={box}>
                      {awards.map((a, i) => (
                        <div key={a.id} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < awards.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                          <span className="font-semibold" style={{ fontSize: 14 }}>{a.rank}</span>
                          <span className="flex-1 text-sm" style={{ color: 'var(--c-muted)' }}>{a.org}</span>
                          <span className="text-xs" style={{ color: 'var(--c-muted-2)' }}>{a.year || ''}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {tab === 'credits' && (
              <section>
                <SectionHeader title={t('كل الأعمال', 'All credits')} count={projects.length} action={isOwner && p.status === 'approved' ? <Link to="/projects/new" className="text-xs font-semibold" style={{ color: 'var(--c-accent)' }}>{t('+ أضف مشروعاً', '+ Add a project')}</Link> : undefined} />
                {projects.length === 0 ? (
                  <div className="rounded-xl p-6 text-sm" style={{ ...box, borderStyle: 'dashed', color: 'var(--c-muted)' }}>{t('لم تُضف مشاريع بعد.', 'No projects added yet.')}</div>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                    {projects.map((pr) => {
                      const img = posterOf(pr)
                      return (
                        <Link key={pr.id} to={projectPath(pr)} onClick={() => track('profile', p.id, 'work')} className="group">
                          <div className="relative rounded-xl overflow-hidden mb-2" style={{ aspectRatio: '2/3', background: 'var(--c-surface)' }}>
                            {img ? <img src={img} alt={pr.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <PosterFallback title={pr.title} />}
                            {p.featured_work_ids?.includes(pr.id) && <span className="absolute top-2 start-2 px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)', fontSize: 9 }}>{t('مختار', 'Featured')}</span>}
                          </div>
                          <p className="font-bold m-0 leading-tight group-hover:text-orange transition-colors" style={{ fontSize: 13 }}>{pr.title}</p>
                          <p className="m-0 truncate" style={{ fontSize: 11, color: 'var(--c-accent)' }}>{roleOn(pr, p.id)}</p>
                          <p className="m-0 truncate" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{[pr.year, kindLabel(pr.kind)].filter(Boolean).join(' · ')}</p>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {tab === 'writing' && (
              <section>
                <SectionHeader title={t('كتابات', 'Writing')} count={writings.length} action={isOwner && viewerWriter ? <Link to="/writing/new" className="text-xs font-semibold" style={{ color: 'var(--c-accent)' }}>{t('+ اكتب', '+ Write')}</Link> : undefined} />
                {writings.length === 0 ? (
                  <div className="rounded-xl p-6 text-sm" style={{ ...box, borderStyle: 'dashed', color: 'var(--c-muted)' }}>{t('لم تنشر كتابات بعد. مقال، سيناريو منجز، أو ستوري بورد.', 'No writing yet. An article, a finished script, or a storyboard.')}</div>
                ) : (
                  <div className="grid gap-x-4 gap-y-7" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
                    {writings.map((w) => <WritingCard key={w.id} w={w} showStatus={isOwner} />)}
                  </div>
                )}
              </section>
            )}

            {tab === 'about' && (
              <section>
                <SectionHeader title={t('نبذة', 'About')} action={isOwner ? <button onClick={() => { setAboutDraft(p.about || p.bio || ''); setAboutOpen(true) }} className="text-xs font-semibold cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--c-accent)' }}>{t('عدّل النبذة', 'Edit about')}</button> : undefined} />
                <div className="rounded-2xl p-6 md:p-8 flex flex-col gap-6" style={box}>
                  {p.about || p.bio ? (
                    <p dir="auto" className="m-0 whitespace-pre-line" style={{ fontSize: 16, lineHeight: 2, color: 'var(--c-text-2)' }}>{p.about || p.bio}</p>
                  ) : (
                    <p className="m-0 text-sm" style={{ color: 'var(--c-muted)' }}>{isOwner ? t('اكتب قصتك: من أنت، ماذا صنعت، وما الذي يميّز شغلك.', 'Tell your story: who you are, what you have made, and what sets your work apart.') : t('لا توجد نبذة بعد.', 'No bio yet.')}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5" style={{ borderTop: '1px solid var(--c-border)' }}>
                    {[
                      creator
                        ? [t('نوع المحتوى', 'Content'), kinds.map((k) => k.name).join(listSep())]
                        : [t('التخصص', 'Specialty'), specs.map((x) => x.name).join(listSep()) || p.other_specialty || ''],
                      [t('المكان', 'Based in'), place],
                      [creator ? t('يصنع المحتوى منذ', 'Creating since') : t('في المجال منذ', 'Working since'), p.start_year ? String(p.start_year) : ''],
                      [t('نوع المحتوى', 'Format'), vlen || ''],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-1">
                        <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{k}</span>
                        <span className="font-semibold" style={{ fontSize: 13 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="w-full lg:w-[260px] shrink-0 flex flex-col gap-5">
            <div className="p-4 rounded-2xl" style={box}>
              <p className="mt-0 mb-3" style={eyebrow}>{t('نبذة', 'About')}</p>
              {p.bio || p.about ? (
                <>
                  <p dir="auto" className="m-0 leading-relaxed" style={{ color: 'var(--c-text-2)', fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.bio || p.about}</p>
                  <button onClick={() => setTab('about')} className="mt-1.5 text-xs font-semibold cursor-pointer" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--c-accent)' }}>{t('اقرأ المزيد', 'Read more')}</button>
                </>
              ) : <p className="m-0 text-sm" style={{ color: 'var(--c-muted)' }}>{t('لا توجد نبذة بعد.', 'No bio yet.')}</p>}
              {place && <p className="mb-0 mt-3" style={{ fontSize: 12, color: 'var(--c-muted)' }}>{place}</p>}
            </div>
            {(followers.length > 0 || socials.length > 0) && (
              <div className="p-4 rounded-2xl" style={box}>
                <p className="mt-0 mb-3" style={eyebrow}>{t('الحضور على السوشال', 'Social reach')}</p>
                {socials.map(([k, v], i) => {
                  const href = v ? socialHref(k, v) : null
                  const n = Number(p.followers?.[k] || 0)
                  const row = (
                    <>
                      <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{SOCIAL_LABEL[k] || k}</span>
                      <span className="text-sm font-semibold" dir="ltr">{n > 0 ? formatFollowers(n) : href ? '↗' : ''}</span>
                    </>
                  )
                  return href ? (
                    <a key={k} href={href} onClick={() => track('profile', p.id, 'social')} target="_blank" rel="noreferrer noopener" className="flex justify-between py-2 hover:opacity-80" style={{ borderBottom: i < socials.length - 1 ? '1px solid var(--c-border)' : 'none' }}>{row}</a>
                  ) : (
                    <div key={k} className="flex justify-between py-2" style={{ borderBottom: i < socials.length - 1 ? '1px solid var(--c-border)' : 'none' }}>{row}</div>
                  )
                })}
              </div>
            )}

            {workedWith.length > 0 && (
              <div className="p-4 rounded-2xl" style={box}>
                <p className="mt-0 mb-3" style={eyebrow}>{t('عمل مع', 'Worked with')}</p>
                <div className="flex flex-col gap-2">
                  {workedWith.map((m) => (
                    <Link key={m.id} to={`/${m.username}`} className="flex items-center gap-2.5 group">
                      {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" style={{ border: '1.5px solid var(--c-border)' }} /> : <span className="w-8 h-8 rounded-full shrink-0" style={{ background: 'var(--c-surface-alt)' }} />}
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold group-hover:text-orange transition-colors truncate">{displayName(m)}</span>
                        <span className="block truncate" style={{ fontSize: 10, color: 'var(--c-muted)' }}>{m.specialty_ids?.[0] ? specName(specialties, m.specialty_ids[0]) : ''}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {!isOwner && p.status === 'approved' && <div className="px-1"><ReportButton type="profile" id={p.id} /></div>}
          </aside>
        </div>
      </div>

      {pickOpen && (
        <Modal
          title={t('أعمالك المختارة (حتى 5)', 'Your featured work (up to 5)')}
          onClose={() => setPickOpen(false)}
          footer={<><Btn disabled={saving} onClick={() => saveProfile({ featured_work_ids: pick }).then(() => setPickOpen(false))}>{t('حفظ', 'Save')}</Btn><Btn variant="outline" onClick={() => setPickOpen(false)}>{t('إلغاء', 'Cancel')}</Btn></>}
        >
          <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t(`اخترت ${pick.length} من 5. تظهر بالترتيب الذي تختاره.`, `${pick.length} of 5 chosen. They show in the order you pick.`)}</span>
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            {projects.map((pr) => {
              const on = pick.includes(pr.id)
              const idx = pick.indexOf(pr.id)
              return (
                <button key={pr.id} type="button" disabled={!on && pick.length >= 5} onClick={() => setPick(on ? pick.filter((x) => x !== pr.id) : [...pick, pr.id])} className="flex items-center gap-3 p-2.5 rounded-xl text-start cursor-pointer disabled:opacity-40" style={{ background: on ? 'rgba(var(--c-accent-rgb),0.12)' : 'var(--c-surface-alt)', border: `1px solid ${on ? 'var(--c-accent)' : 'var(--c-border)'}`, color: 'var(--c-text)' }}>
                  <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: on ? 'var(--c-accent)' : 'transparent', border: on ? 'none' : '1px solid var(--c-border-mid)', color: 'var(--c-on-accent)' }}>{on ? idx + 1 : ''}</span>
                  <span className="shrink-0 rounded overflow-hidden" style={{ width: 30, height: 44 }}>{posterOf(pr) ? <img src={posterOf(pr)!} alt="" className="w-full h-full object-cover" /> : <PosterFallback title="" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">{pr.title}</span>
                    <span className="block text-xs truncate" style={{ color: 'var(--c-muted)' }}>{[pr.year, roleOn(pr, p.id)].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </Modal>
      )}

      {aboutOpen && (
        <Modal
          title={t('نبذة عنك', 'About you')}
          onClose={() => setAboutOpen(false)}
          footer={<><Btn disabled={saving} onClick={() => saveProfile({ about: aboutDraft.trim() || null }).then(() => setAboutOpen(false))}>{t('حفظ', 'Save')}</Btn><Btn variant="outline" onClick={() => setAboutOpen(false)}>{t('إلغاء', 'Cancel')}</Btn></>}
        >
          <TextArea dir="auto" rows={12} maxLength={5000} value={aboutDraft} onChange={(e) => setAboutDraft(e.target.value)} placeholder={t('قصتك، أهم أعمالك، الجوائز، طريقة شغلك…', 'Your story, key work, awards, how you work…')} style={{ lineHeight: 1.9 }} />
          <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{aboutDraft.length}/5000 · {t('النبذة القصيرة في ملفك تظهر في سطرين، وهذه تظهر كاملة في تبويب «نبذة».', 'Your short bio shows in two lines; this full text shows in the About tab.')}</span>
        </Modal>
      )}

      {contactOpen && (
        <Modal title={t(`اطلب تعاوناً مع ${(p.full_name || '').split(' ')[0]}`, `Request a collaboration with ${(p.full_name || '').split(' ')[0]}`)} onClose={() => setContactOpen(false)}>
          <ContactForm to={p} />
        </Modal>
      )}
    </div>
  )
}
