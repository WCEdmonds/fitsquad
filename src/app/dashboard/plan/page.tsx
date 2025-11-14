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
import { Calendar, Eye, CalendarDays, ListTodo, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlanCalendarView } from '@/components/plan-calendar-view';
import { DailyWorkoutView } from '@/components/daily-workout-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlanPrintView } from '@/components/plan-print-view';
import { Capacitor } from '@capacitor/core';

export default function PlanPage() {
  const [teamPlan, setTeamPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('daily'); // Default to daily
  const [isNative, setIsNative] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

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

  const handleDownloadPdf = () => {
    window.print();
  };

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
    <>
      {/* Hidden print view */}
      <div className="hidden print-only">
        {teamPlan && <PlanPrintView plan={teamPlan} viewMode={viewMode} selectedDate={selectedDate} />}
      </div>

      <div className="container mx-auto p-6 space-y-6 no-print pb-24 md:pb-4">
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
          {teamPlan && !isNative && (
            <Button variant="outline" onClick={handleDownloadPdf}>
              <FileText className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'weekly' | 'daily')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Today's Workout
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            8-Week Plan
          </TabsTrigger>
        </TabsList>

        {/* Daily View */}
        <TabsContent value="daily" className="mt-6">
          {teamPlan ? (
            <DailyWorkoutView
              plan={teamPlan}
              userId={user?.uid || ''}
              teamId={userAccount?.teamId || ''}
              onDateChange={setSelectedDate}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Workout Plan Yet</h3>
                <p className="text-muted-foreground text-center">
                  Your team's workout plan hasn't been created yet.
                </p>
                {(userAccount?.accountType === 'Supervisor' || userAccount?.accountType === 'Admin') && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Visit the Plan Builder to create your first plan.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Weekly Calendar View */}
        <TabsContent value="weekly" className="mt-6">
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
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}
