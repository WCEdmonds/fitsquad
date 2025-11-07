'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkoutCalendarView } from '@/components/workout-calendar-view';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { WorkoutPrintView } from '@/components/workout-print-view';
import { Capacitor } from '@capacitor/core';

function SavedPlanDetail() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('id');
  const { user } = useUser();
  const firestore = useFirestore();
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount } = useDoc(userAccountRef);
  
  const planDocRef = useMemoFirebase(() => {
    if (!userAccount?.teamId || !planId) return null;
    return doc(firestore, 'teams', userAccount.teamId, 'workoutPlans', planId);
  }, [firestore, userAccount, planId]);

  const { data: plan, isLoading } = useDoc(planDocRef);

  const parsedPlan = plan?.planData ? JSON.parse(plan.planData) : null;

  const handleDownloadPdf = () => {
    window.print();
  }

  return (
    <>
        <div className="hidden print-only">
            {parsedPlan && <WorkoutPrintView plan={parsedPlan} />}
        </div>
        <div className="no-print">
            <div className="mb-4">
                <Button asChild variant="outline">
                    <Link href="/dashboard/saved-plans">
                        <ArrowLeft className="mr-2" />
                        Back to Saved Plans
                    </Link>
                </Button>
            </div>
            <Card className="h-full min-h-[600px]">
                <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                    <CardTitle>{plan?.name ?? 'Loading...'}</CardTitle>
                    <CardDescription>
                        {plan?.description ?? '...'}
                    </CardDescription>
                    </div>
                    {plan && !isNative && (
                        <Button variant="outline" onClick={handleDownloadPdf}>
                        <FileText className="mr-2" />
                        Download PDF
                        </Button>
                    )}
                </div>
            </CardHeader>
                <CardContent>
                    {isLoading && (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <br />
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                    )}
                    {planId && parsedPlan && <WorkoutCalendarView plan={parsedPlan} planId={planId} />}
                    {!isLoading && !parsedPlan && (
                        <div className="text-center py-12">
                            <p>Plan not found or data is corrupted.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </>
  );
}

export default function SavedPlanPage() {
    return (
        <Suspense fallback={<div>Loading plan...</div>}>
            <SavedPlanDetail />
        </Suspense>
    )
}
