import { useEffect, useMemo, useState } from 'react'
import type { Navigate } from '../App'
import { useAuth } from '../lib/auth'
import { supabase, type AccountType, type Specialty, type WorkLink } from '../lib/supabase'
import { Button, Card, Input, Label, Notice, Select, StatusBadge, Textarea, ORANGE } from '../components/ui'

interface RequestInvitationProps {
  navigate: Navigate
}

const COUNTRIES = ['Jordan', 'Syria', 'Egypt', 'Other']
const CONTENT_TYPES = ['Comedy', 'Films', 'Daily vlogs', 'Lifestyle', 'Food', 'Travel', 'Tech', 'Fashion & beauty', 'Education', 'Sports', 'Gaming', 'Music']
const SOCIALS: { key: string; label: string; followers?: boolean }[] = [
  { key: 'instagram', label: 'Instagram', followers: true },
  { key: 'youtube', label: 'YouTube', followers: true },
  { key: 'tiktok', label: 'TikTok', followers: true },
  { key: 'snapchat', label: 'Snapchat', followers: true },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'x', label: 'X' },
  { key: 'website', label: 'Website' },
]

type FormState = {
  account_type: AccountType | ''
  full_name: string
  name_ar: string
  city: string
  country: string
  bio: string
  specialty_ids: number[]
  other_specialty: string
  suggest_specialty: string
  content_types: string[]
  other_content_type: string
  video_length: '' | 'short' | 'long' | 'both'
  socials: Record<string, string>
  followers: Record<string, string>
  work_links: WorkLink[]
  referred_by: string
  invite_code_used: string
}

