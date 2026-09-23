import { useEffect, useMemo, useState } from 'react'
import Link from '../lib/router'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Profile } from '../lib/supabase'
import { COUNTRIES } from '../lib/constants'
import { label, t } from '../lib/i18n'
import { roleLine, useSpecialties } from '../lib/specialties'
import { Avatar, Card, Chip, PageShell, VerifiedBadge } from '../components/mk'

const LENS = [
  { key: 'any', ar: 'أي نوع فيديو', en: 'any kind of video' },
  { key: 'short', ar: 'فيديو قصير', en: 'short-form video' },
  { key: 'long', ar: 'فيديو طويل', en: 'long-form video' },
] as const

// roles we invite as founding seats when nobody fills them yet
const SEAT_ROLES = [['مدير تصوير', 'Cinematographer (DOP)'], ['مونتير', 'Video Editor'], ['مهندس صوت', 'Sound Engineer'], ['ستايلست', 'Stylist'], ['مصمم موشن جرافيك', 'Motion Graphics Designer']]

const tokenStyle = 'font-semibold cursor-pointer bg-transparent border-0 border-b-2 px-1'

export default function Directory() {
  const specialties = useSpecialties()
  const [makers, setMakers] = useState<Profile[] | null>(null)
  const [spec, setSpec] = useState<number | 'any'>('any')
  const [country, setCountry] = useState<string>('any')
  const [len, setLen] = useState<(typeof LENS)[number]['key']>('any')
  const [q, setQ] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const [specOpen, setSpecOpen] = useState(false)
  const [limit, setLimit] = useState(30)

  useEffect(() => {
    supabase
      .from('profiles')
      .select(PUBLIC_PROFILE_COLUMNS)
      .eq('status', 'approved')
      .eq('account_type', 'maker')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: true })
      .then(({ data }) => setMakers((data as unknown as Profile[]) || []))
  }, [])

  const found = specialties.find((s) => s.id === spec)
  const specLabel = spec === 'any' ? t('أي تخصص', 'any role') : found ? t(found.name_ar || found.name_en, found.name_en) : t('تخصص', 'role')
  const countryLabel = country === 'any' ? t('أي دولة', 'any country') : label(COUNTRIES, country)
  const lenIdx = LENS.findIndex((l) => l.key === len)

  const rows = useMemo(() => {
    const list = (makers || []).filter((m) => {
      if (spec !== 'any' && !m.specialty_ids?.includes(spec)) return false
      if (country !== 'any' && m.country !== country) return false
      if (len !== 'any' && m.video_length && m.video_length !== 'both' && m.video_length !== len) return false
      const t = q.trim()
      if (t && !`${m.full_name || ''} ${m.name_ar || ''} ${m.username || ''}`.includes(t)) return false
      return true
    })
    return list
  }, [makers, spec, country, len, q])

  const seats = useMemo(() => {
    if (q.trim()) return []
    const where = country === 'any' ? t('أي دولة عربية', 'Anywhere') : label(COUNTRIES, country)
    const roles = spec === 'any' ? SEAT_ROLES.map(([ar, en]) => t(ar, en)) : [specLabel]
    return roles
      .filter((role) => !rows.some((m) => roleLine(specialties, m.specialty_ids).includes(role)))
      .slice(0, 4)
      .map((role) => ({ role, where }))
  }, [rows, spec, specLabel, country, q, specialties])

  const shown = rows.slice(0, limit)

  return (
    <PageShell>
      <div className="flex flex-col gap-4 md:gap-5 md:px-2">
        <span className="text-xs md:text-[13px]" style={{ color: '#5C5C59' }}>{t('دليل صنّاع الإنتاج في العالم العربي', 'The directory of production talent across the Arab world')}</span>
        <h1 className="m-0 font-semibold text-[28px] md:text-[44px]" style={{ lineHeight: 1.6, letterSpacing: '-0.01em' }}>
          {t('أبحث عن', "I'm looking for")}{' '}
          <button type="button" aria-expanded={specOpen} onClick={() => { setSpecOpen(!specOpen); setCountryOpen(false) }} className={tokenStyle} style={{ color: '#2563EB', borderColor: '#BFD0F7', fontSize: 'inherit' }}>{specLabel} ▾</button>{' '}
          {t('في', 'in')}{' '}
          <button type="button" aria-expanded={countryOpen} onClick={() => { setCountryOpen(!countryOpen); setSpecOpen(false) }} className={tokenStyle} style={{ color: '#2563EB', borderColor: '#BFD0F7', fontSize: 'inherit' }}>{countryLabel} ▾</button>{' '}
          {t('لإنتاج', 'to make')}{' '}
          <button type="button" onClick={() => setLen(LENS[(lenIdx + 1) % LENS.length].key)} className={tokenStyle} style={{ color: '#2563EB', borderColor: '#BFD0F7', fontSize: 'inherit' }}>{t(LENS[lenIdx].ar, LENS[lenIdx].en)}</button>
        </h1>

        {specOpen && (
          <Card className="p-5 md:p-6 flex flex-col gap-3" style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
            <span className="text-[13px] font-semibold">{t('اختر التخصص', 'Choose a role')}</span>
            <div className="flex flex-wrap gap-2">
              <Chip on={spec === 'any'} onClick={() => { setSpec('any'); setSpecOpen(false) }}>{t('كل التخصصات', 'All roles')}</Chip>
              {specialties.map((s) => (
                <Chip key={s.id} on={spec === s.id} onClick={() => { setSpec(s.id); setSpecOpen(false) }}>{t(s.name_ar || s.name_en, s.name_en)}</Chip>
              ))}
            </div>
          </Card>
        )}
        {countryOpen && (
          <Card className="p-5 md:p-6 flex flex-col gap-3" style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
            <span className="text-[13px] font-semibold">{t('اختر الدولة', 'Choose a country')}</span>
            <div className="flex flex-wrap gap-2">
              <Chip on={country === 'any'} onClick={() => { setCountry('any'); setCountryOpen(false) }}>{t('كل الدول العربية', 'All Arab countries')}</Chip>
              {COUNTRIES.map((c) => (
                <Chip key={c.ar} on={country === c.ar} onClick={() => { setCountry(c.ar); setCountryOpen(false) }}>{t(c.ar, c.en)}</Chip>
              ))}
            </div>
          </Card>
        )}

        <p className="m-0 text-[13px] md:text-sm" style={{ color: '#5C5C59' }}>{t('اضغط على أي كلمة باللون الأزرق لتغييرها. جميع الصنّاع هنا راجعهم فريق Makers.', 'Tap any blue word to change it. Every maker here has been reviewed by the Makers team.')}</p>
        <label className="flex items-center gap-2.5 h-12 md:h-[52px] px-5 rounded-full" style={{ border: '1px solid #E3E3E0', background: '#F7F7F6' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C5C59" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <span className="sr-only">{t('ابحث بالاسم', 'Search by name')}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('أو ابحث باسم شخص تعرفه', 'Or search for someone you know')} className="flex-1 min-w-0 bg-transparent" style={{ border: 'none', height: '100%', fontSize: 15, padding: 0 }} />
        </label>
      </div>

      <Card className="px-5 md:px-8 py-2">
        <div className="flex justify-between items-baseline pt-5 pb-3.5" style={{ borderBottom: '1px solid #111' }}>
          <span className="text-[13px] font-semibold">{t('الصنّاع', 'Makers')}</span>
          <span className="text-xs mono" style={{ color: '#5C5C59' }}>
            {makers === null ? '…' : `${t('الصنّاع', 'Makers')}: ${rows.length}${seats.length ? ` · ${t('مقاعد متاحة', 'Open seats')}: ${seats.length}` : ''}`}
          </span>
        </div>

        {makers === null && <div className="py-12 text-center text-sm" style={{ color: '#5C5C59' }}>{t('جارٍ التحميل…', 'Loading…')}</div>}

        {shown.map((m, i) => (
          <Link key={m.id} to={`/${m.username || ''}`} className="flex items-center gap-3 md:gap-5 py-4 md:py-5" style={{ borderBottom: '1px solid #F0F0EE' }}>
            <span className="hidden md:block mono text-xs w-10 shrink-0" style={{ color: '#8A8A87' }}>{String(i + 1).padStart(2, '0')}</span>
            <Avatar url={m.avatar_url} name={m.full_name} size={52} />
            <span className="flex flex-col gap-1 min-w-0 flex-1 md:flex-none">
              <span className="text-[17px] md:text-2xl font-bold md:truncate">{m.full_name}{m.is_founding && <span className="inline-block align-middle ms-1.5 -mt-1"><VerifiedBadge size={20} title={t('عضو مؤسس', 'Founding member')} /></span>}</span>
              <span className="md:hidden text-[13px]" style={{ color: '#3A3A38' }}>{roleLine(specialties, m.specialty_ids, m.other_specialty)} · {label(COUNTRIES, m.country)}</span>
              {m.is_featured && <span className="self-start text-[11px] font-semibold px-1.5 rounded-full" style={{ color: '#B42318', border: '1.5px solid #D92D20' }}>{t('اختيار الأسبوع', 'Pick of the week')}</span>}
            </span>
            <span className="hidden md:block flex-1 h-0 mt-2.5" style={{ borderBottom: '2px dotted #C9C9C5' }} />
            <span className="hidden md:block text-[17px] whitespace-nowrap">{roleLine(specialties, m.specialty_ids, m.other_specialty)}</span>
            <span className="hidden md:block text-[13px] whitespace-nowrap w-[96px] shrink-0 truncate" style={{ color: '#5C5C59' }}>{label(COUNTRIES, m.country)}</span>
            <span className="flex items-center gap-1.5 text-xs w-auto md:w-20 whitespace-nowrap" style={{ color: m.available ? '#166534' : '#6F6F6C' }}>
              <span className="w-[7px] h-[7px] rounded-full" style={{ background: m.available ? '#16A34A' : '#BDBDB9' }} />
              {m.available ? t('متاح', 'Available') : t('مشغول', 'Busy')}
            </span>
          </Link>
        ))}

        {seats.map((s, i) => (
          <Link key={s.role + i} to="/join" className="flex items-center gap-3 md:gap-5 py-4 md:py-5" style={{ borderBottom: '1px solid #F0F0EE' }}>
            <span className="hidden md:block mono text-xs w-10 shrink-0" style={{ color: '#B5B5B1' }}>{String(shown.length + i + 1).padStart(2, '0')}</span>
            <span className="w-[52px] h-[52px] rounded-full shrink-0" style={{ border: '1.5px dashed #CFCFCB' }} />
            <span className="flex flex-col gap-0.5 flex-1 md:flex-none">
              <span className="text-base md:text-xl font-medium" style={{ color: '#6F6F6C' }}>{t('مقعد مؤسس', 'Founding seat')}</span>
              <span className="md:hidden text-[13px]" style={{ color: '#6F6F6C' }}>{s.role} · {s.where}</span>
            </span>
            <span className="hidden md:block flex-1 h-0 mt-2.5" style={{ borderBottom: '2px dotted #E0E0DC' }} />
            <span className="hidden md:block text-[17px] whitespace-nowrap" style={{ color: '#6F6F6C' }}>{s.role}</span>
            <span className="hidden md:block text-[13px] whitespace-nowrap w-[96px] truncate" style={{ color: '#6F6F6C' }}>{s.where}</span>
            <span className="text-xs font-semibold md:w-20 whitespace-nowrap" style={{ color: '#2563EB' }}>{t('احجز المقعد', 'Claim seat')}</span>
          </Link>
        ))}

        {makers !== null && rows.length === 0 && seats.length === 0 && (
          <div className="py-14 text-center text-[15px]" style={{ color: '#5C5C59' }}>
            {t('لا يوجد صنّاع بهذه المواصفات بعد.', 'No makers match this yet.')} <Link to="/join" className="font-semibold" style={{ color: '#2563EB' }}>{t('كن أول المنضمّين', 'Be the first to join')}</Link>
          </div>
        )}
        {rows.length > limit && (
          <div className="py-5 text-center">
            <button type="button" onClick={() => setLimit(limit + 30)} className="text-sm font-semibold cursor-pointer bg-transparent border-0" style={{ color: '#2563EB' }}>{t('عرض المزيد', 'Show more')}</button>
          </div>
        )}
      </Card>

      <Card dark className="p-6 md:px-9 md:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[17px] md:text-lg font-bold">{t('مقاعد الأعضاء المؤسسين محدودة', 'Founding member seats are limited')}</span>
          <span className="text-[13px]" style={{ color: '#BDBDB9' }}>{t('يحصل أوائل المنضمّين إلى الدليل على شارة «عضو مؤسس» بشكل دائم.', 'The first makers to join keep a permanent Founding Member badge.')}</span>
        </div>
        <Link to="/join" className="self-start md:self-auto text-sm font-semibold px-5 py-3 rounded-full" style={{ background: '#2563EB', color: '#fff' }}>{t('احجز مقعدك', 'Claim your seat')}</Link>
      </Card>

      <footer className="flex flex-wrap gap-4 justify-center text-xs pt-2" style={{ color: '#5C5C59' }}>
        <span>© {new Date().getFullYear()} Makers MENA</span>
      </footer>
    </PageShell>
  )
}
