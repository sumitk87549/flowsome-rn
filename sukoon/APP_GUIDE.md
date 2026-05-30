# Sukoon React Native App — Developer Guide

This guide is the single-file technical map of the Sukoon app. It is written for future developers who need to understand and safely modify the project without first reading every source file.

## 1. Product summary

Sukoon is an Expo React Native mindfulness app focused on Indian users and bilingual English/Hindi content. The app includes:

- Authentication: Google sign-in, email sign-in/sign-up, and guest mode.
- Onboarding: user goals, preferred session length, and daily reminder setup.
- Home: greeting, streak, mood check-in, recommended session, quick actions.
- Focus timer: Pomodoro-style sessions with India-themed environments, particles, ambient audio, pause/resume, completion rating, and local session persistence.
- Breathing: guided pranayama-style techniques with animated breathing phases and haptic feedback.
- Meditation: guided meditation catalogue with language toggle, filters, premium gating, playback-like session UI, completion tracking, feeling/rating capture.
- Garden/progress: visual growth rings, weekly activity heatmap, mood trend, recent sessions.
- Settings: account/subscription display, notifications, referral share, manual cloud sync, data deletion, sign-out.
- Monetization: premium themes and meditations gated by subscription state, Razorpay checkout placeholder/simulation, Firebase Cloud Functions for order/payment verification.
- Local-first storage: Zustand stores persisted to AsyncStorage, with optional Firebase sync in real builds.

## 2. Stack and project setup

### Runtime and framework

- Expo SDK 56 app using `expo-router` as the entry point.
- React 19.2.3 and React Native 0.85.3.
- TypeScript with `strict: true`.
- NativeWind/Tailwind is configured, but most screens currently use `StyleSheet`.
- Zustand stores hold app, auth, user, and session state.
- AsyncStorage persists local data.
- Firebase native modules are used only outside Expo Go.
- Razorpay native checkout is guarded and simulated in Expo Go.

### Important config files

- `package.json`: dependencies and scripts. Available scripts are `npm run start`, `npm run android`, `npm run ios`, and `npm run web`.
- `app.json`: app identity, scheme, icons, permissions, Expo plugins, Firebase/Google Sign-In plugins, notification icon/color, Android/iOS package IDs.
- `eas.json`: EAS build profiles for development, preview APK, and production APK.
- `babel.config.js`: Expo preset, NativeWind preset, and Reanimated plugin.
- `metro.config.js`: NativeWind Metro wrapper with `global.css` input.
- `tailwind.config.js`: scans `app` and `components` folders.
- `tsconfig.json`: extends Expo base config and enables strict mode.
- `AGENTS.md`: says Expo versioned docs for SDK 56 should be read before writing code. Future code work should check the exact Expo SDK 56 docs when touching Expo APIs.

## 3. Directory map

```text
sukoon/
  app/                         Expo Router routes
    _layout.tsx                Root bootstrap, auth/onboarding redirects, notification setup
    (tabs)/                    Main tab navigator screens
      _layout.tsx              Bottom tabs
      index.tsx                Home
      focus.tsx                Focus setup
      breathe.tsx              Breathing setup
      meditate.tsx             Meditation catalogue
      garden.tsx               Progress/garden
    auth/                      Welcome and email auth screens
    onboarding/                Three-step onboarding flow
    session/                   Full-screen active focus/breathe/meditate sessions
    settings.tsx               Settings screen
    settings/notifications.tsx Notification preferences
    history.tsx                Session history
  components/
    home/                      Home screen widgets
    ui/                        Shared UI primitives
    PaywallModal.tsx           Premium checkout modal
  constants/                   Static app data and design tokens
  hooks/                       Theme, translation, premium gate helpers
  i18n/                        English/Hindi resource files and i18next setup
  services/                    Firebase gateway and sync service
  stores/                      Zustand stores
  utils/                       Audio, device, ID helpers
  functions/                   Firebase Cloud Functions for Razorpay
```

## 4. App routing and boot lifecycle

### Root layout: `app/_layout.tsx`

The root layout is the app bootstrapper.

1. Prevents splash auto-hide.
2. Loads Noto Sans Devanagari fonts.
3. Loads app settings and user data from AsyncStorage.
4. In non-Expo-Go builds, attaches Firebase Auth state listener.
5. On Firebase user login, saves the auth user in `authStore` and calls `syncService.syncFromFirebase(user.uid)`.
6. After fonts load, hides splash and redirects based on current state:
   - no authenticated user and not guest -> `/auth/welcome`
   - authenticated/guest but onboarding incomplete -> `/onboarding/step1`
   - authenticated/guest and onboarding complete -> `/(tabs)`
