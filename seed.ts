import posterEinSihriya from '../imports/98.jpeg'
import posterRasAlAfaa from '../imports/6546546546.jpg'
import posterAlMaddah from '../imports/___________________________________2023_.jpg'
import posterSaydAlAqareb from '../imports/233499-_____-___-_______.jpg'
import posterSuperman from '../imports/22752.jpg'
import posterAlNukran from '../imports/h6Umc.jpg'
import posterBeebo from '../imports/166.jpeg'
import posterBilHaram from '../imports/____-__-____-_______-_________-__-_____-_______-__-_____-____-______-____-_____-_____-________.jpg'
import posterArcane from '../imports/81LVp-VkHjL.jpg'
import posterDarsh from '../imports/IMG_0571_591_032344.jpg'
import posterMawlana from '../imports/WhatsApp-Image-2026-01-27-at-4.23.51-PM-1-845x1024.jpeg'
import posterAlOstaz from '../imports/399590-_____-______.jpg'
import posterZelRagel from '../imports/152993405_218481533342120_3524198614448742840_n.jpg'

export type Phase = 'pre-production' | 'production' | 'post-production' | 'social-media'

export interface Maker {
  id: string
  nameLatin: string
  nameArabic: string
  photo: string
  city: string
  country: string
  specialtyTags: string[]
  phases: Phase[]
  bio: string
  verified: boolean
  social: { instagram?: number; tiktok?: number; youtube?: number }
  workedWith: string[]
  credits: { titleId: string; role: string; year: number }[]
  ratingAverage: number
  ratingCount: number
}

export interface Title {
  id: string
  name: string
  brand: string
  year: number
  thumb: string
  platforms: string[]
  description: string
  credits: { makerId: string; role: string }[]
}

export interface CollaborationRequest {
  id: string
  fromMakerId: string
  toMakerId: string
  projectName: string
  brief: string
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  createdAt: string
  completedAt?: string
}

export interface Review {
  id: string
  collaborationRequestId: string
  fromMakerId: string
  toMakerId: string
  stars: number
  comment: string
  submittedAt: string
  visibleAt: string
}

