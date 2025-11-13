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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dumbbell, Zap } from 'lucide-react';

interface SmartPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (workouts: any[]) => void;
}

// Pre-made workout templates
const WORKOUT_TEMPLATES = [
  {
    id: 'upper-lower',
    name: '4-Day Upper/Lower Split',
    description: 'Classic strength training split focusing on upper and lower body',
    workouts: [
      {
        name: 'Upper Body Strength',
        focus: 'Strength',
        day: 'Monday',
        exercises: [
          { name: 'Bench Press', sets: '4', reps: '6-8', rest: '2-3min', perceivedExertion: '8', description: 'Barbell bench press for chest and triceps' },
          { name: 'Bent Over Row', sets: '4', reps: '6-8', rest: '2-3min', perceivedExertion: '8', description: 'Barbell rows for back development' },
          { name: 'Overhead Press', sets: '3', reps: '8-10', rest: '90s', perceivedExertion: '7', description: 'Standing overhead press' },
          { name: 'Pull-ups', sets: '3', reps: '8-12', rest: '90s', perceivedExertion: '7', description: 'Pull-ups or lat pulldowns' },
          { name: 'Dumbbell Curls', sets: '3', reps: '10-12', rest: '60s', perceivedExertion: '6', description: 'Bicep curls' },
        ],
      },
      {
        name: 'Lower Body Strength',
        focus: 'Strength',
        day: 'Tuesday',
        exercises: [
          { name: 'Back Squat', sets: '4', reps: '6-8', rest: '2-3min', perceivedExertion: '8', description: 'Barbell back squat' },
          { name: 'Romanian Deadlift', sets: '4', reps: '8-10', rest: '2min', perceivedExertion: '7', description: 'RDL for hamstrings' },
          { name: 'Bulgarian Split Squat', sets: '3', reps: '10-12', rest: '90s', perceivedExertion: '7', description: 'Single leg work' },
          { name: 'Leg Press', sets: '3', reps: '12-15', rest: '90s', perceivedExertion: '6', description: 'Leg press machine' },
          { name: 'Calf Raises', sets: '4', reps: '15-20', rest: '60s', perceivedExertion: '6', description: 'Standing or seated calf raises' },
        ],
      },
      {
        name: 'Upper Body Hypertrophy',
        focus: 'Hypertrophy',
        day: 'Thursday',
        exercises: [
          { name: 'Incline Dumbbell Press', sets: '4', reps: '10-12', rest: '90s', perceivedExertion: '7', description: 'Incline bench press' },
          { name: 'Cable Row', sets: '4', reps: '10-12', rest: '90s', perceivedExertion: '7', description: 'Seated cable rows' },
          { name: 'Lateral Raises', sets: '3', reps: '12-15', rest: '60s', perceivedExertion: '6', description: 'Shoulder lateral raises' },
          { name: 'Face Pulls', sets: '3', reps: '15-20', rest: '60s', perceivedExertion: '6', description: 'Cable face pulls' },
          { name: 'Tricep Pushdowns', sets: '3', reps: '12-15', rest: '60s', perceivedExertion: '6', description: 'Cable tricep extensions' },
        ],
      },
      {
        name: 'Lower Body Hypertrophy',
        focus: 'Hypertrophy',
        day: 'Friday',
        exercises: [
          { name: 'Front Squat', sets: '4', reps: '10-12', rest: '2min', perceivedExertion: '7', description: 'Front squats' },
          { name: 'Leg Curl', sets: '4', reps: '12-15', rest: '90s', perceivedExertion: '6', description: 'Lying or seated leg curls' },
          { name: 'Walking Lunges', sets: '3', reps: '12-15', rest: '90s', perceivedExertion: '7', description: 'Walking lunges' },
          { name: 'Leg Extension', sets: '3', reps: '15-20', rest: '60s', perceivedExertion: '6', description: 'Leg extension machine' },
          { name: 'Glute Bridges', sets: '3', reps: '15-20', rest: '60s', perceivedExertion: '6', description: 'Barbell or bodyweight glute bridges' },
        ],
      },
    ],
  },
  {
    id: 'push-pull-legs',
    name: '3-Day Push/Pull/Legs',
    description: 'Efficient split for training 3 days per week',
    workouts: [
      {
        name: 'Push Day',
        focus: 'Strength',
        day: 'Monday',
        exercises: [
          { name: 'Bench Press', sets: '4', reps: '6-8', rest: '2-3min', perceivedExertion: '8', description: 'Flat barbell bench press' },
          { name: 'Overhead Press', sets: '4', reps: '8-10', rest: '2min', perceivedExertion: '7', description: 'Standing military press' },
          { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', rest: '90s', perceivedExertion: '7', description: 'Incline press' },
          { name: 'Tricep Dips', sets: '3', reps: '10-12', rest: '90s', perceivedExertion: '7', description: 'Parallel bar dips' },
          { name: 'Lateral Raises', sets: '3', reps: '12-15', rest: '60s', perceivedExertion: '6', description: 'Dumbbell lateral raises' },
        ],
      },
      {
        name: 'Pull Day',
        focus: 'Strength',
        day: 'Wednesday',
        exercises: [
          { name: 'Deadlift', sets: '4', reps: '5-6', rest: '3min', perceivedExertion: '9', description: 'Conventional deadlift' },
          { name: 'Pull-ups', sets: '4', reps: '8-12', rest: '2min', perceivedExertion: '7', description: 'Wide grip pull-ups' },
          { name: 'Barbell Row', sets: '4', reps: '8-10', rest: '2min', perceivedExertion: '7', description: 'Bent over barbell rows' },
          { name: 'Face Pulls', sets: '3', reps: '15-20', rest: '60s', perceivedExertion: '6', description: 'Rear delt work' },
          { name: 'Barbell Curl', sets: '3', reps: '10-12', rest: '60s', perceivedExertion: '6', description: 'Standing barbell curls' },
        ],
      },
      {
        name: 'Leg Day',
        focus: 'Strength',
        day: 'Friday',
        exercises: [
          { name: 'Back Squat', sets: '4', reps: '6-8', rest: '3min', perceivedExertion: '8', description: 'Barbell back squat' },
          { name: 'Romanian Deadlift', sets: '4', reps: '8-10', rest: '2min', perceivedExertion: '7', description: 'RDL for hamstrings' },
          { name: 'Leg Press', sets: '3', reps: '12-15', rest: '90s', perceivedExertion: '7', description: 'Leg press' },
          { name: 'Leg Curl', sets: '3', reps: '12-15', rest: '90s', perceivedExertion: '6', description: 'Hamstring curls' },
          { name: 'Calf Raises', sets: '4', reps: '15-20', rest: '60s', perceivedExertion: '6', description: 'Calf raises' },
        ],
      },
    ],
  },
  {
    id: 'full-body',
    name: '3-Day Full Body',
    description: 'Full body workouts for maximizing frequency',
    workouts: [
      {
        name: 'Full Body A',
        focus: 'Strength',
        day: 'Monday',
        exercises: [
          { name: 'Back Squat', sets: '4', reps: '6-8', rest: '3min', perceivedExertion: '8', description: 'Barbell back squat' },
          { name: 'Bench Press', sets: '4', reps: '6-8', rest: '2-3min', perceivedExertion: '8', description: 'Flat bench press' },
          { name: 'Bent Over Row', sets: '3', reps: '8-10', rest: '2min', perceivedExertion: '7', description: 'Barbell rows' },
          { name: 'Overhead Press', sets: '3', reps: '8-10', rest: '90s', perceivedExertion: '7', description: 'Military press' },
          { name: 'Plank', sets: '3', reps: '60s', rest: '60s', perceivedExertion: '6', description: 'Core stability' },
        ],
      },
      {
        name: 'Full Body B',
        focus: 'Strength',
        day: 'Wednesday',
        exercises: [
          { name: 'Deadlift', sets: '4', reps: '5-6', rest: '3min', perceivedExertion: '9', description: 'Conventional deadlift' },
          { name: 'Overhead Press', sets: '4', reps: '6-8', rest: '2min', perceivedExertion: '7', description: 'Standing press' },
          { name: 'Pull-ups', sets: '3', reps: '8-12', rest: '2min', perceivedExertion: '7', description: 'Pull-ups' },
          { name: 'Bulgarian Split Squat', sets: '3', reps: '10-12', rest: '90s', perceivedExertion: '7', description: 'Single leg work' },
          { name: 'Face Pulls', sets: '3', reps: '15-20', rest: '60s', perceivedExertion: '6', description: 'Rear delts' },
        ],
      },
      {
        name: 'Full Body C',
        focus: 'Strength',
        day: 'Friday',
        exercises: [
          { name: 'Front Squat', sets: '4', reps: '8-10', rest: '2min', perceivedExertion: '7', description: 'Front squats' },
          { name: 'Incline Dumbbell Press', sets: '4', reps: '8-10', rest: '2min', perceivedExertion: '7', description: 'Incline press' },
          { name: 'Romanian Deadlift', sets: '3', reps: '10-12', rest: '2min', perceivedExertion: '7', description: 'RDL' },
          { name: 'Cable Row', sets: '3', reps: '10-12', rest: '90s', perceivedExertion: '6', description: 'Seated rows' },
          { name: 'Hanging Leg Raises', sets: '3', reps: '12-15', rest: '60s', perceivedExertion: '6', description: 'Core work' },
        ],
      },
    ],
  },
];

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

  const handleApplyTemplate = (template: typeof WORKOUT_TEMPLATES[0]) => {
    onPlanGenerated(template.workouts);

    toast({
      title: "Template Applied",
      description: `${template.workouts.length} workout${template.workouts.length !== 1 ? 's' : ''} from "${template.name}" added to your calendar.`,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Plan Generator
          </DialogTitle>
          <DialogDescription>
            Choose from pre-made templates or generate a custom AI-powered plan
          </DialogDescription>
        </DialogHeader>

        {!generatedPlan ? (
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Generate
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {WORKOUT_TEMPLATES.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">{template.workouts.length} workouts</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          {template.workouts.slice(0, 3).map((workout, idx) => (
                            <div key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <div className="flex-1">
                                <span className="font-medium">{workout.name}</span>
                                <span className="text-muted-foreground ml-2">
                                  ({workout.exercises.length} exercises)
                                </span>
                              </div>
                            </div>
                          ))}
                          {template.workouts.length > 3 && (
                            <p className="text-xs text-muted-foreground italic">
                              +{template.workouts.length - 3} more workouts...
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleApplyTemplate(template)}
                          className="w-full"
                          size="sm"
                        >
                          Use This Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* AI Generation Tab */}
            <TabsContent value="ai" className="mt-4">
              <div className="py-4">
                <PlannerForm
                  onSubmit={handleFormSubmit}
                  isLoading={isGenerating}
                  accountType={userAccount?.accountType}
                />
              </div>
            </TabsContent>
          </Tabs>
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