7. On first completed onboarding route into tabs, calls `setupNotifications()` to ask for notification permission and schedule default 08:00 daily reminder if user has not configured notifications yet.

Important behavior: root redirects only depend on `isAuthenticated`, `isGuest`, and `onboardingComplete`. Guest mode is purely in-memory in `authStore`; if the app process restarts, guest access may be lost because `isGuest` is not persisted.

### Tabs layout: `app/(tabs)/_layout.tsx`

Defines five bottom tabs:

- `index`: Home
- `focus`: Focus
- `breathe`: Breathe
- `meditate`: Meditate
- `garden`: Garden

The settings screen and history screen are not tabs; they are pushed from UI actions.

### Route conventions

Expo Router maps files directly:

- `/auth/welcome` -> `app/auth/welcome.tsx`
- `/auth/email` -> `app/auth/email.tsx`
- `/onboarding/step1` -> `app/onboarding/step1.tsx`
- `/session/focus` -> `app/session/focus.tsx`
- `/settings/notifications` -> `app/settings/notifications.tsx`

Session setup screens pass params to session screens via `router.push({ pathname, params })`.

## 5. State management and persistence

### `stores/appStore.ts`

Holds global app preferences:

- `colorScheme`: `light`, `dark`, or `system`.
- `language`: `en` or `hi`.
- `toggleColorScheme()`: cycles light -> dark -> system -> light.
- `toggleLanguage()`: toggles English/Hindi and calls `i18n.changeLanguage()`.
- `loadFromStorage()` and `saveToStorage()` use AsyncStorage keys:
  - `colorScheme`
  - `language`

### `stores/authStore.ts`

Holds authentication and subscription state:

- `user`: Firebase user object or `null`.
- `isAuthenticated`: true when Firebase user exists.
- `isGuest`: true after continue-as-guest.
- `subscription`: plan/status/expiresAt/isActive.
- `isLoading`: auth action loading state.

Actions:

- `signInWithGoogle()`: requires development/production build; throws helpful error in Expo Go.
- `signInWithEmail(email, pass)`: Firebase email sign-in; blocked in Expo Go.
- `signUpWithEmail(name, email, pass)`: creates Firebase email user and updates displayName; blocked in Expo Go.
- `signOut()`: Firebase sign-out, Google sign-out, clears local auth/subscription state.
- `continueAsGuest()`: sets guest mode locally.
- `setAuthUser(user)`: called by Firebase auth listener.
- `setSubscription(sub)`: called from sync/paywall/settings.

Subscription is currently not locally persisted in this store. It comes from Firebase sync in real builds or from simulated checkout in Expo Go.

### `stores/userStore.ts`

Holds profile/progress data:

- `onboardingComplete`
- `goals`
- `timePreference`
- `streak`
- `lastSessionDate`
- `moodHistory`
- `selectedTimerMode`
- `selectedBreathGoal`
- `totalFocusMinutes`
- `totalSessions`
- `weeklyActivity`

Actions persist the full user object to AsyncStorage key `userData`.

Important streak logic in `updateStreakFromSession()`:

- Normalizes today to date-only.
- Increments `weeklyActivity[today]`.
- If the last session was yesterday, increments streak.
- If the last session was earlier than yesterday, resets streak to `1`.
- If same day, keeps streak unchanged but still increments `totalSessions`.
- Persists updated state.

Note: `totalFocusMinutes` exists in state but is not currently updated by session completion logic.

### `stores/sessionStore.ts`

Holds all session records and persists them separately.

Types:

- `FocusSession`
  - `id`, `type: 'focus'`, `themeId`, `mode`, `plannedDuration`, `actualDuration`, `startTime`, optional `endTime`, `status`, optional `focusRating`, `cycles`.
- `BreathingSession`
  - `id`, `type: 'breathe'`, `techniqueId`, `rounds`, `completedRounds`, `duration`, `startTime`, `timestamp`.
- `MeditationSession`
  - `id`, `type: 'meditate'`, `meditationId`, `duration`, `startTime`, optional `endTime`, optional `rating`, optional `feeling`, `status`.

Computed helpers:

- `todayFocusMinutes()`
- `todayBreathingRounds()`
- `getSessionsByDateRange(start, end)`
- `getSessionsByType(type)`
- `getTotalMinutes()`
- `getWeeklyActivity()`
- `getAllSessions()` sorted newest first.

Persistence keys:

