import { useCallback, useEffect, useMemo, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { useAuth } from '../lib/auth'
import { supabase, type Award, type MemberRole, type MemberStatus, type Profile, type Specialty, type Work } from '../lib/supabase'
import { budgetLabel, relativeAr } from '../lib/constants'
import { isCreator, memberLine } from '../lib/specialties'
import { hasAudience } from '../lib/progress'
import { Avatar, Btn, Card, Chip, Field, Modal, Notice, Pill, SelectInput, Skeleton, Spinner, TextArea, TextInput } from '../components/mk'
import { CALL_SELECT, displayName, kindLabel, listProjects, posterOf, type OpenCall, type Project } from '../lib/data'
import { formatDateAr } from '../lib/constants'

type Tab = 'overview' | 'review' | 'calls' | 'projects' | 'members' | 'reports' | 'specialties' | 'audit'

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  suspended: number
  draft: number
  signups_today: number
  signups_7d: number
  makers: number
  works: number
  requests_total: number
  requests_7d: number
  requests_accepted: number
  pending_suggestions: number
  pending_calls?: number
  open_calls?: number
}

const STATUS: Record<MemberStatus, { label: string; tone: 'neutral' | 'green' | 'blue' | 'amber' | 'red' }> = {
  draft: { label: 'مسودة', tone: 'neutral' },
  pending: { label: 'قيد المراجعة', tone: 'blue' },
  approved: { label: 'منشورة', tone: 'green' },
  rejected: { label: 'تحتاج تعديلاً', tone: 'amber' },
  suspended: { label: 'موقوف', tone: 'red' },
}
const ROLE: Record<MemberRole, string> = { member: 'عضو', reviewer: 'مراجع', admin: 'أدمن' }
const MUTED = 'var(--c-muted)'

// All specialties, including hidden ones (staff can read them)
function useAllSpecialties() {
  const [list, setList] = useState<Specialty[]>([])
  const reload = useCallback(async () => {
    const { data } = await supabase.from('specialties').select('*').order('sort')
    setList((data as Specialty[]) || [])
  }, [])
  useEffect(() => { reload() }, [reload])
  return { list, reload }
}

