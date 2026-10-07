import { next } from '@vercel/functions'

// Share previews and sitemap for the single page app.
// Link previews (WhatsApp, X, LinkedIn, Google) read the HTML before any JavaScript runs,
// so for a profile, project or open call we return index.html with that page's own
// title, description and image. Every other request continues untouched.

export const config = {
  matcher: ['/sitemap.xml', '/((?!assets/|api/|.*\\.[A-Za-z0-9]+$).*)'],
}

const SITE = 'https://makerss.net'
const SUPABASE_URL = 'https://ggtdseujebmfugwcbnyk.supabase.co'
// Publishable key: safe to ship, access is enforced by Row Level Security.
const SUPABASE_KEY = 'sb_publishable_OlQKED89zR7MzfM90jE6PQ_rSwjAvs4'
const DEFAULT_IMAGE = `${SITE}/og.png`

// First path segments that are app pages, not usernames (keep in sync with RESERVED_PATHS).
const RESERVED = new Set(['admin', 'join', 'login', 'me', 'inbox', 'terms', 'privacy', 'api', 'about', 'makers', 'settings', 'status', 'reset', 'en', 'ar', 'messages', 'projects', 'opportunities', 'search', 'app', 'creators', 'player', 'account', 'p', 'writing', 'writings', 'write', 'articles'])

interface Meta {
  title: string
  description: string
  image: string
  url: string
  type: 'profile' | 'video.other' | 'article'
}

async function rest<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: AbortSignal.timeout(2000),
    })
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clip = (s: string | null | undefined, n: number) => {
  const v = (s || '').replace(/\s+/g, ' ').trim()
  return v.length > n ? `${v.slice(0, n - 1).trimEnd()}…` : v
}
const https = (u: string | null | undefined) => (u && /^https:\/\//.test(u) ? u : null)

interface ProfileRow { full_name: string | null; name_ar: string | null; username: string; bio: string | null; avatar_url: string | null; city: string | null; country: string | null; account_type: string | null }
interface WorkRow { id: string; slug: string | null; title: string; description: string | null; year: number | null; brand: string | null; thumb_url: string | null; thumbnail_url: string | null; url: string | null }
interface WritingRow { id: string; title: string; summary: string | null; body: string | null; kind: string; owner: { full_name: string | null; name_ar: string | null } | null }
interface CallRow { id: string; title: string; description: string; org: string | null }

function youtubeThumb(url: string | null) {
  const m = url?.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i)
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null
}

async function projectMeta(filter: string): Promise<Meta | null> {
  const rows = await rest<WorkRow[]>(`works?select=id,slug,title,description,year,brand,thumb_url,thumbnail_url,url&${filter}&limit=1`)
  const w = rows?.[0]
  if (!w) return null
  const line = [w.year, w.brand].filter(Boolean).join(' · ')
  return {
    title: `${w.title} | Makers`,
    description: clip(w.description, 180) || (line ? `${line} · Makers` : 'مشروع على Makers، دليل صنّاع الإنتاج في العالم العربي.'),
    image: https(w.thumb_url) || https(w.thumbnail_url) || youtubeThumb(w.url) || DEFAULT_IMAGE,
    url: w.slug ? `${SITE}/${w.slug}` : `${SITE}/projects/${w.id}`,
    type: 'video.other',
  }
}

