import { useState } from 'react'
import type { Navigate } from '../App'

interface NewsPageProps {
  navigate: Navigate
}

const MAIN_ARTICLES = [
  {
    id: 'n1',
    title: "Arab Filmmakers Dominate Cannes 2025 — Record Number of Selections from the Region",
    img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=420&fit=crop',
    body: [
      "This year's Cannes Film Festival saw an unprecedented 14 projects from Arab directors in official selection, signaling a global shift in attention toward Middle Eastern cinema and its makers. Among the highlights were debut features from Saudi Arabia, Lebanon, and Egypt.",
      "The jury praised the diversity of voices and the technical ambition on display, noting that several films were produced entirely outside the traditional studio system — a testament to the growing independent production ecosystem across the Arab world.",
      "1. 'After the Rain' — Lebanon (2025) · Dir. Nadia Karim",
      "2. 'Desert Echo' — Jordan (2025) · Dir. Omar Al-Rashed",
      "...",
    ],
    date: 'Aug 11, 2026',
    author: 'Makers Editorial',
    source: 'Makers News',
    category: 'Top news',
  },
  {
    id: 'n2',
    title: "Saudi Arabia Announces $500M Film Fund for Regional Co-Productions",
    img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=420&fit=crop',
    body: [
      "The Saudi Film Commission unveiled a landmark $500 million fund designed to attract international co-productions and develop local talent across the Arab world. The initiative is expected to greenlight 40+ projects over the next three years.",
      "Commission CEO Abdullah Al-Eyaf described the fund as 'a statement of intent' — positioning Saudi Arabia as the new center of Arabic-language film and television production.",
    ],
    date: 'Aug 11, 2026',
    author: 'Reem Al-Harbi',
    source: 'Variety',
    category: 'Industry news',
  },
  {
    id: 'n3',
    title: "Jordan's 'Desert Echo' Wins Best Cinematography at Dubai International Film Festival",
    img: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&h=420&fit=crop',
    body: [
      "The Jordanian feature took home the top prize in cinematography, with the jury citing its breathtaking desert landscapes and unconventional handheld style. Director of Photography Karim Nassar worked with a skeleton crew of 6 to achieve the film's intimate visual language.",
      "'We wanted the camera to feel like another character,' Nassar told press at the awards ceremony. 'Every shot was earned on foot.'",
    ],
    date: 'Aug 10, 2026',
    author: 'Layla Haddad',
    source: 'Screen Daily',
    category: 'Film news',
  },
  {
    id: 'n4',
    title: "TikTok Arabia Launches $10M Creator Fund Targeting Arab Content Makers",
    img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=420&fit=crop',
    body: [
      "The platform announced dedicated funding for Arab creators producing original short-form content in Arabic, with a focus on storytelling, comedy, and lifestyle verticals. Applications open September 1.",
      "The fund prioritizes creators with audiences in Egypt, Saudi Arabia, and the UAE, with grants ranging from $5,000 to $50,000 per creator.",
    ],
    date: 'Aug 10, 2026',
    author: 'Sami Barakat',
    source: 'Arab News',
    category: 'Industry news',
  },
]

