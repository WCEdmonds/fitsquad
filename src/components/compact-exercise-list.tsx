'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Plus, ChevronDown, ChevronUp, Check, Timer, MoreVertical, X, Trash2, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { RestTimer } from '@/components/rest-timer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Capacitor } from '@capacitor/core';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  perceivedExertion?: string;
  description?: string;
  imageUrl?: string;
  gifUrl?: string;
  instructions?: string[];
}

interface Workout {
  name: string;
  focus: string;
  exercises: Exercise[];
}

interface CompactExerciseListProps {
  workout: Workout | null;
  dayOfWeek: string;
  weekNumber: number;
  onStartWorkout?: () => void;
  onFinishWorkout?: (stats: any) => void;
  onCancel?: () => void;
  onRemoveExercise?: (exerciseIndex: number) => void;
}

interface ExerciseSet {
  previous: string;
  weight: string;
  reps: string;
  rpe: string;
  completed: boolean;
}

interface ExerciseState {
  sets: ExerciseSet[];
  notes: string;
}

export function CompactExerciseList({
  workout,
  dayOfWeek,
  weekNumber,
  onStartWorkout,
  onFinishWorkout,
  onCancel,
  onRemoveExercise,
}: CompactExerciseListProps) {
  const [exerciseStates, setExerciseStates] = useState<Record<number, ExerciseState>>({});
  const [restTimerOpen, setRestTimerOpen] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(60);
  const [startTime] = useState<number>(Date.now());
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [swipingSet, setSwipingSet] = useState<{exerciseIndex: number, setIndex: number} | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);

  // Listen for keyboard show/hide on native
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const showListener = () => setIsKeyboardVisible(true);
    const hideListener = () => setIsKeyboardVisible(false);

    // Try to import Capacitor Keyboard plugin dynamically
    import('@capacitor/keyboard').then(({ Keyboard }) => {
      Keyboard.addListener('keyboardWillShow', showListener);
      Keyboard.addListener('keyboardWillHide', hideListener);
    }).catch(() => {
      // Keyboard plugin not available
    });

    return () => {
      import('@capacitor/keyboard').then(({ Keyboard }) => {
        Keyboard.removeAllListeners();
      }).catch(() => {});
    };
  }, []);

  const hideKeyboard = () => {
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/keyboard').then(({ Keyboard }) => {
        Keyboard.hide();
      }).catch(() => {
        // Fallback: blur active element
        (document.activeElement as HTMLElement)?.blur();
      });
    } else {
      (document.activeElement as HTMLElement)?.blur();
    }
    setIsKeyboardVisible(false);
  };

  // Parse reps - extract just the first number if it's a range
  const parseReps = (reps: string): string => {
    const match = reps.match(/(\d+)/);
    return match ? match[1] : reps;
  };

  // Initialize exercise state if not exists
  const getExerciseState = (index: number, exercise: Exercise): ExerciseState => {
    if (exerciseStates[index]) {
      return exerciseStates[index];
    }
    const setsCount = parseInt(exercise.sets) || 3;
    const repsValue = parseReps(exercise.reps || '10');
    return {
      sets: Array.from({ length: setsCount }, () => ({
        previous: '',
        weight: '',
        reps: repsValue,
        rpe: '',
        completed: false,
      })),
      notes: '',
    };
  };

  const updateExerciseState = (index: number, updates: Partial<ExerciseState>) => {
    setExerciseStates(prev => ({
      ...prev,
      [index]: { ...getExerciseState(index, workout!.exercises[index]), ...prev[index], ...updates },
    }));
  };

  const handleSetChange = (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: string | boolean) => {
    const currentState = getExerciseState(exerciseIndex, workout!.exercises[exerciseIndex]);
    const updatedSets = [...currentState.sets];
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value };
    updateExerciseState(exerciseIndex, { sets: updatedSets });
  };

  const handleToggleSet = (exerciseIndex: number, setIndex: number) => {
    haptics.light();
    const currentState = getExerciseState(exerciseIndex, workout!.exercises[exerciseIndex]);
    const isNowCompleted = !currentState.sets[setIndex].completed;
    
    handleSetChange(exerciseIndex, setIndex, 'completed', isNowCompleted);
    
    // Start rest timer when marking set as complete
    if (isNowCompleted) {
      const exercise = workout!.exercises[exerciseIndex];
      // Parse rest time from exercise (e.g., "60s", "90 sec", "2 min")
      const restMatch = exercise.rest?.match(/(\d+)/);
      const restSeconds = restMatch ? parseInt(restMatch[1]) : 60;
      setRestTimerDuration(restSeconds > 10 ? restSeconds : 60); // Default to 60 if too short
      setRestTimerOpen(true);
    }
  };

  const handleAddSet = (exerciseIndex: number) => {
    haptics.light();
    const currentState = getExerciseState(exerciseIndex, workout!.exercises[exerciseIndex]);
    const lastSet = currentState.sets[currentState.sets.length - 1];
    updateExerciseState(exerciseIndex, {
      sets: [...currentState.sets, {
        previous: '',
        weight: lastSet?.weight || '',
        reps: lastSet?.reps || '10',
        rpe: '',
        completed: false,
      }],
    });
  };

  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    haptics.medium();
    const currentState = getExerciseState(exerciseIndex, workout!.exercises[exerciseIndex]);
    if (currentState.sets.length <= 1) return; // Don't delete last set
    
    const updatedSets = currentState.sets.filter((_, i) => i !== setIndex);
    updateExerciseState(exerciseIndex, { sets: updatedSets });
    setSwipingSet(null);
    setSwipeOffset(0);
  };

  // Swipe gesture handlers
  const handleSwipeStart = (e: React.TouchEvent, exerciseIndex: number, setIndex: number) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipingSet({ exerciseIndex, setIndex });
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    if (!swipingSet) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    // Only allow left swipe (negative delta)
    setSwipeOffset(Math.min(0, delta));
  };

  const handleSwipeEnd = () => {
    if (!swipingSet) return;
    
    // If swiped more than 80px, delete the set
    if (swipeOffset < -80) {
      handleDeleteSet(swipingSet.exerciseIndex, swipingSet.setIndex);
    } else {
      setSwipeOffset(0);
      setSwipingSet(null);
    }
  };

  const handleFinish = () => {
    haptics.success();
    
    // Calculate stats
    let totalVolume = 0;
    let totalSets = 0;
    
    Object.values(exerciseStates).forEach(state => {
      state.sets.forEach(set => {
        if (set.completed) {
          totalSets++;
          const weight = parseInt(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          totalVolume += weight * reps;
        }
      });
    });

    const durationMs = Date.now() - startTime;
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    if (onFinishWorkout) {
      onFinishWorkout({
        duration: durationStr,
        volume: totalVolume,
        sets: totalSets,
        completedAt: new Date(),
        exercises: exerciseStates // Pass full state if needed for logging
      });
    }
  };

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Rest Day</h3>
        <p className="text-muted-foreground">
          No workout scheduled for {dayOfWeek}. Enjoy your recovery!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header Stats */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-secondary/10">
          <div className="flex items-center gap-2">
            {onCancel && (
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-destructive hover:bg-destructive/10 -ml-2">
                    Cancel
                </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isKeyboardVisible && (
              <Button variant="outline" size="sm" onClick={hideKeyboard} className="gap-1">
                <Keyboard className="h-4 w-4" />
                Done
              </Button>
            )}
            <Button size="sm" onClick={handleFinish} className="bg-primary text-primary-foreground">
              Finish
            </Button>
          </div>
        </div>

        {/* Exercise List */}
        {workout.exercises.map((exercise, exerciseIndex) => {
          const state = getExerciseState(exerciseIndex, exercise);
          const hasGifOrInstructions = exercise.gifUrl || exercise.imageUrl || (exercise.instructions && exercise.instructions.length > 0);
          
          return (
            <div key={exerciseIndex} className="border-b border-border/40">
              {/* Exercise Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Exercise name - tappable to show details */}
                <button 
                  className="flex-1 text-left"
                  onClick={() => hasGifOrInstructions && setSelectedExercise(exercise)}
                >
                  <div className="font-semibold text-primary flex items-center gap-1 capitalize">
                    {exercise.name}
                    {hasGifOrInstructions && (
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </button>
                
                {/* More options dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 text-muted-foreground hover:bg-muted rounded">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => onRemoveExercise?.(exerciseIndex)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove from today
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Notes placeholder */}
              <div className="px-4 pb-2">
                <input
                  type="text"
                  placeholder="Add notes here..."
                  className="w-full text-sm text-muted-foreground bg-transparent border-none outline-none"
                  value={state.notes}
                  onChange={(e) => updateExerciseState(exerciseIndex, { notes: e.target.value })}
                />
              </div>

              {/* Rest Timer indicator */}
              <div className="px-4 pb-2 flex items-center gap-2 text-sm text-primary">
                <Timer className="h-4 w-4" />
                <span>Rest Timer: {exercise.rest || '1min 0s'}</span>
              </div>

              {/* Set tracking table */}
              <div className="px-4 pb-3">
                {/* Table header */}
                <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-1 text-xs font-medium text-muted-foreground uppercase mb-2">
                  <div>Set</div>
                  <div>Previous</div>
                  <div className="text-center">Lbs</div>
                  <div className="text-center">Reps</div>
                  <div></div>
                </div>

                {/* Set rows */}
                {state.sets.map((set, setIndex) => {
                  const isSwipingThis = swipingSet?.exerciseIndex === exerciseIndex && swipingSet?.setIndex === setIndex;
                  const offset = isSwipingThis ? swipeOffset : 0;
                  
                  return (
                    <div key={setIndex} className="relative overflow-hidden">
                      {/* Delete background revealed on swipe */}
                      <div className="absolute inset-y-0 right-0 w-20 bg-destructive flex items-center justify-center">
                        <Trash2 className="h-5 w-5 text-destructive-foreground" />
                      </div>
                      
                      {/* Swipeable row */}
                      <div 
                        className={cn(
                          "grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-1 items-center py-1 bg-background relative transition-transform",
                          set.completed && "bg-primary/5"
                        )}
                        style={{ 
                          transform: `translateX(${offset}px)`,
                          transition: isSwipingThis ? 'none' : 'transform 0.2s ease-out'
                        }}
                        onTouchStart={(e) => handleSwipeStart(e, exerciseIndex, setIndex)}
                        onTouchMove={handleSwipeMove}
                        onTouchEnd={handleSwipeEnd}
                      >
                        <div className="font-semibold text-foreground">{setIndex + 1}</div>
                        <div className="text-sm text-muted-foreground">{set.previous || '-'}</div>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={set.weight}
                          onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)}
                          className="h-8 text-center text-sm px-1"
                          placeholder="-"
                        />
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={set.reps}
                          onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)}
                          className="h-8 text-center text-sm px-1"
                          placeholder="-"
                        />
                        <button
                          onClick={() => handleToggleSet(exerciseIndex, setIndex)}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            set.completed
                              ? "bg-primary text-primary-foreground"
                              : "border-2 border-muted-foreground/30 hover:border-primary"
                          )}
                        >
                          <Check className={cn(
                            "h-4 w-4",
                            !set.completed && "text-muted-foreground/30"
                          )} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Set button */}
                <button
                  onClick={() => handleAddSet(exerciseIndex)}
                  className="w-full mt-2 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Set
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exercise Details Sheet */}
      <Sheet open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="capitalize">{selectedExercise?.name}</SheetTitle>
          </SheetHeader>
          
          {selectedExercise && (
            <div className="space-y-4 pb-6">
              {(selectedExercise.gifUrl || selectedExercise.imageUrl) && (
                <img 
                  src={selectedExercise.gifUrl || selectedExercise.imageUrl}
                  alt={selectedExercise.name}
                  className="w-full max-w-sm mx-auto rounded-lg"
                />
              )}
              {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Instructions</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    {selectedExercise.instructions.map((instruction, idx) => (
                      <li key={idx} className="leading-relaxed">{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Rest Timer Modal */}
      <RestTimer
        isOpen={restTimerOpen}
        onClose={() => setRestTimerOpen(false)}
        defaultSeconds={restTimerDuration}
      />
    </>
  );
}
