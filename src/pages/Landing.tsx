import { useEffect, useState } from 'react'
import Link from '../lib/router'
import { useAuth } from '../lib/auth'
import { t, useLang } from '../lib/i18n'
import { useSpecialties, specName, firstRole } from '../lib/specialties'
import { budgetLabel } from '../lib/constants'
import { CALL_COLORS, displayName, formatFollowers, kindLabel, listMembers, listOpenCalls, listProjects, posterOf, topMakers, totalFollowers, type MemberCard, type OpenCall, type Project } from '../lib/data'
import { useRouter } from '../lib/router'
import { PosterFallback, SectionHeader, Skeleton, VerifiedBadge } from '../components/mk'

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="inline-flex items-center justify-center font-black rounded-lg" style={{ background: '#E85D04', color: '#fff', fontSize: 12, minWidth: 32, height: 20, paddingInline: 5 }}>
      #{rank}
    </span>
  )
}

export function ProjectPoster({ p }: { p: Project }) {
  const img = posterOf(p)
  return (
    <Link to={`/projects/${p.id}`} className="group flex flex-col gap-2 text-start">
      <div className="relative rounded-xl overflow-hidden w-full" style={{ aspectRatio: '2/3', background: 'var(--c-surface)' }}>
        {img ? <img src={img} alt={p.title} loading="lazy" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" /> : <PosterFallback title={p.title} />}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(13,10,8,0.4)' }} />
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-bold text-white rounded-full px-3 py-1" style={{ background: '#E85D04', fontSize: 11 }}>{t('عرض', 'View')}</span>
        </div>
        {p.kind && (
          <span className="absolute top-2 start-2 font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(13,10,8,0.75)', color: '#E85D04', fontSize: 9, letterSpacing: '0.05em' }}>{kindLabel(p.kind)}</span>
        )}
      </div>
      <div>
        <p className="font-semibold leading-snug m-0" style={{ fontSize: 12, color: 'var(--c-text)' }}>{p.title}</p>
        <p className="m-0" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{[p.year, p.brand].filter(Boolean).join(' · ')}</p>
      </div>
    </Link>
  )
}

export function CallCard({ c }: { c: OpenCall }) {
  const specialties = useSpecialties()
  const color = CALL_COLORS[c.kind || 'other'] || '#E85D04'
  return (
    <Link
      to={`/opportunities/${c.id}`}
      className="flex-shrink-0 text-start group rounded-2xl overflow-hidden flex flex-col transition-colors"
      style={{ width: 230, background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      <div style={{ height: 4, background: color, width: '100%' }} />
      <div className="p-4 flex flex-col flex-1 gap-3">
        {c.kind && (
          <div><span className="font-bold px-2 py-0.5 rounded-md" style={{ background: color, color: 'white', fontSize: 9, letterSpacing: '0.05em' }}>{kindLabel(c.kind)}</span></div>
        )}
        <p className="font-bold leading-snug group-hover:text-orange transition-colors m-0" style={{ fontSize: 13, color: 'var(--c-text)' }}>{c.title}</p>
        <p className="m-0" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{c.org || displayName(c.owner)}</p>
        <div className="flex flex-wrap gap-1 mt-auto">
          {c.role_ids.slice(0, 3).map((id) => (
            <span key={id} className="px-2 py-0.5 rounded-md" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-text)', fontSize: 10 }}>{specName(specialties, id)}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
          <span className="font-semibold" style={{ color: '#E85D04', fontSize: 11 }}>{budgetLabel(c.budget)}</span>
          {c.deadline && <span style={{ color: 'var(--c-muted)', fontSize: 10 }}>{t('آخر موعد', 'Due')} {c.deadline.slice(5).replace('-', '/')}</span>}
        </div>
      </div>
    </Link>
  )
}

export default function Landing() {
  useLang()
  const { go } = useRouter()
  const { session, profile } = useAuth()
  const specialties = useSpecialties()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [top, setTop] = useState<{ list: MemberCard[]; ranked: boolean } | null>(null)
  const [calls, setCalls] = useState<OpenCall[] | null>(null)
  const [audience, setAudience] = useState<MemberCard[]>([])

  useEffect(() => {
    // One project per maker: newest work from each of the 6 most recently active makers.
    listProjects({ limit: 80 })
      .then((list) => {
        const seen = new Set<string>()
        setProjects(list.filter((p) => (seen.has(p.owner_id) ? false : (seen.add(p.owner_id), true))).slice(0, 6))
      })
      .catch(() => setProjects([]))
    topMakers(10).then(setTop).catch(() => setTop({ list: [], ranked: false }))
    listOpenCalls(8).then(setCalls)
    listMembers().then((all) => setAudience(all.filter((m) => totalFollowers(m) > 0).sort((a, b) => totalFollowers(b) - totalFollowers(a)).slice(0, 8)))
  }, [])

  const firstSpec = (m: MemberCard) => firstRole(specialties, m)

  return (
    <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-8 sm:py-10 flex flex-col gap-10 sm:gap-14">

      {projects === null ? (
        <section aria-busy="true">
          <SectionHeader title={t('جديد على ميكرز', 'New on Makers')} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton style={{ aspectRatio: '2/3' }} />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </section>
      ) : projects.length > 0 && (
        <section>
          <SectionHeader title={t('جديد على ميكرز', 'New on Makers')} onSeeAll={() => go('/projects')} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {projects.map((p) => <ProjectPoster key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {top === null ? (
        <section aria-busy="true">
          <SectionHeader title={t('صنّاع هذا الأسبوع', 'Makers this week')} />
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} style={{ aspectRatio: '2/3' }} />)}
          </div>
        </section>
      ) : top.list.length > 0 && (
        <section>
          <SectionHeader
            title={top.ranked
              ? t(`أفضل ${top.list.length === 10 ? '١٠' : top.list.length} صنّاع هذا الأسبوع`, `Top ${top.list.length} Makers this week`)
              : t('صنّاع على Makers', 'Makers to know')}
            onSeeAll={() => go('/makers')}
          />
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {top.list.map((m, i) => (
              <Link key={m.id} to={`/${m.username}`} className="text-start group">
                <div className="rounded-xl overflow-hidden relative mb-1.5" style={{ aspectRatio: '2/3', background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={displayName(m)} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black" style={{ fontSize: 28, color: 'var(--c-muted-2)' }}>{displayName(m).charAt(0)}</div>
                  )}
                  {top.ranked && <div className="absolute top-1.5 start-1.5"><RankBadge rank={i + 1} /></div>}
                </div>
                <p className="font-semibold group-hover:text-orange transition-colors truncate m-0 flex items-center gap-1" style={{ fontSize: 11, color: 'var(--c-text)' }}>
                  <span className="truncate">{displayName(m)}</span>
                  {m.is_founding && <VerifiedBadge size={12} title={t('عضو مؤسس', 'Founding member')} />}
                </p>
                <p className="truncate m-0" style={{ fontSize: 10, color: 'var(--c-muted)' }}>{firstSpec(m)}</p>
              </Link>
            ))}
          </div>
          <div className="flex justify-center mt-5">
            <Link to="/makers" className="font-semibold px-14 py-3 rounded-full hover:opacity-80 transition-all" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border-mid)', fontSize: 13, color: 'var(--c-text)' }}>
              {t('عرض الكل', 'See all')}
            </Link>
          </div>
        </section>
      )}

      <section>
        <SectionHeader title={t('فرص مفتوحة', 'Open Projects')} onSeeAll={() => go('/opportunities')} />
        <p className="text-sm mb-4" style={{ marginTop: -12, color: 'var(--c-muted)' }}>
          {t('إنتاجات تبحث عن صنّاع الآن. قدّم وانضم إلى الطاقم.', 'Productions looking for Makers right now. Apply to join the crew.')}
        </p>
        {calls && calls.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {calls.map((c) => <CallCard key={c.id} c={c} />)}
          </div>
        ) : calls ? (
          <div className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: 'var(--c-surface)', border: '1px dashed var(--c-border-mid)' }}>
            <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('لا توجد فرص منشورة الآن. عندك مشروع يحتاج طاقم؟', 'No open calls right now. Have a project that needs a crew?')}</span>
            <Link to={session ? '/opportunities/new' : '/join'} className="self-start sm:self-auto font-bold px-5 py-2.5 rounded-full text-sm" style={{ background: '#E85D04', color: '#fff' }}>{t('انشر فرصة', 'Post an opportunity')}</Link>
          </div>
        ) : null}
      </section>

      {audience.length > 0 && (
        <section>
          <SectionHeader title={t('أكبر الجماهير', 'Biggest Audiences')} onSeeAll={() => go('/makers')} />
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {audience.map((m) => (
              <Link key={m.id} to={`/${m.username}`} className="flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl group text-center" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', minWidth: 120 }}>
                {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid var(--c-border)' }} /> : <span className="w-12 h-12 rounded-full" style={{ background: 'var(--c-surface-alt)' }} />}
                <div>
                  <p className="font-semibold group-hover:text-orange transition-colors m-0" style={{ fontSize: 12, color: 'var(--c-text)' }}>{displayName(m).split(' ')[0]}</p>
                  <p className="m-0" style={{ fontSize: 11, color: 'var(--c-muted)' }}>{firstSpec(m)}</p>
                  <p className="font-bold mt-1 mb-0" style={{ color: '#E85D04', fontSize: 13 }}>{formatFollowers(totalFollowers(m))}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl p-7 md:p-12 flex flex-col gap-4" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <span className="text-xs md:text-[13px] font-semibold" style={{ color: '#E85D04' }}>{t('من هي Makers؟', 'Who is Makers?')}</span>
        <h2 className="m-0 font-bold text-[24px] md:text-[34px]" style={{ lineHeight: 1.35 }}>{t('دليل صنّاع الإنتاج في العالم العربي', 'The directory of production talent across the Arab world')}</h2>
        <div className="flex flex-col gap-3 max-w-[640px] text-[15px] md:text-[17px]" style={{ lineHeight: 1.9, color: 'var(--c-text-2)' }}>
          <p className="m-0 font-semibold" style={{ color: 'var(--c-text)' }}>{t('كل صورة رأيتها صنعها أحد.', 'Every image you have ever seen was made by someone.')}</p>
          <p className="m-0">{t('ضوءٌ ضبطه شخص، ولقطةٌ اختارها آخر، وإيقاعٌ قرّره ثالث في غرفة المونتاج.', 'Light set by one person, a shot chosen by another, a rhythm decided by a third in the edit room.')}</p>
          <p className="m-0">{t('Makers دليل مواهب الإنتاج في العالم العربي، مساحة تتعرّف فيها على من يقف خلف الصورة، وتصل إليه مباشرة.', 'Makers is the talent directory for production across the Arab world, a place to meet the people behind the image and reach them directly.')}</p>
          <p className="m-0" style={{ color: 'var(--c-muted)' }}>{t('كل ملف فيه يراجعه فريقنا بعناية.', 'Every profile here is carefully reviewed by our team.')}</p>
        </div>
      </section>

      {!(profile && profile.status === 'approved') && (
        <section className="rounded-2xl p-10 text-center relative overflow-hidden" style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(232,93,4,0.18) 0%, transparent 70%), var(--c-surface)', border: '1px solid rgba(232,93,4,0.2)' }}>
          <p className="text-xs mb-3" style={{ color: '#E85D04', letterSpacing: '0.18em', fontWeight: 600 }}>{t('مقاعد الأعضاء المؤسسين محدودة', 'Founding member seats are limited')}</p>
          <h2 className="font-bold mb-3 leading-tight" style={{ fontSize: 'clamp(22px, 3vw, 34px)' }}>
            {t('نحن في البداية. كن من الأسماء الأولى.', "We're just getting started. Be one of the first names.")}
          </h2>
          <p className="text-sm mb-8 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--c-muted)' }}>
            {t('سجّل، ابنِ ملفك وأضف أعمالك. يراجع فريقنا كل ملف قبل النشر، ويحصل أوائل المنضمّين على شارة «عضو مؤسس» بشكل دائم.', 'Sign up, build your profile and add your work. Our team reviews every profile before it goes live, and the first makers keep a permanent Founding Member badge.')}
          </p>
          <Link to={session ? '/me' : '/join'} className="inline-flex items-center gap-3 font-bold px-10 py-4 rounded-full hover:opacity-90 transition-all" style={{ background: '#E85D04', color: '#fff', fontSize: 15 }}>
            {session ? t('أكمل ملفك', 'Finish your profile') : t('انضم إلى Makers', 'Join Makers')}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rtl:-scale-x-100"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </section>
      )}
    </div>
  )
}
