import { useCallback, useEffect, useMemo, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase, type Award, type Profile, type Work } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import WorkThumb from '../components/WorkThumb'
import { COUNTRIES, CONTENT_TYPES, MAX_CONTENT_TYPES, SITE_URL, cityLabel, VIDEO_LENGTHS, detectPlatform, listSep, platformLabel, videoLengthLabel } from '../lib/constants'
import { isRtl, label, t } from '../lib/i18n'
import { isCreator, memberLine, useSpecialties } from '../lib/specialties'
import { computeProgress } from '../lib/progress'
import { fetchThumb } from '../lib/thumbs'
import { toJpeg } from '../lib/image'
import { Btn, Card, Chip, Corners, Field, Modal, Notice, PageShell, Pill, SelectInput, Spinner, TextArea, TextInput } from '../components/mk'

type ModalKind = null | 'spec' | 'work' | 'award' | 'photo' | 'username'
const SOCIALS = [
  { key: 'instagram', label: 'Instagram', followers: true },
  { key: 'youtube', label: 'YouTube', followers: true },
  { key: 'tiktok', label: 'TikTok', followers: true },
  { key: 'snapchat', label: 'Snapchat', followers: true },
  { key: 'facebook', label: 'Facebook', followers: true },
  { key: 'x', label: 'X', followers: true },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'website', label: 'Website' },
]

