"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Calendar } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';

interface SmartPlannerImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (workout: any) => void;
  teamId: string | null;
}

export function SmartPlannerImportDialog({
  isOpen,
  onClose,
  onImport,
  teamId,
}: SmartPlannerImportDialogProps) {
  const firestore = useFirestore();
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedWorkouts, setSelectedWorkouts] = useState<any[]>([]);

  const savedPlansRef = useMemoFirebase(() => {
    if (!teamId) return null;
    return collection(firestore, 'teams', teamId, 'workoutPlans');
  }, [firestore, teamId]);

  const { data: savedPlans, isLoading } = useCollection(savedPlansRef);

  function handleSelectPlan(plan: any) {
    try {
      const parsedPlan = JSON.parse(plan.planData);
      setSelectedPlan({ ...plan, parsed: parsedPlan });
      setSelectedWorkouts([]);
    } catch (error) {
      console.error('Error parsing plan:', error);
    }
  }

  function getWorkoutsFromPlan(parsedPlan: any): any[] {
    const workouts: any[] = [];

    // Handle individual plan (for soldiers)
    if (parsedPlan.individual_plan && Array.isArray(parsedPlan.individual_plan)) {
      parsedPlan.individual_plan.forEach((dailyWorkout: any) => {
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
              description: ex.description,
            })),
          });
        }
      });
    }

    // Handle strength focus plan (for units)
    if (parsedPlan.strength_focus_plan && Array.isArray(parsedPlan.strength_focus_plan)) {
      parsedPlan.strength_focus_plan.forEach((dailyWorkout: any) => {
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
              description: ex.description,
            })),
          });
        }
      });
    }

    // Handle running focus plan (for units)
    if (parsedPlan.running_focus_plan && Array.isArray(parsedPlan.running_focus_plan)) {
      parsedPlan.running_focus_plan.forEach((dailyWorkout: any) => {
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
              description: ex.description,
            })),
          });
        }
      });
    }

    return workouts;
  }

  function handleToggleWorkout(workout: any) {
    setSelectedWorkouts((prev) => {
      const exists = prev.find((w) => w.name === workout.name);
      if (exists) {
        return prev.filter((w) => w.name !== workout.name);
      } else {
        return [...prev, workout];
      }
    });
  }

  function handleImportSelected() {
    selectedWorkouts.forEach((workout) => {
      onImport(workout);
    });
    setSelectedWorkouts([]);
    setSelectedPlan(null);
    onClose();
  }

  const availableWorkouts = selectedPlan ? getWorkoutsFromPlan(selectedPlan.parsed) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import from Smart Planner</DialogTitle>
          <DialogDescription>
            Select a saved plan and choose workouts to import into your Plan Editor
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Saved Plans List */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Saved Plans</h3>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : savedPlans && savedPlans.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {savedPlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer transition-colors ${
                        selectedPlan?.id === plan.id ? 'border-primary bg-accent' : ''
                      }`}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">{plan.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {plan.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Calendar className="h-12 w-12 mb-2" />
                <p className="text-sm">No saved plans found</p>
                <p className="text-xs">Create plans in Smart Planner first</p>
              </div>
            )}
          </div>

          {/* Right: Workout Selection */}
          <div>
            <h3 className="text-sm font-semibold mb-2">
              Available Workouts {selectedWorkouts.length > 0 && `(${selectedWorkouts.length} selected)`}
            </h3>
            {selectedPlan ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {availableWorkouts.map((workout, idx) => {
                    const isSelected = selectedWorkouts.find((w) => w.name === workout.name);
                    return (
                      <Card
                        key={idx}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-accent' : ''
                        }`}
                        onClick={() => handleToggleWorkout(workout)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{workout.name}</div>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {workout.focus}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {workout.exercises.length} exercises
                                </Badge>
                              </div>
                            </div>
                            {isSelected && (
                              <Badge className="ml-2">Selected</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground text-sm">
                Select a plan to view workouts
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImportSelected}
            disabled={selectedWorkouts.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Import {selectedWorkouts.length > 0 && `(${selectedWorkouts.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
