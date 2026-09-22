import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Navigate } from '../lib/legacyNav'
import { useAuth } from '../lib/auth'
import { supabase, type MemberRole, type MemberStatus, type Profile, type Specialty } from '../lib/supabase'
import { Button, Card, Input, Label, Notice, Select, StatusBadge, Textarea, ORANGE } from '../components/ui'

type Tab = 'overview' | 'applications' | 'members' | 'specialties' | 'audit'

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  suspended: number
  draft: number
  signups_today: number
  signups_7d: number
  creators: number
  makers: number
  works: number
  collabs_7d: number
  open_tickets: number
  pending_suggestions: number
}

export default function Admin({ navigate }: { navigate: Navigate }) {
  const { session, profile, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')
  const [specialties, setSpecialties] = useState<Specialty[]>([])

  const loadSpecialties = useCallback(async () => {
    const { data } = await supabase.from('specialties').select('*').order('sort')
    setSpecialties((data as Specialty[]) || [])
  }, [])

  useEffect(() => {
    if (profile && (profile.role === 'admin' || profile.role === 'reviewer')) loadSpecialties()
  }, [profile, loadSpecialties])

  if (loading) return <div className="px-8 py-20 font-inter text-muted">Loading…</div>

  if (!session) {
    return (
      <div className="px-8 py-20 max-w-md">
        <h1 className="font-inter font-bold text-paper text-3xl mb-3">Admin</h1>
        <p className="font-inter text-muted text-sm mb-6">Sign in with an admin account to continue.</p>
        <Button onClick={() => navigate({ name: 'auth', mode: 'signin', next: { name: 'admin' } })}>Sign in</Button>
      </div>
    )
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'reviewer')) {
    return (
      <div className="px-8 py-20 max-w-md">
        <h1 className="font-inter font-bold text-paper text-3xl mb-3">No access</h1>
        <p className="font-inter text-muted text-sm">This account ({session.user.email}) does not have admin access.</p>
      </div>
    )
  }

  const isAdmin = profile.role === 'admin'
  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'applications', label: 'Applications' },
    { id: 'members', label: 'Members' },
    { id: 'specialties', label: 'Specialties' },
    { id: 'audit', label: 'Audit log', adminOnly: true },
  ]

  return (
    <div className="px-5 sm:px-8 py-10 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="font-inter text-muted text-xs uppercase mb-2" style={{ letterSpacing: '0.14em', fontWeight: 600 }}>Makers control room</div>
          <h1 className="font-inter font-bold text-paper" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>Admin</h1>
        </div>
        <div className="font-inter text-xs text-muted">{session.user.email} · {profile.role}</div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {tabs.filter((t) => !t.adminOnly || isAdmin).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="font-inter text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap"
            style={{
              background: tab === t.id ? ORANGE : 'var(--c-surface)',
              color: tab === t.id ? '#fff' : 'var(--c-text)',
              border: `1px solid ${tab === t.id ? ORANGE : 'var(--c-border)'}`,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview onOpen={setTab} />}
      {tab === 'applications' && <MembersTable key="apps" fixedStatus="pending" specialties={specialties} isAdmin={isAdmin} />}
      {tab === 'members' && <MembersTable key="members" specialties={specialties} isAdmin={isAdmin} />}
      {tab === 'specialties' && <Specialties specialties={specialties} reload={loadSpecialties} isAdmin={isAdmin} />}
      {tab === 'audit' && isAdmin && <AuditLog />}
    </div>
  )
}

function Overview({ onOpen }: { onOpen: (t: Tab) => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.rpc('admin_stats').then(({ data, error }) => {
      if (error) setError(error.message)
      else setStats(data as Stats)
    })
  }, [])

  if (error) return <Notice tone="error">{error}</Notice>
  if (!stats) return <div className="font-inter text-muted text-sm">Loading…</div>

  const tiles: { label: string; value: number; tab?: Tab; accent?: boolean }[] = [
    { label: 'Pending applications', value: stats.pending, tab: 'applications', accent: true },
    { label: 'Signups today', value: stats.signups_today },
    { label: 'Signups last 7 days', value: stats.signups_7d },
    { label: 'Approved members', value: stats.approved, tab: 'members' },
    { label: 'Approved Makers', value: stats.makers },
    { label: 'Approved Creators', value: stats.creators },
    { label: 'Started, not submitted', value: stats.draft },
    { label: 'Rejected', value: stats.rejected },
    { label: 'Suspended', value: stats.suspended },
    { label: 'Works added', value: stats.works },
    { label: 'Collab requests (7d)', value: stats.collabs_7d },
    { label: 'Specialty suggestions', value: stats.pending_suggestions, tab: 'specialties' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <button
          key={t.label}
          onClick={() => t.tab && onOpen(t.tab)}
          className="text-left rounded-2xl p-5"
          style={{
            background: t.accent ? 'rgba(232,93,4,0.12)' : 'var(--c-surface)',
            border: `1px solid ${t.accent ? 'rgba(232,93,4,0.45)' : 'var(--c-border)'}`,
            cursor: t.tab ? 'pointer' : 'default',
            color: 'var(--c-text)',
          }}
        >
          <div className="font-inter font-bold" style={{ fontSize: 30, letterSpacing: '-0.02em' }}>{t.value}</div>
          <div className="font-inter text-muted text-xs mt-1">{t.label}</div>
        </button>
      ))}
    </div>
  )
}