- `sukoon_focus_sessions`
- `sukoon_breathing_sessions`
- `sukoon_meditate_sessions`

Important: session store has local persistence but does not automatically call Firebase realtime sync from its add/update actions. Some cloud sync is manual through settings or auth sync flows.

## 6. Services and native module guards

### `services/firebase.ts`

This file is the only safe gateway for Firebase/Google Sign-In native modules.

- `IS_EXPO_GO` is true when `Constants.executionEnvironment === 'storeClient'`.
- Firebase Auth, Firestore, and Google Sign-In are only `require()`d when not Expo Go.
- Exports:
  - `firebaseAuth`
  - `firebaseFirestore`
  - `GoogleSignin`
  - `isFirebaseAvailable`

Do not import `@react-native-firebase/*` directly in screens. Use this gateway because Firebase native modules can fail at module load time in Expo Go.

### `services/sync.ts`

Responsible for Firebase sync in real builds.

- `syncLocalDataToFirebase(userId)`:
  - Reads `userData` and all session arrays from AsyncStorage.
  - Writes profile settings to `users/{uid}/profile/settings`.
  - Writes streak stats to `users/{uid}/streak/stats`.
  - Writes mood history to `users/{uid}/mood_history/entries`.
  - Writes every session to `users/{uid}/sessions/{session.id}`.
- `syncFromFirebase(userId)`:
  - Reads subscription status from `users/{uid}/subscription/status`.
  - Sets `authStore.subscription` if doc exists.
  - Processes pending sync queue.
- `realtimeSyncSession(session)`:
  - Writes a single session, or queues it if Firestore write fails.
- `syncStreakToCloud(streakData)`:
  - Writes streak stats, or queues them if write fails.
- `addToPendingQueue(collection, docId, data)`:
  - Stores failed writes in AsyncStorage key `sukoon_pending_sync`.
- `processPendingQueue(userId)`:
  - Batch writes queued items and removes queue on success.

### `utils/audio.ts`

Audio manager around `expo-av`:

- Loads one ambient looping sound from a hardcoded Pixabay URL.
- Plays ambient sound at provided volume.
- Loads and plays a singing bowl chime from a hardcoded URL.
- Fades ambient audio out.
- Unloads ambient and chime sounds.

The selected theme ID is tracked, but the current audio source does not vary by theme even though theme records have `ambientSound` filenames.

### `utils/device.ts`

Detects low-end Android devices:

- Android with less than 3GB RAM -> low-end.
- Android API level below 29 -> low-end.
- iOS -> false.
- Fallback checks `Platform.Version`.

Currently not heavily used in UI.

### `utils/id.ts`

Generates Hermes-safe unique IDs without crypto:

```text
timestamp-random-random
```

Use this for session IDs instead of APIs requiring `crypto.getRandomValues()`.

## 7. Hooks and design tokens

### `hooks/useTheme.ts`

Reads `appStore.colorScheme` and device scheme, then returns:

- `colors`: light or dark palette from `constants/colors.ts`.
- `isDark`.

### `hooks/useTranslation.ts`

Wraps `react-i18next` and returns `{ t, i18n }`.

Important issue: several files destructure `language` from `useTranslation()`, but this hook currently does not return `language`. Those usages will receive `undefined`. Either update the hook to return `language: i18n.language` or use appStore language directly.

### `hooks/usePremiumGate.ts`

Returns `hasAccess` based on `authStore.subscription?.isActive ?? false`.

Consequence: free users can access only free content; any active paid/trial/student/lifetime subscription unlocks premium content.

### Design constants

- `constants/colors.ts`: light/dark color palettes.
- `constants/typography.ts`: font families, sizes, line-height scale.
- `constants/pricing.ts`: Razorpay plan metadata and INR pricing.
- `constants/themes.ts`: focus environments.
- `constants/breathing.ts`: breathing techniques.
- `constants/meditations.ts`: meditation catalogue.

## 8. Internationalization

Files:

- `i18n/index.ts`: initializes i18next/react-i18next with English and Hindi resources, fallback English, no escaping.
- `i18n/en.json`
- `i18n/hi.json`

The app uses two i18n approaches:

1. String keys through `t('...')` for navigation/home/onboarding/common labels.
2. Static content fields like `nameHi`, `titleHi`, `descriptionHi` inside constants.

When adding a new translated UI label, update both JSON files. When adding catalogue content, include both English and Hindi fields if the current data shape supports it.

## 9. Authentication flows

### Welcome auth: `app/auth/welcome.tsx`