export default function EditorPage() {
  const { session, profile, loading, refreshProfile } = useAuth()
  const { go } = useRouter()
  const specialties = useSpecialties()
  const [works, setWorks] = useState<Work[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [modal, setModal] = useState<ModalKind>(null)
  const [deleting, setDeleting] = useState<Work | null>(null)
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
      const thumb = await fetchThumb(w.url as string)
      if (!thumb) return false
      const { error } = await supabase.from('works').update({ thumbnail_url: thumb }).eq('id', w.id)
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
    if (error) setError(t('تعذّر الحفظ. حاول مرة أخرى.', 'Could not save. Try again.'))
    await refreshProfile()
    return !error
  }

  const progress = computeProgress(profile, works.length)
  const hasSpec = progress.steps[2].done
  const creator = isCreator(profile)
  const role = memberLine(specialties, profile)
  const vlen = videoLengthLabel(profile.video_length)
  const openFor = (key: string) => (key === 'photo' ? setModal('photo') : key === 'spec' ? setModal('spec') : key === 'works' ? setModal('work') : key === 'bio' ? document.getElementById('bio')?.focus() : key === 'accounts' ? document.getElementById('accounts')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : null)

  const submit = async () => {
    setSaving(true)
    const ok = await update({ status: 'pending' })
    setSaving(false)
    if (ok) go('/me/status')
  }

  const status = profile.status
  const statusPill =
    status === 'approved' ? <Pill tone="green">{t('منشورة', 'Live')}</Pill>
      : status === 'pending' ? <Pill tone="blue">{t('قيد المراجعة', 'In review')}</Pill>
        : status === 'rejected' ? <Pill tone="red">{t('تحتاج تعديلاً', 'Needs changes')}</Pill>
          : progress.count === 5 ? <Pill tone="green">{t('جاهزة للإرسال', 'Ready to send')}</Pill> : <Pill tone="amber">{t('قيد الإكمال', 'In progress')}</Pill>

  return (
    <>
      <PageShell>
        <div className="flex flex-wrap justify-between items-center gap-3 md:px-2">
          <span className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-semibold">{t('صفحتي', 'My page')}</span>
            <button type="button" onClick={() => setModal('username')} className="mono text-xs bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1.5" style={{ color: 'var(--c-muted)' }} dir="ltr">
              {SITE_URL.replace('https://', '')}/{profile.username || '…'}
              <span className="text-[11px]" style={{ color: '#E85D04', fontFamily: 'inherit' }}>{t('تعديل', 'Edit')}</span>
            </button>
            {statusPill}
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={() => update({ available: !profile.available })} className="flex items-center gap-2 text-[13px] px-4 py-2 rounded-full cursor-pointer" style={{ background: 'var(--c-surface-alt)', border: 'none' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: profile.available ? '#4ADE80' : 'var(--c-muted)' }} />
              {profile.available ? t('متاح للعمل', 'Available for work') : t('غير متاح حالياً', 'Not available right now')}
            </button>
            <Link to={profile.username ? `/${profile.username}` : '/me'} className="text-[13px] px-4 py-2 rounded-full" style={{ background: 'var(--c-surface-alt)' }}>{t('معاينة', 'Preview')}</Link>
          </span>
        </div>

        {status === 'rejected' && <Notice tone="error">{t('راجع ملاحظة الفريق في', 'Read the team note on the')} <Link to="/me/status" className="underline font-semibold">{t('صفحة الحالة', 'status page')}</Link>{t('، ثم عدّل صفحتك وأرسلها مجدداً.', ', then update your page and send it again.')}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}

        <Card className="p-5 md:p-10 flex flex-col-reverse md:flex-row gap-6 md:gap-10 md:items-center">
          <div className="flex-1 flex flex-col gap-3">
            {hasSpec ? (
              <button type="button" onClick={() => setModal('spec')} className="self-start text-start text-sm bg-transparent border-0 p-0 cursor-pointer" style={{ color: 'var(--c-text-2)' }}>
                {role}{vlen ? ` · ${vlen}` : ''} · {[cityLabel(profile.city), label(COUNTRIES, profile.country)].filter(Boolean).join(listSep())} <span className="text-xs" style={{ color: '#E85D04' }}>{t('تعديل', 'Edit')}</span>
              </button>
            ) : (
              <Btn variant="dashed" onClick={() => setModal('spec')} className="self-start !px-3.5 !py-1.5 text-[13px]">{creator ? t('+ المحتوى والدولة', '+ Content & country') : t('+ التخصص والدولة', '+ Role & country')}</Btn>
            )}
            <label className="sr-only" htmlFor="fullname">{t('الاسم', 'Name')}</label>
            <input
              id="fullname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && name !== profile.full_name && update({ full_name: name.trim() })}
              className="text-[36px] md:text-[56px] font-bold w-full"
              style={{ background: 'transparent', border: 'none', padding: 0, lineHeight: 1.15, letterSpacing: '-0.02em', height: 'auto' }}
            />
            <span className="mono text-[13px]" style={{ color: profile.start_year ? 'var(--c-text-2)' : 'var(--c-muted)' }}>
              {profile.start_year ? (creator ? t(`يصنع المحتوى منذ ${profile.start_year}`, `Creating since ${profile.start_year}`) : t(`يعمل في المجال منذ ${profile.start_year}`, `In the industry since ${profile.start_year}`)) : creator ? t('أضف سنة البدء من «المحتوى والدولة»', 'Add your start year under Content & country') : t('أضف سنة البدء من «التخصص والدولة»', 'Add your start year under Role & country')}
            </span>
          </div>
          <button type="button" onClick={() => setModal('photo')} aria-label={t('الصورة', 'Photo')} className="relative w-full md:w-[200px] h-[300px] md:h-[250px] shrink-0 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer" style={profile.avatar_url ? { border: 'none', background: 'var(--c-border)' } : { border: '1.5px dashed var(--c-border)', background: 'transparent', color: 'var(--c-muted)' }}>
            {profile.avatar_url ? (
              <>
                <img src={profile.avatar_url} alt="" className="bw w-full h-full object-cover" />
                <Corners size={18} inset={12} color="rgba(255,255,255,0.8)" />
              </>
            ) : (
              <span className="text-[13px]">{t('+ صورتك', '+ Your photo')}</span>
            )}
          </button>
        </Card>

        <Card className="px-5 py-6 md:px-10 md:py-8 flex flex-col gap-3">
          <span className="flex items-center justify-between text-[13px] font-semibold">
            <span className="flex items-center gap-2">{t('نبذة', 'About')} {!progress.steps[3].done && <Pill tone="amber">{t('فارغ', 'Empty')}</Pill>}</span>
            <span className="font-normal text-xs" style={{ color: 'var(--c-muted)' }}>{bio.length}/400</span>
          </span>
          <TextArea
            id="bio"
            dir="auto"
            rows={4}
            value={bio}
            maxLength={400}
            onChange={(e) => setBio(e.target.value)}
            onBlur={() => bio !== (profile.bio || '') && update({ bio: bio.trim() })}
            placeholder={t('عرّف بنفسك في سطرين: ما الذي تقدّمه، ولماذا يطلبك الناس؟', 'Introduce yourself in two lines: what you do, and why people hire you.')}
            style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 17, lineHeight: 1.95 }}
          />
        </Card>

        <Card className="px-5 py-6 md:px-10 md:py-8 flex flex-col gap-5">
          <div className="flex justify-between items-baseline">
            <span className="text-[13px] font-semibold">
              {creator ? t('أبرز محتواك', 'Your best content') : t('أعمالك ومشاريعك', 'Your work & projects')}
              {creator && <span className="font-normal" style={{ color: 'var(--c-muted)' }}> {t('(اختياري)', '(optional)')}</span>}
            </span>
            {status === 'approved'
              ? <Link to="/projects/new" className="text-[13px] font-semibold" style={{ color: '#E85D04' }}>{t('+ مشروع كامل مع الطاقم', '+ Full project with crew')}</Link>
              : !creator && <span className="mono text-xs" style={{ color: 'var(--c-muted)' }}>{t(`${Math.min(works.length, 3)} من 3 على الأقل`, `${Math.min(works.length, 3)} of at least 3`)}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {works.map((w, i) => (
              <div key={w.id} className="flex md:flex-col gap-3 items-center md:items-stretch">
                <WorkThumb work={w} index={i} className="w-28 h-[72px] md:w-auto md:h-[150px] rounded-xl md:rounded-2xl">
                  <button type="button" aria-label={t('حذف العمل', 'Delete work')} onClick={() => setDeleting(w)} className="absolute top-2 end-2 z-10 w-7 h-7 rounded-full text-sm cursor-pointer" style={{ background: 'rgba(13,10,8,0.8)', color: '#fff', border: 'none' }}>×</button>
                </WorkThumb>
                <span className="flex flex-col gap-0.5 px-1">
                  <span className="text-sm font-semibold">{w.title}</span>
                  {w.role && <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{w.role}</span>}
                  {status === 'approved' && <Link to={`/projects/${w.id}/edit`} className="text-xs" style={{ color: '#E85D04' }}>{t('أضف البوستر والطاقم', 'Add poster & crew')}</Link>}
                </span>
              </div>
            ))}
            {(works.length < 6 || status === 'approved') && (
              <button type="button" onClick={() => setModal('work')} className="h-[72px] md:h-[150px] rounded-2xl text-[13px] cursor-pointer" style={{ border: '1.5px dashed var(--c-border)', background: 'transparent', color: 'var(--c-muted)' }}>{t('+ أضف عملاً', '+ Add work')}</button>
            )}
          </div>
          <span className="text-xs" style={{ color: 'var(--c-muted)' }}>
            {creator
              ? t('أضف روابط لأفضل فيديوهاتك أو حملاتك، حتى يرى أصحاب المشاريع أسلوبك.', 'Add links to your best videos or campaigns so brands can see your style.')
              : t('أضف روابط لأعمال تظهر فيها مساهمتك، واكتب دورك تحت كل عمل. تظهر أعمالك في صفحة المشاريع بعد نشر ملفك.', 'Add links to work that shows your contribution, and write your role under each one. Your work appears on the projects page once your profile is live.')}
          </span>
        </Card>

        <Card className="px-5 py-5 md:px-10 md:py-7 flex flex-col gap-1">
          <div className="flex justify-between items-baseline pb-2">
            <span className="text-[13px] font-semibold">{t('الجوائز والاعتمادات', 'Awards & credits')} <span className="font-normal" style={{ color: 'var(--c-muted)' }}>{t('(اختياري)', '(optional)')}</span></span>
            <button type="button" onClick={() => setModal('award')} className="text-[13px] bg-transparent border-0 cursor-pointer" style={{ color: '#E85D04' }}>{t('+ أضف', '+ Add')}</button>
          </div>
          {awards.length === 0 && <span className="text-sm py-1.5" style={{ color: 'var(--c-muted)' }}>{t('أضف جوائزك أو اعتماداتك إن وُجدت، وستظهر في صفحتك تلقائياً.', 'Add any awards or credits, and they will appear on your page automatically.')}</span>}
          {awards.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-3.5" style={{ borderBottom: '1px solid var(--c-surface-alt)' }}>
              <span className="text-[15px] font-semibold">{a.rank}</span>
              <span className="flex-1 text-sm" style={{ color: 'var(--c-text-2)' }}>{a.org}</span>
              <span className="mono text-xs" style={{ color: 'var(--c-muted)' }}>{a.year || ''}</span>
              <button type="button" aria-label={t('حذف', 'Delete')} onClick={async () => { await supabase.from('awards').delete().eq('id', a.id); loadLists() }} className="w-7 h-7 rounded-full cursor-pointer" style={{ background: 'var(--c-surface-alt)', border: 'none' }}>×</button>
            </div>
          ))}
        </Card>

        <SocialsCard profile={profile} required={creator} onSave={(socials, followers) => update({ socials, followers })} />
        {status !== 'approved' && <div className="h-44 md:h-40" />}
      </PageShell>

      {/* progress bar */}
      {status !== 'approved' && <div className="fixed z-30 bottom-[92px] start-3 end-3 md:start-12 md:end-12 p-4 md:px-7 md:py-5 flex flex-col gap-3.5 rounded-2xl md:rounded-2xl" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border-mid)', color: 'var(--c-text)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
        <div className="flex justify-between items-center gap-3">
          <span className="flex items-baseline gap-3">
            <span className="text-[15px] font-bold">{t('أكمل صفحتك', 'Complete your page')}</span>
            <span className="mono text-xs" style={{ color: 'var(--c-muted)' }}>{t(`${progress.count} من 5`, `${progress.count} of 5`)}</span>
          </span>
          {status === 'pending' ? (
            <Link to="/me/status" className="text-[13px]" style={{ color: 'var(--c-muted)' }}>{t('قيد المراجعة', 'In review')}</Link>
          ) : progress.count === 5 ? (
            <Btn onClick={submit} disabled={saving} className="!py-2.5 !px-5 text-[13px]">{saving ? t('جارٍ الإرسال…', 'Sending…') : t('أرسل للمراجعة', 'Send for review')}</Btn>
          ) : (
            <span className="hidden md:inline text-[13px]" style={{ color: 'var(--c-muted)' }}>{t('أكمل الخطوات الخمس لإرسال صفحتك للمراجعة', 'Complete the five steps to send your page for review')}</span>
          )}
        </div>
        <div className="relative grid grid-cols-5 gap-1.5 pt-2.5">
          {progress.steps.map((s, i) => (
            <button key={s.key} type="button" onClick={() => openFor(s.key)} className="h-12 md:h-[54px] rounded-2xl text-[11px] md:text-xs cursor-pointer flex flex-col items-start justify-center gap-0.5 px-2 md:px-3.5 text-start" style={s.done ? { background: 'rgba(232,93,4,0.15)', color: '#FDBA74', border: '1px solid rgba(232,93,4,0.35)', fontWeight: 600 } : { background: 'transparent', color: 'var(--c-muted)', border: '1.5px dashed var(--c-border-mid)' }}>
              <span className="hidden md:inline text-[10px]" style={{ color: 'var(--c-muted)' }}>{t('الخطوة', 'Step')} {i + 1}</span>
              {s.label}
            </button>
          ))}
          <span className="absolute top-0 -bottom-1.5 w-0.5" style={{ insetInlineStart: `${progress.ratio * 100}%`, background: '#F87171' }} />
        </div>
      </div>}

      {modal === 'spec' && <SpecModal profile={profile} onClose={() => setModal(null)} onSave={async (patch) => { if (await update(patch)) setModal(null) }} />}
      {modal === 'username' && <UsernameModal profile={profile} onClose={() => setModal(null)} onSaved={async () => { await refreshProfile(); setModal(null) }} />}
      {modal === 'photo' && <PhotoModal profile={profile} onClose={() => setModal(null)} onSaved={async () => { await refreshProfile(); setModal(null) }} />}
      {modal === 'work' && <WorkModal ownerId={profile.id} count={works.length} onClose={() => { setModal(null); history.replaceState(null, '', '/me') }} onSaved={() => { loadLists(); setModal(null) }} />}
      {modal === 'award' && <AwardModal ownerId={profile.id} onClose={() => setModal(null)} onSaved={() => { loadLists(); setModal(null) }} />}
      {deleting && (
        <Modal
          title={t('حذف العمل؟', 'Delete this work?')}
          onClose={() => setDeleting(null)}
          footer={<><Btn variant="danger" onClick={async () => { await supabase.from('works').delete().eq('id', deleting.id); setDeleting(null); loadLists() }}>{t('احذف', 'Delete')}</Btn><Btn variant="outline" onClick={() => setDeleting(null)}>{t('إلغاء', 'Cancel')}</Btn></>}
        >
          <p className="m-0 text-sm" style={{ color: 'var(--c-muted)' }}>{t(`سيُحذف «${deleting.title}» من صفحتك ومن صفحة المشاريع. لا يمكن التراجع.`, `"${deleting.title}" will be removed from your page and the projects page. This cannot be undone.`)}</p>
        </Modal>
      )}
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
  const [kinds, setKinds] = useState<string[]>(profile.content_types || [])
  const creator = isCreator(profile)
  const isVideo = creator || ids.some((id) => specialties.find((s) => s.id === id)?.is_video)
  const toggle = (id: number) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < 2 ? [...ids, id] : ids)
  const toggleKind = (k: string) => setKinds(kinds.includes(k) ? kinds.filter((x) => x !== k) : kinds.length < MAX_CONTENT_TYPES ? [...kinds, k] : kinds)

  const save = async () => {
    if (!creator && suggest.trim()) await supabase.from('specialty_suggestions').insert({ profile_id: profile.id, name: suggest.trim() })
    const y = parseInt(year, 10)
    onSave({
      ...(creator ? { content_types: kinds } : { specialty_ids: ids, other_specialty: other.trim() || null }),
      video_length: isVideo && vlen ? (vlen as Profile['video_length']) : null,
      country: country || null,
      city: city.trim() || null,
      start_year: y >= 1950 && y <= new Date().getFullYear() ? y : null,
    })
  }

  return (
    <Modal title={creator ? t('المحتوى والدولة', 'Content & country') : t('التخصص والدولة', 'Role & country')} onClose={onClose} footer={<><Btn onClick={save}>{t('حفظ', 'Save')}</Btn><Btn variant="soft" onClick={onClose}>{t('إلغاء', 'Cancel')}</Btn></>}>
      {creator ? (
        <div className="flex flex-col gap-2.5">
          <span className="flex justify-between text-[13px] font-semibold">{t('نوع المحتوى', 'Content type')} <span className="font-normal" style={{ color: 'var(--c-muted)' }}>{t(`${kinds.length} من ${MAX_CONTENT_TYPES}`, `${kinds.length} of ${MAX_CONTENT_TYPES}`)}</span></span>
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_TYPES.map((c) => (
              <Chip key={c.key} on={kinds.includes(c.key)} onClick={() => toggleKind(c.key)} style={{ opacity: !kinds.includes(c.key) && kinds.length >= MAX_CONTENT_TYPES ? 0.45 : 1 }}>{t(c.ar, c.en)}</Chip>
            ))}
          </div>
        </div>
      ) : (
      <div className="flex flex-col gap-2.5">
        <span className="flex justify-between text-[13px] font-semibold">{t('التخصص', 'Role')} <span className="font-normal" style={{ color: 'var(--c-muted)' }}>{t(`${ids.length} من 2`, `${ids.length} of 2`)}</span></span>
        <div className="flex flex-wrap gap-1.5">
          {specialties.map((s) => (
            <Chip key={s.id} on={ids.includes(s.id)} onClick={() => toggle(s.id)} style={{ opacity: !ids.includes(s.id) && ids.length >= 2 ? 0.45 : 1 }}>{t(s.name_ar || s.name_en, s.name_en || s.name_ar || '')}</Chip>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-1">
          <TextInput value={other} onChange={(e) => setOther(e.target.value)} placeholder={t('تخصص آخر (اكتبه هنا)', 'Another role (type it here)')} />
          <TextInput value={suggest} onChange={(e) => setSuggest(e.target.value)} placeholder={t('اقترح تخصصاً لإضافته للقائمة', 'Suggest a role to add to the list')} />
        </div>
      </div>
      )}
      {isVideo && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] font-semibold">{t('نوع الفيديو', 'Video type')}</span>
          <div className="flex gap-1.5">
            {VIDEO_LENGTHS.map((v) => <Chip key={v.key} on={vlen === v.key} onClick={() => setVlen(v.key)}>{t(v.ar, v.en)}</Chip>)}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label={t('الدولة', 'Country')}>
          <SelectInput value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{t('اختر الدولة', 'Choose a country')}</option>
            {COUNTRIES.map((c) => <option key={c.ar} value={c.ar}>{t(c.ar, c.en)}</option>)}
          </SelectInput>
        </Field>
        <Field label={t('المدينة', 'City')}><TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('مثال: عمّان', 'e.g. Amman')} /></Field>
        <Field label={creator ? t('سنة بدء صناعة المحتوى', 'Year you started creating') : t('سنة البدء في المجال', 'Year you started')}><TextInput inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2017" /></Field>
      </div>
    </Modal>
  )
}