function MembersTable({ fixedStatus, specialties, isAdmin }: { fixedStatus?: MemberStatus; specialties: Specialty[]; isAdmin: boolean }) {
  const [status, setStatus] = useState<MemberStatus | ''>(fixedStatus || '')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Profile | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('admin_list_members', {
      p_status: (fixedStatus || status || null) as MemberStatus | null,
      p_search: search || null,
      p_limit: 300,
    })
    if (error) setError(error.message)
    else setRows((data as Profile[]) || [])
    setLoading(false)
  }, [fixedStatus, status, search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const specName = useMemo(() => Object.fromEntries(specialties.map((s) => [s.id, s.name_en])), [specialties])

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, city" style={{ maxWidth: 320 }} />
        {!fixedStatus && (
          <Select value={status} onChange={(e) => setStatus(e.target.value as MemberStatus | '')} style={{ maxWidth: 200 }}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
            <option value="draft">Draft (not submitted)</option>
          </Select>
        )}
        <Button variant="ghost" onClick={load}>Refresh</Button>
        <span className="font-inter text-muted text-xs self-center">{rows.length} results</span>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {loading && rows.length === 0 && <div className="font-inter text-muted text-sm">Loading…</div>}
      {!loading && rows.length === 0 && <Card><span className="font-inter text-muted text-sm">{fixedStatus === 'pending' ? 'No applications waiting. Nice.' : 'No members match.'}</span></Card>}

      <div className="flex flex-col gap-2">
        {rows.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m)}
            className="flex items-center gap-4 rounded-2xl p-3 text-left"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', cursor: 'pointer', color: 'var(--c-text)' }}
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--c-surface-alt)' }}>
              {m.avatar_url && <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-inter font-semibold text-sm truncate">
                {m.full_name || 'No name yet'} {m.is_founding && <span style={{ color: ORANGE }}>· Founding</span>}
              </div>
              <div className="font-inter text-muted text-xs truncate">
                {m.email} · {m.account_type === 'creator' ? 'Creator' : m.account_type === 'maker' ? 'Maker' : 'Type not set'}
                {m.specialty_ids?.length ? ` · ${m.specialty_ids.map((id) => specName[id]).filter(Boolean).join(', ')}` : ''}
                {m.city ? ` · ${m.city}` : ''}
              </div>
            </div>
            <div className="hidden sm:block font-inter text-muted text-xs">{new Date(m.submitted_at || m.created_at).toLocaleDateString()}</div>
            {m.role !== 'member' && <span className="font-inter text-xs font-semibold" style={{ color: ORANGE }}>{m.role}</span>}
            <StatusBadge status={m.status} />
          </button>
        ))}
      </div>

      {selected && (
        <MemberDrawer
          member={selected}
          specName={specName}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            setSelected(null)
            await load()
          }}
        />
      )}
    </div>
  )
}