Shows app branding and three paths:

- Google sign-in via `authStore.signInWithGoogle()`.
- Email auth via navigation to `/auth/email`.
- Guest mode via `authStore.continueAsGuest()` then route to `/onboarding/step1`.

If Google fails in Expo Go, the error message tells the user to use guest mode.

### Email auth: `app/auth/email.tsx`

Single screen toggles between sign-up and sign-in.

- Sign-up requires name, email, password.
- Sign-in requires email, password.
- Calls `authStore.signUpWithEmail()` or `authStore.signInWithEmail()`.
- Has a forgot-password handler that currently only sets a “reset sent” UI state; it does not call Firebase password reset.
- After auth succeeds, navigates to `/onboarding/step1`.

Future improvement: if an existing user has already completed onboarding, root redirect will eventually send them to tabs, but this screen always pushes step1 immediately after submit.

## 10. Onboarding flow

### Step 1: `app/onboarding/step1.tsx`

Collects goals using local selected array initialized from `userStore.goals`.

Goal options:

- Focus Better
- Sleep Deeper
- Reduce Stress
- Build Habit

`handleNext()` saves goals and pushes `/onboarding/step2`.

### Step 2: `app/onboarding/step2.tsx`

Collects preferred daily time.

Options:

- 5 Minutes
- 10 Minutes
- 15-20 Minutes
- 30+ Minutes

Selection is saved immediately and again before pushing `/onboarding/step3`.

### Step 3: `app/onboarding/step3.tsx`

Asks for notification permission and enables reminders if granted. It is guarded for Expo Go.

- If notifications unavailable, it still completes onboarding.
- If granted, stores:
  - `sukoon_notifications_enabled = true`
  - `sukoon_notifications_time = 08:00`
- Schedules a daily 08:00 reminder.
- Completes onboarding via `userStore.setOnboardingComplete(true)` and navigates to tabs.

## 11. Main tab screens

### Home: `app/(tabs)/index.tsx`

Home is a dashboard made of reusable components.

- Randomizes tip of the day on mount.
- Checks whether a mood has been logged today.
- Shows:
  - `GreetingCard`
  - `StreakBanner`
  - `MoodCheckIn` if no mood today
  - “Recommended for you” card, based on the last mood:
    - low mood (`<= 2`) -> SOS calm meditation
    - otherwise -> focus session
  - `QuickActionGrid`
  - tip of the day

### Focus setup: `app/(tabs)/focus.tsx`

Lets the user configure a focus session.

Timer modes:

- `classic`: 25/5, 4 cycles.
- `deep`: 50/10, 3 cycles.
- `flow`: 90/20, 2 cycles.
- `custom`: user-controlled work and break minutes, 4 cycles.

Other behavior:

- Uses `INDIA_THEMES` for environment selection.
- Premium themes are gated by `usePremiumGate()`.
- Pressing a locked theme shows `PaywallModal`.
- Start navigates to `/session/focus` with mode/theme/work/break/cycles params.

### Breathe setup: `app/(tabs)/breathe.tsx`

Lets user choose a goal and technique.

Goals:

- calm
- sleep
- focus
- energy

Techniques are sorted so techniques matching the selected goal appear first. Pressing a technique navigates to `/session/breathe?techniqueId=...`.

### Meditate catalogue: `app/(tabs)/meditate.tsx`

Shows guided meditations.

State:

- selected duration filter
- selected category filter
- language toggle (`en`/`hi`) persisted to AsyncStorage key `meditation_language`
- paywall visible

Categories:

- all
- sleep
- stress
- focus
- morning

Duration filters:

- All
- 5 min
- 10 min
- 15 min
- 20+ min

Behavior:

- `getFeaturedSession()` chooses SOS calm when current hour >= 21, otherwise morning gratitude.
- Filters catalogue by category and duration.
- Locked premium meditations open paywall.
- Free or accessible meditations navigate to `/session/meditate` with `meditationId` and language params.

### Garden/progress: `app/(tabs)/garden.tsx`

Visual progress screen.

Data sources:

- `userStore.streak`
- `userStore.totalSessions`
- `userStore.moodHistory`
- `userStore.weeklyActivity`
- `sessionStore.getTotalMinutes()`
- `sessionStore.getAllSessions()`

Displays:

- Animated garden/plant rings, where rings increase with session count.
- Stats for streak, total sessions, total minutes.
- Weekly heatmap colored by activity count.
- Mood trend using recent mood history.
- Recent session list.
- Link to full history screen.

## 12. Active session screens

