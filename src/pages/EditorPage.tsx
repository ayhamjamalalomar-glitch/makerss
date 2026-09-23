import { useCallback, useEffect, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase, type Award, type Profile, type Work } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import WorkThumb from '../components/WorkThumb'
import { ARAB_COUNTRIES, SITE_URL, VIDEO_LENGTHS, detectPlatform } from '../lib/constants'
import { roleLine, useSpecialties } from '../lib/specialties'
import { computeProgress } from '../lib/progress'
import { fetchThumb } from '../lib/thumbs'
import { Btn, Card, Chip, Corners, Field, Modal, Notice, PageShell, Pill, SelectInput, Spinner, TextArea, TextInput } from '../components/mk'

type ModalKind = null | 'spec' | 'work' | 'award' | 'photo' | 'username'
const SOCIALS = [
  { key: 'instagram', label: 'Instagram', followers: true },
  { key: 'youtube', label: 'YouTube', followers: true },
  { key: 'tiktok', label: 'TikTok', followers: true },
  { key: 'snapchat', label: 'Snapchat', followers: true },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'x', label: 'X' },
  { key: 'website', label: 'الموقع' },
]

export default function EditorPage() {
  const { session, profile, loading, refreshProfile } = useAuth()
  const { go } = useRouter()
  const specialties = useSpecialties()
  const [works, setWorks] = useState<Work[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [modal, setModal] = useState<ModalKind>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !session) go('/login?next=/me')
  }, [loading, session, go])

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '')
      setBio(profile.bio || '')
    }
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadLists = useCallback(async () => {
    if (!session) return
    const [w, a] = await Promise.all([
      supabase.from('works').select('*').eq('owner_id', session.user.id).order('sort').order('created_at'),
      supabase.from('awards').select('*').eq('owner_id', session.user.id).order('year'),
    ])
    setWorks((w.data as Work[]) || [])
    setAwards((a.data as Award[]) || [])
  }, [session])

  useEffect(() => {
    loadLists()
  }, [loadLists])

  // Fill in thumbnails for works added before thumbnails existed
  useEffect(() => {
    const missing = works.filter((w) => w.url && !w.thumbnail_url)
    if (!missing.length) return
    Promise.all(missing.map(async (w) => {
      const t = await fetchThumb(w.url as string)
      if (!t) return false
      const { error } = await supabase.from('works').update({ thumbnail_url: t }).eq('id', w.id)
      return !error
    })).then((r) => { if (r.some(Boolean)) loadLists() })
  }, [works, loadLists])

  useEffect(() => {
    if (window.location.hash === '#add') setModal('work')
  }, [])

  if (loading || !profile) return <PageShell><Spinner /></PageShell>

  const update = async (patch: Partial<Profile>) => {
    setError(null)
    const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id)
    if (error) setError('تعذّر الحفظ. حاول مرة أخرى.')
    await refreshProfile()
    return !error
  }

  const progress = computeProgress(profile, works.length)
  const hasSpec = progress.steps[2].done
  const role = roleLine(specialties, profile.specialty_ids, profile.other_specialty)
  const vlen = VIDEO_LENGTHS.find((v) => v.key === profile.video_length)?.label
  const openFor = (key: string) => (key === 'photo' ? setModal('photo') : key === 'spec' ? setModal('spec') : key === 'works' ? setModal('work') : key === 'bio' ? document.getElementById('bio')?.focus() : null)

  const submit = async () => {
    setSaving(true)
    const ok = await update({ status: 'pending' })
    setSaving(false)
    if (ok) go('/me/status')
  }

  const status = profile.status
  const statusPill =
    status === 'approved' ? <Pill tone="green">منشورة</Pill>
      : status === 'pending' ? <Pill tone="blue">قيد المراجعة</Pill>
        : status === 'rejected' ? <Pill tone="red">تحتاج تعديلاً</Pill>
          : progress.count === 5 ? <Pill tone="green">جاهزة للإرسال</Pill> : <Pill tone="amber">قيد الإكمال</Pill>

  return (
    <>
      <PageShell>
        <div className="flex flex-wrap justify-between items-center gap-3 md:px-2">
          <span className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-semibold">صفحتي</span>
            <button type="button" onClick={() => setModal('username')} className="mono text-xs bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1.5" style={{ color: '#5C5C59' }} dir="ltr">
              {SITE_URL.replace('https://', '')}/{profile.username || '…'}
              <span className="text-[11px]" style={{ color: '#2563EB', fontFamily: 'inherit' }}>تعديل</span>
            </button>
            {statusPill}
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={() => update({ available: !profile.available })} className="flex items-center gap-2 text-[13px] px-4 py-2 rounded-full cursor-pointer" style={{ background: '#F3F3F2', border: 'none' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: profile.available ? '#16A34A' : '#9A9A97' }} />
              {profile.available ? 'متاح للعمل' : 'غير متاح حالياً'}
            </button>
            <Link to={profile.username ? `/${profile.username}` : '/me'} className="text-[13px] px-4 py-2 rounded-full" style={{ background: '#F3F3F2' }}>معاينة</Link>
          </span>
        </div>

        {status === 'rejected' && <Notice tone="error">راجع ملاحظة الفريق في <Link to="/me/status" className="underline font-semibold">صفحة الحالة</Link>، ثم عدّل صفحتك وأرسلها مجدداً.</Notice>}
        {error && <Notice tone="error">{error}</Notice>}

        <Card className="p-5 md:p-10 flex flex-col-reverse md:flex-row gap-6 md:gap-10 md:items-center">
          <div className="flex-1 flex flex-col gap-3">
            {hasSpec ? (
              <button type="button" onClick={() => setModal('spec')} className="self-start text-right text-sm bg-transparent border-0 p-0 cursor-pointer" style={{ color: '#3A3A38' }}>
                {role}{vlen ? ` · ${vlen}` : ''} · {[profile.city, profile.country].filter(Boolean).join('، ')} <span className="text-xs" style={{ color: '#2563EB' }}>تعديل</span>
              </button>
            ) : (
              <Btn variant="dashed" onClick={() => setModal('spec')} className="self-start !px-3.5 !py-1.5 text-[13px]">+ التخصص والدولة</Btn>
            )}
            <label className="sr-only" htmlFor="fullname">الاسم</label>
            <input
              id="fullname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && name !== profile.full_name && update({ full_name: name.trim() })}
              className="text-[36px] md:text-[56px] font-bold w-full"
              style={{ background: 'transparent', border: 'none', padding: 0, lineHeight: 1.15, letterSpacing: '-0.02em', height: 'auto' }}
            />
            <span className="mono text-[13px]" style={{ color: profile.start_year ? '#3A3A38' : '#8A8A87' }}>
              {profile.start_year ? `يعمل في المجال منذ ${profile.start_year}` : 'أضف سنة البدء من «التخصص والدولة»'}
            </span>
          </div>
          <button type="button" onClick={() => setModal('photo')} aria-label="الصورة" className="relative w-full md:w-[200px] h-[300px] md:h-[250px] shrink-0 rounded-[28px] overflow-hidden flex items-center justify-center cursor-pointer" style={profile.avatar_url ? { border: 'none', background: '#DADADA' } : { border: '1.5px dashed #CFCFCB', background: 'transparent', color: '#5C5C59' }}>
            {profile.avatar_url ? (
              <>
                <img src={profile.avatar_url} alt="" className="bw w-full h-full object-cover" />
                <Corners size={18} inset={12} color="#FFFFFF" />
              </>
            ) : (
              <span className="text-[13px]">+ صورتك</span>
            )}
          </button>
        </Card>

        <Card className="px-5 py-6 md:px-10 md:py-8 flex flex-col gap-3">
          <span className="flex items-center justify-between text-[13px] font-semibold">
            <span className="flex items-center gap-2">نبذة {!progress.steps[3].done && <Pill tone="amber">فارغ</Pill>}</span>
            <span className="font-normal text-xs" style={{ color: '#5C5C59' }}>{bio.length}/400</span>
          </span>
          <TextArea
            id="bio"
            rows={4}
            value={bio}
            maxLength={400}
            onChange={(e) => setBio(e.target.value)}
            onBlur={() => bio !== (profile.bio || '') && update({ bio: bio.trim() })}
            placeholder="عرّف بنفسك في سطرين: ما الذي تقدّمه، ولماذا يطلبك الناس؟"
            style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 17, lineHeight: 1.95 }}
          />
        </Card>

        <Card className="px-5 py-6 md:px-10 md:py-8 flex flex-col gap-5">
          <div className="flex justify-between items-baseline">
            <span className="text-[13px] font-semibold">أعمال مختارة</span>
            <span className="mono text-xs" style={{ color: '#5C5C59' }}>{Math.min(works.length, 3)} من 3 على الأقل</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {works.map((w, i) => (
              <div key={w.id} className="flex md:flex-col gap-3 items-center md:items-stretch">
                <WorkThumb work={w} index={i} className="w-28 h-[72px] md:w-auto md:h-[150px] rounded-[18px] md:rounded-[24px]">
                  <button type="button" aria-label="حذف العمل" onClick={async () => { await supabase.from('works').delete().eq('id', w.id); loadLists() }} className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full text-sm cursor-pointer" style={{ background: 'rgba(255,255,255,0.9)', border: 'none' }}>×</button>
                </WorkThumb>
                <span className="flex flex-col gap-0.5 px-1">
                  <span className="text-sm font-semibold">{w.title}</span>
                  {w.role && <span className="text-xs" style={{ color: '#5C5C59' }}>{w.role}</span>}
                </span>
              </div>
            ))}
            {works.length < 6 && (
              <button type="button" onClick={() => setModal('work')} className="h-[72px] md:h-[150px] rounded-[24px] text-[13px] cursor-pointer" style={{ border: '1.5px dashed #CFCFCB', background: 'transparent', color: '#5C5C59' }}>+ أضف عملاً</button>
            )}
          </div>
          <span className="text-xs" style={{ color: '#5C5C59' }}>أضف روابط لأعمال تظهر فيها مساهمتك، واكتب دورك تحت كل عمل.</span>
        </Card>

        <Card className="px-5 py-5 md:px-10 md:py-7 flex flex-col gap-1">
          <div className="flex justify-between items-baseline pb-2">
            <span className="text-[13px] font-semibold">الجوائز والاعتمادات <span className="font-normal" style={{ color: '#5C5C59' }}>(اختياري)</span></span>
            <button type="button" onClick={() => setModal('award')} className="text-[13px] bg-transparent border-0 cursor-pointer" style={{ color: '#2563EB' }}>+ أضف</button>
          </div>
          {awards.length === 0 && <span className="text-sm py-1.5" style={{ color: '#8A8A87' }}>أضف جوائزك أو اعتماداتك إن وُجدت، وستظهر في صفحتك تلقائياً.</span>}
          {awards.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-3.5" style={{ borderBottom: '1px solid #F0F0EE' }}>
              <span className="text-[15px] font-semibold">{a.rank}</span>
              <span className="flex-1 text-sm" style={{ color: '#3A3A38' }}>{a.org}</span>
              <span className="mono text-xs" style={{ color: '#5C5C59' }}>{a.year || ''}</span>
              <button type="button" aria-label="حذف" onClick={async () => { await supabase.from('awards').delete().eq('id', a.id); loadLists() }} className="w-7 h-7 rounded-full cursor-pointer" style={{ background: '#F3F3F2', border: 'none' }}>×</button>
            </div>
          ))}
        </Card>

        <SocialsCard profile={profile} onSave={(socials, followers) => update({ socials, followers })} />
        <div className="h-44 md:h-40" />
      </PageShell>

      {/* progress bar */}
      <div className="fixed z-30 bottom-[100px] md:bottom-6 right-3 left-3 md:right-[144px] md:left-12 p-4 md:px-7 md:py-5 flex flex-col gap-3.5 rounded-[28px] md:rounded-[32px]" style={{ background: '#141414', color: '#F2F2F0' }}>
        <div className="flex justify-between items-center gap-3">
          <span className="flex items-baseline gap-3">
            <span className="text-[15px] font-bold">{status === 'approved' ? 'صفحتك منشورة' : 'أكمل صفحتك'}</span>
            <span className="mono text-xs" style={{ color: '#A3A3A0' }}>{progress.count} من 5</span>
          </span>
          {status === 'approved' ? (
            <Link to={profile.username ? `/${profile.username}` : '/me'} className="text-[13px] font-semibold px-5 py-2.5 rounded-full" style={{ background: '#2563EB', color: '#fff' }}>افتح صفحتي</Link>
          ) : status === 'pending' ? (
            <Link to="/me/status" className="text-[13px]" style={{ color: '#A3A3A0' }}>قيد المراجعة</Link>
          ) : progress.count === 5 ? (
            <Btn onClick={submit} disabled={saving} className="!py-2.5 !px-5 text-[13px]">{saving ? 'جارٍ الإرسال…' : 'أرسل للمراجعة'}</Btn>
          ) : (
            <span className="hidden md:inline text-[13px]" style={{ color: '#A3A3A0' }}>أكمل الخطوات الخمس لإرسال صفحتك للمراجعة</span>
          )}
        </div>
        <div className="relative grid grid-cols-5 gap-1.5 pt-2.5">
          {progress.steps.map((s, i) => (
            <button key={s.key} type="button" onClick={() => openFor(s.key)} className="h-12 md:h-[54px] rounded-2xl text-[11px] md:text-xs cursor-pointer flex flex-col items-start justify-center gap-0.5 px-2 md:px-3.5 text-right" style={s.done ? { background: '#3B3B39', color: '#F2F2F0', border: 'none', fontWeight: 600 } : { background: 'transparent', color: '#A3A3A0', border: '1.5px dashed #4A4A47' }}>
              <span className="hidden md:inline text-[10px]" style={{ color: '#8C8C89' }}>الخطوة {i + 1}</span>
              {s.label}
            </button>
          ))}
          <span className="absolute top-0 -bottom-1.5 w-0.5" style={{ right: `${progress.ratio * 100}%`, background: '#D92D20' }} />
        </div>
      </div>

      {modal === 'spec' && <SpecModal profile={profile} onClose={() => setModal(null)} onSave={async (patch) => { if (await update(patch)) setModal(null) }} />}
      {modal === 'username' && <UsernameModal profile={profile} onClose={() => setModal(null)} onSaved={async () => { await refreshProfile(); setModal(null) }} />}
      {modal === 'photo' && <PhotoModal profile={profile} onClose={() => setModal(null)} onSaved={async () => { await refreshProfile(); setModal(null) }} />}
      {modal === 'work' && <WorkModal ownerId={profile.id} count={works.length} onClose={() => { setModal(null); history.replaceState(null, '', '/me') }} onSaved={() => { loadLists(); setModal(null) }} />}
      {modal === 'award' && <AwardModal ownerId={profile.id} onClose={() => setModal(null)} onSaved={() => { loadLists(); setModal(null) }} />}
    </>
  )
}