export const makers: Maker[] = [
  {
    id: 'lara-nassar',
    nameLatin: 'Lara Nassar',
    nameArabic: 'لارا نصار',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&auto=format&q=80',
    city: 'Amman',
    country: 'Jordan',
    specialtyTags: ['Director', 'Creative Lead'],
    phases: ['production'],
    bio: 'Director and creative lead with 8 years crafting branded content and documentary work across the Arab world. Known for visually driven storytelling that balances commercial precision with cultural depth.',
    verified: true,
    social: { instagram: 42000, tiktok: 18000, youtube: 9500 },
    workedWith: ['kareem-al-rashid', 'nour-khalil', 'rana-qasim'],
    credits: [
      { titleId: 'threads-of-jordan', role: 'Director', year: 2024 },
      { titleId: 'ramadan-glow', role: 'Creative Director', year: 2024 },
      { titleId: 'city-pulse', role: 'Director', year: 2023 },
    ],
    ratingAverage: 4.8,
    ratingCount: 12,
  },
  {
    id: 'kareem-al-rashid',
    nameLatin: 'Kareem Al-Rashid',
    nameArabic: 'كريم الرشيد',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format&q=80',
    city: 'Amman',
    country: 'Jordan',
    specialtyTags: ['Photographer', 'DOP'],
    phases: ['production'],
    bio: 'Cinematographer and photographer specializing in high-contrast, desert-textured visuals. Comfortable on set with a 10-person crew or alone with a camera in a cramped alleyway.',
    verified: true,
    social: { instagram: 31000, tiktok: 7500 },
    workedWith: ['lara-nassar', 'ziad-barakat'],
    credits: [
      { titleId: 'threads-of-jordan', role: 'Director of Photography', year: 2024 },
      { titleId: 'city-pulse', role: 'Cinematographer', year: 2023 },
      { titleId: 'voice-of-streets', role: 'Photographer', year: 2023 },
    ],
    ratingAverage: 4.6,
    ratingCount: 9,
  },
  {
    id: 'nour-khalil',
    nameLatin: 'Nour Khalil',
    nameArabic: 'نور خليل',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&auto=format&q=80',
    city: 'Ramallah',
    country: 'Palestine',
    specialtyTags: ['Video Editor', 'Colorist'],
    phases: ['post-production'],
    bio: 'Post-production editor with a precise, rhythmic approach to pacing. Over 60 branded and editorial pieces delivered — works remotely with directors in Jordan, Egypt, and the Gulf.',
    verified: true,
    social: { instagram: 14000, youtube: 22000 },
    workedWith: ['tarek-haddad', 'lara-nassar'],
    credits: [
      { titleId: 'ramadan-glow', role: 'Lead Editor', year: 2024 },
      { titleId: 'city-pulse', role: 'Editor & Colorist', year: 2023 },
    ],
    ratingAverage: 4.9,
    ratingCount: 16,
  },
  {
    id: 'sana-mahmoud',
    nameLatin: 'Sana Mahmoud',
    nameArabic: 'سنا محمود',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&auto=format&q=80',
    city: 'Amman',
    country: 'Jordan',
    specialtyTags: ['Social Media Manager', 'Content Strategist'],
    phases: ['social-media'],
    bio: 'Social media manager who builds channel ecosystems, not just posts. Grew three brand accounts from under 5K to over 100K followers in under a year. Fluent in Arabic and English content.',
    verified: true,
    social: { instagram: 88000, tiktok: 212000 },
    workedWith: ['dina-freijat', 'lara-nassar'],
    credits: [
      { titleId: 'threads-of-jordan', role: 'Social Media Manager', year: 2024 },
      { titleId: 'ramadan-glow', role: 'Content Distribution Lead', year: 2024 },
    ],
    ratingAverage: 4.7,
    ratingCount: 8,
  },
  {
    id: 'tarek-haddad',
    nameLatin: 'Tarek Haddad',
    nameArabic: 'طارق حداد',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&auto=format&q=80',
    city: 'Baghdad',
    country: 'Iraq',
    specialtyTags: ['Motion Graphics', 'VFX'],
    phases: ['post-production'],
    bio: 'Motion designer with a heavy After Effects background and a love for kinetic type and 3D integration. Based in Baghdad, works across the region on music videos, brand launches, and broadcast.',
    verified: true,
    social: { instagram: 27000, tiktok: 55000, youtube: 41000 },
    workedWith: ['nour-khalil'],
    credits: [
      { titleId: 'voice-of-streets', role: 'Motion Graphics Director', year: 2023 },
      { titleId: 'ramadan-glow', role: 'VFX & Motion Graphics', year: 2024 },
    ],
    ratingAverage: 4.5,
    ratingCount: 11,
  },
  {
    id: 'rana-qasim',
    nameLatin: 'Rana Qasim',
    nameArabic: 'رنا قاسم',
    photo: 'https://images.unsplash.com/photo-1522609925277-66fea332c575?w=400&h=400&fit=crop&auto=format&q=80',
    city: 'Amman',
    country: 'Jordan',
    specialtyTags: ['Makeup Artist', 'Hair Stylist'],
    phases: ['pre-production'],
    bio: 'Editorial and commercial makeup artist with over 200 productions. From fast-paced TikTok shoots to week-long campaign sets — reliable, precise, and calm under pressure.',
    verified: true,
    social: { instagram: 19000, tiktok: 34000 },
    workedWith: ['lara-nassar', 'maya-idris'],
    credits: [
      { titleId: 'threads-of-jordan', role: 'Lead Makeup Artist', year: 2024 },
    ],
    ratingAverage: 4.6,
    ratingCount: 7,
  },
  {
    id: 'ziad-barakat',
    nameLatin: 'Ziad Barakat',
    nameArabic: 'زياد بركات',
    photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop&auto=format&q=80',
    city: 'Damascus',
    country: 'Syria',
    specialtyTags: ['Sound Engineer', 'Music Producer'],
    phases: ['production'],
    bio: 'Sound recordist and mixer for documentary and branded content. Trained in broadcast audio — every clean cut starts with clean sound on set.',
    verified: true,
    social: { instagram: 8500 },
    workedWith: ['kareem-al-rashid'],
    credits: [
      { titleId: 'city-pulse', role: 'Sound Engineer', year: 2023 },
      { titleId: 'voice-of-streets', role: 'Sound Recordist & Mix', year: 2023 },
    ],
    ratingAverage: 4.4,
    ratingCount: 5,
  },
  {
    id: 'maya-idris',
    nameLatin: 'Maya Idris',
    nameArabic: 'مايا إدريس',
    photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&h=400&fit=crop&auto=format&q=80',
    city: 'Cairo',
    country: 'Egypt',
    specialtyTags: ['Stylist', 'Fashion Manager'],
    phases: ['pre-production'],
    bio: 'Fashion stylist and wardrobe manager for editorial and commercial campaigns. Cairo-based, regional reach — worked with brands from Amman to Dubai.',
    verified: true,
    social: { instagram: 23000, tiktok: 11000 },
    workedWith: ['rana-qasim', 'lara-nassar'],
    credits: [
      { titleId: 'threads-of-jordan', role: 'Lead Stylist', year: 2024 },
    ],
    ratingAverage: 4.8,
    ratingCount: 6,
  },
  {
    id: 'omar-shamma',
    nameLatin: 'Omar Shamma',
    nameArabic: 'عمر شمة',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&auto=format&q=80',
    city: 'Amman',
    country: 'Jordan',
    specialtyTags: ['Scriptwriter', 'Story Consultant'],
    phases: ['pre-production'],
    bio: 'Screenwriter and creative consultant for branded content and short-form documentary. Has a gift for finding the specific detail that makes a script feel real.',
    verified: true,
    social: { instagram: 6200, youtube: 3800 },
    workedWith: ['lara-nassar'],
    credits: [
      { titleId: 'city-pulse', role: 'Scriptwriter', year: 2023 },
      { titleId: 'ramadan-glow', role: 'Script & Creative Consultant', year: 2024 },
    ],
    ratingAverage: 4.7,
    ratingCount: 4,
  },
  {
    id: 'dina-freijat',
    nameLatin: 'Dina Freijat',
    nameArabic: 'دينا فريجات',
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&auto=format&q=80',
    city: 'Amman',
    country: 'Jordan',
    specialtyTags: ['Paid Ads Manager', 'Performance Marketing'],
    phases: ['social-media'],
    bio: 'Performance marketer focused on Meta and TikTok campaigns for content creators and brand campaigns. Fluent in both Arabic and English ad environments.',
    verified: true,
    social: { instagram: 12000, tiktok: 29000 },
    workedWith: ['sana-mahmoud'],
    credits: [
      { titleId: 'threads-of-jordan', role: 'Paid Ads Manager', year: 2024 },
    ],
    ratingAverage: 4.3,
    ratingCount: 3,
  },
]