### Focus session: `app/session/focus.tsx`

Full-screen immersive timer.

Inputs from route params:

- `modeId`
- `themeId`
- `work`
- `break`
- `cycles`

Startup:

- Hides status bar.
- Creates session ID with `generateId()`.
- Adds an in-progress focus session to `sessionStore`.
- Starts background/particle animations.
- Loads and plays ambient audio.
- Starts work timer.
- Tracks app background/foreground to correct remaining time using wall-clock `endTimeRef`.

Timer logic:

- Uses `endTimeRef` and interval ticks to compute remaining seconds.
- Schedules a local notification for phase completion when notifications module exists.
- On phase end:
  - plays haptic notification and chime
  - work -> break if break duration > 0
  - break -> next work cycle
  - last cycle -> complete
- Pause saves remaining time, cancels scheduled notification, and stops interval.
- Resume restarts timer from saved remaining seconds.

Exit behavior:

- Closing during active session asks for confirmation and marks focus session `abandoned`.
- Completing updates focus session with `status: 'completed'`, `actualDuration`, `endTime`, `cycles`, and optional rating.

Important issue: this screen adds/updates `sessionStore` but does not call `userStore.updateStreakFromSession()`, so focus completions may not update streak/totalSessions unless handled elsewhere in future code.

### Breathing session: `app/session/breathe.tsx`

Full-screen guided breathing animation.

Inputs:

- `techniqueId` route param.

Startup:

- Finds technique from `BREATHING_TECHNIQUES`.
- Uses current technique color and pattern.
- Tracks phase index, seconds remaining, round count, running state, and completion.
- Uses animated circle scale/opacity.

Pattern model:

- `pattern`: array of seconds for phases.
- `phases`: text IDs for each stage.
- Zero-second phases are skipped by advancing immediately.

Behavior:

- User starts session manually.
- Runs for a target of 5 rounds.
- Each completed cycle increments round.
- When target rounds complete, records a `BreathingSession` in `sessionStore` and calls `userStore.updateStreakFromSession()`.
- Uses haptic feedback on phase transitions.
- Shows completion UI with return button.

### Meditation session: `app/session/meditate.tsx`

Full-screen meditation playback-style UI.

Inputs:

- `meditationId`
- `lang`

Startup:

- Finds meditation from `MEDITATIONS`.
- Creates session ID.
- Adds an in-progress meditation session to `sessionStore`.
- Enters loading phase briefly, then ready phase.
- Uses mandala rotation, pulse, fade, and script fade animations.

Playback model:

- This is a simulated audio player; it does not currently load `audioUrlEn` or `audioUrlHi`.
- Progress is interval-based for `duration * 60` seconds.
- Play/pause toggles interval.
- Completion updates meditation session with `status: 'completed'`, `endTime`, optional `rating`, and optional `feeling`, then calls `userStore.updateStreakFromSession()`.
- Exiting early asks for confirmation and marks session `abandoned`.

Completion UI:

- Shows completed duration.
- Lets user select feeling: calm, sleepy, focused, emotional.
- Lets user rate 1-5 stars.
- Return button updates session and goes to tabs.

## 13. Settings, notifications, history, paywall

### Settings: `app/settings.tsx`

Sections:

- Account:
  - guest mode warning/sign-in button
  - signed-in user avatar/name/email
  - current plan and renewal/end date
  - upgrade/cancel button
- Notifications:
  - navigates to `/settings/notifications`
- Data:
  - manual cloud sync if signed in
  - delete all local data via `AsyncStorage.clear()`
- Referral/share:
  - builds referral code from `user.uid` prefix.
- Sign out.

Important behaviors:

- Cancel subscription is only local state simulation; no Razorpay API call is made.
- Delete all data clears every AsyncStorage key, including app settings and session data.
- Manual sync uses `syncService.syncLocalDataToFirebase(user.uid)`.

### Notifications settings: `app/settings/notifications.tsx`

Uses guarded `expo-notifications`.

- Loads enabled/time from AsyncStorage keys:
  - `sukoon_notifications_enabled`
  - `sukoon_notifications_time`
- Toggle on asks for permission if needed and schedules daily notification at selected time.
- Toggle off cancels all scheduled notifications.
- Time selection is simple fixed options: 07:00, 08:00, 09:00, 20:00, 21:00.
- Shows dev note if notifications module is unavailable, such as in Expo Go.

### History: `app/history.tsx`

Reads all sessions from `sessionStore.getAllSessions()`.

