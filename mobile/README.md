# Makers iOS app

The Makers directory as a native app. Expo (SDK 57) with Expo Router, connected to the same Supabase project as makerss.net (`ggtdseujebmfugwcbnyk`), so every account, page, project, message and open call is shared with the website.

## Run it on an iPhone (no Apple account needed)

1. Install **Expo Go** from the App Store on the iPhone.
2. On the computer, inside this folder:
   ```
   npm install
   npx expo start --tunnel
   ```
3. Scan the QR code with the iPhone camera. The app opens inside Expo Go.

Push notifications do not work inside Expo Go (Apple limits them to real builds). Everything else does.

## Real build (TestFlight / App Store)

Needs an Apple Developer account (99 USD a year) and a free Expo account, both created and signed in by the owner:

```
npx eas-cli@latest login
npx eas-cli@latest init          # writes the EAS project id into app.json, which also turns pushes on
npx eas-cli@latest build -p ios  # cloud build, asks for the Apple account
npx eas-cli@latest submit -p ios # sends the build to App Store Connect / TestFlight
```

Bundle id: `net.makerss.app`. URL scheme: `makers://`.

## Map

```
src/app/(tabs)/        Home, Makers, Calls, Messages, Account (native iOS tab bar)
src/app/maker/[username]   member page        src/app/project/[id]   project page (video plays inline)
src/app/call/[id]      open call + apply      src/app/call/new       post an open call
src/app/chat/[id]      conversation (realtime, typing, collab cards)
src/app/inbox          collab requests + applicants     src/app/status   review status
src/app/edit           my page editor (photo crop 3:4)  src/app/project/new, project/edit/[id]
src/app/settings       language, theme, notifications, change password, delete account
src/app/login, join, search, collab/[id] (collaboration request form)
src/lib/               supabase client, auth, i18n (t(ar, en)), theme tokens, data helpers (ported from the website)
src/components/ui.tsx  primitives: Txt, Btn, Chip, Input, Card, Sheet, Header, Screen, Icon ...
```

## Rules

- Arabic is the default and the whole layout runs right to left through the root `direction` style (not the system RTL switch), so it behaves the same in Expo Go and in real builds. Text goes through `Txt`, which aligns by language.
- Colors only from `useTheme()` (same tokens as the website), fonts from `F` in `src/lib/theme.tsx`.
- Always add packages with `npx expo install <name>`. Never edit `ios/` or `android/` by hand.
- Before committing: `npx tsc --noEmit` and `npx expo-doctor`.
- The admin panel stays on the website only.

## Push notifications

The app registers its Expo push token through the RPC `register_push_token` after sign in. The database queues pushes in `push_outbox` (new message, collaboration request and replies, review decision, open call applications and decisions); the pg_cron job `push-worker` calls the `send-push` Edge Function every minute. Each push carries `data.url`, a path in this app (for example `/chat/<id>`), opened when the member taps it. Members can switch pushes off in Settings (`notification_prefs.push_enabled`).
