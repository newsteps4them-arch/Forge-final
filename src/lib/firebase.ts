/**
 * Firebase Client Configuration
 *
 * Initializes the Firebase SDK for Authentication and Firestore database access.
 *
 * Config priority:
 *  1. VITE_ environment variables (injected at build time by CI / .env files)
 *  2. firebase-applet-config.json (local development fallback)
 *
 * This dual-source strategy ensures:
 *  - Local dev works out-of-the-box with the committed JSON config.
 *  - CI/production builds receive credentials from GitHub Secrets via sync-env.sh,
 *    preventing accidental use of the demo project in production.
 */

import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import jsonConfig from '../../firebase-applet-config.json';

// ---------------------------------------------------------------------------
// 1. Build the effective Firebase config
//    Env vars (VITE_FIREBASE_*) take precedence over the committed JSON file.
//    Any field not supplied by env falls back to the JSON value so that local
//    development continues to work without any extra setup.
// ---------------------------------------------------------------------------
const envConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Merge: env vars win when present and non-empty, otherwise fall back to JSON.
const firebaseConfig = {
  apiKey:            envConfig.apiKey            || jsonConfig.apiKey,
  authDomain:        envConfig.authDomain        || jsonConfig.authDomain,
  projectId:         envConfig.projectId         || jsonConfig.projectId,
  storageBucket:     envConfig.storageBucket     || jsonConfig.storageBucket,
  messagingSenderId: envConfig.messagingSenderId || jsonConfig.messagingSenderId,
  appId:             envConfig.appId             || jsonConfig.appId,
  measurementId:     envConfig.measurementId     || jsonConfig.measurementId,
};

// ---------------------------------------------------------------------------
// 2. Determine the Firestore database ID
//    Prefer the env var; fall back to the JSON field; default to "(default)".
// ---------------------------------------------------------------------------
const firestoreDatabaseId: string =
  (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string | undefined) ||
  (jsonConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  '(default)';

// ---------------------------------------------------------------------------
// 3. Initialize Firebase services
// ---------------------------------------------------------------------------

/** Core Firebase App instance. */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Analytics instance.
 * Only initialised in browser contexts (not SSR / Node).
 */
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

/** Firebase Authentication instance. */
export const auth = getAuth(app);

/**
 * Firestore Database instance.
 *
 * BUG FIX: The previous code passed `firebaseConfig.firestoreDatabaseId`
 * directly from the imported JSON object.  When that field is absent (e.g.
 * in production where config comes from env vars) `getFirestore` received
 * `undefined`, which caused a runtime error.  We now always pass a valid
 * string — either the configured custom ID or the Firebase default "(default)".
 */
export const db = getFirestore(app, firestoreDatabaseId);

/** Google Authentication Provider with recommended scopes. */
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Re-export common Firebase Auth and Firestore functions for cleaner imports.
export {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
};