- Filter pills: all, focus, breathe, meditate.
- Groups records by `new Date(session.startTime).toDateString()`.
- Displays title/icon/details per session type.
- Empty state when no sessions match.

### Paywall: `components/PaywallModal.tsx`

Paywall modal with feature list and plan cards.

Plans come from `constants/pricing.ts`:

- monthly: ₹99/month
- annual: ₹999/year
- lifetime: ₹1999 one-time, original ₹4999
- student: ₹49/month

Behavior:

- In Expo Go or if Razorpay native module is unavailable, checkout is simulated and local `authStore.subscription` is set active.
- In real builds, uses `react-native-razorpay` with placeholder key `rzp_test_YOUR_KEY_HERE`.
- On Razorpay success, sets local subscription active and syncs local data to Firebase.

Important issues:

- The paywall currently does not call the Cloud Functions `createOrder` and `verifyPayment` from the app UI.
- Razorpay key and logo URL are placeholders.
- There is a duplicated “Cloud sync — never lose your streak” line in the features list.
- The hook destructures `language` from `useTranslation()`, but `useTranslation()` does not currently return `language`.

## 14. Static content catalogues

### Breathing techniques: `constants/breathing.ts`

Each technique has:

- `id`
- English/Hindi names
- Sanskrit name
- `pattern`: seconds per phase
- `phases`: phase labels
- `goal`: matching goals
- `color`
- English/Hindi effect label
- science text

Current techniques:

| ID | Name | Pattern | Goals |
| --- | --- | --- | --- |
| `box` | Box Breathing | 4-4-4-4 | focus, calm |
| `four78` | 4-7-8 Method | 4-7-8-0 | sleep |
| `nadi` | Nadi Shodhana | 4-0-4-0 | balance, clarity |
| `coherence` | Coherence Breathing | 5-0-5-0 | stress |
| `extended` | Extended Exhale | 4-0-8-0 | anxiety |
| `kapalbhati` | Kapalbhati | 1-0-1-0 | energy, morning |
| `bhramari` | Bhramari | 4-0-8-0 | anxiety, anger |

### Focus themes: `constants/themes.ts`

Each theme has:

- `id`
- English/Hindi name
- emoji
- gradient colors
- ambient sound filename
- `free` boolean
- English/Hindi description
- `particleType`

Current themes:

| ID | Name | Free | Particle type |
| --- | --- | --- | --- |
| `ganga` | Ganga Ghat Dawn | yes | fireflies |
| `rajasthan` | Rajasthan Dusk | yes | dust |
| `kerala` | Kerala Backwaters | no | rain |
| `himalaya` | Himalayan Dawn | no | snow |
| `mysore` | Mysore Palace Night | no | stars |
| `coorg` | Coorg Forest Rain | no | rain |
| `mumbai` | Mumbai Monsoon | no | rain |
| `spiti` | Spiti Night Sky | no | stars |

### Meditations: `constants/meditations.ts`

Each meditation has:

- `id`
- English/Hindi title
- duration in minutes
- category
- level
- free boolean
- supported languages
- English/Hindi audio URL placeholders
- thumbnail key
- English/Hindi description
- script preview
- tags

Current meditations:

| ID | Title | Duration | Category | Free |
| --- | --- | --- | --- | --- |
| `body-scan` | Body Scan | 10m | sleep | yes |
| `morning-gratitude` | Morning Gratitude | 5m | morning | yes |
| `sos-3min` | SOS — 3-Min Calm | 3m | stress | yes |
| `pre-exam-focus` | Pre-Exam Focus | 10m | focus | no |
| `ranthambore-sleep-story` | Sleep Story: Ranthambore Forest | 20m | sleep | no |
| `yoga-nidra` | Yoga Nidra | 15m | sleep | no |
| `stress-debrief` | End-of-Day Debrief | 10m | stress | no |
| `single-point` | Single-Point Attention | 15m | focus | no |
| `self-compassion` | Self-Compassion | 10m | morning | no |
| `anxiety-relief` | Tension Release | 12m | stress | no |

## 15. Reusable components

### Home components

- `GreetingCard`: greeting/title card using theme and translation.
- `StreakBanner`: shows current streak from `userStore`.
- `MoodCheckIn`: mood selection UI; saves mood to `userStore.logMood()` and hides after selection.
- `QuickActionGrid`: routes to main modes/settings from home.

### UI primitives

- `Card`: pressable or static themed card with small press scale animation.
- `PillButton`: selectable pill with optional emoji and haptic feedback.
- `Badge`: small label with optional icon.
- `ScreenHeader`: common title header with optional right icon/action.

