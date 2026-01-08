'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);

  const { data: userAccount, isLoading: isAccountLoading } = useDoc(userAccountRef);

  useEffect(() => {
    // If not authenticated, let middleware or layout handle it, but if loaded:
    if (!isUserLoading && !isAccountLoading) {
       router.replace('/dashboard/plan');
    }
  }, [router, isUserLoading, isAccountLoading]);

  // While redirecting, show a skeleton or loading state
  return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
  );
}
