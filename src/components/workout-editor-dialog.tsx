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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Minus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExerciseBrowser } from '@/components/exercise-browser';
import { ExerciseWorkoutBuilder } from '@/components/exercise-workout-builder';
import type { Exercise as ExerciseDBExercise } from '@/lib/exercisedb';

// Workout template library
const WORKOUT_TEMPLATES = [
  {
    id: 'upper-body-strength',
    name: 'Upper Body Strength',
    focus: 'Strength',
    description: 'Build upper body strength and muscle',
    exercises: [
      { name: 'Push-ups', sets: '4', reps: '12-15', rest: '60s', perceivedExertion: '7', description: 'Standard push-ups with proper form' },
      { name: 'Pull-ups', sets: '4', reps: '8-10', rest: '90s', perceivedExertion: '8', description: 'Wide grip pull-ups' },
      { name: 'Dumbbell Bench Press', sets: '4', reps: '10-12', rest: '60s', perceivedExertion: '8', description: 'Flat bench press' },
      { name: 'Bent-over Rows', sets: '4', reps: '10-12', rest: '60s', perceivedExertion: '7', description: 'Barbell or dumbbell rows' },
      { name: 'Overhead Press', sets: '3', reps: '10-12', rest: '60s', perceivedExertion: '7', description: 'Standing or seated' },
    ],
  },
  {
    id: 'lower-body-strength',
    name: 'Lower Body Strength',
    focus: 'Strength',
    description: 'Strengthen legs and core',
    exercises: [
      { name: 'Squats', sets: '4', reps: '12-15', rest: '90s', perceivedExertion: '8', description: 'Back squats with proper depth' },
      { name: 'Deadlifts', sets: '4', reps: '8-10', rest: '120s', perceivedExertion: '9', description: 'Conventional or sumo deadlifts' },
      { name: 'Lunges', sets: '3', reps: '12 each leg', rest: '60s', perceivedExertion: '7', description: 'Walking or stationary lunges' },
      { name: 'Leg Press', sets: '4', reps: '12-15', rest: '60s', perceivedExertion: '7', description: 'Machine leg press' },
      { name: 'Calf Raises', sets: '3', reps: '15-20', rest: '45s', perceivedExertion: '6', description: 'Standing calf raises' },
    ],
  },
  {
    id: 'cardio-endurance',
    name: 'Cardio Endurance',
    focus: 'Endurance',
    description: 'Improve cardiovascular fitness',
    exercises: [
      { name: 'Running', sets: '1', reps: '30 min', rest: 'N/A', perceivedExertion: '6', description: 'Steady-state run at moderate pace' },
      { name: 'Burpees', sets: '5', reps: '10', rest: '60s', perceivedExertion: '8', description: 'Full burpees with jump' },
      { name: 'Mountain Climbers', sets: '4', reps: '30s', rest: '30s', perceivedExertion: '7', description: 'Fast-paced mountain climbers' },
      { name: 'Jump Rope', sets: '4', reps: '2 min', rest: '60s', perceivedExertion: '7', description: 'Continuous jump rope' },
      { name: 'High Knees', sets: '4', reps: '45s', rest: '45s', perceivedExertion: '7', description: 'Running in place with high knees' },
    ],
  },
  {
    id: 'hiit',
    name: 'HIIT Circuit',
    focus: 'HIIT',
    description: 'High-intensity interval training',
    exercises: [
      { name: 'Sprint Intervals', sets: '8', reps: '30s sprint / 30s rest', rest: 'As noted', perceivedExertion: '9', description: 'Max effort sprints' },
      { name: 'Box Jumps', sets: '4', reps: '10', rest: '60s', perceivedExertion: '8', description: 'Jump onto sturdy box or platform' },
      { name: 'Kettlebell Swings', sets: '4', reps: '15', rest: '45s', perceivedExertion: '8', description: 'Hip-hinge kettlebell swings' },
      { name: 'Battle Ropes', sets: '4', reps: '30s', rest: '45s', perceivedExertion: '8', description: 'Alternating wave pattern' },
      { name: 'Sled Push', sets: '4', reps: '30m', rest: '90s', perceivedExertion: '9', description: 'Heavy sled push' },
    ],
  },
  {
    id: 'core-conditioning',
    name: 'Core Conditioning',
    focus: 'Core',
    description: 'Build core strength and stability',
    exercises: [
      { name: 'Plank', sets: '3', reps: '60s', rest: '45s', perceivedExertion: '6', description: 'Forearm plank with straight body' },
      { name: 'Russian Twists', sets: '3', reps: '20 each side', rest: '45s', perceivedExertion: '6', description: 'Seated twists with weight' },
      { name: 'Bicycle Crunches', sets: '3', reps: '20 each side', rest: '30s', perceivedExertion: '6', description: 'Alternating knee to elbow' },
      { name: 'Dead Bug', sets: '3', reps: '12 each side', rest: '45s', perceivedExertion: '5', description: 'Controlled opposite limb movements' },
      { name: 'Hanging Leg Raises', sets: '3', reps: '10-12', rest: '60s', perceivedExertion: '7', description: 'Hang from bar, raise legs' },
    ],
  },
  {
    id: 'recovery-mobility',
    name: 'Recovery & Mobility',
    focus: 'Recovery',
    description: 'Active recovery and flexibility work',
    exercises: [
      { name: 'Yoga Flow', sets: '1', reps: '20 min', rest: 'N/A', perceivedExertion: '3', description: 'Light yoga sequence' },
      { name: 'Foam Rolling', sets: '1', reps: '10 min', rest: 'N/A', perceivedExertion: '4', description: 'Full body foam rolling' },
      { name: 'Dynamic Stretching', sets: '1', reps: '10 min', rest: 'N/A', perceivedExertion: '3', description: 'Active stretches' },
      { name: 'Walking', sets: '1', reps: '30 min', rest: 'N/A', perceivedExertion: '2', description: 'Easy-paced walk' },
      { name: 'Static Stretching', sets: '1', reps: '15 min', rest: 'N/A', perceivedExertion: '2', description: 'Hold stretches 30-60s' },
    ],
  },
  {
    id: 'acft-prep',
    name: 'ACFT Preparation',
    focus: 'ACFT',
    description: 'Army Combat Fitness Test specific training',
    exercises: [
      { name: 'Trap Bar Deadlift', sets: '4', reps: '5', rest: '120s', perceivedExertion: '9', description: 'MDL event preparation' },
      { name: 'Hand-Release Push-ups', sets: '4', reps: '15-20', rest: '60s', perceivedExertion: '7', description: 'HRP event practice' },
      { name: 'Sprint-Drag-Carry Simulation', sets: '3', reps: '1 full round', rest: '180s', perceivedExertion: '9', description: 'Practice SDC components' },
      { name: 'Plank Hold', sets: '3', reps: 'Max time', rest: '90s', perceivedExertion: '7', description: 'PLK event training' },
      { name: '2-Mile Run', sets: '1', reps: '1 run', rest: 'N/A', perceivedExertion: '8', description: '2MR at race pace' },
    ],
  },
  {
    id: 'running-cardio',
    name: 'Running & Cardio',
    focus: 'Cardio',
    description: 'Running-focused cardiovascular training',
    exercises: [
      { name: '4x400m Sprints', sets: '4', reps: '400m', rest: '90-120s', perceivedExertion: '8', description: 'Sprint 400m, rest, repeat' },
      { name: 'Long Run', sets: '1', reps: '5-8 miles', rest: 'N/A', perceivedExertion: '6', description: 'Steady-state endurance run' },
      { name: 'Interval Running', sets: '6', reps: '2 min fast / 1 min jog', rest: 'As noted', perceivedExertion: '8', description: 'Alternating pace intervals' },
      { name: 'Hill Sprints', sets: '8', reps: '30s uphill', rest: '90s', perceivedExertion: '9', description: 'Max effort uphill sprints' },
      { name: 'Tempo Run', sets: '1', reps: '20-30 min', rest: 'N/A', perceivedExertion: '7', description: 'Comfortably hard pace' },
    ],
  },
  {
    id: 'bike-cardio',
    name: 'Cycling Cardio',
    focus: 'Cardio',
    description: 'Bicycle-based cardio workout',
    exercises: [
      { name: 'Stationary Bike HIIT', sets: '10', reps: '30s sprint / 30s easy', rest: 'As noted', perceivedExertion: '8', description: 'High intensity intervals on bike' },
      { name: 'Long Ride', sets: '1', reps: '45-60 min', rest: 'N/A', perceivedExertion: '5', description: 'Steady moderate pace cycling' },
      { name: 'Bike Tabata', sets: '8', reps: '20s max / 10s rest', rest: 'As noted', perceivedExertion: '9', description: 'Maximum effort intervals' },
      { name: 'Hill Climbs (Bike)', sets: '5', reps: '3 min climb', rest: '2 min', perceivedExertion: '8', description: 'Resistance/incline intervals' },
      { name: 'Recovery Ride', sets: '1', reps: '30 min', rest: 'N/A', perceivedExertion: '3', description: 'Easy spin for active recovery' },
    ],
  },
  {
    id: 'mixed-cardio',
    name: 'Mixed Cardio',
    focus: 'Cardio',
    description: 'Variety of cardio exercises',
    exercises: [
      { name: 'Rowing Intervals', sets: '5', reps: '500m', rest: '90s', perceivedExertion: '8', description: 'Row 500m at hard pace' },
      { name: 'Assault Bike', sets: '6', reps: '1 min', rest: '60s', perceivedExertion: '9', description: 'Max effort on assault bike' },
      { name: 'Jump Rope', sets: '5', reps: '3 min', rest: '60s', perceivedExertion: '7', description: 'Continuous jump rope' },
      { name: 'Stair Climber', sets: '1', reps: '20 min', rest: 'N/A', perceivedExertion: '6', description: 'Steady pace on stair machine' },
      { name: 'Swimming', sets: '1', reps: '30 min', rest: 'N/A', perceivedExertion: '6', description: 'Continuous swimming laps' },
    ],
  },
];

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  perceivedExertion?: string; // RPE (Rate of Perceived Exertion) scale 1-10
  description?: string; // Optional, mainly for templates
}