export default function Admin() {
  const { session, profile, loading } = useAuth()
  const { go } = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const specs = useAllSpecialties()
  const isStaff = profile?.role === 'admin' || profile?.role === 'reviewer'
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (!loading && !session) go('/login?next=/admin')
  }, [loading, session, go])

  const loadStats = useCallback(async () => {
    const { data } = await supabase.rpc('admin_stats')
    if (data) setStats(data as Stats)
  }, [])

  useEffect(() => { if (isStaff) loadStats() }, [isStaff, loadStats])

  const [openReports, setOpenReports] = useState(0)
  const loadReports = useCallback(async () => {
    const { count } = await supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('kind', 'report').eq('status', 'open')
    setOpenReports(count ?? 0)
  }, [])
  useEffect(() => { if (isStaff) loadReports() }, [isStaff, loadReports])

  if (loading || !profile) return <Wrap><Spinner /></Wrap>
  if (!isStaff) {
    return (
      <Wrap>
        <div className="flex flex-col gap-3 py-16 text-center items-center">
          <span className="text-2xl font-bold">هذه الصفحة لفريق Makers فقط</span>
          <span className="text-sm" style={{ color: MUTED }}>حسابك لا يملك صلاحية الإدارة.</span>
          <Link to="/" className="text-sm font-semibold" style={{ color: '#E85D04' }}>العودة إلى الدليل</Link>
        </div>
      </Wrap>
    )
  }

  const tabs: [Tab, string, number?][] = [
    ['overview', 'نظرة عامة'],
    ['review', 'المراجعة', stats?.pending],
    ['calls', 'الفرص', stats?.pending_calls],
    ['projects', 'المشاريع'],
    ['members', 'الأعضاء'],
    ['reports', 'البلاغات', openReports],
    ['specialties', 'التخصصات', stats?.pending_suggestions],
    ...(isAdmin ? ([['audit', 'السجل']] as [Tab, string][]) : []),
  ]
  const changed = () => { loadStats() }

  return (
    <Wrap>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] md:text-[34px] font-bold">لوحة الإدارة</h1>
          <span className="text-sm" style={{ color: MUTED }}>{profile.full_name} · {ROLE[profile.role]}</span>
        </div>
        <div className="flex gap-1 p-1 rounded-full overflow-x-auto self-start max-w-full" style={{ background: 'var(--c-surface-alt)' }}>
          {tabs.map(([k, l, n]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className="flex items-center gap-1.5 whitespace-nowrap text-[13px] px-4 py-2 rounded-full cursor-pointer" style={{ border: 'none', background: tab === k ? '#E85D04' : 'transparent', fontWeight: tab === k ? 600 : 400, color: tab === k ? '#fff' : MUTED }}>
              {l}
              {!!n && <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold text-white flex items-center justify-center" style={{ background: tab === k ? 'rgba(0,0,0,0.35)' : '#E85D04' }}>{n}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && <Overview stats={stats} onOpen={setOpenId} goReview={() => setTab('review')} />}
      {tab === 'review' && <Review specs={specs.list} onChanged={changed} />}
      {tab === 'calls' && <CallsReview onChanged={changed} />}
      {tab === 'projects' && <ProjectsAdmin />}
      {tab === 'members' && <Members specs={specs.list} onOpen={setOpenId} />}
      {tab === 'specialties' && <Specialties specs={specs.list} reload={async () => { await specs.reload(); changed() }} isAdmin={isAdmin} />}
      {tab === 'reports' && <Reports onChanged={loadReports} />}
      {tab === 'audit' && isAdmin && <Audit />}

      {openId && <MemberModal id={openId} specs={specs.list} isAdmin={isAdmin} selfId={profile.id} onClose={() => setOpenId(null)} onChanged={changed} />}
    </Wrap>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 sm:px-8 py-8 flex justify-center">
      {/* the admin panel stays Arabic whatever the site language */}
      <div dir="rtl" lang="ar" className="w-full max-w-[1120px] flex flex-col gap-6">{children}</div>
    </div>
  )
}

/* Insights */

interface InsightData {
  makers: number
  creators: number
  funnel: { signed_up: number; submitted: number; approved: number }
  views_7d: number
  views_30d: number
  visitors_30d: number
  requests_30d: number
  accept_rate: number | null
  avg_response_hours: number | null
  applications_30d: number
  messages_30d: number
  signups: { day: string; n: number }[] | null
  top_profiles: { id: string; name: string; username: string; views: number }[]
}

function Insights() {
  const [d, setD] = useState<InsightData | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  useEffect(() => { supabase.rpc('admin_insights').then(({ data }) => setD((data as InsightData) || null)) }, [])
  if (!d) return <Card className="p-6"><Skeleton className="h-40 w-full" /></Card>

  const series = d.signups || []
  const max = Math.max(1, ...series.map((x) => x.n))
  const hovered = hover !== null ? series[hover] : null
  const tiles: [string, string, string?][] = [
    ['صنّاع إنتاج منشورون', String(d.makers)],
    ['صنّاع محتوى منشورون', String(d.creators)],
    ['زيارات الصفحات', String(d.views_30d), `${d.views_7d} في آخر 7 أيام`],
    ['زوّار مختلفون', String(d.visitors_30d), 'آخر 30 يوماً'],
    ['طلبات تعاون', String(d.requests_30d), 'آخر 30 يوماً'],
    ['نسبة قبول الطلبات', d.accept_rate === null ? 'لا بيانات' : `${d.accept_rate}%`, 'آخر 90 يوماً'],
    ['متوسط زمن الرد', d.avg_response_hours === null ? 'لا بيانات' : `${d.avg_response_hours} ساعة`],
    ['رسائل متبادلة', String(d.messages_30d), `${d.applications_30d} تقديم على الفرص`],
  ]
  const funnel: [string, number][] = [['سجّلوا', d.funnel.signed_up], ['أرسلوا للمراجعة', d.funnel.submitted], ['نُشرت صفحاتهم', d.funnel.approved]]

  return (
    <div className="flex flex-col gap-4">
      <span className="text-[15px] font-bold">الأداء</span>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
        {tiles.map(([label, v, sub]) => (
          <div key={label} className="p-5 rounded-2xl flex flex-col gap-1" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
            <span className="text-[24px] font-bold" style={{ lineHeight: 1.1 }}>{v}</span>
            <span className="text-[13px] font-semibold">{label}</span>
            {sub && <span className="text-xs" style={{ color: MUTED }}>{sub}</span>}
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-[1fr_300px] gap-4">
        <Card className="p-5 md:p-6 flex flex-col gap-3">
          <div className="flex justify-between items-baseline text-xs" style={{ color: MUTED }}>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--c-text)' }}>التسجيلات يومياً، آخر 30 يوماً</span>
            <span aria-live="polite">{hovered ? `${formatDateAr(hovered.day)} · ${hovered.n} تسجيل` : ''}</span>
          </div>
          <div className="flex items-end h-28" dir="ltr" style={{ gap: 2, borderBottom: '1px solid var(--c-border)' }} onMouseLeave={() => setHover(null)} role="img" aria-label={`${d.funnel.signed_up} تسجيل في آخر 30 يوماً`}>
            {series.map((x, i) => (
              <div key={x.day} className="flex-1 h-full flex items-end" onMouseEnter={() => setHover(i)}>
                <div className="w-full" style={{ height: x.n ? `${Math.max(6, (x.n / max) * 100)}%` : 2, background: x.n ? '#E85D04' : 'var(--c-border-mid)', borderRadius: '4px 4px 0 0', opacity: hover === null || hover === i ? 1 : 0.45 }} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {funnel.map(([l, n], i) => (
              <span key={l} className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-full" style={{ background: 'var(--c-surface-alt)' }}>{l}: <b>{n}</b></span>
                {i < funnel.length - 1 && <span style={{ color: MUTED }}>←</span>}
              </span>
            ))}
          </div>
        </Card>
        <Card className="p-5 md:p-6 flex flex-col gap-2">
          <span className="text-[13px] font-semibold mb-1">أكثر الصفحات زيارة</span>
          {d.top_profiles.length === 0 && <span className="text-sm" style={{ color: MUTED }}>لا زيارات بعد.</span>}
          {d.top_profiles.map((p) => (
            <Link key={p.id} to={`/${p.username}`} className="flex justify-between gap-3 py-2 text-sm" style={{ borderBottom: '1px solid var(--c-surface-alt)' }}>
              <span className="truncate font-semibold">{p.name}</span>
              <span className="shrink-0" style={{ color: MUTED }}>{p.views}</span>
            </Link>
          ))}
        </Card>
      </div>
    </div>
  )
}

/* Reports */

const REPORT_REASON: Record<string, string> = { fake: 'حساب أو معلومات غير حقيقية', stolen: 'عمل منسوب لغير صاحبه', offensive: 'محتوى مسيء', spam: 'إزعاج أو إعلانات', other: 'سبب آخر' }

interface Ticket { id: number; opened_by: string; target_type: string | null; target_id: string | null; reason: string | null; message: string | null; status: string; resolution: string | null; created_at: string }

function Reports({ onChanged }: { onChanged: () => void }) {
  const [filter, setFilter] = useState<'open' | 'resolved'>('open')
  const [rows, setRows] = useState<Ticket[] | null>(null)
  const [names, setNames] = useState<Record<string, { name: string; username: string | null }>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState<number | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('tickets').select('id, opened_by, target_type, target_id, reason, message, status, resolution, created_at').eq('kind', 'report').eq('status', filter).order('created_at', { ascending: false }).limit(200)
    const list = (data as Ticket[]) || []
    setRows(list)
    const ids = [...new Set(list.flatMap((r) => [r.opened_by, r.target_type === 'profile' ? r.target_id : null]).filter(Boolean))] as string[]
    if (ids.length) {
      const { data: ps } = await supabase.from('profiles').select('id, full_name, name_ar, username').in('id', ids)
      const map: Record<string, { name: string; username: string | null }> = {}
      for (const p of (ps as Profile[]) || []) map[p.id] = { name: displayName(p), username: p.username }
      setNames(map)
    }
  }, [filter])
  useEffect(() => { setRows(null); load() }, [load])

  const resolve = async (id: number) => {
    setBusy(id)
    await supabase.rpc('resolve_ticket', { p_id: id, p_resolution: notes[id] || null })
    setBusy(null)
    load()
    onChanged()
  }
  const targetLink = (r: Ticket) =>
    r.target_type === 'profile' ? `/${names[r.target_id || '']?.username || ''}` : r.target_type === 'project' ? `/projects/${r.target_id}` : `/opportunities/${r.target_id}`
  const targetLabel = (r: Ticket) =>
    r.target_type === 'profile' ? `صفحة ${names[r.target_id || '']?.name || 'عضو'}` : r.target_type === 'project' ? 'مشروع' : 'فرصة'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Chip on={filter === 'open'} onClick={() => setFilter('open')}>مفتوحة</Chip>
        <Chip on={filter === 'resolved'} onClick={() => setFilter('resolved')}>تمت معالجتها</Chip>
      </div>
      {!rows ? <Spinner /> : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm" style={{ color: MUTED }}>{filter === 'open' ? 'لا توجد بلاغات مفتوحة.' : 'لا توجد بلاغات معالجة بعد.'}</Card>
      ) : rows.map((r) => (
        <Card key={r.id} className="p-5 md:p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-bold">{REPORT_REASON[r.reason || 'other'] || r.reason}</span>
              <span className="text-xs" style={{ color: MUTED }}>من {names[r.opened_by]?.name || 'عضو'} · {relativeAr(r.created_at)}</span>
            </div>
            <a href={targetLink(r)} target="_blank" rel="noreferrer" className="text-xs font-semibold whitespace-nowrap" style={{ color: '#E85D04' }}>{targetLabel(r)} ↗</a>
          </div>
          {r.message && <p dir="auto" className="m-0 text-sm whitespace-pre-line" style={{ color: 'var(--c-text-2)', lineHeight: 1.8 }}>{r.message}</p>}
          {r.status === 'open' ? (
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <TextInput value={notes[r.id] || ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} placeholder="ماذا فعلت؟ (يظهر في السجل)" style={{ height: 40 }} />
              <Btn className="!py-2 !px-4 text-[13px] shrink-0" disabled={busy === r.id} onClick={() => resolve(r.id)}>تمت المعالجة</Btn>
            </div>
          ) : r.resolution && <span className="text-xs" style={{ color: MUTED }}>الإجراء: {r.resolution}</span>}
        </Card>
      ))}
    </div>
  )
}

/* Overview */

function Overview({ stats, onOpen, goReview }: { stats: Stats | null; onOpen: (id: string) => void; goReview: () => void }) {
  const [recent, setRecent] = useState<Profile[]>([])
  useEffect(() => {
    supabase.rpc('admin_list_members', { p_status: null, p_search: null, p_limit: 8 }).then(({ data }) => setRecent((data as Profile[]) || []))
  }, [])
  if (!stats) return <Spinner />

  const tiles: [string, number, string?][] = [
    ['كل الأعضاء', stats.total, `${stats.signups_7d} هذا الأسبوع`],
    ['بانتظار المراجعة', stats.pending],
    ['صفحات منشورة', stats.approved],
    ['مسودات لم تُرسل', stats.draft],
    ['تحتاج تعديلاً', stats.rejected],
    ['أعمال مضافة', stats.works],
    ['طلبات تعاون', stats.requests_total, `${stats.requests_7d} هذا الأسبوع`],
    ['طلبات مقبولة', stats.requests_accepted],
  ]

  return (
    <div className="flex flex-col gap-6">
      {stats.pending > 0 && (
        <button type="button" onClick={goReview} className="flex items-center justify-between gap-3 px-6 py-5 rounded-2xl cursor-pointer text-right" style={{ background: '#E85D04', color: '#fff', border: 'none' }}>
          <span className="flex flex-col gap-1">
            <span className="text-lg font-bold">{stats.pending === 1 ? 'صفحة واحدة بانتظار المراجعة' : stats.pending === 2 ? 'صفحتان بانتظار المراجعة' : `${stats.pending} صفحات بانتظار المراجعة`}</span>
            <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.82)' }}>أصحابها ينتظرون قرارك لتظهر صفحاتهم في الدليل</span>
          </span>
          <span className="text-sm font-semibold px-5 py-2.5 rounded-full" style={{ background: 'var(--c-surface)', color: 'var(--c-text)' }}>ابدأ المراجعة</span>
        </button>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
        {tiles.map(([label, n, sub]) => (
          <div key={label} className="p-5 rounded-2xl flex flex-col gap-1" style={{ background: 'var(--c-surface-alt)' }}>
            <span className="mono text-[30px] font-bold" style={{ lineHeight: 1.1 }}>{n}</span>
            <span className="text-[13px] font-semibold">{label}</span>
            {sub && <span className="text-xs" style={{ color: MUTED }}>{sub}</span>}
          </div>
        ))}
      </div>
      <Insights />
      <Card className="p-5 md:p-7 flex flex-col gap-2">
        <span className="text-[15px] font-bold mb-2">آخر التسجيلات</span>
        {recent.map((m) => <MemberRow key={m.id} m={m} specs={[]} onClick={() => onOpen(m.id)} compact />)}
        {recent.length === 0 && <span className="text-sm" style={{ color: MUTED }}>لا يوجد أعضاء بعد.</span>}
      </Card>
    </div>
  )
}

function MemberRow({ m, specs, onClick, compact }: { m: Profile; specs: Specialty[]; onClick: () => void; compact?: boolean }) {
  const role = memberLine(specs, m)
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3.5 py-3 px-2 rounded-2xl cursor-pointer text-right bg-transparent hover:bg-[var(--c-surface-alt)]" style={{ border: 'none', borderBottom: '1px solid var(--c-surface-alt)' }}>
      <Avatar url={m.avatar_url} name={m.full_name} size={compact ? 38 : 44} />
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="text-[15px] font-semibold truncate">{m.full_name || 'بدون اسم'}{m.role !== 'member' && <span className="text-xs font-normal" style={{ color: '#E85D04' }}> · {ROLE[m.role]}</span>}{isCreator(m) && <span className="text-xs font-normal" style={{ color: MUTED }}> · صانع محتوى</span>}</span>
        <span className="text-xs truncate" dir="ltr" style={{ color: MUTED, textAlign: 'right' }}>{m.email}</span>
        {!compact && role && <span className="text-xs truncate" style={{ color: 'var(--c-text-2)' }}>{role}{m.country ? ` · ${m.country}` : ''}</span>}
      </span>
      <span className="flex flex-col items-end gap-1 shrink-0">
        <Pill tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Pill>
        <span className="text-[11px]" style={{ color: MUTED }}>{relativeAr(m.submitted_at || m.created_at)}</span>
      </span>
    </button>
  )
}

/* Review queue */

function Review({ specs, onChanged }: { specs: Specialty[]; onChanged: () => void }) {
  const [queue, setQueue] = useState<Profile[] | null>(null)
  const [sel, setSel] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('admin_list_members', { p_status: 'pending', p_search: null, p_limit: 200 })
    const list = ((data as Profile[]) || []).sort((a, b) => (a.submitted_at || a.created_at).localeCompare(b.submitted_at || b.created_at))
    setQueue(list)
    setSel((cur) => (cur && list.some((x) => x.id === cur) ? cur : list[0]?.id || null))
  }, [])
  useEffect(() => { load() }, [load])

  if (!queue) return <Spinner />
  if (queue.length === 0) {
    return (
      <Card className="p-10 text-center flex flex-col gap-2">
        <span className="text-lg font-bold">لا توجد صفحات بانتظار المراجعة</span>
        <span className="text-sm" style={{ color: MUTED }}>عندما يرسل عضو صفحته، ستظهر هنا.</span>
      </Card>
    )
  }
  const current = queue.find((q) => q.id === sel) || null

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
      <div className="md:w-[300px] shrink-0 flex flex-col gap-2">
        <span className="text-xs px-2" style={{ color: MUTED }}>الأقدم أولاً</span>
        {queue.map((q) => (
          <button key={q.id} type="button" onClick={() => setSel(q.id)} className="flex items-center gap-3 p-3.5 rounded-[22px] bg-[var(--c-surface)] cursor-pointer text-right" style={{ border: q.id === sel ? '1.5px solid var(--c-border-mid)' : '1px solid var(--c-border)' }}>
            <Avatar url={q.avatar_url} name={q.full_name} size={40} />
            <span className="flex-1 min-w-0 flex flex-col">
              <span className="text-sm font-semibold truncate">{q.full_name}</span>
              <span className="text-xs" style={{ color: MUTED }}>أُرسلت {relativeAr(q.submitted_at || q.created_at)}</span>
            </span>
          </button>
        ))}
      </div>
      {current && <ReviewDetail key={current.id} m={current} specs={specs} onDone={() => { load(); onChanged() }} />}
    </div>
  )
}