export default function RequestInvitation({ navigate }: RequestInvitationProps) {
  const { session, profile, loading, refreshProfile } = useAuth()
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [form, setForm] = useState<FormState | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    supabase.from('specialties').select('*').eq('is_active', true).order('sort').then(({ data }) => setSpecialties((data as Specialty[]) || []))
  }, [])

  useEffect(() => {
    if (!profile || form) return
    setForm({
      account_type: profile.account_type || '',
      full_name: profile.full_name || '',
      name_ar: profile.name_ar || '',
      city: profile.city || '',
      country: profile.country || '',
      bio: profile.bio || '',
      specialty_ids: profile.specialty_ids || [],
      other_specialty: profile.other_specialty || '',
      suggest_specialty: '',
      content_types: (profile.content_types || []).filter((c) => CONTENT_TYPES.includes(c)),
      other_content_type: (profile.content_types || []).filter((c) => !CONTENT_TYPES.includes(c)).join(', '),
      video_length: profile.video_length || '',
      socials: profile.socials || {},
      followers: Object.fromEntries(Object.entries(profile.followers || {}).map(([k, v]) => [k, String(v)])),
      work_links: profile.work_links?.length ? profile.work_links : [{ url: '' }, { url: '' }, { url: '' }],
      referred_by: profile.referred_by || '',
      invite_code_used: '',
    })
  }, [profile, form])

  const hasVideoSpecialty = useMemo(
    () => form?.specialty_ids.some((id) => specialties.find((s) => s.id === id)?.is_video) ?? false,
    [form?.specialty_ids, specialties],
  )
  const maxLinks = form?.account_type === 'maker' && hasVideoSpecialty ? 6 : 3

  if (loading) return <div className="px-8 py-20 font-inter text-muted">Loading…</div>

  if (!session) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-8">
        <div className="max-w-md text-center">
          <span className="inline-flex items-center gap-2 font-inter font-bold text-paper text-xs px-3 py-1.5 rounded-full mb-6" style={{ background: ORANGE, letterSpacing: '0.1em' }}>
            INVITE ONLY
          </span>
          <h1 className="font-inter font-bold text-paper mb-3" style={{ fontSize: 'clamp(24px, 4vw, 38px)', letterSpacing: '-0.02em' }}>Request an Invitation</h1>
          <p className="font-inter text-muted text-sm leading-relaxed mb-8">
            Create an account first, then complete your application. Our team reviews every application before granting access.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate({ name: 'auth', mode: 'signup' })} className="px-8 py-3.5">Create account</Button>
            <Button variant="ghost" onClick={() => navigate({ name: 'auth', mode: 'signin' })} className="px-8 py-3.5">Sign in</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!profile || !form) return <div className="px-8 py-20 font-inter text-muted">Loading your profile…</div>

  // Status screens
  if (!editing && (profile.status === 'pending' || profile.status === 'approved' || profile.status === 'suspended')) {
    return <StatusScreen navigate={navigate} onEdit={() => setEditing(true)} />
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value })

  const toggleSpecialty = (id: number) => {
    const has = form.specialty_ids.includes(id)
    if (has) set('specialty_ids', form.specialty_ids.filter((x) => x !== id))
    else if (form.specialty_ids.length < 2) set('specialty_ids', [...form.specialty_ids, id])
  }

  const toggleContentType = (c: string) => {
    set('content_types', form.content_types.includes(c) ? form.content_types.filter((x) => x !== c) : [...form.content_types, c])
  }

  const setLink = (i: number, patch: Partial<WorkLink>) => {
    const next = [...form.work_links]
    next[i] = { ...next[i], ...patch }
    set('work_links', next)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const links = form.work_links.filter((l) => l.url.trim())
    if (!form.account_type) return setError('Choose whether you are a Content Creator or a Maker.')
    if (!profile.avatar_url && !avatarFile) return setError('A profile photo is required.')
    if (form.account_type === 'maker' && form.specialty_ids.length === 0 && !form.other_specialty.trim())
      return setError('Pick at least one specialty (or type yours under Other).')
    if (form.account_type === 'creator' && form.content_types.length === 0 && !form.other_content_type.trim())
      return setError('Pick at least one content type.')
    if (links.length < 3) return setError('Add links to at least 3 of your works.')

    setBusy(true)
    try {
      let avatar_url = profile.avatar_url
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${profile.id}/avatar-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (upErr) throw upErr
        avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      }

      const contentTypes = [...form.content_types, ...form.other_content_type.split(',').map((s) => s.trim()).filter(Boolean)]
      const followers = Object.fromEntries(
        Object.entries(form.followers).filter(([, v]) => v !== '' && !isNaN(Number(v))).map(([k, v]) => [k, Number(v)]),
      )
      const socials = Object.fromEntries(Object.entries(form.socials).filter(([, v]) => v.trim()))

      const { error: upd } = await supabase
        .from('profiles')
        .update({
          account_type: form.account_type,
          full_name: form.full_name.trim(),
          name_ar: form.name_ar.trim() || null,
          city: form.city.trim(),
          country: form.country,
          bio: form.bio.trim(),
          avatar_url,
          specialty_ids: form.account_type === 'maker' ? form.specialty_ids : [],
          other_specialty: form.account_type === 'maker' ? form.other_specialty.trim() || null : null,
          content_types: form.account_type === 'creator' ? contentTypes : [],
          video_length: form.account_type === 'maker' && hasVideoSpecialty ? form.video_length || null : null,
          socials,
          followers,
          work_links: links.slice(0, maxLinks),
          referred_by: form.referred_by.trim() || null,
          invite_code_used: form.invite_code_used.trim().toUpperCase() || null,
          status: 'pending',
        })
        .eq('id', profile.id)
      if (upd) throw upd

      if (form.suggest_specialty.trim()) {
        await supabase.from('specialty_suggestions').insert({ profile_id: profile.id, name: form.suggest_specialty.trim() })
      }

      await refreshProfile()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl">
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 font-inter font-bold text-paper text-xs px-3 py-1.5 rounded-full mb-6" style={{ background: ORANGE, letterSpacing: '0.1em' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
          INVITE ONLY
        </span>
        <h1 className="font-inter font-bold text-paper mb-3" style={{ fontSize: 'clamp(24px, 4vw, 38px)', letterSpacing: '-0.02em' }}>
          {profile.status === 'rejected' ? 'Update your application' : 'Your application'}
        </h1>
        <p className="font-inter text-muted text-sm leading-relaxed">
          Tell us who you are and show us your work. Our team reviews every application.
        </p>
      </div>

      {profile.status === 'rejected' && (
        <div className="mb-6">
          <Notice tone="error">
            Your last application was not approved.{profile.review_note ? ` Note from the team: ${profile.review_note}` : ''} You can update it and submit again.
          </Notice>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-7">
        {/* Account type */}
        <div className="flex flex-col gap-3">
          <Label required>I am a</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { v: 'maker', t: 'Maker', d: 'Production professional: director, DOP, editor, designer, stylist and more.' },
              { v: 'creator', t: 'Content Creator', d: 'I create content and want to find a crew to work with.' },
            ].map((o) => (
              <button
                type="button"
                key={o.v}
                onClick={() => set('account_type', o.v as AccountType)}
                className="text-left rounded-2xl p-4 transition-all"
                style={{
                  background: form.account_type === o.v ? 'rgba(232,93,4,0.12)' : 'var(--c-surface)',
                  border: `1px solid ${form.account_type === o.v ? ORANGE : 'var(--c-border)'}`,
                  cursor: 'pointer',
                  color: 'var(--c-text)',
                }}
              >
                <div className="font-inter font-bold text-sm mb-1">{o.t}</div>
                <div className="font-inter text-muted text-xs leading-relaxed">{o.d}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)' }}>
            {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <span className="font-inter text-muted text-xs">Photo</span>}
          </div>
          <label className="flex flex-col gap-2 flex-1">
            <Label required hint="JPG, PNG or WebP, max 5MB">Profile photo</Label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="font-inter text-sm text-muted" />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <label className="flex flex-col gap-2">
            <Label required>Full name</Label>
            <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
          </label>
          <label className="flex flex-col gap-2">
            <Label>Name in Arabic</Label>
            <Input value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} dir="rtl" placeholder="الاسم بالعربي" />
          </label>
          <label className="flex flex-col gap-2">
            <Label required>Country</Label>
            <Select value={form.country} onChange={(e) => set('country', e.target.value)} required>
              <option value="" disabled>Select country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-2">
            <Label required>City</Label>
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} required placeholder="Amman" />
          </label>
        </div>

        {/* Maker: specialties */}
        {form.account_type === 'maker' && (
          <div className="flex flex-col gap-3">
            <Label required hint={`${form.specialty_ids.length}/2 selected`}>Specialties (up to 2)</Label>
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => {
                const on = form.specialty_ids.includes(s.id)
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleSpecialty(s.id)}
                    className="font-inter text-xs font-semibold px-3.5 py-2 rounded-full transition-all"
                    style={{
                      background: on ? ORANGE : 'var(--c-surface)',
                      color: on ? '#fff' : 'var(--c-text)',
                      border: `1px solid ${on ? ORANGE : 'var(--c-border)'}`,
                      cursor: 'pointer',
                      opacity: !on && form.specialty_ids.length >= 2 ? 0.45 : 1,
                    }}
                  >
                    {s.name_en}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={form.other_specialty} onChange={(e) => set('other_specialty', e.target.value)} placeholder="Other: type your specialty" />
              <Input value={form.suggest_specialty} onChange={(e) => set('suggest_specialty', e.target.value)} placeholder="Suggest a specialty for the list" />
            </div>
            {hasVideoSpecialty && (
              <label className="flex flex-col gap-2 mt-2">
                <Label>Video length specialization</Label>
                <Select value={form.video_length} onChange={(e) => set('video_length', e.target.value as FormState['video_length'])}>
                  <option value="">Select</option>
                  <option value="short">Short form</option>
                  <option value="long">Long form</option>
                  <option value="both">Both</option>
                </Select>
              </label>
            )}
          </div>
        )}

        {/* Creator: content types */}
        {form.account_type === 'creator' && (
          <div className="flex flex-col gap-3">
            <Label required>Content type</Label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((c) => {
                const on = form.content_types.includes(c)
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleContentType(c)}
                    className="font-inter text-xs font-semibold px-3.5 py-2 rounded-full"
                    style={{ background: on ? ORANGE : 'var(--c-surface)', color: on ? '#fff' : 'var(--c-text)', border: `1px solid ${on ? ORANGE : 'var(--c-border)'}`, cursor: 'pointer' }}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
            <Input value={form.other_content_type} onChange={(e) => set('other_content_type', e.target.value)} placeholder="Other types, separated by commas" />
          </div>
        )}

        <label className="flex flex-col gap-2">
          <Label required hint={`${form.bio.length}/400`}>Short bio</Label>
          <Textarea value={form.bio} onChange={(e) => set('bio', e.target.value.slice(0, 400))} rows={4} required placeholder="Who you are and what you do best." />
        </label>

        {/* Works */}
        <div className="flex flex-col gap-3">
          <Label required hint={`at least 3, up to ${maxLinks}`}>Links to your main work</Label>
          {form.work_links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input type="url" value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} placeholder="https://" />
              {form.account_type === 'maker' && hasVideoSpecialty && (
                <Select value={l.type || ''} onChange={(e) => setLink(i, { type: (e.target.value || undefined) as WorkLink['type'] })} style={{ maxWidth: 150 }}>
                  <option value="">Type</option>
                  <option value="reels">Reels / Short</option>
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="other">Other</option>
                </Select>
              )}
            </div>
          ))}
          {form.work_links.length < maxLinks && (
            <button type="button" onClick={() => set('work_links', [...form.work_links, { url: '' }])} className="font-inter text-xs text-left" style={{ color: ORANGE, background: 'none', border: 'none', cursor: 'pointer' }}>
              + Add another link
            </button>
          )}
        </div>

        {/* Socials */}
        <div className="flex flex-col gap-3">
          <Label hint="follower counts are entered manually">Social accounts</Label>
          {SOCIALS.map((s) => (
            <div key={s.key} className="flex gap-2 items-center">
              <span className="font-inter text-xs text-muted w-20 flex-shrink-0">{s.label}</span>
              <Input
                value={form.socials[s.key] || ''}
                onChange={(e) => set('socials', { ...form.socials, [s.key]: e.target.value })}
                placeholder={s.key === 'website' ? 'https://' : '@handle or link'}
              />
              {s.followers && (
                <Input
                  type="number"
                  min={0}
                  value={form.followers[s.key] || ''}
                  onChange={(e) => set('followers', { ...form.followers, [s.key]: e.target.value })}
                  placeholder="Followers"
                  style={{ maxWidth: 130 }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <label className="flex flex-col gap-2">
            <Label>Referred by</Label>
            <Input value={form.referred_by} onChange={(e) => set('referred_by', e.target.value)} placeholder="Name of the Maker who referred you" />
          </label>
          <label className="flex flex-col gap-2">
            <Label>Invite code</Label>
            <Input value={form.invite_code_used} onChange={(e) => set('invite_code_used', e.target.value)} placeholder="If you have one" />
          </label>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="flex gap-3">
          <Button type="submit" disabled={busy} className="py-4 px-10" style={{ fontSize: 14 }}>
            {busy ? 'Submitting…' : 'Submit application →'}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          )}
        </div>
      </form>
    </div>
  )
}

function StatusScreen({ navigate, onEdit }: { navigate: Navigate; onEdit: () => void }) {
  const { profile, refreshProfile } = useAuth()
  const [codes, setCodes] = useState<{ code: string; invitee_email: string | null; used_by: string | null }[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const loadCodes = () => {
    supabase.from('invites').select('code, invitee_email, used_by').order('created_at', { ascending: false }).then(({ data }) => setCodes(data || []))
  }

  useEffect(() => {
    if (profile?.status === 'approved') loadCodes()
  }, [profile?.status])

  if (!profile) return null

  const createInvite = async () => {
    setMsg(null)
    const { data, error } = await supabase.rpc('create_invite', { p_email: inviteEmail || null })
    if (error) return setMsg(error.message)
    setMsg(`Invite code created: ${data}`)
    setInviteEmail('')
    await refreshProfile()
    loadCodes()
  }

  return (
    <div className="px-6 sm:px-8 py-16 max-w-xl">
      <div className="mb-6"><StatusBadge status={profile.status} /></div>
      {profile.status === 'pending' && (
        <>
          <h1 className="font-inter font-bold text-paper text-3xl mb-3">Application received</h1>
          <p className="font-inter text-muted text-sm leading-relaxed mb-8">
            Our team is reviewing your application. We will email you at {profile.email} once there is a decision.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onEdit}>Edit application</Button>
            <Button onClick={() => navigate({ name: 'home' })}>Back to home</Button>
          </div>
        </>
      )}
      {profile.status === 'suspended' && (
        <>
          <h1 className="font-inter font-bold text-paper text-3xl mb-3">Account suspended</h1>
          <p className="font-inter text-muted text-sm">Contact the Makers team if you think this is a mistake.</p>
        </>
      )}
      {profile.status === 'approved' && (
        <>
          <h1 className="font-inter font-bold text-paper text-3xl mb-3">You are in, {profile.full_name?.split(' ')[0] || 'Maker'}.</h1>
          <p className="font-inter text-muted text-sm leading-relaxed mb-8">Your profile is live on Makers. You can invite people you trust. They still go through review.</p>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <span className="font-inter font-bold text-paper text-sm">Invites</span>
              <span className="font-inter text-muted text-xs">{profile.invites_remaining} left</span>
            </div>
            <div className="flex gap-2 mb-3">
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Their email (optional)" />
              <Button onClick={createInvite} disabled={profile.invites_remaining <= 0}>Create</Button>
            </div>
            {msg && <div className="mb-3"><Notice>{msg}</Notice></div>}
            <div className="flex flex-col gap-2">
              {codes.map((c) => (
                <div key={c.code} className="flex items-center justify-between font-inter text-xs">
                  <span className="font-mono text-paper">{c.code}</span>
                  <span className="text-muted">{c.invitee_email || 'No email'} · {c.used_by ? 'Used' : 'Unused'}</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={onEdit}>Edit profile</Button>
            {(profile.role === 'admin' || profile.role === 'reviewer') && <Button onClick={() => navigate({ name: 'admin' })}>Open admin</Button>}
          </div>
        </>
      )}
    </div>
  )
}