function SpecModal({ profile, onClose, onSave }: { profile: Profile; onClose: () => void; onSave: (p: Partial<Profile>) => void }) {
  const specialties = useSpecialties()
  const [ids, setIds] = useState<number[]>(profile.specialty_ids || [])
  const [other, setOther] = useState(profile.other_specialty || '')
  const [vlen, setVlen] = useState(profile.video_length || '')
  const [country, setCountry] = useState(profile.country || '')
  const [city, setCity] = useState(profile.city || '')
  const [year, setYear] = useState(profile.start_year ? String(profile.start_year) : '')
  const [suggest, setSuggest] = useState('')
  const isVideo = ids.some((id) => specialties.find((s) => s.id === id)?.is_video)
  const toggle = (id: number) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < 2 ? [...ids, id] : ids)

  const save = async () => {
    if (suggest.trim()) await supabase.from('specialty_suggestions').insert({ profile_id: profile.id, name: suggest.trim() })
    const y = parseInt(year, 10)
    onSave({
      specialty_ids: ids,
      other_specialty: other.trim() || null,
      video_length: isVideo && vlen ? (vlen as Profile['video_length']) : null,
      country: country || null,
      city: city.trim() || null,
      start_year: y >= 1950 && y <= new Date().getFullYear() ? y : null,
      account_type: 'maker',
    })
  }

  return (
    <Modal title="التخصص والدولة" onClose={onClose} footer={<><Btn onClick={save}>حفظ</Btn><Btn variant="soft" onClick={onClose}>إلغاء</Btn></>}>
      <div className="flex flex-col gap-2.5">
        <span className="flex justify-between text-[13px] font-semibold">التخصص <span className="font-normal" style={{ color: '#5C5C59' }}>{ids.length} من 2</span></span>
        <div className="flex flex-wrap gap-1.5">
          {specialties.map((s) => (
            <Chip key={s.id} on={ids.includes(s.id)} onClick={() => toggle(s.id)} style={{ opacity: !ids.includes(s.id) && ids.length >= 2 ? 0.45 : 1 }}>{s.name_ar || s.name_en}</Chip>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-1">
          <TextInput value={other} onChange={(e) => setOther(e.target.value)} placeholder="تخصص آخر (اكتبه هنا)" />
          <TextInput value={suggest} onChange={(e) => setSuggest(e.target.value)} placeholder="اقترح تخصصاً لإضافته للقائمة" />
        </div>
      </div>
      {isVideo && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] font-semibold">نوع الفيديو</span>
          <div className="flex gap-1.5">
            {VIDEO_LENGTHS.map((v) => <Chip key={v.key} on={vlen === v.key} onClick={() => setVlen(v.key)}>{v.label}</Chip>)}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="الدولة">
          <SelectInput value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">اختر الدولة</option>
            {ARAB_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </SelectInput>
        </Field>
        <Field label="المدينة"><TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="مثال: عمّان" /></Field>
        <Field label="سنة البدء في المجال"><TextInput inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2017" /></Field>
      </div>
    </Modal>
  )
}

function PhotoModal({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preview = file ? URL.createObjectURL(file) : profile.avatar_url

  const save = async () => {
    if (!file) return onClose()
    setBusy(true)
    setError(null)
    let blob: Blob
    try {
      blob = await toJpeg(file, 1000)
    } catch {
      setBusy(false)
      return setError('لم نتمكن من قراءة هذه الصورة. جرّب صورة أخرى بصيغة JPG أو PNG.')
    }
    const path = `${profile.id}/avatar-${Date.now()}.jpg`
    const up = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' })
    if (up.error) {
      setBusy(false)
      return setError('تعذّر رفع الصورة. تحقق من الاتصال وحاول مرة أخرى.')
    }
    const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
    setBusy(false)
    onSaved()
  }

  return (
    <Modal title="صورتك" onClose={onClose} footer={<><Btn onClick={save} disabled={busy}>{busy ? 'جارٍ الرفع…' : 'حفظ'}</Btn><Btn variant="soft" onClick={onClose}>إلغاء</Btn></>}>
      <div className="flex flex-col items-center gap-3.5">
        <div className="relative w-[220px] h-[270px] rounded-[28px] overflow-hidden flex items-center justify-center" style={{ background: '#DADADA' }}>
          {preview ? <img src={preview} alt="" className="bw w-full h-full object-cover" /> : <span className="text-6xl font-semibold" style={{ color: '#A8A8A8' }}>{(profile.full_name || 'م').charAt(0)}</span>}
          <Corners size={18} inset={12} color={preview ? '#FFFFFF' : '#111111'} />
        </div>
        <span className="text-[13px] text-center" style={{ color: '#5C5C59' }}>صورة واضحة لوجهك. تظهر الصور في الدليل بالأبيض والأسود.</span>
        <label className="text-[13px] font-semibold px-5 py-2.5 rounded-full cursor-pointer" style={{ background: '#F3F3F2' }}>
          اختر صورة من جهازك
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Modal>
  )
}

// Resize any browser-readable image to a JPEG so uploads stay small and in an allowed format.
async function toJpeg(file: File, max: number): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = url
    })
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.88))
  } finally {
    URL.revokeObjectURL(url)
  }
}