function useMemberContent(id: string) {
  const [works, setWorks] = useState<Work[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  useEffect(() => {
    supabase.from('works').select('*').eq('owner_id', id).order('sort').then(({ data }) => setWorks((data as Work[]) || []))
    supabase.from('awards').select('*').eq('owner_id', id).order('year').then(({ data }) => setAwards((data as Award[]) || []))
  }, [id])
  return { works, awards }
}

function ProfilePreview({ m, specs, works, awards }: { m: Profile; specs: Specialty[]; works: Work[]; awards: Award[] }) {
  const role = memberLine(specs, m)
  const socials = Object.entries(m.socials || {}).filter(([, v]) => v)
  const creator = isCreator(m)
  const checks: [string, boolean][] = creator
    ? [
        ['صورة', !!m.avatar_url],
        ['نوع المحتوى ودولة', (m.content_types?.length || 0) > 0 && !!m.country],
        ['نبذة', (m.bio || '').trim().length >= 20],
        ['حساب مع عدد متابعين', hasAudience(m)],
      ]
    : [
        ['صورة', !!m.avatar_url],
        ['تخصص ودولة', ((m.specialty_ids?.length || 0) > 0 || !!m.other_specialty) && !!m.country],
        ['نبذة', (m.bio || '').trim().length >= 20],
        ['3 أعمال', works.length >= 3],
      ]
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4 md:gap-6 items-center">
        <div className="w-[96px] h-[120px] md:w-[120px] md:h-[148px] rounded-[22px] overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--c-border)' }}>
          {m.avatar_url ? <img src={m.avatar_url} alt="" className="bw w-full h-full object-cover" /> : <span className="text-4xl" style={{ color: 'var(--c-muted)' }}>{(m.full_name || 'م').charAt(0)}</span>}
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-[13px]" style={{ color: MUTED }}>{[role, [m.city, m.country].filter(Boolean).join('، ')].filter(Boolean).join(' · ') || 'لم يحدد التخصص'}</span>
          <span className="text-[26px] md:text-[32px] font-bold" style={{ lineHeight: 1.2 }}>{m.full_name}</span>
          <span className="text-xs mono" dir="ltr" style={{ color: MUTED, textAlign: 'right' }}>makerss.net/{m.username} · {m.email}</span>
          {m.start_year && <span className="text-xs" style={{ color: 'var(--c-text-2)' }}>يعمل في المجال منذ {m.start_year}</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: 'rgba(232,93,4,0.14)', color: '#FB923C' }}>{creator ? 'صانع محتوى' : 'صانع إنتاج'}</span>
        {checks.map(([l, ok]) => (
          <span key={l} className="text-xs px-3 py-1.5 rounded-full" style={{ background: ok ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: ok ? '#4ADE80' : '#F87171' }}>{ok ? '✓' : '✕'} {l}</span>
        ))}
      </div>
      <Section title="النبذة">
        <p className="m-0 text-[15px] whitespace-pre-line" style={{ lineHeight: 1.9 }}>{m.bio || <span style={{ color: MUTED }}>لا توجد نبذة.</span>}</p>
      </Section>
      <Section title={`الأعمال (${works.length})`}>
        {works.length === 0 && <span className="text-sm" style={{ color: MUTED }}>لم يضف أعمالاً.</span>}
        {works.map((w) => (
          <a key={w.id} href={w.url || undefined} target="_blank" rel="noreferrer" className="flex justify-between gap-3 py-2.5 text-sm" style={{ borderBottom: '1px solid var(--c-surface-alt)' }}>
            <span className="font-semibold truncate">{w.title}{w.role ? <span className="font-normal" style={{ color: MUTED }}> · {w.role}</span> : ''}</span>
            <span className="shrink-0 text-xs" style={{ color: '#E85D04' }}>{w.platform || 'رابط'} {w.year || ''} ↗</span>
          </a>
        ))}
      </Section>
      {awards.length > 0 && (
        <Section title="الجوائز">
          {awards.map((a) => <span key={a.id} className="text-sm py-1">{a.rank}{a.org ? ` · ${a.org}` : ''}{a.year ? ` · ${a.year}` : ''}</span>)}
        </Section>
      )}
      {socials.length > 0 && (
        <Section title="الحسابات">
          <div className="flex flex-wrap gap-2">
            {socials.map(([k, v]) => (
              <a key={k} href={v.startsWith('http') ? v : `https://${v}`} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-full" style={{ border: '1px solid var(--c-border)' }}>{k}{m.followers?.[k] ? ` · ${m.followers[k].toLocaleString('en')}` : ''}</a>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold">{title}</span>
      {children}
    </div>
  )
}

function ReviewDetail({ m, specs, onDone }: { m: Profile; specs: Specialty[]; onDone: () => void }) {
  const { works, awards } = useMemberContent(m.id)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const decide = async (status: MemberStatus) => {
    if (status === 'rejected' && note.trim().length < 5) return setError('اكتب للعضو ما الذي يحتاج تعديلاً، حتى يعرف ماذا يصلح.')
    setBusy(true)
    setError(null)
    const { error } = await supabase.rpc('admin_review_member', { p_id: m.id, p_status: status, p_note: note.trim() || null })
    setBusy(false)
    if (error) return setError('تعذّر حفظ القرار. حاول مرة أخرى.')
    onDone()
  }

  return (
    <Card className="flex-1 p-5 md:p-8 flex flex-col gap-6">
      <ProfilePreview m={m} specs={specs} works={works} awards={awards} />
      <div className="flex flex-col gap-3 pt-5" style={{ borderTop: '1px solid var(--c-surface-alt)' }}>
        <Field label="ملاحظة للعضو" hint="تظهر له إذا طلبت تعديلاً">
          <TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: أضف رابطين لأعمال أخرى، والصورة غير واضحة." />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap gap-2.5">
          <Btn disabled={busy} onClick={() => decide('approved')}>انشر الصفحة</Btn>
          <Btn variant="outline" disabled={busy} onClick={() => decide('rejected')}>تحتاج تعديلاً</Btn>
          <a href={`/${m.username}`} target="_blank" rel="noreferrer" className="text-sm px-5 py-3 rounded-full" style={{ color: '#E85D04' }}>افتح الصفحة ↗</a>
        </div>
      </div>
    </Card>
  )
}

/* Members */

function Members({ specs, onOpen }: { specs: Specialty[]; onOpen: (id: string) => void }) {
  const [status, setStatus] = useState<MemberStatus | ''>('')
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Profile[] | null>(null)

  useEffect(() => {
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc('admin_list_members', { p_status: status || null, p_search: q.trim() || null, p_limit: 300 })
      setRows((data as Profile[]) || [])
    }, 250)
    return () => clearTimeout(t)
  }, [status, q])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="md:w-[340px]"><TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو البريد أو المدينة" /></div>
        <div className="flex flex-wrap gap-1.5">
          <Chip on={status === ''} onClick={() => setStatus('')}>الكل</Chip>
          {(Object.keys(STATUS) as MemberStatus[]).map((s) => <Chip key={s} on={status === s} onClick={() => setStatus(s)}>{STATUS[s].label}</Chip>)}
        </div>
      </div>
      <Card className="p-3 md:p-5">
        {rows === null ? <Spinner /> : rows.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: MUTED }}>لا توجد نتائج.</div>
        ) : (
          <>
            <span className="block text-xs px-2 pb-2" style={{ color: MUTED }}>{rows.length} عضو</span>
            {rows.map((m) => <MemberRow key={m.id} m={m} specs={specs} onClick={() => onOpen(m.id)} />)}
          </>
        )}
      </Card>
    </div>
  )
}