function MemberDrawer({ member: m, specName, isAdmin, onClose, onChanged }: {
  member: Profile
  specName: Record<number, string>
  isAdmin: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [note, setNote] = useState(m.review_note || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    setBusy(true)
    setError(null)
    const { error } = await fn()
    setBusy(false)
    if (error) setError(error.message)
    else onChanged()
  }

  const review = (s: MemberStatus) => run(() => supabase.rpc('admin_review_member', { p_id: m.id, p_status: s, p_note: note || null }))
  const setRole = (r: MemberRole) => run(() => supabase.rpc('admin_set_role', { p_id: m.id, p_role: r, p_reason: note || null }))
  const setFounding = (v: boolean) => run(() => supabase.rpc('admin_set_founding', { p_id: m.id, p_value: v }))

  const row = (label: string, value: React.ReactNode) =>
    value ? (
      <div className="flex flex-col gap-1">
        <span className="font-inter text-muted text-xs uppercase" style={{ letterSpacing: '0.1em', fontWeight: 600 }}>{label}</span>
        <div className="font-inter text-sm text-paper break-words">{value}</div>
      </div>
    ) : null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto p-6 pb-32 flex flex-col gap-5" style={{ background: 'var(--c-bg)', borderLeft: '1px solid var(--c-border)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface-alt)' }}>
              {m.avatar_url && <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <div className="font-inter font-bold text-paper text-lg">{m.full_name || 'No name yet'}</div>
              {m.name_ar && <div className="font-arabic text-muted text-sm" dir="rtl">{m.name_ar}</div>}
              <div className="mt-1.5"><StatusBadge status={m.status} /></div>
            </div>
          </div>
          <button onClick={onClose} className="font-inter text-muted text-xl" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        {row('Email', m.email)}
        {row('Type', m.account_type === 'creator' ? 'Content Creator' : m.account_type === 'maker' ? 'Maker' : null)}
        {row('Location', [m.city, m.country].filter(Boolean).join(', '))}
        {row('Specialties', [...(m.specialty_ids || []).map((id) => specName[id]), m.other_specialty].filter(Boolean).join(', '))}
        {row('Video length', m.video_length)}
        {row('Content types', m.content_types?.join(', '))}
        {row('Bio', m.bio)}
        {row('Works', m.work_links?.length ? (
          <div className="flex flex-col gap-1">
            {m.work_links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ color: ORANGE }} className="truncate">
                {l.type ? `[${l.type}] ` : ''}{l.url}
              </a>
            ))}
          </div>
        ) : null)}
        {row('Socials', Object.keys(m.socials || {}).length ? (
          <div className="flex flex-col gap-1">
            {Object.entries(m.socials).map(([k, v]) => (
              <span key={k}>{k}: {v}{m.followers?.[k] != null ? ` · ${Number(m.followers[k]).toLocaleString()} followers` : ''}</span>
            ))}
          </div>
        ) : null)}
        {row('Referred by', m.referred_by)}
        {row('Invite code used', m.invite_code_used)}
        {row('Submitted', m.submitted_at ? new Date(m.submitted_at).toLocaleString() : null)}
        {row('Signed up', new Date(m.created_at).toLocaleString())}

        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
          <Label hint="shown to the applicant if rejected">Review note</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Optional reason or note" />
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="flex flex-wrap gap-2">
          {m.status !== 'approved' && <Button variant="success" disabled={busy} onClick={() => review('approved')}>Approve</Button>}
          {m.status !== 'rejected' && <Button variant="danger" disabled={busy} onClick={() => review('rejected')}>Reject</Button>}
          {m.status === 'approved' && <Button variant="ghost" disabled={busy} onClick={() => review('suspended')}>Suspend</Button>}
          {m.status === 'suspended' && <Button variant="ghost" disabled={busy} onClick={() => review('approved')}>Reinstate</Button>}
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-3 pt-4" style={{ borderTop: '1px solid var(--c-border)' }}>
            <Label>Admin controls</Label>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={m.role} disabled={busy} onChange={(e) => setRole(e.target.value as MemberRole)} style={{ maxWidth: 200 }}>
                <option value="member">Member</option>
                <option value="reviewer">Reviewer (review team)</option>
                <option value="admin">Admin</option>
              </Select>
              <Button variant="ghost" disabled={busy} onClick={() => setFounding(!m.is_founding)}>
                {m.is_founding ? 'Remove founding badge' : 'Mark as founding member'}
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => run(() => supabase.rpc('admin_set_featured', { p_id: m.id, p_value: !m.is_featured }))}>
                {m.is_featured ? 'Remove pick of the week' : 'Make pick of the week'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Specialties({ specialties, reload, isAdmin }: { specialties: Specialty[]; reload: () => Promise<void>; isAdmin: boolean }) {
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [isVideo, setIsVideo] = useState(false)
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; status: string; created_at: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadSuggestions = useCallback(async () => {
    const { data } = await supabase.from('specialty_suggestions').select('id, name, status, created_at').eq('status', 'pending').order('created_at', { ascending: false })
    setSuggestions(data || [])
  }, [])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])

  const add = async (en: string, ar: string | null, video: boolean) => {
    setError(null)
    const { error } = await supabase.from('specialties').insert({ name_en: en.trim(), name_ar: ar?.trim() || null, is_video: video, sort: (specialties.at(-1)?.sort || 100) + 10 })
    if (error) return setError(error.message)
    setNameEn('')
    setNameAr('')
    setIsVideo(false)
    await reload()
  }

  const toggle = async (s: Specialty) => {
    const { error } = await supabase.from('specialties').update({ is_active: !s.is_active }).eq('id', s.id)
    if (error) setError(error.message)
    await reload()
  }

  const resolveSuggestion = async (id: number, status: 'accepted' | 'rejected', name?: string) => {
    if (status === 'accepted' && name) await add(name, null, false)
    await supabase.from('specialty_suggestions').update({ status }).eq('id', id)
    await loadSuggestions()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <div className="font-inter font-bold text-paper text-sm mb-4">Specialty list ({specialties.length})</div>
        <div className="flex flex-col gap-2">
          {specialties.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 font-inter text-sm">
              <span style={{ opacity: s.is_active ? 1 : 0.4 }}>
                {s.name_en} {s.name_ar && <span className="text-muted font-arabic">· {s.name_ar}</span>} {s.is_video && <span className="text-muted text-xs">· video</span>}
              </span>
              {isAdmin && (
                <button onClick={() => toggle(s)} className="font-inter text-xs" style={{ color: s.is_active ? '#F87171' : '#4ADE80', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {s.is_active ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        {isAdmin && (
          <Card>
            <div className="font-inter font-bold text-paper text-sm mb-4">Add specialty</div>
            <div className="flex flex-col gap-3">
              <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Name in English" />
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="الاسم بالعربي" dir="rtl" />
              <label className="flex items-center gap-2 font-inter text-sm text-muted">
                <input type="checkbox" checked={isVideo} onChange={(e) => setIsVideo(e.target.checked)} /> Video related (enables video length + 6 video links)
              </label>
              <Button disabled={!nameEn.trim()} onClick={() => add(nameEn, nameAr, isVideo)}>Add</Button>
            </div>
          </Card>
        )}
        <Card>
          <div className="font-inter font-bold text-paper text-sm mb-4">Member suggestions ({suggestions.length})</div>
          {suggestions.length === 0 && <div className="font-inter text-muted text-sm">No pending suggestions.</div>}
          <div className="flex flex-col gap-2">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 font-inter text-sm">
                <span>{s.name}</span>
                <div className="flex gap-2">
                  {isAdmin && <Button variant="success" onClick={() => resolveSuggestion(s.id, 'accepted', s.name)}>Add</Button>}
                  <Button variant="ghost" onClick={() => resolveSuggestion(s.id, 'rejected')}>Dismiss</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </div>
  )
}

function AuditLog() {
  const [rows, setRows] = useState<{ id: number; admin_id: string; action: string; target_type: string; target_id: string; reason: string | null; created_at: string }[]>([])
  useEffect(() => {
    supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => setRows(data || []))
  }, [])
  return (
    <Card>
      <div className="font-inter font-bold text-paper text-sm mb-4">Last 200 admin actions</div>
      {rows.length === 0 && <div className="font-inter text-muted text-sm">Nothing logged yet.</div>}
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-2 font-inter text-xs">
            <span className="col-span-3 text-muted">{new Date(r.created_at).toLocaleString()}</span>
            <span className="col-span-3 text-paper">{r.action}</span>
            <span className="col-span-3 text-muted truncate">{r.target_type} {r.target_id?.slice(0, 8)}</span>
            <span className="col-span-3 text-muted truncate">{r.reason}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