function PhotoModal({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const local = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (local) URL.revokeObjectURL(local) }, [local])
  const preview = local || profile.avatar_url

  const save = async () => {
    if (!file) return onClose()
    setBusy(true)
    setError(null)
    let blob: Blob
    try {
      blob = await toJpeg(file, 1000)
    } catch {
      setBusy(false)
      return setError(t('لم نتمكن من قراءة هذه الصورة. جرّب صورة أخرى بصيغة JPG أو PNG.', 'We could not read this image. Try another JPG or PNG.'))
    }
    const path = `${profile.id}/avatar-${Date.now()}.jpg`
    const up = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' })
    if (up.error) {
      setBusy(false)
      return setError(t('تعذّر رفع الصورة. تحقق من الاتصال وحاول مرة أخرى.', 'Upload failed. Check your connection and try again.'))
    }
    const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
    setBusy(false)
    onSaved()
  }

  return (
    <Modal title={t('صورتك', 'Your photo')} onClose={onClose} footer={<><Btn onClick={save} disabled={busy}>{busy ? t('جارٍ الرفع…', 'Uploading…') : t('حفظ', 'Save')}</Btn><Btn variant="soft" onClick={onClose}>{t('إلغاء', 'Cancel')}</Btn></>}>
      <div className="flex flex-col items-center gap-3.5">
        <div className="relative w-[220px] h-[270px] rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: 'var(--c-border)' }}>
          {preview ? <img src={preview} alt="" className="bw w-full h-full object-cover" /> : <span className="text-6xl font-semibold" style={{ color: 'var(--c-muted)' }}>{(profile.full_name || 'م').charAt(0)}</span>}
          <Corners size={18} inset={12} color={preview ? 'rgba(255,255,255,0.8)' : 'var(--c-border-mid)'} />
        </div>
        <span className="text-[13px] text-center" style={{ color: 'var(--c-muted)' }}>{t('صورة واضحة لوجهك، بإضاءة جيدة وخلفية بسيطة.', 'A clear photo of your face, with good light and a simple background.')}</span>
        <label className="text-[13px] font-semibold px-5 py-2.5 rounded-full cursor-pointer" style={{ background: 'var(--c-surface-alt)' }}>
          {t('اختر صورة من جهازك', 'Choose a photo')}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Modal>
  )
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
    if (!available) return setError(t('هذا الرابط غير متاح، جرّب رابطاً آخر.', 'This link is not available, try another.'))
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ username: value }).eq('id', profile.id)
    setBusy(false)
    if (error) return setError(t('تعذّر حفظ الرابط. جرّب رابطاً آخر.', 'Could not save the link. Try another.'))
    onSaved()
  }

  return (
    <Modal title={t('رابط صفحتك', 'Your page link')} onClose={onClose} footer={<><Btn onClick={save} disabled={busy}>{busy ? t('لحظة…', 'One moment…') : t('حفظ', 'Save')}</Btn><Btn variant="soft" onClick={onClose}>{t('إلغاء', 'Cancel')}</Btn></>}>
      <div dir="ltr" className="flex items-center h-[50px] px-5 rounded-full mono text-[15px]" style={{ background: 'var(--c-surface-alt)' }}>
        <span style={{ color: 'var(--c-muted)' }}>makerss.net/</span>
        <input
          value={value}
          onChange={(e) => { setError(null); setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)) }}
          className="flex-1 min-w-0"
          style={{ background: 'transparent', border: 'none', padding: 0, height: 'auto', fontFamily: 'inherit', fontSize: 'inherit' }}
        />
      </div>
      <span className="text-xs" style={{ color: available === false ? '#F87171' : available ? '#4ADE80' : 'var(--c-muted)' }}>
        {available === false ? t('هذا الرابط محجوز أو غير صالح.', 'This link is taken or invalid.') : available ? t('الرابط متاح.', 'Link available.') : t('حروف إنجليزية صغيرة وأرقام وشرطات فقط. إذا غيّرت الرابط، يتوقف الرابط القديم عن العمل.', 'Lowercase letters, numbers and dashes only. If you change it, the old link stops working.')}
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
    if (!/^https?:\/\//i.test(url.trim())) return setError(t('الصق رابطاً يبدأ بـ https://', 'Paste a link starting with https://'))
    if (!title.trim()) return setError(t('اكتب اسم العمل.', 'Write the name of the work.'))
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
    if (error) return setError(t('تعذّر الحفظ. حاول مرة أخرى.', 'Could not save. Try again.'))
    onSaved()
  }

  return (
    <Modal title={t('أضف عملاً', 'Add work')} onClose={onClose} footer={<><Btn onClick={save} disabled={busy}>{busy ? t('لحظة…', 'One moment…') : t('حفظ', 'Save')}</Btn><Btn variant="soft" onClick={onClose}>{t('إلغاء', 'Cancel')}</Btn></>}>
      <Field label={t('رابط العمل', 'Work link')} hint={url ? platformLabel(detectPlatform(url)) : undefined}>
        <TextInput type="url" dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://vimeo.com/..." style={{ textAlign: isRtl() ? 'right' : 'left' }} />
      </Field>
      <span className="text-xs -mt-2" style={{ color: 'var(--c-muted)' }}>{t('يقبل روابط Vimeo وYouTube وInstagram وTikTok وBehance.', 'Accepts Vimeo, YouTube, Instagram, TikTok and Behance links.')}</span>
      <Field label={t('اسم العمل', 'Title')}><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('مثال: فيلم قصير عن المدينة', 'e.g. A short film about the city')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('دورك في العمل', 'Your role')}><TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder={t('مثال: إخراج', 'e.g. Director')} /></Field>
        <Field label={t('السنة', 'Year')}><TextInput inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2025" /></Field>
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
    if (!rank.trim()) return setError(t('اكتب اسم الجائزة أو الاعتماد.', 'Write the award or credit name.'))
    const y = parseInt(year, 10)
    const { error } = await supabase.from('awards').insert({ owner_id: ownerId, rank: rank.trim(), org: org.trim() || null, year: y > 1950 ? y : null })
    if (error) return setError(t('تعذّر الحفظ.', 'Could not save.'))
    onSaved()
  }
  return (
    <Modal title={t('أضف جائزة أو اعتماداً', 'Add an award or credit')} onClose={onClose} footer={<><Btn onClick={save}>{t('حفظ', 'Save')}</Btn><Btn variant="soft" onClick={onClose}>{t('إلغاء', 'Cancel')}</Btn></>}>
      <Field label={t('الجائزة أو الاعتماد', 'Award or credit')}><TextInput value={rank} onChange={(e) => setRank(e.target.value)} placeholder={t('مثال: المركز الأول', 'e.g. First place')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('الجهة أو المسابقة', 'Organizer or festival')}><TextInput value={org} onChange={(e) => setOrg(e.target.value)} placeholder={t('اسم المهرجان أو الجهة', 'Festival or organizer name')} /></Field>
        <Field label={t('السنة', 'Year')}><TextInput inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2024" /></Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
    </Modal>
  )
}