function MemberModal({ id, specs, isAdmin, selfId, onClose, onChanged }: { id: string; specs: Specialty[]; isAdmin: boolean; selfId: string; onClose: () => void; onChanged: () => void }) {
  const [m, setM] = useState<Profile | null>(null)
  const { works, awards } = useMemberContent(id)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('admin_get_member', { p_id: id })
    setM(((data as Profile[]) || [])[0] || null)
  }, [id])
  useEffect(() => { load() }, [load])

  const run = async (fn: () => PromiseLike<{ error: unknown }>, msg: string) => {
    setBusy(true)
    setError(null)
    setDone(null)
    const { error } = await fn()
    setBusy(false)
    if (error) return setError('تعذّر تنفيذ العملية.')
    setDone(msg)
    await load()
    onChanged()
  }

  if (!m) return <Modal title="العضو" onClose={onClose}><Spinner /></Modal>
  const setStatus = (s: MemberStatus, msg: string) => run(() => supabase.rpc('admin_review_member', { p_id: m.id, p_status: s, p_note: note.trim() || null }), msg)

  return (
    <Modal title={m.full_name || 'العضو'} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Pill>
        <Pill>{ROLE[m.role]}</Pill>
        {m.is_founding && <Pill>عضو مؤسس</Pill>}
        {m.is_featured && <Pill tone="blue">اختيار الأسبوع</Pill>}
        <span className="text-xs" style={{ color: MUTED }}>انضم {relativeAr(m.created_at)}</span>
      </div>
      <ProfilePreview m={m} specs={specs} works={works} awards={awards} />
      {m.review_note && <Notice>آخر ملاحظة: {m.review_note}</Notice>}

      <div className="flex flex-col gap-3 pt-4" style={{ borderTop: '1px solid var(--c-surface-alt)' }}>
        <span className="text-[13px] font-semibold">حالة الصفحة</span>
        <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة (اختيارية، تظهر للعضو عند طلب التعديل)" />
        <div className="flex flex-wrap gap-2">
          {m.status !== 'approved' && <Btn disabled={busy} onClick={() => setStatus('approved', 'نُشرت الصفحة.')}>انشر</Btn>}
          {m.status !== 'rejected' && <Btn variant="outline" disabled={busy} onClick={() => setStatus('rejected', 'طُلب التعديل من العضو.')}>تحتاج تعديلاً</Btn>}
          {m.status !== 'suspended' && m.id !== selfId && <Btn variant="danger" disabled={busy} onClick={() => setStatus('suspended', 'أُوقف الحساب.')}>إيقاف</Btn>}
          {m.status === 'suspended' && <Btn variant="soft" disabled={busy} onClick={() => setStatus('draft', 'أُعيد الحساب إلى مسودة.')}>إلغاء الإيقاف</Btn>}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4" style={{ borderTop: '1px solid var(--c-surface-alt)' }}>
        <span className="text-[13px] font-semibold">مزايا</span>
        <div className="flex flex-wrap gap-2">
          <Btn variant="soft" disabled={busy || m.status !== 'approved'} onClick={() => run(() => supabase.rpc('admin_set_featured', { p_id: m.id, p_value: !m.is_featured }), m.is_featured ? 'أُزيل من اختيار الأسبوع.' : 'أصبح اختيار الأسبوع.')}>
            {m.is_featured ? 'إزالة من اختيار الأسبوع' : 'اجعله اختيار الأسبوع'}
          </Btn>
          {isAdmin && (
            <Btn variant="soft" disabled={busy} onClick={() => run(() => supabase.rpc('admin_set_founding', { p_id: m.id, p_value: !m.is_founding }), m.is_founding ? 'أُزيلت صفة العضو المؤسس.' : 'أصبح عضواً مؤسساً.')}>
              {m.is_founding ? 'إزالة صفة المؤسس' : 'اجعله عضواً مؤسساً'}
            </Btn>
          )}
        </div>
        {m.status !== 'approved' && <span className="text-xs" style={{ color: MUTED }}>اختيار الأسبوع متاح للصفحات المنشورة فقط.</span>}
      </div>

      {isAdmin && m.id !== selfId && (
        <div className="flex flex-col gap-2 pt-4" style={{ borderTop: '1px solid var(--c-surface-alt)' }}>
          <Field label="الصلاحية" hint="المراجع يراجع الصفحات فقط، والأدمن يملك كل شيء">
            <SelectInput value={m.role} disabled={busy} onChange={(e) => run(() => supabase.rpc('admin_set_role', { p_id: m.id, p_role: e.target.value, p_reason: note.trim() || null }), 'تم تغيير الصلاحية.')}>
              {(Object.keys(ROLE) as MemberRole[]).map((r) => <option key={r} value={r}>{ROLE[r]}</option>)}
            </SelectInput>
          </Field>
        </div>
      )}

      {error && <Notice tone="error">{error}</Notice>}
      {done && <Notice tone="success">{done}</Notice>}
      <a href={`/${m.username}`} target="_blank" rel="noreferrer" className="self-start text-sm font-semibold" style={{ color: '#E85D04' }}>افتح صفحته ↗</a>
    </Modal>
  )
}

