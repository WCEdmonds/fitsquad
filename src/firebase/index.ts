'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// Import 'initializeAuth' and 'indexedDBLocalPersistence'
import { getAuth, initializeAuth, indexedDBLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// Track if we're currently initializing to prevent race conditions
let isInitializing = false;
let cachedSdks: ReturnType<typeof getSdks> | null = null;

// IMPORTANT: This function is now corrected with better error handling
export function initializeFirebase() {
  // Return cached SDKs if already initialized
  if (cachedSdks) {
    return cachedSdks;
  }

  // Wait if currently initializing (prevent race conditions)
  if (isInitializing) {
    console.warn('Firebase initialization already in progress');
    // Return a temporary placeholder - will be replaced by actual SDKs
    if (getApps().length) {
      return getSdks(getApp());
    }
  }

  if (!getApps().length) {
    isInitializing = true;
    try {
      console.log('Initializing Firebase app...');
      const firebaseApp = initializeApp(firebaseConfig);
      cachedSdks = getSdks(firebaseApp);
      console.log('Firebase initialized successfully');
      return cachedSdks;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    } finally {
      isInitializing = false;
    }
  }

  // If already initialized, get the existing app and create/cache SDKs
  const existingApp = getApp();
  if (!cachedSdks) {
    cachedSdks = getSdks(existingApp);
  }
  return cachedSdks;
}

export function getSdks(firebaseApp: FirebaseApp) {
  // This part includes the fix for the sign-in page hanging
  let auth: Auth;

  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';

  try {
    // Only use indexedDB persistence in browser environments
    if (isBrowser) {
      auth = initializeAuth(firebaseApp, {
        persistence: indexedDBLocalPersistence
      });
      console.log('Auth initialized with indexedDB persistence');
    } else {
      auth = getAuth(firebaseApp);
      console.log('Auth initialized without persistence (SSR)');
    }
  } catch (e: any) {
    // If initializeAuth fails (e.g., auth already initialized), fall back to getAuth
    console.warn("Could not initialize auth with indexedDB persistence. Falling back to getAuth.", e.code, e.message);
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