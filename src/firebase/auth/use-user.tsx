'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '@/firebase/provider'; // Adjusted import path

export interface UserAuthResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * Hook to get the current authenticated user from Firebase.
 * @returns An object containing the user, loading state, and error.
 */
export const useUser = (): UserAuthResult => {
  const auth = useAuth(); // Get auth instance from context
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isUserLoading, setIsLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    // If there's no auth instance, we can't determine the user.
    if (!auth) {
      setIsLoading(false);
      setUser(null);
      // Optional: Set an error if auth is expected but not available.
      // setError(new Error("Firebase Auth service is not available."));
      return;
    }

    // Subscribe to authentication state changes.
    const unsubscribe = auth.onAuthStateChanged(
      (firebaseUser) => {
        setUser(firebaseUser); // User is null if not logged in.
        setIsLoading(false);
      },
      (error) => {
        console.error('useUser: Auth state change error:', error);
        setUserError(error);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount.
    return () => unsubscribe();
  }, [auth]); // Rerun effect if the auth instance changes.

  return { user, isUserLoading, userError };
};
