import type { Navigate } from '../App'

interface NewsArticleProps {
  id: string
  navigate: Navigate
}

const ARTICLES: Record<string, {
  title: string
  category: string
  author: string
  date: string
  source: string
  img: string
  imgCaption: string
  body: string[]
  related: { title: string; id: string }[]
}> = {
  n1: {
    title: 'Arab Filmmakers Dominate Cannes 2025 — Record Number of Selections from the Region',
    category: 'Top news',
    author: 'Makers Editorial',
    date: 'Aug 11, 2026',
    source: 'Makers News',
    img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=600&fit=crop',
    imgCaption: 'The Cannes Film Festival red carpet drew an unprecedented number of Arab filmmakers in 2025.',
    body: [
      "This year's Cannes Film Festival saw an unprecedented 14 projects from Arab directors in official selection, signaling a global shift in attention toward Middle Eastern cinema and its makers. Among the highlights were debut features from Saudi Arabia, Lebanon, and Egypt that drew standing ovations from critics and audiences alike.",
      "The jury, led by French director Claire Denis, praised the diversity of voices on display, noting that several films were produced entirely outside the traditional studio system — a testament to the growing independent production ecosystem across the Arab world.",
      "Lebanese director Nadia Karim's debut feature 'After the Rain' received the longest ovation of the festival, while Jordanian documentary 'Desert Echo' won the FIPRESCI Prize for best debut film. Saudi Arabia was represented by three projects — the most in the country's history at Cannes.",
      "Industry observers are pointing to a perfect storm of factors: the Saudi Film Commission's $500 million investment fund, the expansion of platforms like Shahid and Netflix Arabia commissioning original Arabic-language content, and a generation of filmmakers trained in Europe and the US who are now returning home with world-class technical skills.",
      "'We are no longer waiting for permission,' said director Omar Al-Rashed in a press conference following the premiere of 'Desert Echo'. 'The infrastructure is here. The audiences are ready. The stories have always been there.'",
      "The Cannes selections represent a broader shift that industry insiders have been tracking for several years. Regional film festivals — El Gouna, Abu Dhabi, Marrakech — have nurtured a pipeline of talent that is now breaking through to the world stage.",
    ],
    related: [
      { title: "Saudi Arabia Announces $500M Film Fund for Regional Co-Productions", id: 'n2' },
      { title: "Jordan's 'Desert Echo' Wins Best Cinematography at Dubai International Film Festival", id: 'n3' },
      { title: "Lebanese Director Nadia Karim's Debut Feature Gets Netflix Worldwide Deal", id: 'n5' },
    ],
  },
  n2: {
    title: "Saudi Arabia Announces $500M Film Fund for Regional Co-Productions",
    category: 'Industry news',
    author: 'Reem Al-Harbi',
    date: 'Aug 11, 2026',
    source: 'Variety',
    img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=600&fit=crop',
    imgCaption: 'The Saudi Film Commission announced the landmark fund at a ceremony in Riyadh.',
    body: [
      "The Saudi Film Commission unveiled a landmark $500 million fund designed to attract international co-productions and develop local talent across the Arab world. The initiative is expected to greenlight 40+ projects over the next three years.",
      "Commission CEO Abdullah Al-Eyaf described the fund as 'a statement of intent' — positioning Saudi Arabia as the new center of Arabic-language film and television production. The fund will prioritize projects that tell Arab stories to global audiences.",
      "International studios including Sony Pictures, Warner Bros. Discovery, and Netflix have already expressed interest in co-production agreements under the new framework. The fund will require a minimum of 40% Arab creative involvement in all funded projects.",
      "Eligible projects include feature films, documentary series, short films, and branded content campaigns. Applications open September 1, with the first slate of greenlit projects expected to be announced at the El Gouna Film Festival in October.",
    ],
    related: [
      { title: 'Arab Filmmakers Dominate Cannes 2025 — Record Number of Selections from the Region', id: 'n1' },
      { title: "TikTok Arabia Launches $10M Creator Fund Targeting Arab Content Makers", id: 'n4' },
      { title: "Morocco's Atlas Studios Expands to Become Africa's Largest Production Facility", id: 'n9' },
    ],
  },
  n3: {
    title: "Jordan's 'Desert Echo' Wins Best Cinematography at Dubai International Film Festival",
    category: 'Film news',
    author: 'Layla Haddad',
    date: 'Aug 10, 2026',
    source: 'Screen Daily',
    img: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&h=600&fit=crop',
    imgCaption: "A still from 'Desert Echo', shot entirely in Wadi Rum over three weeks.",
    body: [
      "The Jordanian feature 'Desert Echo' took home the top prize in cinematography at the Dubai International Film Festival, with the jury citing its breathtaking desert landscapes and unconventional handheld style.",
      "Director of Photography Karim Nassar worked with a skeleton crew of 6 to achieve the film's intimate visual language. 'We wanted the camera to feel like another character,' Nassar told press at the awards ceremony. 'Every shot was earned on foot.'",
      "The film was shot entirely in Wadi Rum over three weeks, using only natural light and a single ARRI Alexa Mini LF camera. The production team slept in tents and rose before dawn each day to capture the first light over the desert.",
      "Director Lara Nassar dedicated the award to 'every Jordanian filmmaker who was told their story wasn't big enough for the world.' The film has since been acquired for distribution in 22 countries.",
    ],
    related: [
      { title: 'Arab Filmmakers Dominate Cannes 2025 — Record Number of Selections from the Region', id: 'n1' },
      { title: "Egyptian Actor Youssef Nasser Becomes First Arab to Win ASC Cinematography Award", id: 'n7' },
    ],
  },
  n4: {
    title: "TikTok Arabia Launches $10M Creator Fund Targeting Arab Content Makers",
    category: 'Industry news',
    author: 'Sami Barakat',
    date: 'Aug 10, 2026',
    source: 'Arab News',
    img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=600&fit=crop',
    imgCaption: 'TikTok Arabia announced the fund at a creator summit in Dubai.',
    body: [
      "The platform announced dedicated funding for Arab creators producing original short-form content in Arabic, with a focus on storytelling, comedy, and lifestyle verticals. Applications open September 1.",
      "The fund prioritizes creators with audiences in Egypt, Saudi Arabia, and the UAE, with grants ranging from $5,000 to $50,000 per creator. Recipients will also receive access to TikTok's production studios in Dubai and Riyadh.",
      "TikTok Arabia head of creator partnerships Dana Al-Mansouri said the fund aims to close the production quality gap between Arabic and English-language content on the platform. 'The talent is extraordinary. We want to remove the resource barrier.'",
      "Over 12,000 creators are expected to apply in the first cycle. A selection committee of Arab creators, producers, and platform executives will review applications on a rolling basis.",
    ],
    related: [
      { title: "Saudi Arabia Announces $500M Film Fund for Regional Co-Productions", id: 'n2' },
      { title: 'Arab Filmmakers Dominate Cannes 2025 — Record Number of Selections from the Region', id: 'n1' },
    ],
  },
  n5: {
    title: "Lebanese Director Nadia Karim's Debut Feature Gets Netflix Worldwide Deal",
    category: 'Film news',
    author: 'Editors',
    date: 'Aug 9, 2026',
    source: 'The Hollywood Reporter',
    img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=600&fit=crop',
    imgCaption: "Nadia Karim on the set of 'After the Rain' in Beirut.",
    body: [
      "The acclaimed Beirut-set drama 'After the Rain' will stream globally on Netflix following a bidding war at the Toronto International Film Festival. The deal, reported to be in the low seven figures, is the largest ever for an Arabic-language debut feature.",
      "Director Nadia Karim, 29, shot the film over 18 days with a crew of 14 in the Achrafieh neighborhood of Beirut. The story follows a family reuniting after years of separation, told across a single weekend.",
      "'After the Rain' stars Lebanese theater actress Rima Noun in her first film role. Netflix will release the film in 190 countries with subtitles in 30 languages. A theatrical release in Lebanon, France, and the UK will precede the streaming debut.",
      "The acquisition marks a significant moment for Arabic-language cinema on the global streaming landscape, following Netflix's earlier investment in Egyptian series 'Paranormal' and Saudi drama 'Al Rawabi School for Girls'.",
    ],
    related: [
      { title: 'Arab Filmmakers Dominate Cannes 2025 — Record Number of Selections from the Region', id: 'n1' },
      { title: "Jordan's 'Desert Echo' Wins Best Cinematography at Dubai International Film Festival", id: 'n3' },
    ],
  },
  n6: {
    title: "MBC Studios Greenlights 12 Original Arabic Series for 2026 Ramadan Season",
    category: 'TV news',
    author: 'Editors',
    date: 'Aug 9, 2026',
    source: 'Deadline',
    img: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=1200&h=600&fit=crop',
    imgCaption: 'MBC Studios headquarters in Riyadh.',
    body: [
      "Saudi Arabia's MBC Studios confirmed production on 12 original series targeting the 2026 Ramadan season, commissioning emerging directors and giving unprecedented creative control to local showrunners.",
      "The slate includes drama, comedy, and reality formats, with budgets ranging from $2 million to $15 million per series. Five of the 12 shows are created by first-time showrunners under 35.",
      "MBC Group CEO Sam Barnett said the investment reflects the company's commitment to building an Arabic-language content ecosystem. 'We are not just commissioning shows. We are building careers and building an industry.'",
      "The series will air on MBC and stream on Shahid, with international distribution rights to be sold at MIPCOM in October.",
    ],
    related: [
      { title: "Saudi Arabia Announces $500M Film Fund for Regional Co-Productions", id: 'n2' },
      { title: "TikTok Arabia Launches $10M Creator Fund Targeting Arab Content Makers", id: 'n4' },
    ],
  },
  n7: {
    title: "Egyptian Cinematographer Youssef Nasser Becomes First Arab to Win ASC Award",
    category: 'Awards',
    author: 'Hana Al-K',
    date: 'Aug 8, 2026',
    source: 'ASC News',
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&h=600&fit=crop',
    imgCaption: 'Youssef Nasser accepting the ASC Outstanding Achievement Award.',
    body: [
      "Egyptian cinematographer Youssef Nasser made history at the American Society of Cinematographers gala, winning the Outstanding Achievement Award for his work on the miniseries 'Nile' — becoming the first Arab to receive the honor in the organization's 106-year history.",
      "Nasser, who trained at the Cairo Film Institute before completing his MFA at AFI, shot 'Nile' entirely on film using a combination of archival 16mm footage and newly shot 35mm material. The series traces four generations of an Egyptian family from 1950 to the present day.",
      "'This award belongs to every Egyptian who ever held a camera and was told to look somewhere else,' Nasser said in his acceptance speech. 'The Nile has always been cinematic. We just finally have the platform to show it.'",
    ],
    related: [
      { title: "Jordan's 'Desert Echo' Wins Best Cinematography at Dubai International Film Festival", id: 'n3' },
      { title: 'Arab Filmmakers Dominate Cannes 2025 — Record Number of Selections from the Region', id: 'n1' },
    ],
  },
  n8: {
    title: "Abu Dhabi Film Festival Returns After 3-Year Hiatus With Record 200 Submissions",
    category: 'Festivals',
    author: 'Ahmed N',
    date: 'Aug 8, 2026',
    source: 'Screen Arabia',
    img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=600&fit=crop',
    imgCaption: 'The Abu Dhabi Film Festival returns to Yas Island this October.',
    body: [
      "The Abu Dhabi Film Festival announced its revival with a curated selection of 48 films from 32 countries, with a dedicated Arab Lens competition showcasing 16 regional productions. The festival received a record 200 submissions in its first year back.",
      "The three-year hiatus allowed the organizing team to restructure the festival around a new focus: championing Arab voices in international cinema while bringing world-class films to UAE audiences.",
      "This year's festival will run October 14–22 at the Yas Creative Hub in Abu Dhabi. The opening night film is a world premiere from Emirati director Mohammed Al-Hamadi.",
      "Industry events include a co-production market, a talent lab for emerging Arab filmmakers, and a retrospective of classic Egyptian cinema from the 1960s and 70s.",
    ],
    related: [
      { title: 'Arab Filmmakers Dominate Cannes 2025 — Record Number of Selections from the Region', id: 'n1' },
      { title: "Saudi Arabia Announces $500M Film Fund for Regional Co-Productions", id: 'n2' },
    ],
  },
  n9: {
    title: "Morocco's Atlas Studios Expands to Become Africa's Largest Production Facility",
    category: 'Industry news',
    author: 'Sofia B',
    date: 'Aug 7, 2026',
    source: 'Deadline',
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=600&fit=crop',
    imgCaption: "The expanded Atlas Studios complex in Ouarzazate, Morocco.",
    body: [
      "The historic Ouarzazate studio complex has completed a $120M expansion, adding three new sound stages and digital backlot infrastructure serving global productions. The expanded facility is now officially the largest production complex on the African continent.",
      "The expansion was financed by a joint venture between the Moroccan government and a consortium of European and American production companies. The new stages can accommodate productions of up to $200M in budget.",
      "Atlas Studios has historically been the location of choice for productions requiring desert, ancient city, and North African backdrops — credits include 'Gladiator', 'Game of Thrones', and 'Babel'. The expansion adds virtual production capabilities that allow for seamless digital environment integration.",
      "Studio director Karima Bennani said the expansion positions Morocco as a 'full-service production hub' for the EMEA region. Five major international productions are already booked for 2027.",
    ],
    related: [
      { title: "Saudi Arabia Announces $500M Film Fund for Regional Co-Productions", id: 'n2' },
      { title: 'Arab Filmmakers Dominate Cannes 2025 — Record Number of Selections from the Region', id: 'n1' },
    ],
  },
}

