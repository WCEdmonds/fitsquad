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
import { Calendar, Lock, Pencil, Eye, Save, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { callSendPushNotification } from '@/lib/cloudFunctions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlanMonthView } from '@/components/plan-month-view';
import { SmartPlanDialog } from '@/components/smart-plan-dialog';

export default function PlanBuilderPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [teamPlan, setTeamPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSmartPlanDialogOpen, setIsSmartPlanDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount, isLoading: isAccountLoading } = useDoc(userAccountRef);

  // Check if user can edit (Supervisor or Admin only)
  const canEdit = userAccount?.accountType === 'Supervisor' || userAccount?.accountType === 'Admin';
  const isViewOnly = userAccount?.accountType === 'Commander' || userAccount?.accountType === 'Soldier';

  // Load the team plan
  useEffect(() => {
    async function loadTeamPlan() {
      if (!userAccount?.teamId || !firestore) return;

      setIsLoading(true);
      try {
        const planRef = doc(firestore, 'teams', userAccount.teamId, 'mainPlan', 'current');
        const planSnap = await getDoc(planRef);

        if (planSnap.exists()) {
          const loadedPlan = planSnap.data();
          // Ensure plan has at least 52 weeks (auto-migration for existing 8-week plans)
          if (loadedPlan.weeks && loadedPlan.weeks.length < 52) {
            const currentLength = loadedPlan.weeks.length;
            const extraWeeks = Array.from({ length: 52 - currentLength }, (_, i) => ({
              weekNumber: currentLength + i + 1,
              days: Array.from({ length: 7 }, (_, dIndex) => ({
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dIndex],
                workout: null,
              })),
            }));
            loadedPlan.weeks = [...loadedPlan.weeks, ...extraWeeks];
          }
          setTeamPlan(loadedPlan);
        } else {
          // Initialize empty plan structure (8 weeks)
          const emptyPlan = {
            weeks: Array.from({ length: 52 }, (_, weekIndex) => ({
              weekNumber: weekIndex + 1,
              days: Array.from({ length: 7 }, (_, dayIndex) => ({
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIndex],
                workout: null,
              })),
            })),

            // Initialize to the Monday of the current week
            cycleStartDate: (() => {
               const d = new Date();
               const day = d.getDay();
               const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
               d.setDate(diff);
               d.setHours(0, 0, 0, 0);
               return d.toISOString();
            })(),
            lastUpdated: new Date().toISOString(),
            updatedBy: user?.uid,
          };

          // Set in state immediately
          setTeamPlan(emptyPlan);

          // If user can edit, create the document in Firestore
          if (canEdit) {
            try {
              await setDoc(planRef, emptyPlan);
              console.log('✅ Created initial empty plan in Firestore');
            } catch (createError: any) {
              console.error('❌ Error creating initial plan:', createError);
              // Don't show error to user - they can still work with it in state
              // and save manually later
            }
          }
        }
      } catch (error: any) {
        console.error('❌ Error loading team plan:', error);

        // Provide more specific error messages
        let errorMessage = "Could not load the team plan.";

        if (error.code === 'permission-denied') {
          errorMessage = "Permission denied. You may not have access to this team's plan.";
          console.error('Permission details:', {
            userAccountType: userAccount?.accountType,
            teamId: userAccount?.teamId,
            canEdit,
          });
        } else if (error.code === 'not-found') {
          errorMessage = "Team not found.";
        } else if (!userAccount?.teamId) {
          errorMessage = "No team assigned to your account.";
        }

        toast({
          title: "Error Loading Plan",
          description: errorMessage + " Creating empty plan...",
          variant: "destructive",
        });

        // Still set an empty plan so user can see the interface
        const fallbackPlan = {
          weeks: Array.from({ length: 52 }, (_, weekIndex) => ({
            weekNumber: weekIndex + 1,
            days: Array.from({ length: 7 }, (_, dayIndex) => ({
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIndex],
              workout: null,
            })),
          })),
          cycleStartDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          updatedBy: user?.uid,
        };
        setTeamPlan(fallbackPlan);
      } finally {
        setIsLoading(false);
      }
    }

    if (userAccount) {
      loadTeamPlan();
    }
  }, [userAccount, firestore, user, toast, canEdit]);

  async function handleSavePlan() {
    if (!userAccount?.teamId || !canEdit || !teamPlan) return;

    setIsSaving(true);
    try {
      const planRef = doc(firestore, 'teams', userAccount.teamId, 'mainPlan', 'current');

      // Set cycle start date to today if not already set (for new plans)
      const cycleStartDate = teamPlan.cycleStartDate || new Date().toISOString();

      await setDoc(planRef, {
        ...teamPlan,
        cycleStartDate,
        updatedAt: Timestamp.now(), // Use Timestamp for consistent ordering
        lastUpdated: new Date().toISOString(), // Keep string for legacy/display compatibility
        updatedBy: user?.uid,
      });

      // Trigger push notification
      callSendPushNotification({
        teamId: userAccount.teamId,
        type: 'schedule_update',
        title: 'Plan Updated',
        body: 'Your supervisor has updated the workout plan.'
      }).catch(err => console.error('Failed to trigger push:', err));

      console.log('✅ Plan saved successfully');
      toast({
        title: "Plan Saved",
        description: "The team workout plan has been saved successfully.",
      });
    } catch (error: any) {
      console.error('❌ Error saving plan:', error);

      let errorMessage = "Could not save the team plan.";

      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. You may not have permission to edit this team's plan.";
        console.error('Save permission details:', {
          userAccountType: userAccount?.accountType,
          teamId: userAccount?.teamId,
          canEdit,
        });
      } else if (error.code === 'not-found') {
        errorMessage = "Team not found.";
      }

      toast({
        title: "Error Saving Plan",
        description: errorMessage + " " + (error.message || "Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateWorkout(weekIndex: number, dayIndex: number, workout: any) {
    if (!canEdit || !userAccount?.teamId) return;

    // Update state first for immediate UI feedback
    const updatedPlan = { ...teamPlan };
    updatedPlan.weeks[weekIndex].days[dayIndex].workout = workout;
    setTeamPlan(updatedPlan);

    // Auto-save to Firestore
    try {
      const planRef = doc(firestore, 'teams', userAccount.teamId, 'mainPlan', 'current');
      const cycleStartDate = updatedPlan.cycleStartDate || new Date().toISOString();

      await setDoc(planRef, {
        ...updatedPlan,
        cycleStartDate,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.uid,
      });

      console.log('✅ Workout saved and plan auto-saved');
      toast({
        title: "Workout Saved",
        description: "The workout has been saved to your plan.",
      });
    } catch (error: any) {
      console.error('❌ Error auto-saving plan:', error);
      toast({
        title: "Warning",
        description: "Workout updated locally but failed to save to server. Please click Save Plan to retry.",
        variant: "destructive",
      });
    }
  }

  function handleApplyGeneratedWorkouts(workouts: any[]) {
    if (!teamPlan || !canEdit) return;

    const updated = { ...teamPlan };
    let placedCount = 0;

    // Map day names to indices (Monday = 0, Sunday = 6)
    const dayNameToIndex: { [key: string]: number } = {
      'Monday': 0,
      'Tuesday': 1,
      'Wednesday': 2,
      'Thursday': 3,
      'Friday': 4,
      'Saturday': 5,
      'Sunday': 6,
    };

    // Place each workout on its corresponding day in Week 1
    workouts.forEach((workout) => {
      const dayIndex = dayNameToIndex[workout.day];
      if (dayIndex !== undefined && updated.weeks.length > 0) {
        // Place in Week 1 (index 0)
        updated.weeks[0].days[dayIndex].workout = workout;
        placedCount++;
      }
    });

    if (placedCount > 0) {
      setTeamPlan(updated);
      toast({
        title: "Workouts Applied",
        description: `${placedCount} workout${placedCount !== 1 ? 's' : ''} added to Week 1 of your plan.`,
      });
    }
  }

  if (isAccountLoading || isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6 pb-24 md:pb-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!userAccount) {
    return (
      <div className="container mx-auto p-6 pb-24 md:pb-4">
        <Alert>
          <AlertDescription>
            Please log in to access the Plan Builder.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 pb-24 md:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold tracking-tight">Workout Calendar</h2>
            <p className="text-muted-foreground">
              Manage the comprehensive workout plan for your team.
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button
              onClick={() => setIsSmartPlanDialogOpen(true)}
              variant="outline"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Smart Plan
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={isSaving || !teamPlan}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Plan"}
            </Button>
          </div>
        )}
      </div>

      {/* Permission indicator */}
      <Alert className={canEdit ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300" : "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300"}>
        <div className="flex items-center gap-2">
          {canEdit ? (
            <>
              <Pencil className="h-4 w-4" />
              <AlertDescription className="text-inherit">
                <strong>Edit Mode:</strong> You can modify workouts for your team.
              </AlertDescription>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <AlertDescription className="text-inherit">
                <strong>View Mode:</strong> You can view the team plan but cannot make changes.
              </AlertDescription>
            </>
          )}
        </div>
      </Alert>

      {/* Calendar View */}
      <Card className="border-border/40 shadow-sm relative overflow-hidden">
        <CardHeader className="hidden">
          <CardTitle>Workout Calendar</CardTitle>
          <CardDescription>
            Click on any day to {canEdit ? 'add or edit' : 'view'} workouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamPlan ? (
            <PlanMonthView
        plan={teamPlan}
        onUpdateWorkout={handleUpdateWorkout}
        canEdit={canEdit}
        teamId={userAccount?.teamId}
        userId={user?.uid}
      />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No plan data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Plan Dialog */}
      <SmartPlanDialog
        isOpen={isSmartPlanDialogOpen}
        onClose={() => setIsSmartPlanDialogOpen(false)}
        onPlanGenerated={handleApplyGeneratedWorkouts}
      />
    </div>
  );
}
