'use client';

import { User } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';

export interface UserAuthResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * Hook to get the current authenticated user from Firebase.
 * Uses the centralized auth state from FirebaseProvider to avoid duplicate listeners.
 * @returns An object containing the user, loading state, and error.
 */
export const useUser = (): UserAuthResult => {
  const { user, isUserLoading, userError } = useFirebase();

  return { user, isUserLoading, userError };
};
