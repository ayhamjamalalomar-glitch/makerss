# Build Brief: Makers Platform

## 1. What This Is
Makers, by intime, is an invite-only, verified web platform for the Arab
world's content creators and production professionals. Its core purpose:
let a content creator enter, find a complete crew for their project, and
collaborate with other verified "Makers" — this is a COLLABORATION
MARKETPLACE, not a passive database to browse.

intime is the parent creative/media/talent agency (Amman, Jordan) that
Makers is built under. Makers is the product to build now. intime's own
agency services (influencer campaigns, talent management, content
production) are SECONDARY — mention them on one supporting page only,
never as the homepage focus.

## 2. Brand System

### Colors (exact hex — dark-mode-first product)
- Ink       #101408  — primary background, almost all surfaces
- Volt      #C8F53C  — primary accent: CTAs, highlights, badges, filled stars
- Volt Deep #8FCB0F  — secondary accent, hover states, section labels
- Volt Tint #EAFBC0  — light fills, tag backgrounds
- Paper     #FAFCF2  — primary text on dark backgrounds (never pure white)
- Borders/dividers on dark surfaces: #2a3318
- Card surfaces on dark: #141a0c / #161c0d

### Typography
- Headlines/display: Archivo Black (Google Fonts), bold, tight tracking,
  uppercase for labels
- Body/UI: Inter, weights 400–800
- Arabic text (names, bios): IBM Plex Sans Arabic, 400–700, always with
  dir="rtl" on Arabic spans
- Logo wordmark: Caveat (600), cursive, as placeholder script

### Logo
Continuous cursive monoline script reading "in" in Volt green, with a
small detached solid circular dot (Paper color) floating at the top
right of the letterform, like a floating recording indicator. Until a
final vector logo is supplied, render as:
font-family:'Caveat'; font-weight:600; color:#C8F53C; plus an absolutely
positioned circular span in Paper color near the top-right of the "in".
Pair with "— Makers" in Archivo Black uppercase in the nav.

### Visual language
- Dark (Ink) background primary throughout; Volt-background sections
  used for emphasis blocks only (landing hero, callouts)
- Rounded corners ~16–20px on cards and buttons
- 2–3px borders using the divider color; hover state switches border
  to Volt
