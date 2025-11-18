'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [initError, setInitError] = useState<Error | null>(null);

  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    try {
      return initializeFirebase();
    } catch (error) {
      console.error('Firebase initialization error in client provider:', error);
      setInitError(error as Error);
      // Return a minimal structure to prevent crashes
      return null;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Ensure we're in a browser environment
  useEffect(() => {
    if (typeof window !== 'undefined' && !firebaseServices) {
      console.error('Firebase failed to initialize on client');
    }
  }, [firebaseServices]);

  if (initError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Firebase Initialization Error</h2>
        <p>Failed to connect to Firebase. Please refresh the page.</p>
        <pre style={{ textAlign: 'left', background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
          {initError.message}
        </pre>
      </div>
    );
  }

  if (!firebaseServices) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading Firebase...</p>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}