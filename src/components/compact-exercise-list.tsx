'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Plus, ChevronDown, ChevronUp, Check, Timer, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { RestTimer } from '@/components/rest-timer';

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
  expanded: boolean;
}

export function CompactExerciseList({
  workout,
  dayOfWeek,
  weekNumber,
  onStartWorkout,
  onFinishWorkout,
}: CompactExerciseListProps) {
  const [exerciseStates, setExerciseStates] = useState<Record<number, ExerciseState>>({});
  const [restTimerOpen, setRestTimerOpen] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(60);
  const [startTime] = useState<number>(Date.now());

  // Initialize exercise state if not exists
  const getExerciseState = (index: number, exercise: Exercise): ExerciseState => {
    if (exerciseStates[index]) {
      return exerciseStates[index];
    }
    const setsCount = parseInt(exercise.sets) || 3;
    const repsValue = exercise.reps || '10';
    return {
      sets: Array.from({ length: setsCount }, () => ({
        previous: '',
        weight: '',
        reps: repsValue,
        rpe: '',
        completed: false,
      })),
      notes: '',
      expanded: false,
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

  const toggleExpanded = (exerciseIndex: number) => {
    haptics.light();
    const currentState = getExerciseState(exerciseIndex, workout!.exercises[exerciseIndex]);
    updateExerciseState(exerciseIndex, { expanded: !currentState.expanded });
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
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header Stats */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Duration</span>
              <div className="font-semibold text-primary">--</div> 
            </div>
            <div>
              <span className="text-muted-foreground">Volume</span>
              <div className="font-semibold">--</div>
            </div>
            <div>
              <span className="text-muted-foreground">Sets</span>
              <div className="font-semibold">--</div>
            </div>
          </div>
          <Button size="sm" onClick={handleFinish} className="bg-primary text-primary-foreground">
            Finish
          </Button>
        </div>

        {/* Exercise List */}
        {workout.exercises.map((exercise, exerciseIndex) => {
          const state = getExerciseState(exerciseIndex, exercise);
          const hasGifOrInstructions = exercise.gifUrl || exercise.imageUrl || (exercise.instructions && exercise.instructions.length > 0);
          
          return (
            <div key={exerciseIndex} className="border-b border-border/40">
              {/* Exercise Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Thumbnail or placeholder */}
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {(exercise.gifUrl || exercise.imageUrl) ? (
                    <img 
                      src={exercise.gifUrl || exercise.imageUrl} 
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground text-xs">🏋️</div>
                  )}
                </div>
                
                {/* Exercise name - tappable to expand */}
                <button 
                  className="flex-1 text-left"
                  onClick={() => hasGifOrInstructions && toggleExpanded(exerciseIndex)}
                >
                  <div className="font-semibold text-primary flex items-center gap-1 capitalize">
                    {exercise.name}
                    {hasGifOrInstructions && (
                      state.expanded ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>
                
                {/* More options */}
                <button className="p-1 text-muted-foreground">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Expanded gif/instructions */}
              {state.expanded && hasGifOrInstructions && (
                <div className="px-4 pb-3 space-y-3">
                  {(exercise.gifUrl || exercise.imageUrl) && (
                    <img 
                      src={exercise.gifUrl || exercise.imageUrl}
                      alt={exercise.name}
                      className="w-full max-w-xs mx-auto rounded-lg"
                    />
                  )}
                  {exercise.instructions && exercise.instructions.length > 0 && (
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {exercise.instructions.map((instruction, idx) => (
                        <li key={idx} className="leading-relaxed">{instruction}</li>
                      ))}
                    </ol>
                  )}
                </div>
              )}

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
                <div className="grid grid-cols-[40px_1fr_1fr_1fr_50px_40px] gap-1 text-xs font-medium text-muted-foreground uppercase mb-2">
                  <div>Set</div>
                  <div>Previous</div>
                  <div className="text-center">Lbs</div>
                  <div className="text-center">Reps</div>
                  <div className="text-center">RPE</div>
                  <div></div>
                </div>

                {/* Set rows */}
                {state.sets.map((set, setIndex) => (
                  <div 
                    key={setIndex} 
                    className={cn(
                      "grid grid-cols-[40px_1fr_1fr_1fr_50px_40px] gap-1 items-center py-1",
                      set.completed && "bg-primary/5 -mx-4 px-4 rounded"
                    )}
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
                    <button className="h-8 px-2 text-xs border rounded text-muted-foreground hover:bg-muted">
                      RPE
                    </button>
                    <button
                      onClick={() => handleToggleSet(exerciseIndex, setIndex)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        set.completed
                          ? "bg-primary text-primary-foreground"
                          : "border-2 border-muted-foreground/30 hover:border-primary"
                      )}
                    >
                      {set.completed && <Check className="h-4 w-4" />}
                    </button>
                  </div>
                ))}

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

      {/* Rest Timer Modal */}
      <RestTimer
        isOpen={restTimerOpen}
        onClose={() => setRestTimerOpen(false)}
        defaultSeconds={restTimerDuration}
      />
    </>
  );
}