- Sparing offset "hard" shadows on hero elements only
  (e.g. box-shadow: 6px 6px 0 #2a3318)
- No soft gradients, no corporate look — flat, confident, bold

### Custom Star Icon (critical — do not use a default 5-pointed star)
All ratings use a custom FOUR-POINTED sparkle-style star (like a camera
flash glint / sparkle icon), not the standard 5-pointed star glyph.
Build as a reusable SVG icon: four elongated points radiating from a
center point (north/south points longer, east/west points shorter),
soft rounded tips. Filled state: Volt (#C8F53C). Empty/outline state:
Divider color (#2a3318) outline only. This icon must be visually
consistent everywhere ratings appear.

## 3. Product Definition — Build This Exactly
Do NOT default to a generic directory/database template. The core loop:

1. Invite/Verification — no public sign-up. Users join via invitation
   from an existing verified Maker, or a reviewed application. Every
   Maker carries a ✓ Verified badge.
2. Profile — name (Latin + Arabic), city, specialty tag(s), production
   phase, bio, social stats, credits history, rating summary.
3. Discovery — browse/search Makers by PRODUCTION PHASE first (see
   taxonomy below), then specialty and city. Not a flat unstructured
   list.
4. Collaboration Request — THE CORE ACTION, must be prominent, not an
   afterthought. From any Maker profile, a signed-in user sends a
   structured "Request Collaboration" (project name, brief, timeline).
   The recipient accepts/declines inside the platform.
5. Collaboration Completion & Rating — once a collaboration is marked
   complete by either party, BOTH sides are prompted to rate and
   review each other. See Section 7 (Ratings & Reviews System) for the
   full spec — this is a required, not optional, part of the build.
6. Titles — a produced work (campaign, video) with a full cast & crew
   credit list, each credit linking to a Maker profile.
7. Neutral, industry-wide reference — NOT exclusive to intime's own
   roster. Any verified professional from any agency or independent
   background belongs here.

## 4. Crew Taxonomy — Use This Exact 4-Phase Structure
(This must be the primary browse/filter structure, not a flat list.)

1. Pre-production: Planning, Writing, Storyboarding, Acting, Makeup
   Artist, Stylist/Fashion Manager, Set Designer
2. Production: Photographer/DOP, Director, Production Manager,
   Location/Set Designer, Sound Engineer, Lighting Director
3. Post-production: Video Editor, Motion Graphics Designer
4. Social Media Management: Social Media Manager, Paid Ads Manager

## 5. Pages to Build
- Landing — hero (what Makers is + why invite-only), how-it-works (4
  steps: Get Invited → Build Profile → Find Your Crew → Collaborate),
  featured Makers, featured Titles, "Request an Invitation" CTA.
- Search/Browse — the 4 production-phase categories as first-class
  filters, plus specialty, city, and "Verified only" toggle. Show
  result counts (e.g. "Editors in Amman — 14 results").
- Maker Profile — photo, name (Latin + Arabic), verified badge,
  specialty tags, city, bio, social stats, "Worked With" (linked
  collaborator avatars), Credits grouped by year (linking to Titles),
  a rating summary (average out of 5, using the custom sparkle-star
  icon, e.g. "4.6 ★★★★☆"), a list of written reviews below it, and a
  prominent "Request Collaboration" button.
- Title Page — hero thumbnail/video, name, brand/client, year,
  platform tags, description, Full Credits table (role + name +
  verified badge, each linking to its Maker profile).
- About/Secondary Services (light page) — brief mention of intime's
  supporting services (Influencer Campaigns, Talent Management, Content
  Production). Clearly secondary.
- Request Invitation — form (name, specialty, city, portfolio link,
  referrer) for the invite-only gate.
- Request Collaboration Modal — form fields: project name, brief,
  timeline. Confirmation state after sending. Accept/decline view for
  the recipient.
- Rate & Review Modal — triggered after a collaboration is marked
  complete. Star selector (custom 4-point sparkle icon, 1–5) + written
  comment field. Submit shows a "Waiting for the other side" state
  until both are in (see Section 7).

## 6. Data Model (minimum)
Maker: id, nameLatin, nameArabic, photo, city, specialtyTags[], phase[],
bio, verified(bool), social{instagram,tiktok,youtube}, workedWith[]
(Maker ids), credits[]{titleId, role, year}, ratingAverage, ratingCount

Title: id, name, brand, year, thumb, platforms[], description,
credits[]{makerId, role}

CollaborationRequest: id, fromMakerId, toMakerId, projectName, brief,
status(pending/accepted/declined/completed), createdAt, completedAt

Review: id, collaborationRequestId, fromMakerId, toMakerId, stars(1-5),
comment, submittedAt, visibleAt (null until both sides have submitted,
OR 14 days after the first submission — whichever comes first, then
both become visible simultaneously)

## 7. Ratings & Reviews System (required feature — do not skip)
- Reviews are ONLY possible between two Makers who share a
  CollaborationRequest with status "completed". No open/public
  commenting from unrelated visitors.
- Double-blind reveal: after a collaboration is marked complete, both
  sides are prompted to submit a star rating (1–5, custom sparkle
  icon) plus a written comment. Neither side's review is visible to
  anyone (including each other) until BOTH have submitted, or 14 days
  have passed since the first submission — whichever happens first.
  At that point both reveal simultaneously.
- Once visible, reviews display permanently on the reviewed Maker's
  profile: rating average at the top (e.g. "4.6 / 5"), followed by a
  chronological list of star rating + written comment per review.
- Ratings cannot be edited after submission. No public reply/dispute
  feature in this version.

## 8. Bilingual Requirement
UI chrome (nav, buttons, labels) in English. Maker names, bios, and any
Arabic content must render correctly with dir="rtl" and IBM Plex Sans
Arabic. English-first product with native Arabic content support — do
not force-translate the whole UI.

## 9. Sample/Seed Data
Populate with 6–10 realistic Arab-world creator names (mix of
Jordanian, Palestinian, Syrian, Iraqi backgrounds, Latin + Arabic
script) and 4–6 sample Titles/campaigns. Do not use real public
figures or real brand names. Use "intime Creative" as the sample
brand/client wherever a placeholder brand is needed. Seed a few
completed CollaborationRequests with visible Reviews so the rating UI
has real data to display.

## 10. Tech Stack
Next.js + React + Tailwind CSS (or comparable modern stack available on
Replit). Component-based, fully mobile-responsive. Store the color
values above as Tailwind theme tokens / CSS variables — never hardcode
hex values per component.