## 16. Firebase Cloud Functions

File: `functions/index.ts`

Functions:

- `createOrder`: callable function requiring auth. Creates Razorpay order with `amount`, `currency`, `receipt`, and `notes`.
- `verifyPayment`: callable function requiring auth. Verifies Razorpay signature using HMAC SHA-256, then updates `users/{uid}/subscription/status` in Firestore.

Important implementation notes:

- Uses `functions.config().razorpay?.key_id` and `key_secret`, but has placeholder fallbacks.
- App-side paywall currently bypasses these functions and opens Razorpay directly with a placeholder key.
- For production, wire app checkout to call `createOrder`, pass returned order ID into Razorpay, then call `verifyPayment` after payment success.

## 17. Data model reference

### AsyncStorage keys

| Key | Owner | Meaning |
| --- | --- | --- |
| `colorScheme` | `appStore` | light/dark/system preference |
| `language` | `appStore` | app language |
| `userData` | `userStore` / sync | onboarding, goals, streak, mood, totals |
| `sukoon_focus_sessions` | `sessionStore` | focus sessions array |
| `sukoon_breathing_sessions` | `sessionStore` | breathing sessions array |
| `sukoon_meditate_sessions` | `sessionStore` | meditation sessions array |
| `sukoon_notifications_enabled` | root/onboarding/settings | notification enabled flag |
| `sukoon_notifications_time` | root/onboarding/settings | daily reminder time |
| `sukoon_pending_sync` | `syncService` | queued Firestore writes |
| `meditation_language` | meditate catalogue | last selected meditation language |

### Firestore paths

| Path | Written/read by | Meaning |
| --- | --- | --- |
| `users/{uid}/profile/settings` | sync upload | onboarding settings |
| `users/{uid}/streak/stats` | sync upload, realtime streak sync | streak and total session stats |
| `users/{uid}/mood_history/entries` | sync upload | mood history array |
| `users/{uid}/sessions/{sessionId}` | sync upload / realtime session sync | individual session record |
| `users/{uid}/subscription/status` | sync read / Cloud Function write | subscription plan/status/expiresAt/isActive source |

## 18. Premium gating model

Premium access is a simple boolean:

```ts
const hasAccess = subscription?.isActive ?? false;
```

Content records carry `free: true/false`.

- Free content is always available.
- Premium content requires `hasAccess`.
- Locked focus themes and locked meditations open `PaywallModal`.

Because subscription state is not persisted locally, Expo Go simulated subscriptions can disappear on app reload. In real builds, subscription should be loaded from Firestore on auth state change.

## 19. Native module and Expo Go rules

Several libraries are native-only or unreliable in Expo Go:

- `@react-native-firebase/*`
- `@react-native-google-signin/google-signin`
- `react-native-razorpay`
- `expo-notifications` in newer SDKs can throw module-level errors in Expo Go.

The code uses `Constants.executionEnvironment === 'storeClient'` to avoid loading these modules in Expo Go. Preserve this pattern when adding new native integrations.

Current project style sometimes uses guarded `require()` inside files. Do not replace it with top-level imports for native-only modules unless the module is safe in Expo Go or the file is only loaded in native builds.

## 20. Common modification recipes

### Add a new meditation

1. Add an object to `constants/meditations.ts` with all required fields.
2. Set `free: true` or `false` depending on premium access.
3. Use a valid `category` expected by `app/(tabs)/meditate.tsx`, or add the new category there too.
4. Add English/Hindi title and description.
5. Replace `CLOUDINARY_URL/...` with real audio URLs when actual playback is implemented.
6. If adding a new duration bucket, update the duration filter logic.

### Add a new focus environment

1. Add an object to `constants/themes.ts`.
2. Include `gradientColors`, `particleType`, English/Hindi names/descriptions, and `free` status.
3. If using a new `particleType`, update focus session particle rendering logic.
4. If real theme-specific audio is required, update `utils/audio.ts` to map `theme.ambientSound` to an actual local asset or remote URL.

### Add a new breathing technique

1. Add an object to `constants/breathing.ts`.
2. Ensure `pattern` and `phases` arrays align.
3. Use `0` for skipped phases.
4. Add goals matching the setup screen goals, or update the goals list in `app/(tabs)/breathe.tsx`.
5. Confirm `app/session/breathe.tsx` can display your phase labels.

### Add a new app language

