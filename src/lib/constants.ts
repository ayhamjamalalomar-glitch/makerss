export const ARAB_COUNTRIES = [
  'الأردن', 'الإمارات', 'البحرين', 'تونس', 'الجزائر', 'جيبوتي', 'السعودية', 'السودان', 'سوريا', 'الصومال', 'العراق',
  'عُمان', 'فلسطين', 'قطر', 'جزر القمر', 'الكويت', 'لبنان', 'ليبيا', 'مصر', 'المغرب', 'موريتانيا', 'اليمن',
]

export const PROJECT_TYPES = ['إعلان تجاري', 'فيلم قصير', 'فيلم وثائقي', 'محتوى سوشال', 'فيديو كليب', 'غير ذلك']

export const BUDGETS = ['حسب الاتفاق', 'أقل من 500 دولار', 'من 500 إلى 1,500 دولار', 'من 1,500 إلى 5,000 دولار', 'أكثر من 5,000 دولار']

export const VIDEO_LENGTHS: { key: 'short' | 'long' | 'both'; label: string }[] = [
  { key: 'short', label: 'فيديو قصير' },
  { key: 'long', label: 'فيديو طويل' },
  { key: 'both', label: 'قصير وطويل' },
]

export const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export const SITE_URL = 'https://makerss.net'

export const RESERVED_PATHS = ['admin', 'join', 'login', 'me', 'inbox', 'terms', 'privacy', 'api', 'about', 'makers', 'settings', 'status', 'reset']

export function formatDateAr(iso: string | null | undefined) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS_AR[m - 1]} ${y}`
}

export function daysBetween(a: string, b: string) {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

export function durationAr(days: number) {
  if (days === 0) return 'يوم واحد'
  if (days === 1) return 'يومان'
  if (days <= 10) return `${days + 1} أيام`
  return `${days + 1} يوماً`
}

export function detectPlatform(url: string) {
  if (/youtu\.?be/i.test(url)) return 'YouTube'
  if (/vimeo/i.test(url)) return 'Vimeo'
  if (/tiktok/i.test(url)) return 'TikTok'
  if (/instagram/i.test(url)) return 'Instagram'
  if (/behance/i.test(url)) return 'Behance'
  return 'رابط'
}

export function relativeAr(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600) return 'منذ قليل'
  if (diff < 86400) return `منذ ${Math.max(1, Math.round(diff / 3600))} ساعة`
  const d = Math.round(diff / 86400)
  if (d === 1) return 'أمس'
  return `قبل ${d} أيام`
}
