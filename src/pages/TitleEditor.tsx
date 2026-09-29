import { useEffect, useRef, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { t, useLang } from '../lib/i18n'
import { fetchThumb, quickThumb } from '../lib/thumbs'
import { toJpeg } from '../lib/image'
import { CARD_COLUMNS, displayName, getProject, PLATFORMS, PROJECT_KINDS, type MemberCard } from '../lib/data'
import { useSpecialties, specName } from '../lib/specialties'
import { Avatar, Btn, Chip, Field, Modal, Notice, PageShell, Spinner, TextArea, TextInput } from '../components/mk'
import ImageCropper, { DropZone } from '../components/ImageCropper'

type Crew = { key: string; profile?: MemberCard | null; name?: string; role: string }

const card = { background: 'var(--c-surface)', border: '1px solid var(--c-border)' } as const

function MemberPicker({ exclude, onPick }: { exclude: string[]; onPick: (m: MemberCard) => void }) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState<MemberCard[]>([])
  useEffect(() => {
    const s = q.trim().replace(/[%_,()*]/g, ' ')
    if (s.length < 2) return setRes([])
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select(CARD_COLUMNS).eq('status', 'approved').or(`full_name.ilike.%${s}%,name_ar.ilike.%${s}%,username.ilike.%${s}%`).limit(6)
      setRes(((data as unknown as MemberCard[]) || []).filter((m) => !exclude.includes(m.id)))
    }, 200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, exclude.join(',')])
  return (
    <div className="relative">
      <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('ابحث عن عضو في Makers بالاسم…', 'Search a Makers member by name…')} />
      {res.length > 0 && (
        <div className="absolute start-0 end-0 mt-1 rounded-xl overflow-hidden z-20" style={{ ...card, boxShadow: '0 12px 32px var(--c-shadow)' }}>
          {res.map((m) => (
            <button key={m.id} type="button" onClick={() => { onPick(m); setQ(''); setRes([]) }} className="flex items-center gap-3 w-full px-3 py-2.5 text-start cursor-pointer hover:bg-white/5" style={{ background: 'none', border: 'none', color: 'var(--c-text)' }}>
              <Avatar url={m.avatar_url} name={m.full_name} size={30} />
              <span className="text-sm font-semibold">{displayName(m)}</span>
              <span className="text-xs" style={{ color: 'var(--c-muted)' }} dir="ltr">@{m.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TitleEditor({ id }: { id?: string }) {
  useLang()
  const { go } = useRouter()
  const { profile, loading } = useAuth()
  const specialties = useSpecialties()
  const [ready, setReady] = useState(!id)
  const [denied, setDenied] = useState(false)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<string | null>(null)
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [brand, setBrand] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [url, setUrl] = useState('')
  const [poster, setPoster] = useState<string | null>(null)
  const [videoThumb, setVideoThumb] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [myRole, setMyRole] = useState('')
  const [crew, setCrew] = useState<Crew[]>([])
  const [outsider, setOutsider] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<File | null>(null)
  const crop = useRef<(() => Promise<Blob>) | null>(null)

  // Suggest my role from my first specialty
  useEffect(() => {
    if (!id && profile && !myRole && profile.specialty_ids?.[0] && specialties.length) setMyRole(specName(specialties, profile.specialty_ids[0]))
  }, [id, profile, specialties, myRole])

  useEffect(() => {
    if (!id || !profile) return
    getProject(id).then((p) => {
      if (!p) return setDenied(true)
      const staff = profile.role === 'admin' || profile.role === 'reviewer'
      if (p.owner_id !== profile.id && !staff) return setDenied(true)
      setTitle(p.title); setKind(p.kind); setYear(p.year ? String(p.year) : ''); setBrand(p.brand || '')
      setPlatforms(p.platforms || []); setUrl(p.url || ''); setPoster(p.thumb_url); setVideoThumb(p.thumbnail_url)
      setDescription(p.description || '')
      const mine = p.credits?.find((c) => c.profile_id === p.owner_id)
      setMyRole(mine?.role || p.role || '')
      setCrew((p.credits || []).filter((c) => c.profile_id !== p.owner_id).map((c) => ({ key: c.id, profile: c.profile, name: c.display_name || undefined, role: c.role || '' })))
      setReady(true)
    })
  }, [id, profile])

  // Video thumbnail (YouTube instantly, Vimeo/TikTok via oEmbed)
  useEffect(() => {
    const u = url.trim()
    if (!/^https:\/\//.test(u)) return setVideoThumb(null)
    setVideoThumb(quickThumb(u))
    let alive = true
    fetchThumb(u).then((x) => { if (alive && x) setVideoThumb(x) })
    return () => { alive = false }
  }, [url])

  if (loading || (id && !ready && !denied)) return <Spinner />
  if (!profile) {
    return <PageShell narrow><Notice>{t('سجّل الدخول لإضافة مشروع.', 'Sign in to add a project.')} <Link to="/login" className="font-semibold underline">{t('دخول', 'Sign in')}</Link></Notice></PageShell>
  }
  if (profile.status !== 'approved') {
    return <PageShell narrow><Notice>{t('يمكنك إضافة المشاريع بعد موافقة فريق Makers على ملفك.', 'You can add projects once the Makers team approves your profile.')} <Link to="/me/status" className="font-semibold underline">{t('حالة طلبك', 'Your application')}</Link></Notice></PageShell>
  }
  if (denied) return <PageShell narrow><Notice tone="error">{t('لا يمكنك تعديل هذا المشروع.', 'You cannot edit this project.')}</Notice></PageShell>

  const upload = async (file: File) => {
    setError(null)
    setUploading(true)
    try {
      const blob = crop.current ? await crop.current() : await toJpeg(file, 1400)
      const path = `${profile.id}/poster-${Date.now()}.jpg`
      const up = await supabase.storage.from('works').upload(path, blob, { contentType: 'image/jpeg' })
      if (up.error) throw up.error
      setPoster(supabase.storage.from('works').getPublicUrl(path).data.publicUrl)
    } catch {
      setError(t('تعذّر رفع الصورة. جرّب صورة JPG أو PNG أصغر.', 'Could not upload the image. Try a smaller JPG or PNG.'))
    }
    setUploading(false)
    setPending(null)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (title.trim().length < 1) return setError(t('اكتب اسم المشروع.', 'Enter the project title.'))
    if (url.trim() && !/^https:\/\//.test(url.trim())) return setError(t('رابط الفيديو يجب أن يبدأ بـ https://', 'The video link must start with https://'))
    if (!myRole.trim()) return setError(t('اكتب دورك في المشروع.', 'Enter your role on the project.'))
    const y = year ? Number(year) : null
    if (y !== null && (y < 1950 || y > new Date().getFullYear() + 2)) return setError(t('تحقق من السنة.', 'Check the year.'))
    setBusy(true)
    const credits = [
      { profile_id: profile.id, role: myRole.trim() },
      ...crew.map((c) => (c.profile ? { profile_id: c.profile.id, role: c.role.trim() } : { name: c.name, role: c.role.trim() })),
    ]
    const { data, error } = await supabase.rpc('save_work', {
      p_id: id || null,
      p: { title: title.trim(), kind, year: y, brand: brand.trim(), platforms, url: url.trim(), thumb_url: poster, thumbnail_url: videoThumb, description: description.trim(), role: myRole.trim() },
      p_credits: credits,
    })
    setBusy(false)
    if (error || !data) return setError(t('تعذّر الحفظ. تحقق من البيانات وحاول مرة أخرى.', 'Could not save. Check the details and try again.'))
    go(`/projects/${data}`)
  }

  const shown = poster || videoThumb

  return (
    <PageShell narrow>
      <div className="flex items-center gap-2">
        <span className="inline-block w-1 rounded-full" style={{ background: 'var(--c-accent)', height: 24 }} />
        <h1 className="font-black m-0" style={{ fontSize: 26 }}>{id ? t('تعديل المشروع', 'Edit project') : t('أضف مشروعاً', 'Add a project')}</h1>
      </div>
      <p className="m-0 -mt-3 text-sm" style={{ color: 'var(--c-muted)' }}>{t('أضف عملاً شاركت فيه، وسمِّ باقي الطاقم ليظهر المشروع في صفحاتهم أيضاً.', 'Add work you were part of, and tag the rest of the crew so it shows on their pages too.')}</p>

      <form onSubmit={save} className="flex flex-col gap-5">
        <div className="p-5 rounded-2xl flex flex-col sm:flex-row gap-5" style={card}>
          <DropZone onFile={setPending} className="shrink-0 flex flex-col gap-2 items-center">
            <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ width: 150, height: 225, background: 'var(--c-surface-alt)', border: '1px dashed var(--c-border-mid)' }}>
              {shown ? <img src={shown} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-center px-3" style={{ color: 'var(--c-muted)' }}>{t('بوستر المشروع', 'Project poster')}</span>}
            </div>
            <label className="text-xs font-semibold px-4 py-2 rounded-full cursor-pointer" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)' }}>
              {uploading ? t('جارٍ الرفع…', 'Uploading…') : poster ? t('غيّر الصورة', 'Change image') : t('ارفع بوستر', 'Upload poster')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setPending(e.target.files[0]); e.target.value = '' }} />
            </label>
            {poster && <button type="button" onClick={() => setPoster(null)} className="text-[11px] cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--c-muted)' }}>{t('إزالة', 'Remove')}</button>}
            {!poster && videoThumb && <span className="text-[11px]" style={{ color: 'var(--c-muted)' }}>{t('نستخدم صورة الفيديو', 'Using the video frame')}</span>}
            <span className="text-[11px] text-center max-w-[150px]" style={{ color: 'var(--c-muted-2)' }}>{t('أو اسحب الصورة وأفلتها هنا', 'or drop an image here')}</span>
          </DropZone>
          <div className="flex-1 flex flex-col gap-4">
            <Field label={t('اسم المشروع *', 'Title *')}><TextInput required maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('مثال: إعلان رمضان 2026', 'e.g. Ramadan 2026 campaign')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('السنة', 'Year')}><TextInput inputMode="numeric" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))} dir="ltr" /></Field>
              <Field label={t('العميل أو الجهة', 'Brand or studio')}><TextInput maxLength={120} value={brand} onChange={(e) => setBrand(e.target.value)} /></Field>
            </div>
            <Field label={t('رابط الفيديو', 'Video link')} hint="YouTube · Vimeo · TikTok · Instagram"><TextInput type="url" dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></Field>
          </div>
        </div>

        <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--c-text-2)' }}>{t('النوع', 'Type')}</span>
            <div className="flex flex-wrap gap-2">{PROJECT_KINDS.map((k) => <Chip key={k.key} on={kind === k.key} onClick={() => setKind(kind === k.key ? null : k.key)}>{t(k.ar, k.en)}</Chip>)}</div>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--c-text-2)' }}>{t('أين عُرض؟', 'Where was it released?')}</span>
            <div className="flex flex-wrap gap-2">{PLATFORMS.map((pl) => <Chip key={pl} on={platforms.includes(pl)} onClick={() => setPlatforms(platforms.includes(pl) ? platforms.filter((x) => x !== pl) : [...platforms, pl])}>{pl}</Chip>)}</div>
          </div>
          <Field label={t('عن المشروع', 'About the project')}><TextArea rows={4} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('فكرة العمل، أين صُوّر، وما الذي يميّزه.', 'The idea, where it was shot, what makes it stand out.')} /></Field>
        </div>

        <div className="p-5 rounded-2xl flex flex-col gap-4" style={card}>
          <span className="font-bold">{t('الطاقم', 'Crew')}</span>
          <div className="flex items-center gap-3">
            <Avatar url={profile.avatar_url} name={profile.full_name} size={36} />
            <span className="text-sm font-semibold shrink-0">{t('أنت', 'You')}</span>
            <TextInput required value={myRole} onChange={(e) => setMyRole(e.target.value)} placeholder={t('دورك: مخرج، مدير تصوير…', 'Your role: director, DOP…')} style={{ height: 40 }} />
          </div>
          {crew.map((c, i) => (
            <div key={c.key} className="flex items-center gap-3">
              {c.profile ? <Avatar url={c.profile.avatar_url} name={c.profile.full_name} size={36} /> : <Avatar name={c.name} size={36} />}
              <span className="text-sm font-semibold shrink-0 max-w-[35%] truncate">{c.profile ? displayName(c.profile) : c.name}</span>
              <TextInput value={c.role} onChange={(e) => setCrew(crew.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} placeholder={t('الدور', 'Role')} style={{ height: 40 }} />
              <button type="button" onClick={() => setCrew(crew.filter((_, j) => j !== i))} aria-label={t('إزالة', 'Remove')} className="w-9 h-9 shrink-0 rounded-full cursor-pointer" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}>×</button>
            </div>
          ))}
          <MemberPicker exclude={[profile.id, ...crew.map((c) => c.profile?.id || '')]} onPick={(m) => setCrew([...crew, { key: m.id, profile: m, role: m.specialty_ids?.[0] ? specName(specialties, m.specialty_ids[0]) : '' }])} />
          <div className="flex gap-2">
            <TextInput value={outsider} onChange={(e) => setOutsider(e.target.value)} placeholder={t('أو اكتب اسم شخص ليس على Makers', 'Or type the name of someone not on Makers')} style={{ height: 40 }} />
            <Btn type="button" variant="soft" className="shrink-0 !py-2" disabled={outsider.trim().length < 2} onClick={() => { setCrew([...crew, { key: `n${Date.now()}`, name: outsider.trim(), role: '' }]); setOutsider('') }}>{t('أضف', 'Add')}</Btn>
          </div>
          <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{t('أعضاء Makers الذين تضيفهم سيظهر المشروع في صفحاتهم، ويمكنهم إزالة أسمائهم في أي وقت.', 'Makers members you tag will see the project on their pages, and can remove their name any time.')}</span>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex gap-2">
          <Btn type="submit" disabled={busy || uploading}>{busy ? t('جارٍ الحفظ…', 'Saving…') : id ? t('احفظ التعديلات', 'Save changes') : t('انشر المشروع', 'Publish project')}</Btn>
          <Btn type="button" variant="outline" onClick={() => (window.history.length > 1 ? window.history.back() : go('/projects'))}>{t('إلغاء', 'Cancel')}</Btn>
        </div>
      </form>

      {pending && (
        <Modal
          title={t('اضبط البوستر', 'Frame the poster')}
          onClose={() => setPending(null)}
          footer={<><Btn disabled={uploading} onClick={() => upload(pending)}>{uploading ? t('جارٍ الرفع…', 'Uploading…') : t('استخدم هذه الصورة', 'Use this image')}</Btn><Btn variant="outline" onClick={() => setPending(null)}>{t('إلغاء', 'Cancel')}</Btn></>}
        >
          <ImageCropper file={pending} aspect={2 / 3} outWidth={1000} width={220} cropRef={crop} />
        </Modal>
      )}
    </PageShell>
  )
}
