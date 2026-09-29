import { label, t, type Pair } from './i18n'

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

export const budgetLabel = (v: string | null | undefined) => (v ? label(BUDGETS, v) : t(BUDGETS[0].ar, BUDGETS[0].en))

export const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
export const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return t(`${d} ${MONTHS_AR[m - 1]} ${y}`, `${MONTHS_EN[m - 1].slice(0, 3)} ${d}, ${y}`)
}

export function relative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600) return t('منذ قليل', 'just now')
  if (diff < 86400) {
    const h = Math.max(1, Math.round(diff / 3600))
    return t(`منذ ${h} ساعة`, `${h}h ago`)
  }
  const d = Math.round(diff / 86400)
  if (d === 1) return t('أمس', 'yesterday')
  return t(`قبل ${d} أيام`, `${d} days ago`)
}

export const SITE_URL = 'https://makerss.net'