const CATEGORY_COLORS: Record<string, string> = {
  'Top news': '#E85D04',
  'Industry news': '#2563EB',
  'Film news': '#9333EA',
  'TV news': '#059669',
  'Awards': '#D97706',
  'Festivals': '#DC2626',
  'Celebrity news': '#DB2777',
}

export default function NewsArticle({ id, navigate }: NewsArticleProps) {
  const article = ARTICLES[id] ?? ARTICLES['n1']

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8 max-w-3xl">

      {/* Back */}
      <button
        onClick={() => navigate({ name: 'news' })}
        className="flex items-center gap-2 font-inter text-muted hover:text-paper transition-colors mb-8"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13 }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to News
      </button>

      {/* Category + meta */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className="font-inter font-bold px-2.5 py-1 rounded-md"
          style={{ background: CATEGORY_COLORS[article.category] ?? '#E85D04', color: 'white', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          {article.category}
        </span>
        <span className="font-inter text-muted" style={{ fontSize: 12 }}>{article.source}</span>
      </div>

      {/* Title */}
      <h1 className="font-inter font-black text-paper leading-tight mb-4" style={{ fontSize: 'clamp(22px, 3.5vw, 32px)' }}>
        {article.title}
      </h1>

      {/* Author + date + actions */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-5" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-inter font-bold text-paper" style={{ background: '#E85D04', fontSize: 12 }}>
            {article.author[0]}
          </div>
          <div>
            <p className="font-inter font-semibold text-paper" style={{ fontSize: 13 }}>{article.author}</p>
            <p className="font-inter text-muted" style={{ fontSize: 11 }}>{article.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 font-inter text-muted hover:text-paper transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7a5 5 0 1010 0A5 5 0 002 7zM7 4v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            6 min read
          </button>
          <button className="flex items-center gap-1.5 font-inter text-muted hover:text-paper transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Share
          </button>
          <button className="flex items-center gap-1.5 font-inter text-muted hover:text-paper transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2h8a1 1 0 011 1v9l-4.5-2.5L3 12V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
            Save
          </button>
        </div>
      </div>

      {/* Hero image */}
      <div className="rounded-2xl overflow-hidden mb-3" style={{ width: '100%' }}>
        <img src={article.img} alt={article.title} className="w-full object-cover" style={{ maxHeight: 420 }} />
      </div>
      <p className="font-inter text-muted mb-8 text-center" style={{ fontSize: 11 }}>{article.imgCaption}</p>

      {/* Body */}
      <div className="flex flex-col gap-5">
        {article.body.map((para, i) => (
          <p key={i} className="font-inter leading-relaxed text-paper/80" style={{ fontSize: 15 }}>
            {para}
          </p>
        ))}
      </div>

      {/* Related */}
      {article.related.length > 0 && (
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--c-border)' }}>
          <p className="font-inter font-black text-paper mb-5" style={{ fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Read also
          </p>
          <div className="flex flex-col gap-0">
            {article.related.map((r, i) => (
              <button
                key={r.id}
                onClick={() => navigate({ name: 'news-article', id: r.id })}
                className="flex items-start gap-3 text-left py-4 hover:opacity-70 transition-opacity group"
                style={{ background: 'none', border: 'none', borderTop: i > 0 ? '1px solid var(--c-border)' : 'none', cursor: 'pointer', padding: '14px 0' }}
              >
                <span style={{ color: '#E85D04', fontSize: 16, marginTop: 1 }}>›</span>
                <p className="font-inter font-semibold text-paper group-hover:text-orange transition-colors leading-snug" style={{ fontSize: 14 }}>
                  {r.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
