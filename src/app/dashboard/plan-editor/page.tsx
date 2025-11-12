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
import { Calendar, Lock, Pencil, Eye, Save, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlanCalendarView } from '@/components/plan-calendar-view';
import { SmartPlannerImportDialog } from '@/components/smart-planner-import-dialog';

export default function PlanEditorPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [teamPlan, setTeamPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
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
          setTeamPlan(planSnap.data());
        } else {
          // Initialize empty plan structure (8 weeks)
          const emptyPlan = {
            weeks: Array.from({ length: 8 }, (_, weekIndex) => ({
              weekNumber: weekIndex + 1,
              days: Array.from({ length: 7 }, (_, dayIndex) => ({
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIndex],
                workout: null,
              })),
            })),
            lastUpdated: new Date().toISOString(),
            updatedBy: user?.uid,
          };
          setTeamPlan(emptyPlan);
        }
      } catch (error) {
        console.error('Error loading team plan:', error);
        toast({
          title: "Error Loading Plan",
          description: "Could not load the team plan. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (userAccount) {
      loadTeamPlan();
    }
  }, [userAccount, firestore, user, toast]);

  async function handleSavePlan() {
    if (!userAccount?.teamId || !canEdit || !teamPlan) return;

    setIsSaving(true);
    try {
      const planRef = doc(firestore, 'teams', userAccount.teamId, 'mainPlan', 'current');
      await setDoc(planRef, {
        ...teamPlan,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.uid,
      });

      toast({
        title: "Plan Saved",
        description: "The team workout plan has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error Saving Plan",
        description: "Could not save the team plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleUpdateWorkout(weekIndex: number, dayIndex: number, workout: any) {
    if (!canEdit) return;

    setTeamPlan((prev: any) => {
      const updated = { ...prev };
      updated.weeks[weekIndex].days[dayIndex].workout = workout;
      return updated;
    });
  }

  function handleImportWorkout(workout: any) {
    if (!teamPlan || !canEdit) return;

    // Find the first available rest day to place the workout
    let placed = false;
    const updated = { ...teamPlan };

    for (let weekIdx = 0; weekIdx < updated.weeks.length && !placed; weekIdx++) {
      for (let dayIdx = 0; dayIdx < updated.weeks[weekIdx].days.length && !placed; dayIdx++) {
        if (!updated.weeks[weekIdx].days[dayIdx].workout) {
          updated.weeks[weekIdx].days[dayIdx].workout = workout;
          placed = true;

          setTeamPlan(updated);
          toast({
            title: "Workout Imported",
            description: `${workout.name} added to Week ${weekIdx + 1}, ${updated.weeks[weekIdx].days[dayIdx].dayOfWeek}.`,
          });
        }
      }
    }

    if (!placed) {
      toast({
        title: "Plan Full",
        description: "All days have workouts. Please remove a workout first or use copy/paste to replace one.",
        variant: "destructive",
      });
    }
  }

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
            Please log in to access the Plan Editor.
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
            Plan Editor
          </h1>
          <p className="text-muted-foreground mt-2">
            {canEdit
              ? "Create and edit your team's workout plan over 8 weeks"
              : "View your team's workout plan"
            }
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button
              onClick={() => setIsImportDialogOpen(true)}
              variant="outline"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Import from Smart Planner
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
      <Alert className={canEdit ? "border-green-500 bg-green-50" : "border-blue-500 bg-blue-50"}>
        <div className="flex items-center gap-2">
          {canEdit ? (
            <>
              <Pencil className="h-4 w-4" />
              <AlertDescription>
                <strong>Edit Mode:</strong> You can modify workouts for your team.
              </AlertDescription>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                <strong>View Mode:</strong> You can view the team plan but cannot make changes.
              </AlertDescription>
            </>
          )}
        </div>
      </Alert>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>8-Week Workout Calendar</CardTitle>
          <CardDescription>
            Click on any day to {canEdit ? 'add or edit' : 'view'} workouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamPlan ? (
            <PlanCalendarView
              plan={teamPlan}
              onUpdateWorkout={handleUpdateWorkout}
              canEdit={canEdit}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No plan data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Planner Import Dialog */}
      <SmartPlannerImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportWorkout}
        teamId={userAccount?.teamId || null}
      />
    </div>
  );
}
