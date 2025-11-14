'use client';

import { GenerateTailoredWorkoutPlanOutput } from '@/ai/flows/generate-tailored-workout-plan';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Target, Activity, Dumbbell, Zap, User, BookPlus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState, useEffect } from 'react';
import { LogProgressDialog } from './log-progress-dialog';
import { Button } from './ui/button';
import { Capacitor } from '@capacitor/core';


interface DailyWorkoutDisplayProps {
    dailyWorkouts: NonNullable<GenerateTailoredWorkoutPlanOutput['strength_focus_plan' | 'individual_plan']>;
    workoutPlanId: string; // Assuming we can pass this down
}


const DailyWorkoutDisplay = ({ dailyWorkouts, workoutPlanId }: DailyWorkoutDisplayProps) => {
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<{ id: string; name: string } | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [openTooltip, setOpenTooltip] = useState<number | null>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const handleOpenLogDialog = (exercise: { id: string, name: string }) => {
    setSelectedExercise(exercise);
    setIsLogDialogOpen(true);
  };

  const handleTooltipToggle = (index: number) => {
    if (isNative) {
      setOpenTooltip(openTooltip === index ? null : index);
    }
  };
  
  if (!dailyWorkouts || dailyWorkouts.length === 0) {
    return <p className="text-muted-foreground">No workouts scheduled for this plan.</p>
  }
  
  return (
     <>
     {selectedExercise && (
        <LogProgressDialog
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          exercise={selectedExercise}
          workoutPlanId={workoutPlanId}
        />
     )}
     <div className="grid grid-cols-1 gap-4">
      {dailyWorkouts.map((dailyWorkout) => (
        <Card key={dailyWorkout.day}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{dailyWorkout.day}</span>
              <Badge variant="secondary">{dailyWorkout.focus}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">Warm-up</h4>
              <p className="text-sm text-muted-foreground">{dailyWorkout.warmup}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Main Workout</h4>
              <div className="overflow-x-auto -mx-3 px-3">
                <TooltipProvider>
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[140px]">Exercise</TableHead>
                        <TableHead className="w-16">Sets</TableHead>
                        <TableHead className="min-w-[100px]">Reps</TableHead>
                        <TableHead className="w-20">Rest</TableHead>
                        <TableHead className="text-right w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyWorkout.main_workout.map((exercise, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium min-w-[140px]">
                            <Tooltip open={isNative ? openTooltip === index : undefined}>
                              <TooltipTrigger asChild>
                                <span
                                  className="cursor-help underline decoration-dotted"
                                  onClick={() => handleTooltipToggle(index)}
                                >
                                  {exercise.name}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{exercise.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="w-16">{exercise.sets}</TableCell>
                          <TableCell className="min-w-[100px]">{exercise.reps}</TableCell>
                          <TableCell className="w-20">{exercise.rest}</TableCell>
                          <TableCell className="text-right w-24">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenLogDialog({id: `ex-${index}`, name: exercise.name})}>
                              <BookPlus className="mr-2 h-4 w-4" />
                              Log
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Cool-down</h4>
              <p className="text-sm text-muted-foreground">{dailyWorkout.cooldown}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    </>
  );
};


export function WorkoutCalendarView({ plan, planId }: { plan: GenerateTailoredWorkoutPlanOutput, planId: string }) {
  const isIndividualPlan = !!plan.individual_plan;

  useEffect(() => {
    console.log('📅 WorkoutCalendarView rendered with:', {
      planId,
      isIndividualPlan,
      hasCommonWeaknesses: !!plan.common_weaknesses,
      weaknessesCount: plan.common_weaknesses?.length,
      hasIndividualPlan: !!plan.individual_plan,
      individualPlanLength: plan.individual_plan?.length,
      hasStrengthPlan: !!plan.strength_focus_plan,
      strengthPlanLength: plan.strength_focus_plan?.length,
      hasRunningPlan: !!plan.running_focus_plan,
      runningPlanLength: plan.running_focus_plan?.length
    });
  }, [plan, planId]);

  return (
    <div className="space-y-6">

      <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2" /> {isIndividualPlan ? 'Personal Weaknesses' : 'Common Unit Weaknesses'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {plan.common_weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm">{weakness}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center"><Activity className="mr-2" /> Weekly Schedule</h2>
        
        {isIndividualPlan && plan.individual_plan ? (
            <DailyWorkoutDisplay dailyWorkouts={plan.individual_plan} workoutPlanId={planId}/>
        ) : (
            <Tabs defaultValue="strength">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="strength">
                    <Dumbbell className="mr-2" /> Strength Plan
                    </TabsTrigger>
                    <TabsTrigger value="running">
                    <Zap className="mr-2" /> Running Plan
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="strength" className="mt-4">
                    {plan.strength_focus_plan && <DailyWorkoutDisplay dailyWorkouts={plan.strength_focus_plan} workoutPlanId={planId} />}
                </TabsContent>
                <TabsContent value="running" className="mt-4">
                    {plan.running_focus_plan && <DailyWorkoutDisplay dailyWorkouts={plan.running_focus_plan} workoutPlanId={planId} />}
                </TabsContent>
            </Tabs>
        )}
      </div>
    </div>
  );
}
