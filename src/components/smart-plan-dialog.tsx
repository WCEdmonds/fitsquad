"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlannerForm, type PlannerFormValues } from '@/components/planner-form';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useDoc, useCollection, getCollectionNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import {
  callGeneratePlan,
  type GenerateTailoredWorkoutPlanOutput,
} from '@/lib/cloudFunctions';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';

interface SmartPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (workouts: any[]) => void;
}

export function SmartPlanDialog({
  isOpen,
  onClose,
  onPlanGenerated,
}: SmartPlanDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GenerateTailoredWorkoutPlanOutput | null>(null);
  const [allSoldierData, setAllSoldierData] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount } = useDoc(userAccountRef);

  const teamMembersRef = useMemoFirebase(() => {
    if (!userAccount?.teamId) return null;
    return collection(firestore, 'teams', userAccount.teamId, 'members');
  }, [firestore, userAccount]);
  const { data: teamMembers } = useCollection(teamMembersRef);

  // Fetch soldier data for the team
  useEffect(() => {
    if (teamMembers && firestore) {
      const fetchData = async () => {
        const dataPromises = teamMembers.map(async (member) => {
          const soldierDataRef = collection(firestore, 'accounts', member.id, 'soldierData');
          const data = await getCollectionNonBlocking<any>(soldierDataRef);
          const latestData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          return latestData ? { ...latestData, memberEmail: member.email } : null;
        });
        const results = await Promise.all(dataPromises);
        setAllSoldierData(results.filter(r => r !== null));
      };
      fetchData();
    }
  }, [teamMembers, firestore]);

  async function handleFormSubmit(values: PlannerFormValues) {
    if (!user || !userAccount) return;

    let fitnessData;
    let isUnitPlan = false;
    let isIndividualPlan = false;

    if (userAccount.accountType === 'Soldier') {
      const soldierData = allSoldierData.find(s => s.accountId === user.uid);
      if (!soldierData) {
        toast({
          title: "No Fitness Data",
          description: "You must log your benchmark fitness data before generating a plan.",
          variant: "destructive",
        });
        return;
      }
      fitnessData = `Soldier: MDL score ${soldierData.mdl}, HRP score ${soldierData.hrp}, SDC score ${soldierData.sdc}, PLK score ${soldierData.plk}, 2MR score ${soldierData.twoMileRun}. Notes: ${soldierData.healthInfo}`;
      isIndividualPlan = true;
    } else {
      if (!allSoldierData || allSoldierData.length === 0) {
        toast({
          title: "No Soldier Data",
          description: "Cannot generate a plan without soldier fitness data in your unit.",
          variant: "destructive",
        });
        return;
      }
      fitnessData = allSoldierData.map(s => (
        `Soldier (${s.memberEmail}): MDL score ${s.mdl}, HRP score ${s.hrp}, SDC score ${s.sdc}, PLK score ${s.plk}, 2MR score ${s.twoMileRun}. Notes: ${s.healthInfo}`
      )).join('\n');
      isUnitPlan = true;
    }

    setIsGenerating(true);
    setGeneratedPlan(null);

    try {
      const result = await callGeneratePlan({
        fitnessData,
        trainingGoals: values.trainingGoals,
        additionalContext: values.additionalContext,
        days: values.days,
        equipmentAccess: values.equipmentAccess ?? undefined,
        isUnitPlan,
        isIndividualPlan,
      });

      setGeneratedPlan(result);

    } catch (error: any) {
      console.error('Workout plan generation failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate workout plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function getWorkoutsFromPlan(plan: GenerateTailoredWorkoutPlanOutput): any[] {
    const workouts: any[] = [];

    // Handle individual plan (for soldiers)
    if (plan.individual_plan && Array.isArray(plan.individual_plan)) {
      plan.individual_plan.forEach((dailyWorkout: any) => {
        if (dailyWorkout.main_workout && Array.isArray(dailyWorkout.main_workout)) {
          workouts.push({
            name: `${dailyWorkout.day} - ${dailyWorkout.focus}`,
            focus: dailyWorkout.focus,
            day: dailyWorkout.day,
            exercises: dailyWorkout.main_workout.map((ex: any) => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              perceivedExertion: ex.perceivedExertion,
              description: ex.description,
            })),
          });
        }
      });
    }

    // Handle strength focus plan (for units)
    if (plan.strength_focus_plan && Array.isArray(plan.strength_focus_plan)) {
      plan.strength_focus_plan.forEach((dailyWorkout: any) => {
        if (dailyWorkout.main_workout && Array.isArray(dailyWorkout.main_workout)) {
          workouts.push({
            name: `${dailyWorkout.day} - Strength Focus`,
            focus: 'Strength',
            day: dailyWorkout.day,
            exercises: dailyWorkout.main_workout.map((ex: any) => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              perceivedExertion: ex.perceivedExertion,
              description: ex.description,
            })),
          });
        }
      });
    }

    // Handle running focus plan (for units)
    if (plan.running_focus_plan && Array.isArray(plan.running_focus_plan)) {
      plan.running_focus_plan.forEach((dailyWorkout: any) => {
        if (dailyWorkout.main_workout && Array.isArray(dailyWorkout.main_workout)) {
          workouts.push({
            name: `${dailyWorkout.day} - Running Focus`,
            focus: 'Endurance',
            day: dailyWorkout.day,
            exercises: dailyWorkout.main_workout.map((ex: any) => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              perceivedExertion: ex.perceivedExertion,
              description: ex.description,
            })),
          });
        }
      });
    }

    return workouts;
  }

  function handleApplyToPlan() {
    if (!generatedPlan) return;

    const workouts = getWorkoutsFromPlan(generatedPlan);
    onPlanGenerated(workouts);

    toast({
      title: "Plan Applied",
      description: `${workouts.length} workout${workouts.length !== 1 ? 's' : ''} added to your calendar.`,
    });

    // Reset and close
    setGeneratedPlan(null);
    onClose();
  }

  function handleCloseDialog() {
    setGeneratedPlan(null);
    onClose();
  }

  const availableWorkouts = generatedPlan ? getWorkoutsFromPlan(generatedPlan) : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Plan Generator
          </DialogTitle>
          <DialogDescription>
            {!generatedPlan
              ? "AI-powered workout plans tailored to your team's fitness data and goals"
              : "Review and apply the generated workouts to your calendar"
            }
          </DialogDescription>
        </DialogHeader>

        {!generatedPlan ? (
          <div className="py-4">
            <PlannerForm
              onSubmit={handleFormSubmit}
              isLoading={isGenerating}
              accountType={userAccount?.accountType}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">{generatedPlan.title}</p>
                <p className="text-sm text-green-700">
                  Generated {availableWorkouts.length} workout{availableWorkouts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {availableWorkouts.map((workout, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{workout.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {workout.day}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{workout.focus}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {workout.exercises.slice(0, 3).map((exercise: any, exIdx: number) => (
                          <div key={exIdx} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <div className="flex-1">
                              <span className="font-medium">{exercise.name}</span>
                              <span className="text-muted-foreground ml-2">
                                {exercise.sets}x{exercise.reps}
                                {exercise.perceivedExertion && ` • RPE ${exercise.perceivedExertion}`}
                              </span>
                            </div>
                          </div>
                        ))}
                        {workout.exercises.length > 3 && (
                          <p className="text-xs text-muted-foreground italic">
                            +{workout.exercises.length - 3} more exercises...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleApplyToPlan}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply to Calendar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