/* Specialties */

function Specialties({ specs, reload, isAdmin }: { specs: Specialty[]; reload: () => Promise<void>; isAdmin: boolean }) {
  const [sugg, setSugg] = useState<{ id: number; name: string; created_at: string }[]>([])
  const [ar, setAr] = useState('')
  const [en, setEn] = useState('')
  const [video, setVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSugg = useCallback(async () => {
    const { data } = await supabase.from('specialty_suggestions').select('id, name, created_at').eq('status', 'pending').order('created_at', { ascending: false })
    setSugg(data || [])
  }, [])
  useEffect(() => { loadSugg() }, [loadSugg])

  const nextSort = useMemo(() => (specs.at(-1)?.sort || 100) + 10, [specs])
  const add = async (nameAr: string, nameEn: string, isVideo: boolean) => {
    setError(null)
    const { error } = await supabase.from('specialties').insert({ name_ar: nameAr.trim(), name_en: (nameEn || nameAr).trim(), is_video: isVideo, sort: nextSort })
    if (error) { setError('تعذّرت الإضافة. ربما التخصص موجود.'); return false }
    await reload()
    return true
  }
  const resolve = async (id: number, name: string, accept: boolean) => {
    if (accept && !(await add(name, name, false))) return
    await supabase.from('specialty_suggestions').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', id)
    loadSugg()
    reload()
  }
  const toggle = async (s: Specialty) => {
    await supabase.from('specialties').update({ is_active: !s.is_active }).eq('id', s.id)
    reload()
  }

  return (
    <div className="grid md:grid-cols-[1fr_340px] gap-4 md:gap-6 items-start">
      <Card className="p-4 md:p-6 flex flex-col">
        <span className="text-[15px] font-bold mb-3">التخصصات ({specs.filter((s) => s.is_active).length} ظاهرة)</span>
        {specs.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 py-2.5" style={{ borderBottom: '1px solid var(--c-surface-alt)', opacity: s.is_active ? 1 : 0.5 }}>
            <span className="text-sm">
              <span className="font-semibold">{s.name_ar || s.name_en}</span>
              <span className="text-xs" style={{ color: MUTED }}> · {s.name_en}{s.is_video ? ' · فيديو' : ''}</span>
            </span>
            {isAdmin && <button type="button" onClick={() => toggle(s)} className="text-xs px-3 py-1.5 rounded-full cursor-pointer" style={{ background: 'var(--c-surface-alt)', border: 'none' }}>{s.is_active ? 'إخفاء' : 'إظهار'}</button>}
          </div>
        ))}
      </Card>
      <div className="flex flex-col gap-4">
        <Card className="p-5 flex flex-col gap-3">
          <span className="text-[15px] font-bold">اقتراحات الأعضاء</span>
          {sugg.length === 0 && <span className="text-sm" style={{ color: MUTED }}>لا توجد اقتراحات جديدة.</span>}
          {sugg.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-sm font-semibold">{s.name}</span>
              {isAdmin && (
                <span className="flex gap-1.5">
                  <button type="button" onClick={() => resolve(s.id, s.name, true)} className="text-xs px-3 py-1.5 rounded-full cursor-pointer text-white" style={{ background: '#E85D04', border: 'none' }}>أضف</button>
                  <button type="button" onClick={() => resolve(s.id, s.name, false)} className="text-xs px-3 py-1.5 rounded-full cursor-pointer" style={{ background: 'var(--c-surface-alt)', border: 'none' }}>تجاهل</button>
                </span>
              )}
            </div>
          ))}
        </Card>
        {isAdmin && (
          <Card className="p-5 flex flex-col gap-3">
            <span className="text-[15px] font-bold">أضف تخصصاً</span>
            <TextInput value={ar} onChange={(e) => setAr(e.target.value)} placeholder="الاسم بالعربي" />
            <TextInput value={en} onChange={(e) => setEn(e.target.value)} placeholder="الاسم بالإنجليزي" dir="ltr" />
            <Chip on={video} onClick={() => setVideo(!video)} className="self-start">تخصص فيديو (يسأل عن قصير وطويل)</Chip>
            {error && <Notice tone="error">{error}</Notice>}
            <Btn disabled={ar.trim().length < 2} onClick={async () => { if (await add(ar, en, video)) { setAr(''); setEn(''); setVideo(false) } }}>إضافة</Btn>
          </Card>
        )}
      </div>
    </div>
  )
}

