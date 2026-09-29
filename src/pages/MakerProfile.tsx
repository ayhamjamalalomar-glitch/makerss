import { useEffect, useMemo, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Award, type Profile } from '../lib/supabase'
import { COUNTRIES, SITE_URL, cityLabel, contentLabel, listSep, videoLengthLabel } from '../lib/constants'
import { label, t, useLang } from '../lib/i18n'
import { useSpecialties, specName, isCreator } from '../lib/specialties'
import { useAuth } from '../lib/auth'
import { displayName, formatFollowers, kindLabel, posterOf, projectsForMember, roleOn, totalFollowers, type MemberCard, type Project } from '../lib/data'
import ContactForm from '../components/ContactForm'
import ReportButton from '../components/ReportButton'
import { track } from '../lib/track'
import { Btn, Modal, Notice, PageShell, PosterFallback, SectionHeader, Spinner, TextArea, VerifiedBadge } from '../components/mk'

const SOCIAL_LABEL: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', snapchat: 'Snapchat', facebook: 'Facebook', linkedin: 'LinkedIn', vimeo: 'Vimeo', behance: 'Behance', website: 'Website' }

function socialHref(key: string, v: string) {
  if (/^https?:\/\//i.test(v)) return v
  const h = v.replace(/^@/, '')
  const base: Record<string, string> = { instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/@', youtube: 'https://youtube.com/@', x: 'https://x.com/', snapchat: 'https://snapchat.com/add/', facebook: 'https://facebook.com/', vimeo: 'https://vimeo.com/', behance: 'https://behance.net/' }
  return base[key] ? base[key] + h : null
}

type Tab = 'overview' | 'credits' | 'about'

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
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [pickOpen, setPickOpen] = useState(false)
  const [pick, setPick] = useState<string[]>([])
  const [aboutOpen, setAboutOpen] = useState(false)
  const [aboutDraft, setAboutDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setP(undefined)
    supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).ilike('username', username).maybeSingle().then(async ({ data }) => {
      const prof = (data as unknown as Profile) || null
      setP(prof)
      if (!prof) return
      document.title = `${prof.full_name} | Makers`
      if (prof.status === 'approved') track('profile', prof.id, 'view')
      const [list, a] = await Promise.all([projectsForMember(prof.id), supabase.from('awards').select('*').eq('owner_id', prof.id).order('year', { ascending: false })])
      setProjects(list)
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

  if (p === undefined) return <PageShell><Spinner /></PageShell>
  if (p === null) {
    return (
      <PageShell narrow>
        <div className="py-20 flex flex-col gap-4 items-start">
          <h1 className="m-0 text-3xl font-bold">{t('الصفحة غير موجودة', 'Page not found')}</h1>
          <p className="m-0" style={{ color: 'var(--c-muted)' }}>{t('ربما تغيّر الرابط أو لم تُنشر الصفحة بعد.', 'The link may have changed, or the page is not published yet.')}</p>
          <Link to="/makers" className="font-semibold" style={{ color: '#E85D04' }}>{t('تصفّح الصنّاع', 'Browse makers')}</Link>
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
    try { await navigator.clipboard.writeText(`${SITE_URL}/${p.username}`) } catch { /* blocked */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 pt-6">
          {p.status !== 'approved' && isOwner && (
            <div className="mb-5"><Notice>{t('هذه معاينة لصفحتك. لن تظهر للزوار قبل موافقة فريق Makers.', 'This is a preview of your page. Visitors will see it once the Makers team approves it.')} <Link to="/me" className="font-semibold underline">{t('عد إلى التعديل', 'Back to editing')}</Link></Notice></div>
          )}
          <Link to="/makers" className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80" style={{ color: 'var(--c-muted)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rtl:-scale-x-100"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            {t('كل الصنّاع', 'All makers')}
          </Link>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-7 items-start">
            <div className="relative shrink-0 rounded-2xl overflow-hidden w-full sm:w-[180px]" style={{ height: 240, background: 'var(--c-surface-alt)' }}>
              {p.avatar_url ? <img src={p.avatar_url} alt={p.full_name || ''} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black" style={{ fontSize: 64, color: 'var(--c-muted-2)' }}>{displayName(p).charAt(0)}</div>}
              {p.is_founding && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5" style={{ background: '#E85D04', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  {t('عضو مؤسس', 'Founding member')}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 sm:pt-2 w-full">
              <h1 className="font-black mb-1 mt-0 flex items-center gap-3 flex-wrap" style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {displayName(p)}
                {p.is_founding && <VerifiedBadge size={26} title={t('عضو مؤسس', 'Founding member')} />}
              </h1>
              {altName && <p className="m-0 mb-2" style={{ fontSize: 15, color: 'var(--c-muted)' }}><bdi>{altName}</bdi></p>}
              <p className="m-0 mb-4" style={{ fontSize: 15, color: 'var(--c-text-2)' }}>
                {creator
                  ? [t('صانع محتوى', 'Content creator'), ...kinds.map((k) => k.name)].join(' · ')
                  : specs.map((s) => s.name).concat(p.other_specialty ? [p.other_specialty] : []).join(' · ')}
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: 'rgba(232,93,4,0.15)', border: '1.5px solid #E85D04' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="#E85D04"><path d="M7 1l1.4 2.8 3.1.45-2.25 2.2.53 3.05L7 8l-2.78 1.5.53-3.05L2.5 4.25l3.1-.45L7 1z" /></svg>
                  </div>
                  <div>
                    <p className="m-0" style={eyebrow}>{creator ? t('المتابعون', 'Followers') : t('أعمال', 'Credits')}</p>
                    <p className="m-0 font-black" dir="ltr" style={{ fontSize: 18, lineHeight: 1 }}>{creator ? formatFollowers(audience) : projects.length}</p>
                  </div>
                </div>
                {p.start_year && (
                  <div>
                    <p className="m-0" style={eyebrow}>{creator ? t('يصنع المحتوى منذ', 'Creating since') : t('في المجال منذ', 'Working since')}</p>
                    <p className="m-0 font-black" style={{ fontSize: 18, lineHeight: 1 }}>{p.start_year}</p>
                  </div>
                )}
                <span className="flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-full" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: p.available ? '#4ADE80' : 'var(--c-muted-2)' }} />
                  {p.available ? t('متاح للعمل', 'Available for work') : t('غير متاح حالياً', 'Not available right now')}
                </span>
                {specs.length > 0 && (
                  <div>
                    <p className="m-0" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{t('اكتشف المزيد', 'Discover more')}</p>
                    <div className="flex gap-2 mt-1">
                      {specs.slice(0, 2).map((s) => <Link key={s.id} to={`/makers?s=${s.id}`} className="text-xs hover:underline" style={{ color: '#E85D04' }}>{s.name}</Link>)}
                    </div>
                  </div>
                )}
                {creator && (
                  <div>
                    <p className="m-0" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{t('اكتشف المزيد', 'Discover more')}</p>
                    <div className="flex gap-2 mt-1">
                      <Link to="/makers?type=creator" className="text-xs hover:underline" style={{ color: '#E85D04' }}>{t('صنّاع المحتوى', 'Content creators')}</Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {isOwner ? (
                  <>
                    <Link to="/me" className="font-semibold px-5 py-2.5 rounded-full hover:opacity-90" style={{ background: '#E85D04', color: '#fff', fontSize: 13 }}>{t('تعديل الملف الشخصي', 'Edit profile')}</Link>
                    {p.status === 'approved' && <Link to="/projects/new" className="font-semibold px-5 py-2.5 rounded-full" style={{ border: '1px solid var(--c-border-mid)', fontSize: 13 }}>{t('+ أضف مشروعاً', '+ Add a project')}</Link>}
                  </>
                ) : p.status === 'approved' && (
                  <button onClick={() => { track('profile', p.id, 'contact'); setContactOpen(true) }} className="font-semibold px-5 py-2.5 rounded-full hover:opacity-90 cursor-pointer" style={{ background: '#E85D04', border: 'none', color: '#fff', fontSize: 13 }}>{t('اطلب تعاوناً', 'Request collaboration')}</button>
                )}
                {canMessage && (
                  <button onClick={startChat} disabled={msgBusy} className="font-semibold px-5 py-2.5 rounded-full cursor-pointer disabled:opacity-60" style={{ background: 'transparent', border: '1px solid var(--c-border-mid)', color: 'var(--c-text)', fontSize: 13 }}>{t('راسِل', 'Message')}</button>
                )}
                <button onClick={copy} className="font-semibold px-4 py-2.5 rounded-full cursor-pointer" style={{ background: 'transparent', border: '1px solid var(--c-border)', color: 'var(--c-muted)', fontSize: 13 }}>{copied ? t('تم نسخ الرابط', 'Link copied') : t('انسخ الرابط', 'Copy link')}</button>
              </div>
            </div>
          </div>

          <div className="flex gap-0 mt-6 overflow-x-auto no-scrollbar" style={{ borderBottom: '1px solid var(--c-border)' }}>
            {([['overview', t('نظرة عامة', 'Overview')], ['credits', t(`الأعمال (${projects.length})`, `Credits (${projects.length})`)], ['about', t('نبذة', 'About')]] as [Tab, string][]).map(([id, text]) => (
              <button key={id} onClick={() => setTab(id)} className="font-semibold px-5 py-3 relative cursor-pointer shrink-0" style={{ background: 'none', border: 'none', color: tab === id ? 'var(--c-text)' : 'var(--c-muted)', fontSize: 13, letterSpacing: '0.02em' }}>
                {text}
                {tab === id && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#E85D04' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

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
                        <span key={b.key} className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ ...box, borderInlineStart: b.accent ? '3px solid #E85D04' : undefined }}>
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
                    action={isOwner && projects.length > 0 ? <button onClick={() => { setPick(featuredIds); setPickOpen(true) }} className="text-xs font-semibold cursor-pointer" style={{ background: 'none', border: 'none', color: '#E85D04' }}>{t('اختر أعمالك المميزة', 'Choose featured work')}</button> : undefined}
                  />
                  {projects.length === 0 ? (
                    <div className="rounded-xl p-6 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ ...box, borderStyle: 'dashed' }}>
                      <span style={{ color: 'var(--c-muted)' }}>{isOwner ? t('أضف أول مشروع لك ليظهر هنا وفي صفحة المشاريع.', 'Add your first project to show it here and on the projects page.') : t('لم تُضف مشاريع بعد.', 'No projects added yet.')}</span>
                      {isOwner && p.status === 'approved' && <Link to="/projects/new" className="font-bold px-4 py-2 rounded-full self-start" style={{ background: '#E85D04', color: '#fff', fontSize: 13 }}>{t('أضف مشروعاً', 'Add a project')}</Link>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {featured.map((pr) => {
                        const img = posterOf(pr)
                        return (
                          <Link key={pr.id} to={`/projects/${pr.id}`} onClick={() => track('profile', p.id, 'work')} className="flex gap-3 p-3 rounded-xl group" style={box}>
                            <div className="shrink-0 rounded-lg overflow-hidden" style={{ width: 72, height: 96 }}>
                              {img ? <img src={img} alt={pr.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <PosterFallback title="" />}
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                              <p className="font-bold group-hover:text-orange transition-colors leading-tight mb-1 mt-0" style={{ fontSize: 14 }}>{pr.title}</p>
                              <p className="m-0" style={{ fontSize: 12, color: '#E85D04' }}>{roleOn(pr, p.id)}</p>
                              <p className="m-0" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{[pr.year, kindLabel(pr.kind), pr.brand].filter(Boolean).join(' · ')}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                  {projects.length > featured.length && (
                    <button onClick={() => setTab('credits')} className="mt-4 text-sm font-semibold cursor-pointer" style={{ background: 'none', border: 'none', color: '#E85D04', padding: 0 }}>{t(`كل الأعمال (${projects.length})`, `All ${projects.length} credits`)}</button>
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
                <SectionHeader title={t('كل الأعمال', 'All credits')} count={projects.length} action={isOwner && p.status === 'approved' ? <Link to="/projects/new" className="text-xs font-semibold" style={{ color: '#E85D04' }}>{t('+ أضف مشروعاً', '+ Add a project')}</Link> : undefined} />
                {projects.length === 0 ? (
                  <div className="rounded-xl p-6 text-sm" style={{ ...box, borderStyle: 'dashed', color: 'var(--c-muted)' }}>{t('لم تُضف مشاريع بعد.', 'No projects added yet.')}</div>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                    {projects.map((pr) => {
                      const img = posterOf(pr)
                      return (
                        <Link key={pr.id} to={`/projects/${pr.id}`} onClick={() => track('profile', p.id, 'work')} className="group">
                          <div className="relative rounded-xl overflow-hidden mb-2" style={{ aspectRatio: '2/3', background: 'var(--c-surface)' }}>
                            {img ? <img src={img} alt={pr.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <PosterFallback title={pr.title} />}
                            {p.featured_work_ids?.includes(pr.id) && <span className="absolute top-2 start-2 px-1.5 py-0.5 rounded font-bold" style={{ background: '#E85D04', color: '#fff', fontSize: 9 }}>{t('مختار', 'Featured')}</span>}
                          </div>
                          <p className="font-bold m-0 leading-tight group-hover:text-orange transition-colors" style={{ fontSize: 13 }}>{pr.title}</p>
                          <p className="m-0 truncate" style={{ fontSize: 11, color: '#E85D04' }}>{roleOn(pr, p.id)}</p>
                          <p className="m-0 truncate" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{[pr.year, kindLabel(pr.kind)].filter(Boolean).join(' · ')}</p>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {tab === 'about' && (
              <section>
                <SectionHeader title={t('نبذة', 'About')} action={isOwner ? <button onClick={() => { setAboutDraft(p.about || p.bio || ''); setAboutOpen(true) }} className="text-xs font-semibold cursor-pointer" style={{ background: 'none', border: 'none', color: '#E85D04' }}>{t('عدّل النبذة', 'Edit about')}</button> : undefined} />
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
                  <button onClick={() => setTab('about')} className="mt-1.5 text-xs font-semibold cursor-pointer" style={{ background: 'none', border: 'none', padding: 0, color: '#E85D04' }}>{t('اقرأ المزيد', 'Read more')}</button>
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
                <button key={pr.id} type="button" disabled={!on && pick.length >= 5} onClick={() => setPick(on ? pick.filter((x) => x !== pr.id) : [...pick, pr.id])} className="flex items-center gap-3 p-2.5 rounded-xl text-start cursor-pointer disabled:opacity-40" style={{ background: on ? 'rgba(232,93,4,0.12)' : 'var(--c-surface-alt)', border: `1px solid ${on ? '#E85D04' : 'var(--c-border)'}`, color: 'var(--c-text)' }}>
                  <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: on ? '#E85D04' : 'transparent', border: on ? 'none' : '1px solid var(--c-border-mid)', color: '#fff' }}>{on ? idx + 1 : ''}</span>
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