interface Workout {
  name: string;
  focus: string;
  exercises: Exercise[];
}

interface WorkoutEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workout: Workout | null) => void;
  onDelete: () => void;
  workout: Workout | null;
  dayName: string;
  canEdit: boolean;
}

export function WorkoutEditorDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  workout,
  dayName,
  canEdit,
}: WorkoutEditorDialogProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library');
  const [customWorkout, setCustomWorkout] = useState<Workout>({
    name: '',
    focus: '',
    exercises: [],
  });

  useEffect(() => {
    if (workout) {
      setCustomWorkout(workout);
      setActiveTab('custom');
    } else {
      setCustomWorkout({
        name: '',
        focus: '',
        exercises: [],
      });
      setActiveTab('library');
    }
  }, [workout, isOpen]);

  function handleSelectTemplate(template: typeof WORKOUT_TEMPLATES[0]) {
    onSave({
      name: template.name,
      focus: template.focus,
      exercises: template.exercises,
    });
  }

  function handleAddExercise() {
    setCustomWorkout({
      ...customWorkout,
      exercises: [
        ...customWorkout.exercises,
        { name: '', sets: '', reps: '', rest: '', perceivedExertion: '' },
      ],
    });
  }

  function handleRemoveExercise(index: number) {
    setCustomWorkout({
      ...customWorkout,
      exercises: customWorkout.exercises.filter((_, i) => i !== index),
    });
  }

  function handleUpdateExercise(index: number, field: keyof Exercise, value: string) {
    const updated = [...customWorkout.exercises];
    updated[index] = { ...updated[index], [field]: value };
    setCustomWorkout({ ...customWorkout, exercises: updated });
  }

  function handleSaveCustom() {
    if (customWorkout.exercises.length === 0) {
      return;
    }
    // Auto-generate name if not provided
    const workoutToSave = {
      ...customWorkout,
      name: customWorkout.name || `${dayName} Workout`,
      focus: customWorkout.focus || 'Custom',
    };
    onSave(workoutToSave);
  }

  function handleSetRestDay() {
    onSave(null);
  }

  function handleSelectExerciseFromDB(exercise: ExerciseDBExercise) {
    // Convert ExerciseDB exercise to our exercise format
    const newExercise: Exercise = {
      name: exercise.name,
      sets: '3', // Default values - user can modify
      reps: '10',
      rest: '60s',
      perceivedExertion: '7', // Moderate intensity default
      description: exercise.instructions?.join('. ') || exercise.targetMuscles.join(', '),
    };

    // Add to custom workout
    setCustomWorkout({
      ...customWorkout,
      exercises: [...customWorkout.exercises, newExercise],
    });

    // Switch to custom tab to show the added exercise
    setActiveTab('custom');
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] w-[95vw] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {canEdit ? 'Edit' : 'View'} Workout - {dayName}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {canEdit
              ? 'Choose from templates or build a custom workout'
              : 'View the workout details for this day'}
          </DialogDescription>
        </DialogHeader>

        {canEdit ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'custom')}>
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="library" className="text-xs sm:text-sm">Templates</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs sm:text-sm">Build Workout</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="mt-4">
              <ScrollArea className="h-[400px] sm:h-[500px] pr-2 sm:pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {WORKOUT_TEMPLATES.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          <span className="font-semibold">{template.focus}</span> • {template.exercises.length} exercises
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        {template.description}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <ExerciseWorkoutBuilder
                exercises={customWorkout.exercises}
                onUpdateExercises={(newExercises) => setCustomWorkout({ ...customWorkout, exercises: newExercises })}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            {workout ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{workout.name}</h3>
                  <p className="text-sm text-muted-foreground">{workout.focus}</p>
                </div>

                <div className="space-y-3">
                  <Label>Exercises</Label>
                  {workout.exercises.map((exercise, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold">{exercise.name}</h4>
                        <div className="grid grid-cols-4 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Sets:</span> {exercise.sets}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reps:</span> {exercise.reps}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rest:</span> {exercise.rest}
                          </div>
                          {exercise.perceivedExertion && (
                            <div>
                              <span className="text-muted-foreground">RPE:</span> {exercise.perceivedExertion}/10
                            </div>
                          )}
                        </div>
                        {exercise.description && (
                          <p className="text-sm text-muted-foreground mt-2">{exercise.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                This is a rest day. No workout scheduled.
              </div>
            )}
          </ScrollArea>
        )}

        <DialogFooter>
          {canEdit && (
            <>
              {workout && (
                <Button variant="destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Workout
                </Button>
              )}
              <Button variant="outline" onClick={handleSetRestDay}>
                Set as Rest Day
              </Button>
              {activeTab === 'custom' && (
                <Button
                  onClick={handleSaveCustom}
                  disabled={!customWorkout.name || customWorkout.exercises.length === 0}
                >
                  Save Custom Workout
                </Button>
              )}
            </>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