const SIDEBAR_SECTIONS: { label: string; items: { title: string; date: string; author: string; img: string }[] }[] = [
  {
    label: 'Celebrity news',
    items: [
      { title: "Egyptian Actor Khaled El Nabawy Joins Marvel's Upcoming Project", date: '8/11/2026', author: 'by Rania Aziz...', img: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=80&h=80&fit=crop' },
      { title: "Lebanese Singer Fairuz's Biopic Gets International Distribution Deal", date: '8/11/2026', author: 'by Omar Madi...', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=80&h=80&fit=crop' },
      { title: "Syrian Director Waha Al-Raheb Named UNESCO Artist for Peace", date: '8/11/2026', author: 'by Lina Sami...', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop' },
      { title: "Moroccan Actor Saïd Taghmaoui Cast in Ridley Scott's New Epic", date: '8/11/2026', author: 'by Yousef Kh...', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop' },
    ],
  },
  {
    label: 'Indie news',
    items: [
      { title: "Palestinian Documentary 'Stone and Sky' Wins at Sundance", date: '8/11/2026', author: 'by Maya Idris...', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=80&h=80&fit=crop' },
      { title: "Beirut-Shot Short Film Accepted to 40 International Festivals", date: '8/11/2026', author: 'by Nour Nass...', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=80&h=80&fit=crop' },
      { title: "Iraqi Director Haider Rashid's Thriller Acquired by MUBI", date: '8/10/2026', author: 'by Sana Mah...', img: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=80&h=80&fit=crop' },
      { title: "New Arab Indie Film Fund Opens Applications — Up to $80K Available", date: '8/10/2026', author: 'by Editors...', img: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=80&h=80&fit=crop' },
    ],
  },
  {
    label: 'Festivals',
    items: [
      { title: "Abu Dhabi Film Festival Returns With Record 200 Submissions", date: '8/8/2026', author: 'by Hana Al-K...', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=80&h=80&fit=crop' },
      { title: "El Gouna Film Festival Announces 2026 Competition Lineup", date: '8/7/2026', author: 'by Ahmed N...', img: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=80&h=80&fit=crop' },
      { title: "Marrakech IFF Expands Arab Cinema Competition to 20 Films", date: '8/7/2026', author: 'by Sofia B...', img: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=80&h=80&fit=crop' },
    ],
  },
]

export default function NewsPage({ navigate }: NewsPageProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['n1']))

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8">

      {/* Page title */}
      <div className="flex items-center gap-2 mb-8">
        <span className="inline-block w-1 rounded-full flex-shrink-0" style={{ background: '#E85D04', height: 24 }} />
        <h1 className="font-inter font-black text-paper" style={{ fontSize: 26, letterSpacing: '-0.02em' }}>Top news</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* ── Left: article stack ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-0">
          {MAIN_ARTICLES.map((article, idx) => {
            const isOpen = expanded.has(article.id)
            return (
              <div
                key={article.id}
                className="py-5"
                style={{ borderBottom: idx < MAIN_ARTICLES.length - 1 ? '1px solid var(--c-border)' : 'none' }}
              >
                {/* Title */}
                <button
                  onClick={() => navigate({ name: 'news-article', id: article.id })}
                  className="text-left w-full mb-3"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <h2
                    className="font-inter font-bold leading-snug hover:text-orange transition-colors"
                    style={{ fontSize: 16, color: 'var(--c-text)' }}
                  >
                    {article.title}
                    <svg className="inline ml-1.5 opacity-40" width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ verticalAlign: 'middle' }}>
                      <path d="M2 2h7v7M2 9l7-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </h2>
                </button>

                {/* Full image always visible */}
                <div className="rounded-xl overflow-hidden mb-3" style={{ width: '100%', maxHeight: 320 }}>
                  <img src={article.img} alt={article.title} className="w-full object-cover" style={{ maxHeight: 320 }} />
                </div>

                {/* Body */}
                <div className="font-inter leading-relaxed mb-3" style={{ fontSize: 13, color: 'rgba(245,240,235,0.65)' }}>
                  {isOpen ? (
                    article.body.map((para, i) => (
                      <p key={i} className="mb-2">{para}</p>
                    ))
                  ) : (
                    <p>{article.body[0].slice(0, 180)}…</p>
                  )}
                </div>

                {/* Byline */}
                <div className="flex items-center justify-between">
                  <p className="font-inter" style={{ fontSize: 11, color: 'var(--c-muted-2)' }}>
                    {article.date} · <span style={{ color: 'var(--c-muted)' }}>by {article.author}</span> · <span style={{ color: '#E85D04' }}>{article.source}</span>
                  </p>
                  <button
                    onClick={() => navigate({ name: 'news-article', id: article.id })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted-2)', padding: 4 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                      <circle cx="4" cy="8" r="1.2" fill="currentColor" />
                      <circle cx="12" cy="8" r="1.2" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Right: More to explore sidebar ── */}
        <div className="flex-shrink-0 w-full lg:w-72">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-block w-1 rounded-full flex-shrink-0" style={{ background: '#E85D04', height: 20 }} />
            <h2 className="font-inter font-black text-paper" style={{ fontSize: 18 }}>More to explore</h2>
          </div>

          <div className="flex flex-col gap-8">
            {SIDEBAR_SECTIONS.map((section) => (
              <div key={section.label}>
                <button
                  className="flex items-center gap-1 mb-4 hover:text-orange transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <span className="font-inter font-black text-paper" style={{ fontSize: 15 }}>{section.label}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" transform="rotate(-90 7 7)" /></svg>
                </button>

                <div className="flex flex-col gap-0">
                  {section.items.map((item, i) => (
                    <button
                      key={i}
                      className="flex items-start gap-3 py-3 text-left group hover:opacity-80 transition-opacity w-full"
                      style={{ background: 'none', border: 'none', borderTop: i > 0 ? '1px solid var(--c-border)' : 'none', cursor: 'pointer', padding: '10px 0' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-inter font-semibold leading-snug mb-1 group-hover:text-orange transition-colors" style={{ fontSize: 12, color: 'var(--c-text)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.title}
                        </p>
                        <p className="font-inter" style={{ fontSize: 10, color: 'var(--c-muted-2)' }}>
                          {item.date} · <span>{item.author}</span>
                        </p>
                      </div>
                      <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 52, height: 52 }}>
                        <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