function SocialsCard({ profile, required, onSave }: { profile: Profile; required?: boolean; onSave: (s: Record<string, string>, f: Record<string, number>) => void }) {
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
    <Card className="px-5 py-6 md:px-10 md:py-8 flex flex-col gap-3" style={{ scrollMarginTop: 80 }}>
      <span id="accounts" className="text-[13px] font-semibold">
        {t('حساباتك', 'Your accounts')}{' '}
        <span className="font-normal" style={{ color: 'var(--c-muted)' }}>
          {required
            ? t('(أضف حساباً واحداً على الأقل مع عدد المتابعين)', '(add at least one account with its follower count)')
            : t('(اختياري، أدخل عدد المتابعين يدوياً)', '(optional, enter follower counts manually)')}
        </span>
      </span>
      {SOCIALS.map((s) => (
        <div key={s.key} className="flex gap-2 items-center">
          <span className="text-xs w-20 shrink-0" style={{ color: 'var(--c-muted)' }}>{s.label}</span>
          <TextInput dir="ltr" value={socials[s.key] || ''} onChange={(e) => setSocials({ ...socials, [s.key]: e.target.value })} placeholder="https://" style={{ textAlign: isRtl() ? 'right' : 'left', height: 44 }} />
          {s.followers && <TextInput inputMode="numeric" value={followers[s.key] || ''} onChange={(e) => setFollowers({ ...followers, [s.key]: e.target.value.replace(/\D/g, '') })} placeholder={t('المتابعون', 'Followers')} style={{ maxWidth: 120, height: 44 }} />}
        </div>
      ))}
      <Btn variant="soft" onClick={save} className="self-start mt-1">{saved ? t('تم الحفظ', 'Saved') : t('حفظ الحسابات', 'Save accounts')}</Btn>
    </Card>
  )
}
