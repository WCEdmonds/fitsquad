'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// Import 'initializeAuth' and 'indexedDBLocalPersistence'
import { getAuth, initializeAuth, indexedDBLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: This function is now corrected
export function initializeFirebase() {
  if (!getApps().length) {
    // This is the main fix:
    // We REMOVED the try/catch block and now *always*
    // initialize using the config object.
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  // This part includes the fix for the sign-in page hanging
  let auth: Auth;
  try {
    auth = initializeAuth(firebaseApp, {
      persistence: indexedDBLocalPersistence
    });
  } catch (e) {
    console.warn("Could not initialize auth with indexedDB persistence. Falling back.", e);
    auth = getAuth(firebaseApp);
  }

  return {
    firebaseApp,
    auth: auth, // Use the initialized auth instance
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export * from './auth/use-user';