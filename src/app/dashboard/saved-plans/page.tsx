'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Archive } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { SavedPlanList } from '@/components/saved-plan-list';
import { Skeleton } from '@/components/ui/skeleton';

export default function SavedPlansPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount } = useDoc(userAccountRef);

  const workoutPlansRef = useMemoFirebase(() => {
    if (!userAccount?.teamId) return null;
    return collection(firestore, 'teams', userAccount.teamId, 'workoutPlans');
  }, [firestore, userAccount]);

  const { data: savedPlans, isLoading } = useCollection(workoutPlansRef);

  return (
    <div className="pb-24 md:pb-4">
    <Card>
      <CardHeader>
        <CardTitle>Saved Workout Plans</CardTitle>
        <CardDescription>
          Review and manage your previously generated workout plans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )}
        {!isLoading && savedPlans && savedPlans.length > 0 && (
          <SavedPlanList plans={savedPlans} teamId={userAccount.teamId} />
        )}
        {!isLoading && (!savedPlans || savedPlans.length === 0) && (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[300px]">
            <Archive className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Saved Plans Yet</h3>
            <p className="text-muted-foreground">
              Once you save a plan from the Fitness Planner, it will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