function UsernameModal({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState(profile.username || '')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const same = value === (profile.username || '')

  useEffect(() => {
    if (same || value.length < 3) return setAvailable(null)
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc('username_available', { p_username: value })
      setAvailable(!!data)
    }, 350)
    return () => clearTimeout(t)
  }, [value, same])

  const save = async () => {
    if (same) return onClose()
    if (!available) return setError('هذا الرابط غير متاح، جرّب رابطاً آخر.')
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ username: value }).eq('id', profile.id)
    setBusy(false)
    if (error) return setError('تعذّر حفظ الرابط. جرّب رابطاً آخر.')
    onSaved()
  }

  return (
    <Modal title="رابط صفحتك" onClose={onClose} footer={<><Btn onClick={save} disabled={busy}>{busy ? 'لحظة…' : 'حفظ'}</Btn><Btn variant="soft" onClick={onClose}>إلغاء</Btn></>}>
      <div dir="ltr" className="flex items-center h-[50px] px-5 rounded-full mono text-[15px]" style={{ background: '#F7F7F6' }}>
        <span style={{ color: '#8C8C89' }}>makerss.net/</span>
        <input
          value={value}
          onChange={(e) => { setError(null); setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)) }}
          className="flex-1 min-w-0"
          style={{ background: 'transparent', border: 'none', padding: 0, height: 'auto', fontFamily: 'inherit', fontSize: 'inherit' }}
        />
      </div>
      <span className="text-xs" style={{ color: available === false ? '#B42318' : available ? '#166534' : '#5C5C59' }}>
        {available === false ? 'هذا الرابط محجوز أو غير صالح.' : available ? 'الرابط متاح.' : 'حروف إنجليزية صغيرة وأرقام وشرطات فقط. إذا غيّرت الرابط، يتوقف الرابط القديم عن العمل.'}
      </span>
      {error && <Notice tone="error">{error}</Notice>}
    </Modal>
  )
}

