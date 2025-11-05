'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkoutCalendarView } from '@/components/workout-calendar-view';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { WorkoutPrintView } from '@/components/workout-print-view';

export default function SavedPlanDetailPage() {
  const { planId } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();

  // This is a bit of a workaround to get the teamId. Ideally, this would be part of the route or a more direct lookup.
  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount } = useDoc(userAccountRef);
  
  const planDocRef = useMemoFirebase(() => {
    if (!userAccount?.teamId || !planId) return null;
    return doc(firestore, 'teams', userAccount.teamId, 'workoutPlans', planId as string);
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
                    {plan && (
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
                    {parsedPlan && <WorkoutCalendarView plan={parsedPlan} />}
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