/* Audit log */

function actionAr(a: string) {
  const [k, v] = a.split(':')
  if (k === 'set_status') return `غيّر الحالة إلى «${STATUS[v as MemberStatus]?.label || v}»`
  if (k === 'set_role') return `غيّر الصلاحية إلى «${ROLE[v as MemberRole] || v}»`
  if (k === 'set_founding') return v === 'true' ? 'منح صفة العضو المؤسس' : 'أزال صفة العضو المؤسس'
  if (k === 'set_featured') return v === 'true' ? 'جعله اختيار الأسبوع' : 'أزاله من اختيار الأسبوع'
  if (k === 'resolve_ticket') return 'عالج بلاغاً'
  if (k === 'project_delete') return 'حذف مشروعاً'
  return a
}

function Audit() {
  const [rows, setRows] = useState<{ id: number; admin_id: string; action: string; target_id: string; reason: string | null; created_at: string }[] | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  useEffect(() => {
    supabase.from('admin_audit_log').select('id, admin_id, action, target_id, reason, created_at').order('created_at', { ascending: false }).limit(200).then(({ data }) => setRows(data || []))
    supabase.rpc('admin_list_members', { p_status: null, p_search: null, p_limit: 1000 }).then(({ data }) => {
      const map: Record<string, string> = {}
      for (const p of (data as Profile[]) || []) map[p.id] = p.full_name || p.email || p.id.slice(0, 8)
      setNames(map)
    })
  }, [])
  if (!rows) return <Spinner />
  return (
    <Card className="p-4 md:p-6">
      {rows.length === 0 && <div className="p-6 text-center text-sm" style={{ color: MUTED }}>لا توجد عمليات بعد.</div>}
      {rows.map((r) => (
        <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 py-3" style={{ borderBottom: '1px solid var(--c-surface-alt)' }}>
          <span className="text-xs md:w-[110px] shrink-0" style={{ color: MUTED }}>{relativeAr(r.created_at)}</span>
          <span className="text-sm flex-1">
            <span className="font-semibold">{names[r.admin_id] || 'أدمن'}</span> {actionAr(r.action)} لـ <span className="font-semibold">{names[r.target_id] || 'عضو'}</span>
            {r.reason && <span style={{ color: MUTED }}> · {r.reason}</span>}
          </span>
        </div>
      ))}
    </Card>
  )
}