function WorkModal({ ownerId, count, onClose, onSaved }: { ownerId: string; count: number; onClose: () => void; onSaved: () => void }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [role, setRole] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!/^https?:\/\//i.test(url.trim())) return setError('الصق رابطاً يبدأ بـ https://')
    if (!title.trim()) return setError('اكتب اسم العمل.')
    const y = parseInt(year, 10)
    setBusy(true)
    const thumb = await fetchThumb(url.trim())
    const { error } = await supabase.from('works').insert({
      owner_id: ownerId,
      url: url.trim(),
      title: title.trim(),
      role: role.trim() || null,
      year: y > 1950 && y <= new Date().getFullYear() + 1 ? y : null,
      platform: detectPlatform(url),
      thumbnail_url: thumb,
      sort: count,
    })
    setBusy(false)
    if (error) return setError('تعذّر الحفظ. حاول مرة أخرى.')
    onSaved()
  }

  return (
    <Modal title="أضف عملاً" onClose={onClose} footer={<><Btn onClick={save} disabled={busy}>{busy ? 'لحظة…' : 'حفظ'}</Btn><Btn variant="soft" onClick={onClose}>إلغاء</Btn></>}>
      <Field label="رابط العمل" hint={url ? detectPlatform(url) : undefined}>
        <TextInput type="url" dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://vimeo.com/..." style={{ textAlign: 'right' }} />
      </Field>
      <span className="text-xs -mt-2" style={{ color: '#5C5C59' }}>يقبل روابط Vimeo وYouTube وInstagram وTikTok وBehance.</span>
      <Field label="اسم العمل"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: فيلم قصير عن المدينة" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="دورك في العمل"><TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="مثال: إخراج" /></Field>
        <Field label="السنة"><TextInput inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2025" /></Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
    </Modal>
  )
}

