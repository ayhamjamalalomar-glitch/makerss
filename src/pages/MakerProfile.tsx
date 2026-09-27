import { useEffect, useMemo, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Award, type Profile } from '../lib/supabase'
import { COUNTRIES, SITE_URL, cityLabel, videoLengthLabel } from '../lib/constants'
import { label, t, useLang } from '../lib/i18n'
import { useSpecialties, specName } from '../lib/specialties'
import { useAuth } from '../lib/auth'
import { displayName, formatFollowers, kindLabel, posterOf, projectsForMember, roleOn, type MemberCard, type Project } from '../lib/data'
import ContactForm from '../components/ContactForm'
import { Modal, Notice, PageShell, PosterFallback, SectionHeader, Spinner, VerifiedBadge } from '../components/mk'

const SOCIAL_LABEL: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', snapchat: 'Snapchat', facebook: 'Facebook', linkedin: 'LinkedIn', vimeo: 'Vimeo', behance: 'Behance', website: 'Website' }

function socialHref(key: string, v: string) {
  if (/^https?:\/\//i.test(v)) return v
  const h = v.replace(/^@/, '')
  const base: Record<string, string> = { instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/@', youtube: 'https://youtube.com/@', x: 'https://x.com/', snapchat: 'https://snapchat.com/add/', facebook: 'https://facebook.com/', vimeo: 'https://vimeo.com/', behance: 'https://behance.net/' }
  return base[key] ? base[key] + h : null
}

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

  useEffect(() => {
    setP(undefined)
    supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).ilike('username', username).maybeSingle().then(async ({ data }) => {
      const prof = (data as unknown as Profile) || null
      setP(prof)
      if (!prof) return
      document.title = `${prof.full_name} | Makers`
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
  const specs = (p.specialty_ids || []).map((id) => ({ id, name: specName(specialties, id) })).filter((s) => s.name)
  const place = [cityLabel(p.city), label(COUNTRIES, p.country)].filter(Boolean).join(t('، ', ', '))
  const vlen = videoLengthLabel(p.video_length)
  const followers = Object.entries(p.followers || {}).filter(([, n]) => Number(n) > 0)
  const socials: [string, string][] = [
    ...Object.entries(p.socials || {}).filter(([, v]) => v),
    ...followers.filter(([k]) => !(p.socials || {})[k]).map(([k]) => [k, ''] as [string, string]),
  ]
  const altName = t(p.full_name && p.full_name !== p.name_ar ? p.full_name : '', p.name_ar || '')

  const startChat = async () => {
    setMsgBusy(true)
    const { data, error } = await supabase.rpc('start_conversation', { p_other: p.id })
    setMsgBusy(false)
    if (!error && data) go(`/messages?c=${data}`)
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${SITE_URL}/${p.username}`) } catch { /* blocked */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6">
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
                {specs.map((s) => s.name).concat(p.other_specialty ? [p.other_specialty] : []).join(' · ')}
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: 'rgba(232,93,4,0.15)', border: '1.5px solid #E85D04' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="#E85D04"><path d="M7 1l1.4 2.8 3.1.45-2.25 2.2.53 3.05L7 8l-2.78 1.5.53-3.05L2.5 4.25l3.1-.45L7 1z" /></svg>
                  </div>
                  <div>
                    <p className="m-0" style={eyebrow}>{t('أعمال', 'Credits')}</p>
                    <p className="m-0 font-black" style={{ fontSize: 18, lineHeight: 1 }}>{projects.length}</p>
                  </div>
                </div>
                {p.start_year && (
                  <div>
                    <p className="m-0" style={eyebrow}>{t('في المجال منذ', 'Working since')}</p>
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
              </div>

              <div className="flex flex-wrap gap-2">
                {isOwner ? (
                  <>
                    <Link to="/me" className="font-semibold px-5 py-2.5 rounded-full hover:opacity-90" style={{ background: '#E85D04', color: '#fff', fontSize: 13 }}>{t('تعديل الملف الشخصي', 'Edit profile')}</Link>
                    {p.status === 'approved' && <Link to="/projects/new" className="font-semibold px-5 py-2.5 rounded-full" style={{ border: '1px solid var(--c-border-mid)', fontSize: 13 }}>{t('+ أضف مشروعاً', '+ Add a project')}</Link>}
                  </>
                ) : p.status === 'approved' && (
                  <button onClick={() => setContactOpen(true)} className="font-semibold px-5 py-2.5 rounded-full hover:opacity-90 cursor-pointer" style={{ background: '#E85D04', border: 'none', color: '#fff', fontSize: 13 }}>{t('اطلب تعاوناً', 'Request collaboration')}</button>
                )}
                {canMessage && (
                  <button onClick={startChat} disabled={msgBusy} className="font-semibold px-5 py-2.5 rounded-full cursor-pointer disabled:opacity-60" style={{ background: 'transparent', border: '1px solid var(--c-border-mid)', color: 'var(--c-text)', fontSize: 13 }}>{t('راسِل', 'Message')}</button>
                )}
                <button onClick={copy} className="font-semibold px-4 py-2.5 rounded-full cursor-pointer" style={{ background: 'transparent', border: '1px solid var(--c-border)', color: 'var(--c-muted)', fontSize: 13 }}>{copied ? t('تم نسخ الرابط', 'Link copied') : t('انسخ الرابط', 'Copy link')}</button>
              </div>
            </div>
          </div>

          <div className="flex gap-0 mt-6 overflow-x-auto no-scrollbar" style={{ borderBottom: '1px solid var(--c-border)' }}>
            {[['overview', t('نظرة عامة', 'Overview')], ['credits', t('الأعمال', 'Credits')], ['about', t('نبذة', 'About')]].map(([id, text], i) => (
              <button key={id} onClick={() => scrollTo(id)} className="font-semibold px-5 py-3 relative cursor-pointer shrink-0" style={{ background: 'none', border: 'none', color: i === 0 ? 'var(--c-text)' : 'var(--c-muted)', fontSize: 13, letterSpacing: '0.02em' }}>
                {text}
                {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#E85D04' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="flex-1 min-w-0 w-full flex flex-col gap-10">
            <section id="overview" style={{ scrollMarginTop: 80 }}>
              <SectionHeader title={t('اشتهر بـ', 'Known for')} />
              {projects.length === 0 ? (
                <div className="rounded-xl p-6 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ ...box, borderStyle: 'dashed' }}>
                  <span style={{ color: 'var(--c-muted)' }}>{isOwner ? t('أضف أول مشروع لك ليظهر هنا وفي صفحة المشاريع.', 'Add your first project to show it here and on the projects page.') : t('لم تُضف مشاريع بعد.', 'No projects added yet.')}</span>
                  {isOwner && p.status === 'approved' && <Link to="/projects/new" className="font-bold px-4 py-2 rounded-full self-start" style={{ background: '#E85D04', color: '#fff', fontSize: 13 }}>{t('أضف مشروعاً', 'Add a project')}</Link>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projects.slice(0, 4).map((pr) => {
                    const img = posterOf(pr)
                    return (
                      <Link key={pr.id} to={`/projects/${pr.id}`} className="flex gap-3 p-3 rounded-xl group" style={box}>
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
            </section>

            {(p.is_founding || awards.length > 0) && (
              <div className="flex items-center justify-between px-4 py-3.5 rounded-xl" style={{ ...box, borderInlineStart: '3px solid #E85D04' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.4 2.8 3.1.45-2.25 2.2.53 3.05L8 8l-2.78 1.5.53-3.05L3.5 4.25l3.1-.45L8 1z" fill="#F5C518" /></svg>
                  <span className="font-bold" style={{ fontSize: 14 }}>{p.is_founding ? t('عضو مؤسس في Makers', 'Makers founding member') : t('جوائز', 'Awards')}</span>
                  {awards.length > 0 && <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>{t(`${awards.length} جائزة واعتماد`, `${awards.length} award${awards.length > 1 ? 's' : ''}`)}</span>}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <section id="credits" style={{ scrollMarginTop: 80 }}>
                <SectionHeader title={t('كل الأعمال', 'All credits')} count={projects.length} />
                <div className="rounded-xl overflow-hidden" style={box}>
                  {projects.map((pr, i) => (
                    <Link key={pr.id} to={`/projects/${pr.id}`} className="flex items-center gap-4 px-5 py-4 group hover:bg-white/[0.03] transition-colors" style={{ borderBottom: i < projects.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                      <span className="font-bold shrink-0" style={{ width: 44, fontSize: 13, color: 'var(--c-muted)' }}>{pr.year || ''}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold truncate group-hover:text-orange transition-colors" style={{ fontSize: 14 }}>{pr.title}</span>
                        <span className="block truncate" style={{ fontSize: 12, color: 'var(--c-muted)' }}>{[roleOn(pr, p.id), kindLabel(pr.kind)].filter(Boolean).join(' · ')}</span>
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 rtl:-scale-x-100" style={{ color: 'var(--c-border-mid)' }}><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </Link>
                  ))}
                </div>
              </section>
            )}

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
          </div>

          <aside id="about" className="w-full lg:w-[260px] shrink-0 flex flex-col gap-5" style={{ scrollMarginTop: 80 }}>
            <div className="p-4 rounded-2xl" style={box}>
              <p className="mt-0 mb-3" style={eyebrow}>{t('نبذة', 'About')}</p>
              {p.bio ? <p dir="auto" className="m-0 leading-relaxed whitespace-pre-line" style={{ color: 'var(--c-text-2)', fontSize: 13 }}>{p.bio}</p> : <p className="m-0 text-sm" style={{ color: 'var(--c-muted)' }}>{t('لا توجد نبذة بعد.', 'No bio yet.')}</p>}
              {place && <p className="mb-0 mt-3" style={{ fontSize: 12, color: 'var(--c-muted)' }}>{place}</p>}
              {vlen && <p className="mb-0 mt-1" style={{ fontSize: 12, color: 'var(--c-muted)' }}>{vlen}</p>}
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
                    <a key={k} href={href} target="_blank" rel="noreferrer noopener" className="flex justify-between py-2 hover:opacity-80" style={{ borderBottom: i < socials.length - 1 ? '1px solid var(--c-border)' : 'none' }}>{row}</a>
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
          </aside>
        </div>
      </div>

      {contactOpen && (
        <Modal title={t(`اطلب تعاوناً مع ${(p.full_name || '').split(' ')[0]}`, `Request a collaboration with ${(p.full_name || '').split(' ')[0]}`)} onClose={() => setContactOpen(false)}>
          <ContactForm to={p} />
        </Modal>
      )}
    </div>
  )
}