export const titles: Title[] = [
  {
    id: 'ein-sihriya',
    name: 'عين سحرية',
    brand: 'BlueBee Productions · United Studios',
    year: 2025,
    thumb: posterEinSihriya,
    platforms: ['Shahid', 'ON'],
    description: 'A gripping Arabic thriller series following a surveillance expert who uncovers a web of secrets. Directed by السدير مسعود, written by هشام هلال, produced by دينا كريم.',
    credits: [
      { makerId: 'lara-nassar', role: 'Director' },
      { makerId: 'kareem-al-rashid', role: 'Director of Photography' },
      { makerId: 'nour-khalil', role: 'Editor' },
    ],
  },
  {
    id: 'ras-al-afaa',
    name: 'رأس الأفعى',
    brand: 'المتحدة · United Studios',
    year: 2026,
    thumb: posterRasAlAfaa,
    platforms: ['ON', 'Shahid'],
    description: 'An action-packed Ramadan 2026 series about an elite police unit facing its most dangerous mission. Exclusive on ON.',
    credits: [
      { makerId: 'tarek-haddad', role: 'VFX Supervisor' },
      { makerId: 'ziad-barakat', role: 'Sound Designer' },
      { makerId: 'omar-shamma', role: 'Scriptwriter' },
    ],
  },
  {
    id: 'al-maddah',
    name: 'المداح: أسطورة العشق',
    brand: 'Cedars Art Production · MBC مصر',
    year: 2023,
    thumb: posterAlMaddah,
    platforms: ['MBC', 'Shahid'],
    description: 'A beloved Arabic drama series following the legendary storyteller in a tale of love and sacrifice. Directed by أحمد سمير فرج, written by أمين جمال.',
    credits: [
      { makerId: 'maya-idris', role: 'Costume Designer' },
      { makerId: 'rana-qasim', role: 'Lead Makeup Artist' },
      { makerId: 'dina-freijat', role: 'Production Manager' },
    ],
  },
  {
    id: 'sayd-al-aqareb',
    name: 'صيد العقارب',
    brand: 'المتحدة · Phenomena Media',
    year: 2025,
    thumb: posterSaydAlAqareb,
    platforms: ['Shahid', 'ON'],
    description: 'A high-stakes Arabic drama series featuring an ensemble cast in a story of power, betrayal, and survival. Directed by أحمد حسن.',
    credits: [
      { makerId: 'lara-nassar', role: 'Creative Consultant' },
      { makerId: 'kareem-al-rashid', role: 'Director of Photography' },
      { makerId: 'sana-mahmoud', role: 'Social Media Lead' },
    ],
  },
  {
    id: 'superman-2025',
    name: 'Superman',
    brand: 'DC Studios · Warner Bros.',
    year: 2025,
    thumb: posterSuperman,
    platforms: ['Cinema', 'MAX'],
    description: 'A new chapter for the Man of Steel. A hopeful hero navigates a complex world while rediscovering what it means to be human. Directed by James Gunn.',
    credits: [
      { makerId: 'tarek-haddad', role: 'VFX Artist' },
      { makerId: 'ziad-barakat', role: 'Sound Mix' },
    ],
  },
  {
    id: 'al-nukran',
    name: 'النكران',
    brand: 'Gulf Lens · Abu Dhabi Media',
    year: 2024,
    thumb: posterAlNukran,
    platforms: ['Abu Dhabi TV', 'Shahid'],
    description: 'A powerful Gulf drama exploring denial, loyalty, and family secrets. Directed by خالد جمال, produced by Gulf Lens Art Production.',
    credits: [
      { makerId: 'lara-nassar', role: 'Creative Director' },
      { makerId: 'kareem-al-rashid', role: 'Director of Photography' },
    ],
  },
  {
    id: 'beebo',
    name: 'بيبو',
    brand: 'Film Khana Studios · المتحدة',
    year: 2026,
    thumb: posterBeebo,
    platforms: ['ON', 'Shahid'],
    description: 'A Ramadan 2026 drama series. Directed by أحمد شفيق, written by تامر محسن. Produced by Film Khana Studios.',
    credits: [
      { makerId: 'tarek-haddad', role: 'VFX Supervisor' },
      { makerId: 'nour-khalil', role: 'Editor' },
    ],
  },
  {
    id: 'bil-haram',
    name: 'بالحرام',
    brand: 'Eagle Films',
    year: 2025,
    thumb: posterBilHaram,
    platforms: ['Shahid', 'Cinema'],
    description: 'A theatrical ensemble drama. Directed by فيليب أسمر, produced by جمال سنان. Written by شادي كيوان and فادي حسين.',
    credits: [
      { makerId: 'maya-idris', role: 'Costume Designer' },
      { makerId: 'rana-qasim', role: 'Lead Makeup Artist' },
    ],
  },
  {
    id: 'arcane',
    name: 'Arcane',
    brand: 'Netflix · Riot Games',
    year: 2021,
    thumb: posterArcane,
    platforms: ['Netflix'],
    description: 'An animated series set in the League of Legends universe, exploring the origins of champions Vi and Jinx in the cities of Piltover and Zaun.',
    credits: [
      { makerId: 'tarek-haddad', role: 'Motion Graphics Reference' },
    ],
  },
  {
    id: 'darsh',
    name: 'درش',
    brand: 'المتحدة · United Studios',
    year: 2026,
    thumb: posterDarsh,
    platforms: ['ON', 'Shahid'],
    description: 'A Ramadan 2026 action series. Exclusive on ON. Featuring an ensemble cast in a high-stakes story of crime and survival.',
    credits: [
      { makerId: 'omar-shamma', role: 'Scriptwriter' },
      { makerId: 'ziad-barakat', role: 'Sound Designer' },
    ],
  },
  {
    id: 'mawlana',
    name: 'مولانا',
    brand: 'Cedars Art Production · MBC',
    year: 2026,
    thumb: posterMawlana,
    platforms: ['MBC', 'Shahid'],
    description: 'A Ramadan 2026 drama series. Directed by سامر البرقاوي, written by كفاح زبي and باسل الفاعور.',
    credits: [
      { makerId: 'lara-nassar', role: 'Creative Consultant' },
      { makerId: 'dina-freijat', role: 'Production Manager' },
    ],
  },
  {
    id: 'al-ostaz',
    name: 'الأستاذ',
    brand: 'Synergy · المتحدة',
    year: 2025,
    thumb: posterAlOstaz,
    platforms: ['ON', 'Shahid'],
    description: 'A gripping drama series. Directed by مرقس عادل, produced by تامر مرسي (Synergy). Written by محمد الشواف.',
    credits: [
      { makerId: 'kareem-al-rashid', role: 'Director of Photography' },
      { makerId: 'nour-khalil', role: 'Editor & Colorist' },
    ],
  },
  {
    id: 'zel-ragel',
    name: 'ظل راجل',
    brand: 'Synergy · تامر مرسي',
    year: 2024,
    thumb: posterZelRagel,
    platforms: ['ON', 'Shahid'],
    description: "Man's Shadow — a tense psychological thriller. Directed by أحمد صالح, produced by تامر مرسي. Written by أحمد عبد الفتاح.",
    credits: [
      { makerId: 'tarek-haddad', role: 'VFX Supervisor' },
      { makerId: 'ziad-barakat', role: 'Sound Engineer' },
    ],
  },
]

