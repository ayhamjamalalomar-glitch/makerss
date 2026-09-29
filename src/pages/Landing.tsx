import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from '../lib/router'
import { useAuth } from '../lib/auth'
import { t, useLang } from '../lib/i18n'
import { useSpecialties, specName, firstRole, isCreator } from '../lib/specialties'
import { budgetLabel, formatDateAr } from '../lib/constants'
import { displayName, formatFollowers, kindLabel, listMembers, listOpenCalls, listProjects, posterOf, topMakers, totalFollowers, type MemberCard, type OpenCall, type Project } from '../lib/data'
import { Corners, Skeleton, VerifiedBadge } from '../components/mk'
import { useDarkHero } from '../lib/hero'
import { CastCard, FilmStrip, PosterCard, Rail, RecBadge, SceneHeader, ScrollLitText } from '../components/cine'

const openPalette = () => window.dispatchEvent(new Event('mk-open-palette'))

/** An open call written like a production call sheet. */
function CallSheet({ c }: { c: OpenCall }) {
  const specialties = useSpecialties()
  return (
    <Link to={`/opportunities/${c.id}`} className="group shrink-0 flex flex-col rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1" style={{ width: 280, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium" style={{ background: 'var(--c-surface-alt)', borderBottom: '1px dashed var(--c-border-mid)', color: 'var(--c-accent)' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-accent)' }} />
        {kindLabel(c.kind) || t('مشروع', 'Project')}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <p className="font-display font-bold leading-snug m-0 transition-colors group-hover:text-[color:var(--c-accent)]" style={{ fontSize: 16 }}>{c.title}</p>
        <p className="m-0 text-xs" style={{ color: 'var(--c-muted)' }}>{c.org || displayName(c.owner)}</p>
        <div className="flex flex-wrap gap-1.5">
          {c.role_ids.slice(0, 3).map((id) => (
            <span key={id} className="px-2 py-1 rounded-md text-[11px]" style={{ background: 'rgba(var(--c-accent-rgb),0.12)', color: 'var(--c-accent)' }}>{specName(specialties, id)}</span>
          ))}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3 font-mono text-[11px]" style={{ borderTop: '1px solid var(--c-border)' }}>
          <span className="flex flex-col gap-0.5"><span style={{ color: 'var(--c-muted-2)' }}>{t('الميزانية', 'Budget')}</span><span>{budgetLabel(c.budget)}</span></span>
          <span className="flex flex-col gap-0.5"><span style={{ color: 'var(--c-muted-2)' }}>{t('آخر موعد', 'Deadline')}</span><span>{c.deadline ? formatDateAr(c.deadline) : t('مفتوح', 'Open')}</span></span>
        </div>
      </div>
    </Link>
  )
}

function Hero({ members, projects }: { members: MemberCard[] | null; projects: Project[] | null }) {
  const specialties = useSpecialties()
  // Real faces and real posters only: the strips are built from what is on Makers.
  const faces = useMemo(() => (members || []).map((m) => m.avatar_url).filter(Boolean) as string[], [members])
  const posters = useMemo(() => (projects || []).map((p) => posterOf(p)).filter(Boolean) as string[], [projects])
  const stripA = [...posters, ...faces]
  const stripB = [...faces].reverse().concat(posters)
  const topSpecs = useMemo(() => {
    const map = new Map<number, number>()
    for (const m of members || []) for (const id of m.specialty_ids || []) map.set(id, (map.get(id) || 0) + 1)
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)
  }, [members])
  const countries = new Set((members || []).map((m) => m.country).filter(Boolean)).size
  const stats = [
    members?.length ? t(`${members.length} صانع`, `${members.length} makers`) : '',
    projects?.length ? t(`${projects.length} مشروع`, `${projects.length} projects`) : '',
    countries ? t(`${countries} ${countries === 1 ? 'دولة' : 'دول'}`, `${countries} ${countries === 1 ? 'country' : 'countries'}`) : '',
  ].filter(Boolean)

  return (
    <section className="relative -mt-16 overflow-hidden" style={{ minHeight: 'min(92vh, 860px)', background: 'var(--c-screen)', color: '#F3EFE7' }}>
      {/* moving film strips behind the title */}
      <div className="absolute inset-0 flex flex-col justify-center gap-6" style={{ transform: 'rotate(-7deg) scale(1.25)', opacity: 0.55 }}>
        {stripA.length > 0 && <FilmStrip images={stripA} speed={90} height={170} />}
        {stripB.length > 0 && <FilmStrip images={stripB} speed={110} reverse height={170} />}
      </div>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(5,5,7,0.55) 0%, rgba(5,5,7,0.92) 70%, #050507 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: 'linear-gradient(to bottom, rgba(5,5,7,0), var(--c-bg))' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 20%, rgba(var(--c-accent-rgb),0.16), transparent 45%)' }} />

      {/* letterbox bars open like a shutter */}
      <motion.div className="absolute inset-x-0 top-0 z-10" style={{ background: '#050507' }} initial={{ height: '50%' }} animate={{ height: '0%' }} transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1], delay: 0.1 }} />
      <motion.div className="absolute inset-x-0 bottom-0 z-10" style={{ background: '#050507' }} initial={{ height: '50%' }} animate={{ height: '0%' }} transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1], delay: 0.1 }} />

      <div className="relative z-[5] max-w-[1120px] mx-auto w-full px-4 sm:px-8 pt-28 pb-28 md:pb-20 flex flex-col" style={{ minHeight: 'min(92vh, 860px)' }}>
        <div className="flex items-center justify-between">
          <RecBadge light />
        </div>

        <div className="relative flex-1 flex flex-col justify-center py-10">
          <Corners size={26} inset={-2} color="rgba(243,239,231,0.35)" w={1.5} />
          <div className="px-5 sm:px-10 py-8 flex flex-col gap-6 max-w-[860px]">
            <h1 className="font-display font-black m-0" style={{ fontSize: 'clamp(40px, 7.4vw, 96px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              {[t('دليل صنّاع الإنتاج', 'Arab World'), t('في العالم العربي', 'Production Directory')].map((line, i) => (
                <span key={i} className="block overflow-hidden pb-[0.08em]">
                  <motion.span className="block" style={{ color: i === 1 ? 'var(--c-accent)' : undefined }} initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: 0.75 + i * 0.14, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}>
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }} className="m-0 max-w-[560px] text-[16px] md:text-[18px]" style={{ lineHeight: 1.8, color: 'rgba(243,239,231,0.78)' }}>
              {t('مساحة تتعرّف فيها على من يقف خلف الصورة، وتصل إليه مباشرة.', 'A place to meet the people behind the image and reach them directly.')}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.35, duration: 0.6 }} className="flex flex-col gap-3 max-w-[620px]">
              <button type="button" onClick={openPalette} className="group flex items-center gap-3 rounded-2xl px-5 cursor-pointer text-start transition-all hover:border-[color:var(--c-accent)]" style={{ height: 60, background: 'rgba(243,239,231,0.07)', border: '1px solid rgba(243,239,231,0.2)', backdropFilter: 'blur(10px)', color: 'rgba(243,239,231,0.75)' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--c-accent)' }} aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" /><path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                <span className="flex-1 text-[15px] truncate">
                  <span className="hidden sm:inline">{t('ابحث عن مخرج، مصوّر، مونتير، صانع محتوى…', 'Find a director, DOP, editor, creator…')}</span>
                  <span className="sm:hidden">{t('ابحث عن صانع أو مشروع…', 'Search makers or projects…')}</span>
                </span>
                <kbd className="hidden sm:inline font-mono text-[10px] px-1.5 py-0.5 rounded" dir="ltr" style={{ border: '1px solid rgba(243,239,231,0.3)' }}>Ctrl K</kbd>
              </button>
              {topSpecs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topSpecs.map((id) => (
                    <Link key={id} to={`/makers?s=${id}`} className="text-[12px] px-3 py-1.5 rounded-full transition-colors hover:bg-[var(--c-accent)] hover:text-[color:var(--c-on-accent)]" style={{ border: '1px solid rgba(243,239,231,0.22)', color: 'rgba(243,239,231,0.85)' }}>{specName(specialties, id)}</Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-2.5">
            <Link to="/join" className="inline-flex items-center gap-2 font-semibold px-6 rounded-full transition hover:brightness-110" style={{ height: 48, background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>
              {t('انضم إلى Makers', 'Join Makers')}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="rtl:-scale-x-100" aria-hidden="true"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link to="/makers" className="inline-flex items-center font-semibold px-6 rounded-full transition-colors hover:bg-white/10" style={{ height: 48, border: '1px solid rgba(243,239,231,0.3)', color: '#F3EFE7' }}>{t('تصفّح الصنّاع', 'Browse makers')}</Link>
          </div>
          {stats.length > 0 && <span className="text-[13px] tabular-nums" style={{ color: 'rgba(243,239,231,0.6)' }}>{stats.join('  ·  ')}</span>}
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  useLang()
  useDarkHero()
  const { session, profile } = useAuth()
  const specialties = useSpecialties()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [allProjects, setAllProjects] = useState<Project[] | null>(null)
  const [top, setTop] = useState<{ list: MemberCard[]; ranked: boolean } | null>(null)
  const [calls, setCalls] = useState<OpenCall[] | null>(null)
  const [members, setMembers] = useState<MemberCard[] | null>(null)

  useEffect(() => {
    // One project per maker: newest work from each of the most recently active makers.
    listProjects({ limit: 80 })
      .then((list) => {
        setAllProjects(list)
        const seen = new Set<string>()
        setProjects(list.filter((p) => (seen.has(p.owner_id) ? false : (seen.add(p.owner_id), true))).slice(0, 10))
      })
      .catch(() => { setProjects([]); setAllProjects([]) })
    topMakers(10).then(setTop).catch(() => setTop({ list: [], ranked: false }))
    listOpenCalls(8).then(setCalls)
    listMembers().then(setMembers)
  }, [])

  const audience = (members || []).filter((m) => totalFollowers(m) > 0).sort((a, b) => totalFollowers(b) - totalFollowers(a)).slice(0, 8)
  const creators = (members || []).filter(isCreator)
  const approved = profile?.status === 'approved'

  return (
    <div className="flex flex-col">
      <Hero members={members} projects={allProjects} />

      <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 pt-6 pb-10 flex flex-col gap-16 sm:gap-20">
        <section>
          <SceneHeader title={t('جديد على Makers', 'New on Makers')} sub={t('آخر ما أضافه الصنّاع إلى أعمالهم.', 'The latest work makers added.')} to="/projects" />
          {projects === null ? (
            <div className="flex gap-3.5 overflow-hidden">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="shrink-0" style={{ width: 180, aspectRatio: '2/3' }} />)}</div>
          ) : (
            <Rail label={t('جديد على Makers', 'New on Makers')}>
              {projects.map((p) => <PosterCard key={p.id} p={p} width={180} />)}
              <Link to={approved ? '/projects/new' : session ? '/me' : '/join'} className="group shrink-0 flex flex-col items-center justify-center gap-3 rounded-xl text-center px-5 transition-colors hover:border-[color:var(--c-accent)]" style={{ width: 180, aspectRatio: '2/3', border: '1.5px dashed var(--c-border-mid)', color: 'var(--c-muted)' }}>
                <span className="w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors group-hover:bg-[var(--c-accent)] group-hover:text-[color:var(--c-on-accent)]" style={{ border: '1px solid var(--c-border-mid)' }}>+</span>
                <span className="text-sm font-medium">{approved ? t('أضف مشروعك إلى الشاشة', 'Put your project on screen') : t('انضم وأضف أعمالك', 'Join and add your work')}</span>
              </Link>
            </Rail>
          )}
        </section>

        <section>
          <SceneHeader title={top?.ranked ? t('الأكثر نشاطاً هذا الأسبوع', 'Most active this week') : t('صنّاع على Makers', 'Makers to know')}
            sub={top?.ranked ? t('ترتيب تلقائي حسب النشاط خلال سبعة أيام.', 'Ranked automatically by activity over seven days.') : undefined}
            to="/makers"
          />
          {top === null ? (
            <div className="flex gap-3.5 overflow-hidden">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="shrink-0" style={{ width: 200, aspectRatio: '3/4' }} />)}</div>
          ) : top.list.length > 0 && (
            <Rail label={t('الصنّاع', 'Makers')} itemWidth={200}>
              {top.list.map((m, i) => <CastCard key={m.id} m={m} specialties={specialties} width={200} rank={top.ranked ? i + 1 : undefined} />)}
            </Rail>
          )}
        </section>

        {creators.length > 0 && (
          <section>
            <SceneHeader title={t('صنّاع المحتوى', 'Content creators')} sub={t('وجوه وأصوات تصنع جمهورها بنفسها.', 'Voices who build their own audience.')} to="/makers?type=creator" />
            <Rail label={t('صنّاع المحتوى', 'Content creators')} itemWidth={200}>
              {creators.map((m) => <CastCard key={m.id} m={m} specialties={specialties} width={200} />)}
            </Rail>
          </section>
        )}

        <section>
          <SceneHeader title={t('فرص مفتوحة', 'Open calls')} sub={t('إنتاجات تبحث عن طاقم الآن. قدّم وانضم إلى التصوير.', 'Productions looking for crew right now. Apply and join the shoot.')} to="/opportunities" />
          {calls && calls.length > 0 ? (
            <Rail label={t('فرص مفتوحة', 'Open calls')} itemWidth={280}>
              {calls.map((c) => <CallSheet key={c.id} c={c} />)}
            </Rail>
          ) : calls ? (
            <div className="relative rounded-2xl p-7 md:p-9 flex flex-col md:flex-row md:items-center justify-between gap-5 overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px dashed var(--c-border-mid)' }}>
              <div className="flex flex-col gap-1.5">
                <span className="font-display font-bold text-lg">{t('لا توجد فرص منشورة الآن.', 'No open calls right now.')}</span>
                <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('عندك مشروع يحتاج طاقم؟ انشره ويصل إلى صنّاع موثّقين.', 'Have a project that needs a crew? Post it and reach reviewed makers.')}</span>
              </div>
              <Link to={approved ? '/opportunities/new' : session ? '/me/status' : '/join'} className="self-start md:self-auto font-semibold px-6 py-3 rounded-full text-sm" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>{t('انشر فرصة', 'Post an open call')}</Link>
            </div>
          ) : null}
        </section>

        {audience.length > 0 && (
          <section>
            <SceneHeader title={t('أكبر الجماهير', 'Biggest audiences')} to="/makers?sort=audience" />
            <Rail label={t('أكبر الجماهير', 'Biggest audiences')} itemWidth={150}>
              {audience.map((m) => (
                <Link key={m.id} to={`/${m.username}`} className="group shrink-0 flex flex-col items-center gap-3 p-5 rounded-2xl text-center transition-colors hover:border-[color:var(--c-accent)]" style={{ width: 150, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                  <span className="relative">
                    {m.avatar_url ? <img src={m.avatar_url} alt="" draggable={false} className="w-16 h-16 rounded-full object-cover grayscale-[0.6] transition group-hover:grayscale-0" /> : <span className="w-16 h-16 rounded-full block" style={{ background: 'var(--c-surface-alt)' }} />}
                    {m.is_founding && <span className="absolute -bottom-0.5 -end-0.5"><VerifiedBadge size={18} /></span>}
                  </span>
                  <span className="min-w-0 w-full">
                    <span className="block font-semibold text-[13px] truncate">{displayName(m).split(' ')[0]}</span>
                    <span className="block text-[11px] truncate" style={{ color: 'var(--c-muted)' }}>{firstRole(specialties, m)}</span>
                  </span>
                  <span className="font-display font-black text-xl" dir="ltr" style={{ color: 'var(--c-accent)' }}>{formatFollowers(totalFollowers(m))}</span>
                </Link>
              ))}
            </Rail>
          </section>
        )}

        <section className="relative py-6">
          <span className="text-[14px] font-medium" style={{ color: 'var(--c-accent)' }}>{t('من هي Makers؟', 'Who is Makers?')}</span>
          <ScrollLitText
            className="font-display font-bold m-0 mt-5"
            style={{ fontSize: 'clamp(26px, 4.2vw, 52px)', lineHeight: 1.35, letterSpacing: '-0.01em' }}
            text={t('كل صورة رأيتها صنعها أحد. ضوءٌ ضبطه شخص، ولقطةٌ اختارها آخر، وإيقاعٌ قرّره ثالث في غرفة المونتاج.', 'Every image you have ever seen was made by someone. Light set by one person, a shot chosen by another, a rhythm decided by a third in the edit room.')}
          />
          <p className="m-0 mt-8 max-w-[620px] text-[16px] md:text-[17px]" style={{ lineHeight: 1.9, color: 'var(--c-text-2)' }}>
            {t('Makers دليل مواهب الإنتاج في العالم العربي، مساحة تتعرّف فيها على من يقف خلف الصورة، وتصل إليه مباشرة. كل ملف فيه يراجعه فريقنا بعناية.', 'Makers is the talent directory for production across the Arab world, a place to meet the people behind the image and reach them directly. Every profile is carefully reviewed by our team.')}
          </p>
        </section>

        {!approved && (
          <section className="relative rounded-3xl overflow-hidden" style={{ background: 'var(--c-screen)', color: '#F3EFE7' }}>
            <div className="mk-sprockets h-4 mt-3 opacity-70" style={{ backgroundImage: 'radial-gradient(circle, #1a1a1f 3px, transparent 3.5px)' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 80% at 85% 50%, rgba(var(--c-accent-rgb),0.2), transparent 70%)' }} />
            <div className="relative px-7 md:px-12 py-14 md:py-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div className="flex flex-col gap-5 max-w-[640px]">
              <h2 className="font-display font-black m-0" style={{ fontSize: 'clamp(28px, 4.2vw, 50px)', lineHeight: 1.15 }}>
                {t('نحن في البداية. كن من الأسماء الأولى.', "We're just getting started. Be one of the first names.")}
              </h2>
              <p className="m-0 max-w-md text-[15px]" style={{ lineHeight: 1.8, color: 'rgba(243,239,231,0.7)' }}>
                {t('سجّل، ابنِ ملفك وأضف أعمالك. يراجع فريقنا كل ملف قبل النشر، ويحصل أوائل المنضمّين على شارة «عضو مؤسس» بشكل دائم.', 'Sign up, build your profile and add your work. Our team reviews every profile before it goes live, and the first makers keep a permanent Founding Member badge.')}
              </p>
              </div>
              <Link to={session ? '/me' : '/join'} className="self-start md:self-auto shrink-0 inline-flex items-center gap-3 font-semibold px-9 rounded-full transition hover:brightness-110" style={{ height: 54, background: 'var(--c-accent)', color: 'var(--c-on-accent)', fontSize: 15 }}>
                {session ? t('أكمل ملفك', 'Finish your profile') : t('انضم إلى Makers', 'Join Makers')}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="rtl:-scale-x-100" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <div className="mk-sprockets h-4 mb-3 opacity-70" style={{ backgroundImage: 'radial-gradient(circle, #1a1a1f 3px, transparent 3.5px)' }} />
          </section>
        )}
      </div>
    </div>
  )
}
