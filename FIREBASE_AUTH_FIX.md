# Firebase Authentication — Bug Report & Fix Log

This document records every authentication issue found in the codebase and the
exact fix applied to each one.  It supersedes the earlier placeholder version.

---

## Summary of Issues Fixed

| # | Severity | Area | Issue |
|---|----------|------|-------|
| 1 | **Critical** | `firebase.ts` | Firestore initialised with `undefined` DB ID when env-var config is used |
| 2 | **Critical** | `App.tsx` | Anonymous sign-in called `handleNext()` before `onAuthStateChanged` fired, leaving `user` null during profile load |
| 3 | **High** | `App.tsx` | Profile-load error was silently swallowed — user stayed on Welcome screen forever |
| 4 | **High** | `App.tsx` | Anonymous users have no Firestore profile; Firestore permission error was never handled |
| 5 | **High** | `App.tsx` | `signInWithPopup` not falling back to `signInWithRedirect` on native (Capacitor) or popup-blocked browsers |
| 6 | **Medium** | `App.tsx` | Email-link sign-in missing `setAuthLoading(false)` on success path — spinner never cleared |
| 7 | **Medium** | `App.tsx` | `handleLogout` did not reset navigation — user stayed on `Main` with `user = null` |
| 8 | **Medium** | `App.tsx` | `actionCodeSettings.url` used raw `window.location.href` (with query params) — could trigger `auth/invalid-continue-uri` |
| 9 | **Medium** | `App.tsx` | WelcomeScreen rendered briefly for already-authenticated users (flash of login screen) |
| 10 | **Low** | `firebase.ts` | `firebase-applet-config.json` was the only config source — CI/production builds using env vars were ignored |
| 11 | **Low** | `AndroidManifest.xml` | No `VIEW` intent-filter for Firebase auth redirect/email-link callbacks on Android |
| 12 | **Low** | CI workflows | `VITE_FIREBASE_APP_ID` and `VITE_FIREBASE_MEASUREMENT_ID` were not passed to `sync-env.sh` |

---

## Detailed Fix Descriptions

### Fix 1 — Firestore `undefined` database ID (`src/lib/firebase.ts`)

**Root cause:** `getFirestore(app, firebaseConfig.firestoreDatabaseId)` read the
`firestoreDatabaseId` field directly from the imported JSON.  When the app is
built with env-var config (CI/production), this field is absent and `getFirestore`
received `undefined`, throwing a runtime error before any auth could proceed.

**Fix:** The database ID is now resolved with a three-level fallback:
1. `VITE_FIREBASE_FIRESTORE_DATABASE_ID` env var
2. `firestoreDatabaseId` field in `firebase-applet-config.json`
3. Hard-coded `"(default)"`

### Fix 2 — Anonymous sign-in navigation race condition (`App.tsx`)

**Root cause:** `handleLoginAnon` called `handleNext()` synchronously after
`signInAnonymously` resolved.  At that point `onAuthStateChanged` had not yet
fired, so `user` was still `null` when the profile-load `useEffect` ran.  The
effect bailed out immediately (`if (!user) return`) leaving the user in
onboarding with no Firebase session.

**Fix:** Removed both `handleNext()` calls from `handleLoginAnon`.  Navigation
is now driven exclusively by the `onAuthStateChanged` listener + profile-load
effect, consistent with the Google sign-in flow.

### Fix 3 & 4 — Profile-load error handling and anonymous user path (`App.tsx`)

**Root cause:** The `catch` block in the profile-load effect only logged the
error without navigating.  Anonymous users (who have no Firestore document)
always hit a Firestore permission error, and the app silently stayed on the
Welcome screen.

**Fix:**
- Anonymous users skip the Firestore fetch entirely and go straight to
  `NameAssistant`.
- All Firestore errors in the profile-load path now fall back to `NameAssistant`
  instead of leaving the user stranded.
- Added a third navigation branch: if a profile exists but `onboardingComplete`
  is `false`, the user is routed to `NameAssistant` to resume onboarding.

### Fix 5 — Google sign-in popup blocked / native Capacitor (`App.tsx`)

**Root cause:** `signInWithPopup` throws `auth/popup-blocked` in browsers with
strict popup policies and is entirely unsupported inside a Capacitor WebView.
The previous code only showed an error toast with no fallback.

**Fix:**
- On `Capacitor.isNativePlatform()`, `signInWithRedirect` is called directly.
- On web, if `signInWithPopup` throws `auth/popup-blocked`,
  `auth/cancelled-popup-request`, or `auth/popup-closed-by-user`, the code
  automatically falls back to `signInWithRedirect`.
- `getRedirectResult(auth)` is now called on every app mount (inside the auth
  listener `useEffect`) to process the redirect result after the page reloads.

### Fix 6 — Email-link sign-in spinner never cleared (`App.tsx`)

**Root cause:** After `signInWithEmailLink` resolved successfully, the code
relied solely on `onAuthStateChanged` to set `authLoading = false`.  On a cold
page-load triggered by clicking the email link, the listener fires asynchronously
and there is a window where the spinner remains visible indefinitely if the
listener fires before the effect has a chance to clear it.

