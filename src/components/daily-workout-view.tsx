"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle2, Circle, Dumbbell, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  perceivedExertion?: string;
  description?: string;
  imageUrl?: string;
}

interface Workout {
  name: string;
  focus: string;
  exercises: Exercise[];
}

interface DailyWorkoutViewProps {
  plan: {
    weeks: Array<{
      weekNumber: number;
      days: Array<{
        dayOfWeek: string;
        workout: Workout | null;
      }>;
    }>;
    cycleStartDate?: string;
  };
  userId: string;
  teamId: string;
  onDateChange?: (date: Date) => void;
}

interface ExerciseLog {
  exerciseName: string;
  completedSets: number[];
  actualReps: string[];
  weights: string[]; // Changed from single weight to array of weights per set
  notes: string;
  completedAt: Date;
}

export function DailyWorkoutView({ plan, userId, teamId, onDateChange }: DailyWorkoutViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  // Notify parent of date changes
  useEffect(() => {
    if (onDateChange) {
      onDateChange(selectedDate);
    }
  }, [selectedDate, onDateChange]);

  // Get current day's workout
  const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

  // Calculate which week in the 8-week cycle we're in
  const getCurrentWeekInCycle = () => {
    if (!plan.cycleStartDate) {
      // Fallback to week of year if no cycle start date
      const startOfYear = new Date(selectedDate.getFullYear(), 0, 1);
      const weekOfYear = Math.floor((selectedDate.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weekOfYear % 8;
    }

    // Calculate based on cycle start date
    const cycleStart = new Date(plan.cycleStartDate);
    // Adjust to Monday of cycle start week
    const startMonday = new Date(cycleStart);
    startMonday.setDate(cycleStart.getDate() - cycleStart.getDay() + (cycleStart.getDay() === 0 ? -6 : 1));

    // Calculate days difference
    const diffTime = selectedDate.getTime() - startMonday.getTime();
    const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
    const weeksSinceStart = Math.floor(diffDays / 7);

    // Cycle through 8 weeks
    return Math.max(0, weeksSinceStart % 8);
  };

  const currentWeekInCycle = getCurrentWeekInCycle();

  const todaysWorkout = plan.weeks[currentWeekInCycle]?.days.find(
    day => day.dayOfWeek === dayOfWeek
  )?.workout || null;

  // Initialize exercise logs
  useEffect(() => {
    if (todaysWorkout) {
      const initialLogs: Record<string, ExerciseLog> = {};
      todaysWorkout.exercises.forEach((exercise) => {
        const setsCount = parseInt(exercise.sets) || 3;
        initialLogs[exercise.name] = {
          exerciseName: exercise.name,
          completedSets: [],
          actualReps: Array(setsCount).fill(''),
          weights: Array(setsCount).fill(''),
          notes: '',
          completedAt: new Date(),
        };
      });
      setExerciseLogs(initialLogs);
    }
  }, [todaysWorkout]);

  function handleToggleSet(exerciseName: string, setIndex: number) {
    setExerciseLogs(prev => {
      const log = prev[exerciseName];
      const completedSets = [...log.completedSets];
      const index = completedSets.indexOf(setIndex);

      if (index > -1) {
        completedSets.splice(index, 1);
      } else {
        completedSets.push(setIndex);
        completedSets.sort((a, b) => a - b);
      }

      return {
        ...prev,
        [exerciseName]: { ...log, completedSets },
      };
    });
  }

  function handleRepsChange(exerciseName: string, setIndex: number, value: string) {
    setExerciseLogs(prev => {
      const log = prev[exerciseName];
      const actualReps = [...log.actualReps];
      actualReps[setIndex] = value;

      return {
        ...prev,
        [exerciseName]: { ...log, actualReps },
      };
    });
  }

  function handleWeightChange(exerciseName: string, setIndex: number, value: string) {
    setExerciseLogs(prev => {
      const log = prev[exerciseName];
      const weights = [...log.weights];
      weights[setIndex] = value;

      return {
        ...prev,
        [exerciseName]: { ...log, weights },
      };
    });
  }

  function handleNotesChange(exerciseName: string, value: string) {
    setExerciseLogs(prev => ({
      ...prev,
      [exerciseName]: { ...prev[exerciseName], notes: value },
    }));
  }

  async function handleSaveWorkoutLog() {
    if (!todaysWorkout) return;

    setIsSaving(true);
    try {
      const workoutLog = {
        userId,
        teamId,
        workoutName: todaysWorkout.name,
        workoutFocus: todaysWorkout.focus,
        date: selectedDate.toISOString(),
        dayOfWeek,
        weekNumber: currentWeekInCycle + 1,
        exercises: Object.values(exerciseLogs).map(log => ({
          exerciseName: log.exerciseName,
          completedSets: log.completedSets.length,
          totalSets: log.actualReps.length,
          actualReps: log.actualReps.filter(r => r.trim() !== ''),
          weights: log.weights.filter(w => w.trim() !== ''),
          notes: log.notes,
        })),
        createdAt: serverTimestamp(),
      };

      const logsRef = collection(firestore, 'users', userId, 'workoutLogs');
      await addDoc(logsRef, workoutLog);

      toast({
        title: "Workout Logged!",
        description: `Your ${todaysWorkout.name} has been saved.`,
      });

      // Reset logs
      const initialLogs: Record<string, ExerciseLog> = {};
      todaysWorkout.exercises.forEach((exercise) => {
        const setsCount = parseInt(exercise.sets) || 3;
        initialLogs[exercise.name] = {
          exerciseName: exercise.name,
          completedSets: [],
          actualReps: Array(setsCount).fill(''),
          weights: Array(setsCount).fill(''),
          notes: '',
          completedAt: new Date(),
        };
      });
      setExerciseLogs(initialLogs);

    } catch (error: any) {
      console.error('Error saving workout log:', error);
      toast({
        title: "Error",
        description: "Failed to save workout log. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function changeDay(offset: number) {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  }

  const totalExercises = todaysWorkout?.exercises.length || 0;
  const completedExercises = Object.values(exerciseLogs).filter(
    log => log.completedSets.length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeDay(-1)}
              className="shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center flex-1 min-w-0">
              <div className="flex items-center gap-2 justify-center">
                <CalendarIcon className="h-5 w-5 shrink-0" />
                <h2 className="text-base md:text-xl font-bold">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Week {currentWeekInCycle + 1} of 8-week cycle
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => changeDay(1)}
              className="shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Workout Content */}
      {todaysWorkout ? (
        <>
          {/* Workout Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{todaysWorkout.name}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    <Badge variant="secondary" className="mr-2">{todaysWorkout.focus}</Badge>
                    {totalExercises} exercises
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Progress</div>
                  <div className="text-2xl font-bold">
                    {completedExercises}/{totalExercises}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Exercises */}
          <div className="space-y-4">
            {todaysWorkout.exercises.map((exercise, index) => {
              const log = exerciseLogs[exercise.name];
              const setsCount = parseInt(exercise.sets) || 3;
              const isCompleted = log?.completedSets.length === setsCount;

              return (
                <Card key={index} className={isCompleted ? 'border-green-500' : ''}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {/* Exercise Image */}
                      {exercise.imageUrl ? (
                        <div className="relative group">
                          <img
                            src={exercise.imageUrl}
                            alt={exercise.name}
                            className="w-20 h-20 rounded-md object-cover border flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            loading="lazy"
                            onClick={() => setExpandedImage(exercise.imageUrl!)}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <Maximize2 className="h-6 w-6 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-md border bg-muted flex items-center justify-center flex-shrink-0">
                          <Dumbbell className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Exercise Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-semibold">{exercise.name}</h3>
                            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{exercise.sets} sets × {exercise.reps} reps</span>
                              <span>Rest: {exercise.rest}</span>
                              {exercise.perceivedExertion && (
                                <span>RPE: {exercise.perceivedExertion}/10</span>
                              )}
                            </div>
                          </div>
                          {isCompleted && (
                            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        {exercise.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {exercise.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Set Tracking with Reps and Weight */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Sets</Label>
                      <div className="space-y-3">
                        {Array.from({ length: setsCount }).map((_, setIndex) => {
                          const isSetCompleted = log?.completedSets.includes(setIndex);
                          return (
                            <div key={setIndex} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <Checkbox
                                  id={`${exercise.name}-set-${setIndex}`}
                                  checked={isSetCompleted}
                                  onCheckedChange={() => handleToggleSet(exercise.name, setIndex)}
                                />
                                <Label
                                  htmlFor={`${exercise.name}-set-${setIndex}`}
                                  className="text-sm cursor-pointer font-medium"
                                >
                                  Set {setIndex + 1}
                                </Label>
                              </div>
                              <div className="flex items-center gap-2 flex-1">
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="text"
                                    placeholder="reps"
                                    value={log?.actualReps[setIndex] || ''}
                                    onChange={(e) => handleRepsChange(exercise.name, setIndex, e.target.value)}
                                    className="w-16 h-9 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground">reps</span>
                                </div>
                                <span className="text-muted-foreground">×</span>
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="text"
                                    placeholder="weight"
                                    value={log?.weights[setIndex] || ''}
                                    onChange={(e) => handleWeightChange(exercise.name, setIndex, e.target.value)}
                                    className="w-20 h-9 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground">lbs</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor={`${exercise.name}-notes`} className="text-sm">
                        Notes (optional)
                      </Label>
                      <Textarea
                        id={`${exercise.name}-notes`}
                        placeholder="How did it feel? Any modifications?"
                        value={log?.notes || ''}
                        onChange={(e) => handleNotesChange(exercise.name, e.target.value)}
                        className="mt-1 h-20"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4 pb-24 md:pb-4">
            <Button
              size="lg"
              onClick={handleSaveWorkoutLog}
              disabled={isSaving || completedExercises === 0}
              className="w-full sm:w-auto"
            >
              {isSaving ? "Saving..." : "Complete Workout & Save Log"}
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Rest Day</h3>
            <p className="text-muted-foreground text-center">
              No workout scheduled for {dayOfWeek}. Take this time to recover!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Image Expansion Dialog */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {expandedImage && (
            <img
              src={expandedImage}
              alt="Exercise demonstration"
              className="w-full h-full object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