async function metaFor(path: string): Promise<Meta | null> {
  const seg = path.replace(/^\/+|\/+$/g, '').split('/').map((s) => decodeURIComponent(s))
  const [first = '', second = ''] = seg

  if (first === 'projects' && /^[0-9a-f-]{36}$/i.test(second) && seg.length === 2) return projectMeta(`id=eq.${second}`)

  if (first === 'opportunities' && /^[0-9a-f-]{36}$/i.test(second) && seg.length === 2) {
    const rows = await rest<CallRow[]>(`open_calls?select=id,title,description,org&id=eq.${second}&status=eq.open&limit=1`)
    const c = rows?.[0]
    if (!c) return null
    return {
      title: `${c.title} | فرصة على Makers`,
      description: clip(c.description, 180),
      image: DEFAULT_IMAGE,
      url: `${SITE}/opportunities/${c.id}`,
      type: 'article',
    }
  }

  if (first === 'writing' && /^[0-9a-f-]{36}$/i.test(second) && seg.length === 2) {
    const rows = await rest<WritingRow[]>(`writings?select=id,title,summary,body,kind,owner:profiles!writings_owner_id_fkey(full_name,name_ar)&id=eq.${second}&status=eq.published&limit=1`)
    const w = rows?.[0]
    if (!w) return null
    const by = w.owner ? w.owner.name_ar || w.owner.full_name : ''
    const kind = w.kind === 'article' ? 'مقال' : w.kind === 'script' ? 'سيناريو' : 'ستوري بورد'
    return {
      title: `${w.title} | Makers`,
      description: clip(w.summary || (w.body || '').replace(/^#{2,3}\s+|^>\s?|\*\*/gm, ''), 180) || [kind, by].filter(Boolean).join(' · '),
      image: DEFAULT_IMAGE,
      url: `${SITE}/writing/${w.id}`,
      type: 'article',
    }
  }

  if (seg.length === 1 && first && !RESERVED.has(first.toLowerCase()) && /^[a-z0-9-]{2,50}$/i.test(first)) {
    const rows = await rest<ProfileRow[]>(`profiles?select=full_name,name_ar,username,bio,avatar_url,city,country,account_type&username=ilike.${encodeURIComponent(first)}&status=eq.approved&limit=1`)
    const p = rows?.[0]
    // Not a member: maybe a project's short link (makerss.net/al-nahham).
    if (!p) return projectMeta(`slug=eq.${encodeURIComponent(first.toLowerCase())}`)
    const name = p.name_ar || p.full_name || p.username
    const alt = p.full_name && p.name_ar && p.full_name !== p.name_ar ? ` (${p.full_name})` : ''
    const place = [p.city, p.country].filter(Boolean).join('، ')
    const kind = p.account_type === 'creator' ? 'صانع محتوى على Makers' : 'على Makers، دليل صنّاع الإنتاج'
    return {
      title: `${name}${alt} | Makers`,
      description: clip(p.bio, 180) || [kind, place].filter(Boolean).join(' · '),
      image: https(p.avatar_url) || DEFAULT_IMAGE,
      url: `${SITE}/${p.username}`,
      type: 'profile',
    }
  }
  return null
}

function withMeta(html: string, m: Meta) {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+(?:property|name)="(?:og:[a-z_:]+|twitter:[a-z_:]+|description)"[^>]*>\s*/gi, '')
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${esc(m.url)}" />`,
    `<meta property="og:site_name" content="Makers" />`,
    `<meta property="og:type" content="${m.type}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${esc(m.url)}" />`,
    `<meta property="og:image" content="${esc(m.image)}" />`,
    `<meta name="twitter:card" content="${m.image === DEFAULT_IMAGE ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${esc(m.image)}" />`,
  ].join('\n    ')
  return cleaned.replace(/<\/head>/i, `    ${tags}\n  </head>`)
}

async function sitemap() {
  const [profiles, works, writings] = await Promise.all([
    rest<{ username: string; updated_at: string }[]>('profiles?select=username,updated_at&status=eq.approved&order=updated_at.desc&limit=5000'),
    rest<{ id: string; slug: string | null; updated_at: string | null; created_at: string }[]>('works?select=id,slug,updated_at,created_at&order=created_at.desc&limit=5000'),
    rest<{ id: string; updated_at: string }[]>('writings?select=id,updated_at&status=eq.published&order=published_at.desc&limit=5000'),
  ])
  const day = (iso: string | null | undefined) => (iso || new Date().toISOString()).slice(0, 10)
  const urls = [
    `<url><loc>${SITE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${SITE}/makers</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${SITE}/projects</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${SITE}/opportunities</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`,
    `<url><loc>${SITE}/writing</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`,
    ...(profiles || []).map((p) => `<url><loc>${SITE}/${esc(p.username)}</loc><lastmod>${day(p.updated_at)}</lastmod><priority>0.8</priority></url>`),
    ...(works || []).map((w) => `<url><loc>${SITE}/${w.slug ? esc(w.slug) : `projects/${w.id}`}</loc><lastmod>${day(w.updated_at || w.created_at)}</lastmod><priority>0.6</priority></url>`),
    ...(writings || []).map((w) => `<url><loc>${SITE}/writing/${w.id}</loc><lastmod>${day(w.updated_at)}</lastmod><priority>0.6</priority></url>`),
  ]
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=3600' },
  })
}

export default async function middleware(request: Request) {
  if (request.method !== 'GET') return next()
  try {
    const url = new URL(request.url)
    if (url.pathname === '/sitemap.xml') return await sitemap()
    const meta = await metaFor(url.pathname)
    if (!meta) return next()
    const page = await fetch(new URL('/index.html', url), { signal: AbortSignal.timeout(2000) })
    if (!page.ok) return next()
    return new Response(withMeta(await page.text(), meta), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate' },
    })
  } catch {
    return next()
  }
}