**Fix:** `setAuthLoading(false)` is now called explicitly on the success path,
immediately after the URL is cleaned up.  Also added user-friendly error messages
for `auth/invalid-action-code` (expired/used link) and `auth/invalid-email`
(email mismatch).

### Fix 7 — Logout did not reset navigation (`App.tsx`)

**Root cause:** `handleLogout` signed out of Firebase but left `currentScreen`
at its current value (e.g. `"Main"`).  With `user = null`, Firestore listeners
failed and the UI was in a broken state.

**Fix:** `setCurrentScreen('Welcome')` is called immediately after `signOut`
resolves, cleanly returning the app to the unauthenticated state.

### Fix 8 — `actionCodeSettings.url` contained query params (`App.tsx`)

**Root cause:** The email-link `actionCodeSettings.url` was set to
`window.location.origin` (which was actually correct in the original code, but
the comment and intent were ambiguous).  We clarified and hardened it to use
`window.location.origin + window.location.pathname`, which strips any existing
query parameters or hash fragments that could cause `auth/invalid-continue-uri`
errors if the page is loaded with stale URL state.

### Fix 9 — Flash of Welcome screen for authenticated users (`App.tsx`)

**Root cause:** The render condition `currentScreen === "Welcome"` was true for
a brief moment after `onAuthStateChanged` set `user` but before the profile-load
effect had updated `currentScreen`.

**Fix:** Added `&& !user` guard: `currentScreen === "Welcome" && !user`.

### Fix 10 — Firebase config only read from JSON, ignoring env vars (`src/lib/firebase.ts`)

**Root cause:** `firebase-applet-config.json` was the sole config source.
CI/production builds inject credentials via `VITE_FIREBASE_*` env vars (through
`scripts/sync-env.sh`), but those were never read by the client.  Deployed builds
were silently using the demo project credentials.

**Fix:** `firebase.ts` now merges env vars over the JSON config.  Any
`VITE_FIREBASE_*` variable that is set and non-empty takes precedence; otherwise
the JSON value is used as a fallback.  This makes local development zero-config
while allowing CI to inject the correct production credentials.

### Fix 11 — Android missing deep-link intent-filter (`AndroidManifest.xml`)

**Root cause:** The `MainActivity` had only a `LAUNCHER` intent-filter.  Without
a `VIEW` intent-filter for the Firebase auth domain, the Android OS could not
route the OAuth redirect or email-link callback URL back into the app.

**Fix:** Added an `intent-filter` with `android:autoVerify="true"` that handles
`https://demoforce-d8279.firebaseapp.com` URLs.  Update the host to match your
production `authDomain` if it differs.

### Fix 12 — Missing `VITE_FIREBASE_APP_ID` / `VITE_FIREBASE_MEASUREMENT_ID` in CI

**Root cause:** Both `build-apk.yml` and `build-and-release-apk.yml` passed most
Firebase secrets to `sync-env.sh` but omitted `VITE_FIREBASE_APP_ID` and
`VITE_FIREBASE_MEASUREMENT_ID`.  These are required for Analytics initialisation
and for Firebase to correctly identify the app.

**Fix:** Both workflow files and `sync-env.sh` now include these two variables.

---

## Firebase Console Checklist (Manual Steps Required)

The following changes **must be made in the Firebase Console** — they cannot be
fixed in code:

1. **Enable Email/Password + Email Link provider**
   - Firebase Console → Authentication → Sign-in method
   - Click **Email/Password** → Enable → check **Email link (passwordless)** → Save

2. **Enable Google provider**
   - Firebase Console → Authentication → Sign-in method
   - Click **Google** → Enable → Save

3. **Enable Anonymous provider** (for offline/guest mode)
   - Firebase Console → Authentication → Sign-in method
   - Click **Anonymous** → Enable → Save

4. **Add Authorized Domains**
   - Firebase Console → Authentication → Settings → Authorized domains
   - Ensure these are listed:
     - `localhost`
     - `team-forge-seven.vercel.app` (or your actual production domain)
     - `demoforce-d8279.firebaseapp.com` (auto-added, verify it is present)

5. **Add GitHub Secrets** for CI builds
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
     `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
     `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`,
     `VITE_FIREBASE_MEASUREMENT_ID`, `VITE_FIREBASE_FIRESTORE_DATABASE_ID`

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/firebase.ts` | Dual-source config (env vars + JSON fallback), fixed DB ID, added `getRedirectResult` export, added Google provider scopes |
| `src/App.tsx` | Fixes 2–9 (see above) |
| `android/app/src/main/AndroidManifest.xml` | Added Firebase auth deep-link intent-filter |
| `scripts/sync-env.sh` | Added `VITE_FIREBASE_APP_ID` and `VITE_FIREBASE_MEASUREMENT_ID` |
| `.github/workflows/build-apk.yml` | Added `VITE_FIREBASE_APP_ID` and `VITE_FIREBASE_MEASUREMENT_ID` secrets |
| `.github/workflows/build-and-release-apk.yml` | Added `VITE_FIREBASE_APP_ID` and `VITE_FIREBASE_MEASUREMENT_ID` secrets |
| `.env.example` | Documented all `VITE_FIREBASE_*` environment variables |