/* Open calls review */

function CallsReview({ onChanged }: { onChanged: () => void }) {
  const [filter, setFilter] = useState<OpenCall['status']>('pending')
  const [list, setList] = useState<OpenCall[] | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const load = useCallback(async () => {
    const { data } = await supabase.from('open_calls').select(CALL_SELECT).eq('status', filter).order('created_at', { ascending: false }).limit(100)
    setList((data as unknown as OpenCall[]) || [])
  }, [filter])
  useEffect(() => { setList(null); load() }, [load])
  const act = async (id: string, approve: boolean) => {
    setBusy(id)
    await supabase.rpc('admin_review_open_call', { p_id: id, p_approve: approve, p_note: notes[id] || null })
    setBusy(null)
    load(); onChanged()
  }
  const close = async (id: string) => { setBusy(id); await supabase.rpc('close_open_call', { p_id: id }); setBusy(null); load(); onChanged() }
  const labels: Record<OpenCall['status'], string> = { pending: 'بانتظار المراجعة', open: 'منشورة', closed: 'مغلقة', rejected: 'مرفوضة' }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">{(Object.keys(labels) as OpenCall['status'][]).map((k) => <Chip key={k} on={filter === k} onClick={() => setFilter(k)}>{labels[k]}</Chip>)}</div>
      {!list ? <Spinner /> : list.length === 0 ? <Card className="p-8 text-center text-sm" style={{ color: MUTED }}>لا توجد فرص في هذا القسم.</Card> : list.map((c) => (
        <Card key={c.id} className="p-5 md:p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold">{c.title}</span>
              <span className="text-xs" style={{ color: MUTED }}>{[c.org, kindLabel(c.kind), c.remote ? 'عن بُعد' : [c.city, c.country].filter(Boolean).join('، '), budgetLabel(c.budget), c.deadline ? `آخر موعد ${formatDateAr(c.deadline)}` : ''].filter(Boolean).join(' · ')}</span>
            </div>
            <span className="text-xs whitespace-nowrap" style={{ color: MUTED }}>{relativeAr(c.created_at)}</span>
          </div>
          <p dir="auto" className="m-0 text-sm whitespace-pre-line" style={{ color: 'var(--c-text-2)', lineHeight: 1.8 }}>{c.description}</p>
          {c.owner && <Link to={`/${c.owner.username}`} className="text-xs font-semibold" style={{ color: '#E85D04' }}>نشرها: {displayName(c.owner)}</Link>}
          {filter === 'pending' && (
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <TextInput value={notes[c.id] || ''} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} placeholder="ملاحظة لصاحب الفرصة عند الرفض (اختياري)" style={{ height: 40 }} />
              <div className="flex gap-2 shrink-0">
                <Btn className="!py-2 !px-4 text-[13px]" disabled={busy === c.id} onClick={() => act(c.id, true)}>انشر</Btn>
                <Btn variant="danger" className="!py-2 !px-4 text-[13px]" disabled={busy === c.id} onClick={() => act(c.id, false)}>ارفض</Btn>
              </div>
            </div>
          )}
          {filter === 'open' && <div className="flex gap-2 items-center"><span className="text-xs" style={{ color: MUTED }}>{c.applicants_count} متقدّم</span><Btn variant="outline" className="!py-2 !px-4 text-[13px] ms-auto" disabled={busy === c.id} onClick={() => close(c.id)}>أغلق الفرصة</Btn></div>}
        </Card>
      ))}
    </div>
  )
}

