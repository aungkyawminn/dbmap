import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use browserLocalPersistence (localStorage) as primary persistence with IndexedDB fallback.
// This prevents 'Database is closing/hidden' errors when tab/iframe visibility changes or when auth popups open.
let authInstance;
try {
  if (typeof window !== 'undefined') {
    authInstance = initializeAuth(app, {
      persistence: [browserLocalPersistence, indexedDBLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver
    });
  } else {
    authInstance = getAuth(app);
  }
} catch (e) {
  // If already initialized, use existing instance
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Initialize Google / Firebase Analytics if supported in this environment
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported && firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn('Firebase Analytics initialization error:', err);
      }
    }
  }).catch(() => {});
}

export function trackEvent(eventName, eventParams = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
  if (analytics) {
    try {
      logEvent(analytics, eventName, eventParams);
    } catch (e) {
      // ignore
    }
  }
}

export function handleFirestoreError(error, operationType, path) {
  const msg = error instanceof Error ? error.message : String(error);
  // Avoid crashing app runtime when Cloud Firestore API is pending enablement or client is offline
  if (
    msg.includes('Cloud Firestore API has not been used') ||
    msg.includes('is disabled') ||
    msg.includes('client is offline') ||
    msg.includes('Failed to get document because the client is offline')
  ) {
    console.warn('Cloud Firestore is not yet activated or client is offline:', msg);
    return;
  }

  const errInfo = {
    error: msg,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  logEvent
};
