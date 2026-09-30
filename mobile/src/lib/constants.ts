import { getLang, label, t, type Pair } from './i18n'

// Stored values stay Arabic (they are already in the database); labels switch with the language.
export const COUNTRIES: Pair[] = [
  { ar: 'الأردن', en: 'Jordan' }, { ar: 'الإمارات', en: 'UAE' }, { ar: 'البحرين', en: 'Bahrain' }, { ar: 'تونس', en: 'Tunisia' },
  { ar: 'الجزائر', en: 'Algeria' }, { ar: 'جيبوتي', en: 'Djibouti' }, { ar: 'السعودية', en: 'Saudi Arabia' }, { ar: 'السودان', en: 'Sudan' },
  { ar: 'سوريا', en: 'Syria' }, { ar: 'الصومال', en: 'Somalia' }, { ar: 'العراق', en: 'Iraq' }, { ar: 'عُمان', en: 'Oman' },
  { ar: 'فلسطين', en: 'Palestine' }, { ar: 'قطر', en: 'Qatar' }, { ar: 'جزر القمر', en: 'Comoros' }, { ar: 'الكويت', en: 'Kuwait' },
  { ar: 'لبنان', en: 'Lebanon' }, { ar: 'ليبيا', en: 'Libya' }, { ar: 'مصر', en: 'Egypt' }, { ar: 'المغرب', en: 'Morocco' },
  { ar: 'موريتانيا', en: 'Mauritania' }, { ar: 'اليمن', en: 'Yemen' },
]
export const ARAB_COUNTRIES = COUNTRIES.map((c) => c.ar)
export const REMOTE: Pair = { ar: 'تصوير عن بُعد أو بدون تصوير', en: 'Remote or no shoot' }

export const PROJECT_TYPES: Pair[] = [
  { ar: 'إعلان تجاري', en: 'Commercial' }, { ar: 'فيلم قصير', en: 'Short film' }, { ar: 'فيلم وثائقي', en: 'Documentary' },
  { ar: 'محتوى سوشال', en: 'Social content' }, { ar: 'فيديو كليب', en: 'Music video' }, { ar: 'غير ذلك', en: 'Other' },
]

export const BUDGETS: Pair[] = [
  { ar: 'حسب الاتفاق', en: 'Open to discuss' }, { ar: 'أقل من 500 دولار', en: 'Under $500' },
  { ar: 'من 500 إلى 1,500 دولار', en: '$500 to $1,500' }, { ar: 'من 1,500 إلى 5,000 دولار', en: '$1,500 to $5,000' },
  { ar: 'أكثر من 5,000 دولار', en: 'Over $5,000' },
]

/** Content categories a creator picks (stored as keys in profiles.content_types). */
export const CONTENT_TYPES: (Pair & { key: string })[] = [
  { key: 'comedy', ar: 'كوميديا', en: 'Comedy' },
  { key: 'lifestyle', ar: 'لايف ستايل', en: 'Lifestyle' },
  { key: 'fashion', ar: 'موضة وجمال', en: 'Fashion & beauty' },
  { key: 'food', ar: 'طبخ وأكل', en: 'Food' },
  { key: 'travel', ar: 'سفر', en: 'Travel' },
  { key: 'tech', ar: 'تقنية', en: 'Tech' },
  { key: 'gaming', ar: 'ألعاب', en: 'Gaming' },
  { key: 'sports', ar: 'رياضة ولياقة', en: 'Sports & fitness' },
  { key: 'education', ar: 'تعليم', en: 'Education' },
  { key: 'family', ar: 'عائلة وأطفال', en: 'Family & kids' },
  { key: 'business', ar: 'أعمال ومال', en: 'Business & finance' },
  { key: 'cars', ar: 'سيارات', en: 'Cars' },
  { key: 'music', ar: 'موسيقى', en: 'Music' },
  { key: 'art', ar: 'فن وتصميم', en: 'Art & design' },
  { key: 'culture', ar: 'ثقافة ومجتمع', en: 'Culture & society' },
  { key: 'other', ar: 'أخرى', en: 'Other' },
]
export const contentLabel = (key: string) => {
  const hit = CONTENT_TYPES.find((c) => c.key === key)
  return hit ? t(hit.ar, hit.en) : ''
}
export const MAX_CONTENT_TYPES = 3

/** Text for matching: same rules as the database's ar_norm (أحمد = احمد, محمّد = محمد, مدرسة = مدرسه). */
export const arNorm = (s: string | null | undefined) =>
  (s || '')
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()

/** Separator for inline lists: Arabic comma in Arabic, plain comma in English. */
export const listSep = () => t('، ', ', ')

/** Budget in the reader's language. Stored values are the Arabic labels; empty means open to discuss. */
export const budgetLabel = (v: string | null | undefined) => (v ? label(BUDGETS, v) : t(BUDGETS[0].ar, BUDGETS[0].en))

export const VIDEO_LENGTHS: { key: 'short' | 'long' | 'both'; ar: string; en: string }[] = [
  { key: 'short', ar: 'فيديو قصير', en: 'Short-form' },
  { key: 'long', ar: 'فيديو طويل', en: 'Long-form' },
  { key: 'both', ar: 'قصير وطويل', en: 'Short and long' },
]
export const videoLengthLabel = (key: string | null | undefined) => {
  const v = VIDEO_LENGTHS.find((x) => x.key === key)
  return v ? t(v.ar, v.en) : undefined
}