export const collaborationRequests: CollaborationRequest[] = [
  {
    id: 'cr-001',
    fromMakerId: 'lara-nassar',
    toMakerId: 'kareem-al-rashid',
    projectName: 'Threads of Jordan',
    brief: 'Looking for a DOP who can handle both intimate portrait work and wide landscape shots. This is a 6-day fashion shoot.',
    status: 'completed',
    createdAt: '2024-01-10T09:00:00Z',
    completedAt: '2024-03-15T18:00:00Z',
  },
  {
    id: 'cr-002',
    fromMakerId: 'nour-khalil',
    toMakerId: 'tarek-haddad',
    projectName: 'Ramadan Glow',
    brief: 'Need motion graphics support for a Ramadan campaign — soft, warm aesthetic, Arabic type animation.',
    status: 'completed',
    createdAt: '2024-02-01T11:00:00Z',
    completedAt: '2024-03-25T17:00:00Z',
  },
]

export const reviews: Review[] = [
  {
    id: 'rev-001a',
    collaborationRequestId: 'cr-001',
    fromMakerId: 'lara-nassar',
    toMakerId: 'kareem-al-rashid',
    stars: 5,
    comment: 'Kareem brought an instinct to the shoot that I didn\'t expect. He understood what we needed before I said it — and his eye for light in Wadi Rum was exceptional.',
    submittedAt: '2024-03-16T10:00:00Z',
    visibleAt: '2024-03-16T14:00:00Z',
  },
  {
    id: 'rev-001b',
    collaborationRequestId: 'cr-001',
    fromMakerId: 'kareem-al-rashid',
    toMakerId: 'lara-nassar',
    stars: 5,
    comment: 'Lara runs a tight, respectful set. Her direction is decisive without being rigid — exactly the kind of director who makes your camera work look better than it is.',
    submittedAt: '2024-03-16T12:00:00Z',
    visibleAt: '2024-03-16T14:00:00Z',
  },
  {
    id: 'rev-002a',
    collaborationRequestId: 'cr-002',
    fromMakerId: 'nour-khalil',
    toMakerId: 'tarek-haddad',
    stars: 4,
    comment: 'Tarek delivered beautiful work and understood the mood immediately. Slight delays on the first round of revisions, but the final output was exactly what we needed.',
    submittedAt: '2024-03-26T09:00:00Z',
    visibleAt: '2024-03-28T09:00:00Z',
  },
  {
    id: 'rev-002b',
    collaborationRequestId: 'cr-002',
    fromMakerId: 'tarek-haddad',
    toMakerId: 'nour-khalil',
    stars: 5,
    comment: 'Working with Nour was a masterclass in remote collaboration. Clear briefs, fast feedback, and she trusted my choices while staying decisive about what she needed.',
    submittedAt: '2024-03-28T08:00:00Z',
    visibleAt: '2024-03-28T09:00:00Z',
  },
]

export function getMakerById(id: string) {
  return makers.find((m) => m.id === id)
}

export function getTitleById(id: string) {
  return titles.find((t) => t.id === id)
}

export function getReviewsForMaker(makerId: string) {
  return reviews.filter((r) => r.toMakerId === makerId)
}

export function getReviewsFromMaker(makerId: string) {
  return reviews.filter((r) => r.fromMakerId === makerId)
}

export function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toString()
}

export const phaseLabels: Record<Phase, string> = {
  'pre-production': 'Pre-Production',
  production: 'Production',
  'post-production': 'Post-Production',
  'social-media': 'Social Media',
}

export const phaseSpecialties: Record<Phase, string[]> = {
  'pre-production': ['Planning', 'Writing', 'Storyboarding', 'Acting', 'Makeup Artist', 'Stylist/Fashion Manager', 'Set Designer'],
  production: ['Photographer/DOP', 'Director', 'Production Manager', 'Location/Set Designer', 'Sound Engineer', 'Lighting Director'],
  'post-production': ['Video Editor', 'Motion Graphics Designer'],
  'social-media': ['Social Media Manager', 'Paid Ads Manager'],
}
