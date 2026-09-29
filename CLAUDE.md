# Makers (makerss.net): project handoff

Read this whole file before touching anything. It is the single source of truth for this project.

## 1. What Makers is

Makers is a talent directory for production people across the Arab world: directors, DOPs, editors, writers, stylists, creators, everyone behind the camera. Think "IMDb for Arab production talent".

- Live site: https://makerss.net
- Owner: Ayham Al-Omar (creative director, co-founder of Intime, Amman). He approves every product and design decision.
- Footer credit: "© Makers, by intime".
- Approved tagline (AR): «دليل صنّاع الإنتاج في العالم العربي»
- Approved bio (AR): «كل صورة رأيتها صنعها أحد. Makers دليل مواهب الإنتاج في العالم العربي، مساحة تتعرّف فيها على من يقف خلف الصورة، وتصل إليه مباشرة. كل ملف فيه يراجعه فريقنا بعناية.»
- Approved bio (EN): "Every image you have ever seen was made by someone. Makers is the talent directory for production across the Arab world, a place to meet the people behind the image and reach them directly. Every profile is carefully reviewed by our team."

## 2. Working rules (from the owner, always apply)

1. Talk to Ayham in Arabic (Jordanian dialect is fine), short, direct, no filler.
2. Never use em dashes or double dashes, in code comments, UI copy or replies. Use commas, colons, periods.
3. Discuss first, then edit. For any big feature or anything that changes the design, explain the plan and wait for a yes.
4. No placeholders or fake content in the product. Real info only. In any demo or example content, the only person name allowed is "محمد اللباد".
5. Never mention Intime clients or Intime numbers inside Makers materials.
6. Never ask Ayham for secret keys: no Supabase service_role key, no DB password, no API keys. The publishable key in the code is fine.
7. Never type passwords or sign in for him. He does all sign-ins himself.
8. The approved design (dark theme, orange #E85D04 accent) is final. Do not redesign; fix and extend inside it.
9. The official logo is the text wordmark MAKERS / FILMMAKERS / CREATORS in Archivo Black (see `src/components/Logo.tsx`). The old "MK" mark is retired. Do not bring it back.
10. Do NOT deploy from Figma Make. A Figma Make deploy once force-pushed over `main` and wiped the backend wiring. All code changes go through git here.

## 3. Stack

- Vite 8, React 19, TypeScript 5.7, Tailwind CSS v4 (`@tailwindcss/vite`, no tailwind config file), framer-motion, lucide-react.
- Supabase (auth, Postgres with RLS, storage) via `@supabase/supabase-js`. Project ref: `ggtdseujebmfugwcbnyk`.
- Hosting: Vercel, auto-deploys from GitHub `main`. `vercel.json` uses pnpm and an SPA rewrite to `/index.html`.
- Repo: `ayhamjamalalomar-glitch/makerss` (private).
- The repo started as a Figma Make scaffold, which is why `AGENTS.md` and `package.json` name it `figma-make-app`. Ignore the Figma Make dev-server notes in AGENTS.md.

### Branches
- `main`: production. Vercel deploys it. Commit here (or via PR) for anything that should go live.
- `redesign`: the working branch used while rebuilding the approved design. Same file tree as `main`. Keep it in sync or retire it; do not let the two drift.

### Commands
```
pnpm install            # or npm install
pnpm dev                # vite dev server
npx tsc --noEmit -p .   # type check, must pass before every commit
pnpm build              # vite build, must pass before every push
```

## 4. Code map

```
src/main.tsx            LangProvider > RouterProvider > AuthProvider > App
src/App.tsx             path router (see routes below), Header, main, Footer, BottomNav
src/index.css           Tailwind import, fonts, CSS color tokens (--c-bg, --c-text, --c-surface, --c-border, --c-muted ...), light theme overrides
src/LangContext.tsx     small shim returning the current lang string
src/lib/router.tsx      custom router: Link, useRouter() -> { path, go }, go(path)
src/lib/i18n.tsx        t(ar, en), useLang() -> { lang, setLang }, label(), isRtl()
src/lib/supabase.ts     client, Profile type, PUBLIC_PROFILE_COLUMNS
src/lib/auth.tsx        AuthProvider, useAuth() -> { session, profile, ... }
src/lib/data.ts         Project/CreditRow/OpenCall/MemberCard types, PROJECT_KINDS (incl. ai-film, ai-video), kindLabel, listProjects, getProject, projectsForMember, posterOf, listMembers, topMakers, listOpenCalls, displayName, formatFollowers
src/lib/messages.ts     Message type (kind: 'text' | 'collab', ref_id), messaging helpers
src/lib/constants.ts    COUNTRIES, PROJECT_TYPES, BUDGETS, RESERVED_PATHS (usernames that cannot be taken)
src/lib/image.ts        toJpeg (client side resize before upload)
src/lib/track.ts        track(type, id, kind): page analytics through RPC `track_event` (random visitor id in localStorage 'mk-visitor')
src/lib/toast.tsx       ToastProvider + useToast(): short confirmations ("Link copied", "Saved")
src/lib/share.ts        shareLink(url, title): native share sheet on phones, clipboard elsewhere
src/components/         (Phase 3) CommandPalette (Ctrl+K or "/", also the mobile search button), ImageCropper + DropZone (photo 3:4, poster 2:3), Reveal (scroll fade-in), StatsCard, EmailPrefs, ReportButton
src/components/mk.tsx   design primitives: Btn, Card, Chip, Field, TextInput, SelectInput, TextArea, Pill, Avatar, Notice, Spinner, Modal, PageShell, SectionHeader, VerifiedBadge, PosterFallback
src/components/         Header (search, lang toggle, account menu), Footer (theme toggle, stored in localStorage 'mk-theme'), BottomNav (mobile), Logo, ContactForm (collab request), RangeCalendar, WorkThumb, ResendConfirm, DarkCard
public/                 favicon-32.png, apple-touch-icon.png, icon-512.png, og.png (all generated from the wordmark), robots.txt
middleware.ts           Vercel Routing Middleware: per-page share previews (title, description, og:image) for /:username, /projects/:id, /opportunities/:id, and /sitemap.xml. Falls through with next() on any error.
supabase/migrations/    SQL for every schema change made from this repo (applied through the Supabase MCP)
supabase/functions/send-emails/  Edge Function that drains public.email_outbox through Resend
```

### Routes (`src/App.tsx`)
| Path | Page |
|---|---|
| `/` | Landing: New on Makers (one newest project per maker, 6 max), Top makers (auto ranked by activity via RPC `top_makers`), Open Projects, Biggest Audiences, Who is Makers, Join CTA |
| `/makers` | MakersPage, directory with filters |
| `/projects` | TitlesPage, all projects |
| `/projects/new`, `/projects/:id/edit` | TitleEditor (poster upload, crew picker, RPC `save_work`) |
| `/projects/:id` | TitlePage: poster (2:3) + video frame (16:9, YouTube maxres then hq thumbnail, else thumbnail_url, else poster over blur), embed honours `t=` |
| `/opportunities` | OpenProjects (open calls list + detail modal, apply, close) |
| `/opportunities/new` | OpenCallEditor |
| `/join`, `/login` | full-screen auth pages (no header/footer) |
| `/me` | EditorPage (edit own profile) |
| `/me/status` | StatusPage (review status) |
| `/inbox` | InboxPage: collab requests (`RequestsInbox`) + open call applications |
| `/messages` | MessagesPage: tabs "المحادثات" and "طلبات التعاون" (`?tab=collab`), collab cards inside threads with Accept / Decline |
| `/admin` | Admin (members review, new calls, projects, stats) |
| `/:username` | MakerProfile: tabs Overview (badges + up to 5 featured works), Works (all), About (long text up to 5000 chars); short bio clamped to 2 lines |

Layout width: every page content sits in `max-w-[1120px] mx-auto w-full` with side padding. Keep that.

### UI conventions
- Pages that only members or the team use are lazy loaded in `App.tsx`; keep public pages (Landing, Makers, profile, projects, open calls) eager.
- Loading states use `Skeleton` / `PageSkeleton` from `mk.tsx`, not plain "Loading" text. Windows use `Modal` (Esc closes, page scroll locks); custom overlays call `useDialog(onClose)`.
- Motion respects the visitor's reduce-motion setting through `MotionConfig` in `main.tsx`.
- The makers directory keeps every filter in the URL (`type`, `q`, `s`, `c`, `country`, `f`, `available`, `sort`).
- Every user-facing string goes through `t('عربي', 'English')`. Arabic is the default language, RTL. Arabic text right, English text left (use `dir="auto"` on user-generated text).
- Colors via CSS variables (`var(--c-text)` etc.), accent `#E85D04`. Dark is default, light theme via `data-theme="light"`.
- Reuse primitives from `mk.tsx` instead of new ad-hoc components.
- Wordmark font: Archivo Black (`.font-archivo`). Body: Inter + IBM Plex Sans Arabic.

## 5. Product decisions already made

- Signup is open. New profiles go to review; admins approve (status: draft, pending, approved, rejected, suspended). First makers get a permanent Founding Member badge.
- Approved members add projects without review.
- Any approved member can post an open call (opportunity). Open calls need admin review. Applications happen on the site.
- Collaboration requests (`contact_requests`) also land as a `kind='collab'` message inside the two members' conversation, via DB trigger.
- Top 10 makers are ranked automatically by activity.
- Content creators (`account_type = 'creator'`) sign up like makers since 2026-09-29. They pick up to 3 content categories (`CONTENT_TYPES` in `constants.ts`, stored as keys in `profiles.content_types`) instead of specialties, and their fifth completion step is "at least one account with a follower count" instead of 3 works. The directory has a Production / Content creators switch (`/makers?type=creator`).
- Invite codes are retired (removed from the status page on 2026-09-29). The `invites` table and `create_invite` RPC stay in the DB but nothing in the UI uses them.
- Phase 2 (not built yet, do not start without Ayham): news, events, feed, reviews.
- Ayham will add real content before launch. Right now the DB has 7 profiles and 1 work.

## 6. Supabase

Everything is protected by RLS, column grants, and `security definer` RPCs with `search_path = ''`. Write paths go through RPCs, not direct table writes, wherever an RPC exists.

### Tables (public)
- `profiles`: id, email, full_name, name_ar, username, account_type (creator|maker), status, role (member|reviewer|admin), is_founding, is_featured, avatar_url, bio, about, featured_work_ids, city, country, specialty_ids, specialty_names, other_specialty, content_types, video_length, socials, followers, work_links, start_year, available, review fields, invite fields, timestamps
- `works` (projects): id, owner_id, title, brand, year, kind, thumb_url, thumbnail_url, url, platform(s), description, role, sort, timestamps
- `credits`: work_id, profile_id, display_name, invitee_email, role, status, added_by
- `open_calls`, `open_call_applications`
- `contact_requests` (collab requests), `conversations`, `messages` (kind, ref_id), `blocks`
- `awards`, `invites`, `specialties`, `specialty_suggestions`, `reviews`, `tickets`, `admin_emails`, `admin_audit_log`, `collaboration_requests` (older, unused by the new UI)

### Storage
Buckets `avatars` and `works`: public read, each user writes only inside their own folder.

### RPCs
- Members/admin: `admin_list_members`, `admin_get_member`, `admin_review_member`, `admin_set_role`, `admin_set_featured`, `admin_set_founding`, `admin_stats`, `admin_log_access`, `my_review_note`, `username_available`, `make_username`, `create_invite`, `directory_stats`, `top_makers(p_limit)`
- Projects: `save_work(p_id, p, p_credits)`, `remove_my_credit(p_work)`
- Open calls: `create_open_call(p)`, `close_open_call`, `admin_review_open_call`, `apply_open_call`, `set_application_status`
- Messaging: `start_conversation`, `send_message`, `mark_conversation_read`, `unread_messages_count`, `can_message`, `set_block`, `is_participant`
- Collab: `send_contact_request(...)`, `collab_card(p_id)`, `pending_collab_count()`, `contact_request_email`, `contact_request_sender_member`, `expire_contact_requests`
- Helpers: `is_admin`, `is_staff`, `is_approved`, `current_role_name`

### Added 2026-09-29 (Phase 2)
- Search: `ar_norm(text)` (Arabic normalisation), `search_makers(p_q, p_limit, p_kinds)`, `search_projects(p_q, p_limit)`; the header uses `searchSite()` in `data.ts`. Client filters use `arNorm()` from `constants.ts` with the same rules.
- Analytics: table `page_events` (RLS on, no direct access), RPCs `track_event`, `my_page_stats(p_days)` (StatsCard on /me), `admin_insights()` (admin overview).
- Emails: tables `email_outbox`, `notification_prefs` (member switch on /me), `message_email_log`. Triggers on contact_requests, profiles (status), open_call_applications, open_calls enqueue emails. pg_cron job `email-worker` runs `kick_email_worker()` every minute; it posts to the `send-emails` function with a secret kept in Vault (`email_worker_secret`). The function needs `RESEND_API_KEY` (and optionally `EMAIL_FROM`, default `Makers <hello@makerss.net>`) set by Ayham in the Supabase dashboard. Without the key the queue just waits.
- Reports: `tickets` gained target_type, target_id, reason. RPCs `report_content`, `resolve_ticket`; admin tab "البلاغات".
- Housekeeping: pg_cron job `housekeeping` (hourly) closes open calls past their deadline and expires unanswered requests.
- Hardening: indexes on all foreign keys, internal functions revoked from anon/authenticated, pg_net in the `extensions` schema.

### Triggers
`contact_request_to_conversation` on contact_requests, `profiles_guard` on profiles (blocks members from editing status/role/etc.), `collab_limit`, `review_check`, and `handle_new_user` on auth signup.

### Migrations
Apply schema changes as named migrations (Supabase MCP `apply_migration` or CLI). Recent ones: `redesign_projects_open_calls`, `reserve_redesign_paths`, `profile_about_and_featured_works`, `collab_requests_in_messages`. When you add a public profile column, also add it to `PUBLIC_PROFILE_COLUMNS` and the column grants.

## 7. Before every push
1. `npx tsc --noEmit -p .` passes.
2. `pnpm build` passes.
3. Check the page in Arabic and English, desktop and mobile width.
4. Commit with a clear message, push to `main`, wait for the Vercel deploy, then check makerss.net.

## 8. Open items
- Footer has no social links yet; waiting for Ayham to give the real Makers accounts.
- Favicon at 32px shows the full three-line wordmark, which is hard to read. Ayham may want a short version later; ask first.