/* Projects moderation */

function ProjectsAdmin() {
  const [list, setList] = useState<Project[] | null>(null)
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<Project | null>(null)
  const load = useCallback(() => { listProjects({ limit: 300 }).then(setList).catch(() => setList([])) }, [])
  useEffect(load, [load])
  const del = async (p: Project) => {
    await supabase.from('works').delete().eq('id', p.id)
    await supabase.from('admin_audit_log').insert({ action: 'project_delete', target_type: 'work', target_id: p.id, reason: p.title }).then(() => null, () => null)
    setConfirm(null)
    load()
  }
  const shown = (list || []).filter((p) => !q || `${p.title} ${p.brand || ''} ${displayName(p.owner)}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="flex flex-col gap-4">
      <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم المشروع أو صاحبه" />
      {!list ? <Spinner /> : shown.length === 0 ? <Card className="p-8 text-center text-sm" style={{ color: MUTED }}>لا توجد مشاريع.</Card> : (
        <Card className="overflow-hidden">
          {shown.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < shown.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
              <span className="shrink-0 rounded-md overflow-hidden" style={{ width: 36, height: 54, background: 'var(--c-surface-alt)' }}>{posterOf(p) && <img src={posterOf(p)!} alt="" className="w-full h-full object-cover" />}</span>
              <span className="flex-1 min-w-0">
                <Link to={`/projects/${p.id}`} className="block text-sm font-semibold truncate hover:underline">{p.title}</Link>
                <span className="block text-xs truncate" style={{ color: MUTED }}>{[displayName(p.owner), p.year, `${p.credits?.length || 0} في الطاقم`, relativeAr(p.created_at)].filter(Boolean).join(' · ')}</span>
              </span>
              <Link to={`/projects/${p.id}/edit`} className="text-xs" style={{ color: '#E85D04' }}>تعديل</Link>
              <button type="button" onClick={() => setConfirm(p)} className="text-xs cursor-pointer" style={{ background: 'none', border: 'none', color: '#F87171' }}>حذف</button>
            </div>
          ))}
        </Card>
      )}
      {confirm && (
        <Modal title="حذف المشروع؟" onClose={() => setConfirm(null)} footer={<><Btn variant="danger" onClick={() => del(confirm)}>احذف</Btn><Btn variant="outline" onClick={() => setConfirm(null)}>إلغاء</Btn></>}>
          <p className="m-0 text-sm" style={{ color: MUTED }}>سيُحذف «{confirm.title}» وكل أسماء الطاقم المرتبطة به.</p>
        </Modal>
      )}
    </div>
  )
}