function AwardModal({ ownerId, onClose, onSaved }: { ownerId: string; onClose: () => void; onSaved: () => void }) {
  const [rank, setRank] = useState('')
  const [org, setOrg] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const save = async () => {
    if (!rank.trim()) return setError('اكتب اسم الجائزة أو الاعتماد.')
    const y = parseInt(year, 10)
    const { error } = await supabase.from('awards').insert({ owner_id: ownerId, rank: rank.trim(), org: org.trim() || null, year: y > 1950 ? y : null })
    if (error) return setError('تعذّر الحفظ.')
    onSaved()
  }
  return (
    <Modal title="أضف جائزة أو اعتماداً" onClose={onClose} footer={<><Btn onClick={save}>حفظ</Btn><Btn variant="soft" onClick={onClose}>إلغاء</Btn></>}>
      <Field label="الجائزة أو الاعتماد"><TextInput value={rank} onChange={(e) => setRank(e.target.value)} placeholder="مثال: المركز الأول" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="الجهة أو المسابقة"><TextInput value={org} onChange={(e) => setOrg(e.target.value)} placeholder="اسم المهرجان أو الجهة" /></Field>
        <Field label="السنة"><TextInput inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2024" /></Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
    </Modal>
  )
}

function SocialsCard({ profile, onSave }: { profile: Profile; onSave: (s: Record<string, string>, f: Record<string, number>) => void }) {
  const [socials, setSocials] = useState<Record<string, string>>(profile.socials || {})
  const [followers, setFollowers] = useState<Record<string, string>>(Object.fromEntries(Object.entries(profile.followers || {}).map(([k, v]) => [k, String(v)])))
  const [saved, setSaved] = useState(false)
  const save = () => {
    const s = Object.fromEntries(Object.entries(socials).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v))
    const f = Object.fromEntries(Object.entries(followers).filter(([, v]) => v && !isNaN(Number(v))).map(([k, v]) => [k, Number(v)]))
    onSave(s, f)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  return (
    <Card className="px-5 py-6 md:px-10 md:py-8 flex flex-col gap-3">
      <span className="text-[13px] font-semibold">حساباتك <span className="font-normal" style={{ color: '#5C5C59' }}>(اختياري، أدخل عدد المتابعين يدوياً)</span></span>
      {SOCIALS.map((s) => (
        <div key={s.key} className="flex gap-2 items-center">
          <span className="text-xs w-20 shrink-0" style={{ color: '#5C5C59' }}>{s.label}</span>
          <TextInput dir="ltr" value={socials[s.key] || ''} onChange={(e) => setSocials({ ...socials, [s.key]: e.target.value })} placeholder="https://" style={{ textAlign: 'right', height: 44 }} />
          {s.followers && <TextInput inputMode="numeric" value={followers[s.key] || ''} onChange={(e) => setFollowers({ ...followers, [s.key]: e.target.value.replace(/\D/g, '') })} placeholder="المتابعون" style={{ maxWidth: 120, height: 44 }} />}
        </div>
      ))}
      <Btn variant="soft" onClick={save} className="self-start mt-1">{saved ? 'تم الحفظ' : 'حفظ الحسابات'}</Btn>
    </Card>
  )
}