export const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
export const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const months = () => (getLang() === 'en' ? MONTHS_EN : MONTHS_AR)

export const SITE_URL = 'https://makerss.net'

export const RESERVED_PATHS = ['admin', 'join', 'login', 'me', 'inbox', 'terms', 'privacy', 'api', 'about', 'makers', 'settings', 'status', 'reset', 'en', 'ar', 'messages', 'projects', 'opportunities', 'search']

export function formatDateAr(iso: string | null | undefined) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return getLang() === 'en' ? `${MONTHS_EN[m - 1].slice(0, 3)} ${d}, ${y}` : `${d} ${MONTHS_AR[m - 1]} ${y}`
}

export function daysBetween(a: string, b: string) {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

export function durationAr(days: number) {
  const n = days + 1
  if (getLang() === 'en') return n === 1 ? '1 day' : `${n} days`
  if (days === 0) return 'يوم واحد'
  if (days === 1) return 'يومان'
  if (days <= 10) return `${n} أيام`
  return `${n} يوماً`
}

export function detectPlatform(url: string) {
  if (/youtu\.?be/i.test(url)) return 'YouTube'
  if (/vimeo/i.test(url)) return 'Vimeo'
  if (/tiktok/i.test(url)) return 'TikTok'
  if (/instagram/i.test(url)) return 'Instagram'
  if (/behance/i.test(url)) return 'Behance'
  return 'رابط'
}
export const platformLabel = (p: string | null | undefined) => (p === 'رابط' ? t('رابط', 'Link') : p || '')

export function relativeAr(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const en = getLang() === 'en'
  if (diff < 3600) return en ? 'just now' : 'منذ قليل'
  if (diff < 86400) {
    const h = Math.max(1, Math.round(diff / 3600))
    return en ? `${h}h ago` : `منذ ${h} ساعة`
  }
  const d = Math.round(diff / 86400)
  if (d === 1) return en ? 'yesterday' : 'أمس'
  return en ? `${d} days ago` : `قبل ${d} أيام`
}

// City is free text. In English we show a known English name, or hide an Arabic-only city
// so the line never mixes scripts ("عمان, Jordan").
const CITIES: Record<string, string> = {
  'عمان': 'Amman', 'عمّان': 'Amman', 'إربد': 'Irbid', 'اربد': 'Irbid', 'الزرقاء': 'Zarqa', 'العقبة': 'Aqaba', 'السلط': 'Salt', 'مادبا': 'Madaba',
  'الرياض': 'Riyadh', 'جدة': 'Jeddah', 'مكة': 'Makkah', 'المدينة المنورة': 'Madinah', 'الدمام': 'Dammam', 'الخبر': 'Khobar',
  'دبي': 'Dubai', 'أبوظبي': 'Abu Dhabi', 'ابوظبي': 'Abu Dhabi', 'أبو ظبي': 'Abu Dhabi', 'الشارقة': 'Sharjah', 'عجمان': 'Ajman',
  'الدوحة': 'Doha', 'الكويت': 'Kuwait City', 'المنامة': 'Manama', 'مسقط': 'Muscat', 'بيروت': 'Beirut', 'طرابلس': 'Tripoli',
  'القاهرة': 'Cairo', 'الإسكندرية': 'Alexandria', 'الاسكندرية': 'Alexandria', 'الجيزة': 'Giza', 'بغداد': 'Baghdad', 'أربيل': 'Erbil', 'اربيل': 'Erbil', 'البصرة': 'Basra',
  'دمشق': 'Damascus', 'حلب': 'Aleppo', 'حمص': 'Homs', 'اللاذقية': 'Latakia', 'درعا': 'Daraa', 'رام الله': 'Ramallah', 'غزة': 'Gaza', 'القدس': 'Jerusalem', 'نابلس': 'Nablus',
  'الدار البيضاء': 'Casablanca', 'الرباط': 'Rabat', 'مراكش': 'Marrakech', 'تونس': 'Tunis', 'الجزائر': 'Algiers', 'الخرطوم': 'Khartoum',
  'بنغازي': 'Benghazi', 'صنعاء': "Sana'a", 'عدن': 'Aden', 'نواكشوط': 'Nouakchott', 'مقديشو': 'Mogadishu', 'جيبوتي': 'Djibouti',
}
// English name to Arabic, so a city typed in English still reads in Arabic ("amman" shows as عمّان).
const CITIES_AR: Record<string, string> = Object.fromEntries(
  Object.entries(CITIES).reverse().map(([ar, en]) => [en.toLowerCase(), ar]),
)
CITIES_AR.amman = 'عمّان'

const titleCase = (s: string) => s.replace(/(^|[\s-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())

export function cityLabel(city: string | null | undefined) {
  if (!city) return ''
  const c = city.trim()
  const arabic = /[؀-ۿ]/.test(c)
  if (getLang() !== 'en') return arabic ? c : CITIES_AR[c.toLowerCase()] || titleCase(c)
  if (CITIES[c]) return CITIES[c]
  return arabic ? '' : titleCase(c)
}
