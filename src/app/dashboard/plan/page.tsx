"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Calendar, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlanCalendarView } from '@/components/plan-calendar-view';

export default function PlanPage() {
  const [teamPlan, setTeamPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount, isLoading: isAccountLoading } = useDoc(userAccountRef);

  // Load the team plan (view-only)
  useEffect(() => {
    async function loadTeamPlan() {
      if (!userAccount?.teamId || !firestore) return;

      setIsLoading(true);
      try {
        const planRef = doc(firestore, 'teams', userAccount.teamId, 'mainPlan', 'current');
        const planSnap = await getDoc(planRef);

        if (planSnap.exists()) {
          setTeamPlan(planSnap.data());
        } else {
          // No plan exists yet
          setTeamPlan(null);
        }
      } catch (error: any) {
        console.error('❌ Error loading team plan:', error);

        let errorMessage = "Could not load the team plan.";

        if (error.code === 'permission-denied') {
          errorMessage = "Permission denied. You may not have access to this team's plan.";
        } else if (error.code === 'not-found') {
          errorMessage = "Team not found.";
        } else if (!userAccount?.teamId) {
          errorMessage = "No team assigned to your account.";
        }

        toast({
          title: "Error Loading Plan",
          description: errorMessage,
          variant: "destructive",
        });

        setTeamPlan(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (userAccount) {
      loadTeamPlan();
    }
  }, [userAccount, firestore, toast]);

  if (isAccountLoading || isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!userAccount) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please log in to access the team plan.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Team Workout Plan
          </h1>
          <p className="text-muted-foreground mt-2">
            View your team's 8-week workout schedule
          </p>
        </div>
      </div>

      {/* View-only indicator */}
      <Alert className="border-blue-500 bg-blue-50">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <AlertDescription>
            <strong>View Mode:</strong> You are viewing the team plan.
            {(userAccount?.accountType === 'Supervisor' || userAccount?.accountType === 'Admin') &&
              ' To make changes, visit the Plan Builder page.'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>8-Week Workout Calendar</CardTitle>
          <CardDescription>
            Click on any day to view workout details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamPlan ? (
            <PlanCalendarView
              plan={teamPlan}
              onUpdateWorkout={() => {}} // No-op for view-only
              canEdit={false}
              teamId={userAccount?.teamId}
              userId={user?.uid}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Workout Plan Yet</h3>
              <p>Your team's workout plan hasn't been created yet.</p>
              {(userAccount?.accountType === 'Supervisor' || userAccount?.accountType === 'Admin') && (
                <p className="mt-2 text-sm">Visit the Plan Builder to create your first plan.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