1. Add a new JSON resource under `i18n/`.
2. Register it in `i18n/index.ts`.
3. Update `appStore.language` type and `toggleLanguage()` logic.
4. Add localized fields for catalogue content or move catalogue strings into i18n resources.
5. Update UI language toggles that currently assume only English/Hindi.

### Add a new tab

1. Create `app/(tabs)/newscreen.tsx`.
2. Add a `<Tabs.Screen name="newscreen" ... />` entry in `app/(tabs)/_layout.tsx`.
3. Add translations/icons as needed.
4. Add quick action links if the screen should be reachable from home.

### Make a session count toward streak

For any successful session completion:

1. Add/update the appropriate session record in `sessionStore`.
2. Call `useUserStore.getState().updateStreakFromSession()` or destructure `updateStreakFromSession` inside the component.
3. Optionally call `syncService.realtimeSyncSession(session)` and `syncService.syncStreakToCloud(streakData)` in real builds.

### Wire real Razorpay payment flow

1. Configure Razorpay keys in Firebase Functions config.
2. From `PaywallModal`, call Cloud Function `createOrder` instead of direct placeholder checkout.
3. Pass returned order ID to Razorpay options.
4. On Razorpay success, call Cloud Function `verifyPayment` with order/payment/signature data and plan.
5. Trust Firestore subscription status from `syncFromFirebase()` as the source of truth.
6. Remove the Expo Go simulation only if QA no longer needs it.

## 21. Known gaps and sharp edges

These are not necessarily bugs the guide fixes, but future developers should know them:

- `useTranslation()` does not return `language`, yet `PaywallModal` expects it. UI may always fall back to English or behave incorrectly.
- `PaywallModal` has a duplicated feature text line.
- Paywall uses placeholder Razorpay key and logo URL.
- App paywall does not call the provided Cloud Functions.
- Meditation sessions simulate playback and do not play actual `audioUrlEn`/`audioUrlHi` audio.
- Focus ambient audio uses a single hardcoded URL, not per-theme `ambientSound` values.
- Focus completions appear not to call `updateStreakFromSession()`, unlike breathing and meditation.
- `totalFocusMinutes` exists but is not maintained.
- Guest mode is not persisted across process restarts.
- Email forgot-password UI does not send Firebase reset email.
- `AsyncStorage.clear()` in settings deletes all app keys, not only Sukoon-specific data.
- Root redirect sends authenticated users without onboarding complete to onboarding; if cloud profile onboarding state is not synced down, existing users may repeat onboarding.
- Firebase sync uploads local data but currently does not download full profile/session history into local stores; it mostly reads subscription and pending queue.

## 22. Testing and development notes

### Local development commands

```bash
npm install
npm run start
npm run android
npm run ios
npm run web
```

### Type checking

There is no explicit typecheck script in `package.json`, but TypeScript can be run directly:

```bash
npx tsc --noEmit
```

### Expo Go vs development build

Use Expo Go for UI and guest-mode testing. Use a development build for:

- Firebase auth
- Google Sign-In
- Razorpay
- reliable notifications
- any native-module behavior

### Practical QA checklist

After major changes, test:

- Fresh install -> welcome -> guest -> onboarding -> tabs.
- Mood check-in hides after logging.
- Focus setup free theme starts a session.
- Locked focus theme opens paywall.
- Breathing session completes and increments streak/total sessions.
- Meditation free session completes and records rating/feeling.
- History shows completed sessions with filters.
- Notification toggle stores settings and schedules/cancels in a dev build.
- Settings delete data resets local state after app restart.
- Auth flows in a development build.
- Payment flow in a development build after replacing placeholders.

## 23. High-level mental model

Think of Sukoon as a local-first Expo Router app:

1. Root layout decides whether the user is allowed into the app.
2. Zustand stores are the source of truth while the app is running.
3. AsyncStorage is the durable local database.
4. Firebase is optional cloud backup/subscription source in real builds.
5. Most product content is static arrays in `constants/`.
6. Active sessions create local records and should update streaks on completion.
7. Premium gating is simply `content.free || subscription.isActive`.
8. Native modules must be loaded through guarded gateways to keep Expo Go usable.

If you need to change client requirements quickly, first identify whether the change is:

- Static content -> edit `constants/` and translation files.
- Screen behavior -> edit the matching route under `app/`.
- Shared UI -> edit `components/ui` or `components/home`.
- Persisted app/user/session state -> edit the relevant Zustand store and storage/sync code.
- Auth/payment/cloud -> edit `stores/authStore.ts`, `services/firebase.ts`, `services/sync.ts`, `components/PaywallModal.tsx`, and/or `functions/index.ts`.
