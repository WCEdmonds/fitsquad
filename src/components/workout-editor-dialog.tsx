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
import type { Exercise as ExerciseDBExercise } from '@/lib/exercisedb';

// Workout template library
const WORKOUT_TEMPLATES = [
  {
    id: 'upper-body-strength',
    name: 'Upper Body Strength',
    focus: 'Strength',
    description: 'Build upper body strength and muscle',
    exercises: [
      { name: 'Push-ups', sets: '4', reps: '12-15', rest: '60s', description: 'Standard push-ups with proper form' },
      { name: 'Pull-ups', sets: '4', reps: '8-10', rest: '90s', description: 'Wide grip pull-ups' },
      { name: 'Dumbbell Bench Press', sets: '4', reps: '10-12', rest: '60s', description: 'Flat bench press' },
      { name: 'Bent-over Rows', sets: '4', reps: '10-12', rest: '60s', description: 'Barbell or dumbbell rows' },
      { name: 'Overhead Press', sets: '3', reps: '10-12', rest: '60s', description: 'Standing or seated' },
    ],
  },
  {
    id: 'lower-body-strength',
    name: 'Lower Body Strength',
    focus: 'Strength',
    description: 'Strengthen legs and core',
    exercises: [
      { name: 'Squats', sets: '4', reps: '12-15', rest: '90s', description: 'Back squats with proper depth' },
      { name: 'Deadlifts', sets: '4', reps: '8-10', rest: '120s', description: 'Conventional or sumo deadlifts' },
      { name: 'Lunges', sets: '3', reps: '12 each leg', rest: '60s', description: 'Walking or stationary lunges' },
      { name: 'Leg Press', sets: '4', reps: '12-15', rest: '60s', description: 'Machine leg press' },
      { name: 'Calf Raises', sets: '3', reps: '15-20', rest: '45s', description: 'Standing calf raises' },
    ],
  },
  {
    id: 'cardio-endurance',
    name: 'Cardio Endurance',
    focus: 'Endurance',
    description: 'Improve cardiovascular fitness',
    exercises: [
      { name: 'Running', sets: '1', reps: '30 min', rest: 'N/A', description: 'Steady-state run at moderate pace' },
      { name: 'Burpees', sets: '5', reps: '10', rest: '60s', description: 'Full burpees with jump' },
      { name: 'Mountain Climbers', sets: '4', reps: '30s', rest: '30s', description: 'Fast-paced mountain climbers' },
      { name: 'Jump Rope', sets: '4', reps: '2 min', rest: '60s', description: 'Continuous jump rope' },
      { name: 'High Knees', sets: '4', reps: '45s', rest: '45s', description: 'Running in place with high knees' },
    ],
  },
  {
    id: 'hiit',
    name: 'HIIT Circuit',
    focus: 'HIIT',
    description: 'High-intensity interval training',
    exercises: [
      { name: 'Sprint Intervals', sets: '8', reps: '30s sprint / 30s rest', rest: 'As noted', description: 'Max effort sprints' },
      { name: 'Box Jumps', sets: '4', reps: '10', rest: '60s', description: 'Jump onto sturdy box or platform' },
      { name: 'Kettlebell Swings', sets: '4', reps: '15', rest: '45s', description: 'Hip-hinge kettlebell swings' },
      { name: 'Battle Ropes', sets: '4', reps: '30s', rest: '45s', description: 'Alternating wave pattern' },
      { name: 'Sled Push', sets: '4', reps: '30m', rest: '90s', description: 'Heavy sled push' },
    ],
  },
  {
    id: 'core-conditioning',
    name: 'Core Conditioning',
    focus: 'Core',
    description: 'Build core strength and stability',
    exercises: [
      { name: 'Plank', sets: '3', reps: '60s', rest: '45s', description: 'Forearm plank with straight body' },
      { name: 'Russian Twists', sets: '3', reps: '20 each side', rest: '45s', description: 'Seated twists with weight' },
      { name: 'Bicycle Crunches', sets: '3', reps: '20 each side', rest: '30s', description: 'Alternating knee to elbow' },
      { name: 'Dead Bug', sets: '3', reps: '12 each side', rest: '45s', description: 'Controlled opposite limb movements' },
      { name: 'Hanging Leg Raises', sets: '3', reps: '10-12', rest: '60s', description: 'Hang from bar, raise legs' },
    ],
  },
  {
    id: 'recovery-mobility',
    name: 'Recovery & Mobility',
    focus: 'Recovery',
    description: 'Active recovery and flexibility work',
    exercises: [
      { name: 'Yoga Flow', sets: '1', reps: '20 min', rest: 'N/A', description: 'Light yoga sequence' },
      { name: 'Foam Rolling', sets: '1', reps: '10 min', rest: 'N/A', description: 'Full body foam rolling' },
      { name: 'Dynamic Stretching', sets: '1', reps: '10 min', rest: 'N/A', description: 'Active stretches' },
      { name: 'Walking', sets: '1', reps: '30 min', rest: 'N/A', description: 'Easy-paced walk' },
      { name: 'Static Stretching', sets: '1', reps: '15 min', rest: 'N/A', description: 'Hold stretches 30-60s' },
    ],
  },
  {
    id: 'acft-prep',
    name: 'ACFT Preparation',
    focus: 'ACFT',
    description: 'Army Combat Fitness Test specific training',
    exercises: [
      { name: 'Trap Bar Deadlift', sets: '4', reps: '5', rest: '120s', description: 'MDL event preparation' },
      { name: 'Hand-Release Push-ups', sets: '4', reps: '15-20', rest: '60s', description: 'HRP event practice' },
      { name: 'Sprint-Drag-Carry Simulation', sets: '3', reps: '1 full round', rest: '180s', description: 'Practice SDC components' },
      { name: 'Plank Hold', sets: '3', reps: 'Max time', rest: '90s', description: 'PLK event training' },
      { name: '2-Mile Run', sets: '1', reps: '1 run', rest: 'N/A', description: '2MR at race pace' },
    ],
  },
];

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  description: string;
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
  const [activeTab, setActiveTab] = useState<'library' | 'custom' | 'exercise-db'>('library');
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
  }, [workout]);

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
        { name: '', sets: '', reps: '', rest: '', description: '' },
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
    if (!customWorkout.name || customWorkout.exercises.length === 0) {
      return;
    }
    onSave(customWorkout);
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
      description: exercise.instructions?.join(' ') || exercise.target,
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
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {canEdit ? 'Edit' : 'View'} Workout - {dayName}
          </DialogTitle>
          <DialogDescription>
            {canEdit
              ? 'Choose from templates, browse the exercise database, or create a custom workout'
              : 'View the workout details for this day'}
          </DialogDescription>
        </DialogHeader>

        {canEdit ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'custom' | 'exercise-db')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="library">Templates</TabsTrigger>
              <TabsTrigger value="exercise-db">Exercise Database</TabsTrigger>
              <TabsTrigger value="custom">Custom Workout</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <TabsContent value="exercise-db" className="mt-4">
              <ExerciseBrowser
                onSelectExercise={handleSelectExerciseFromDB}
                selectedExercises={customWorkout.exercises.map((ex, idx) => ({
                  id: `custom-${idx}`,
                  name: ex.name,
                  bodyPart: '',
                  target: '',
                  equipment: '',
                  gifUrl: '',
                  instructions: [ex.description],
                }))}
              />
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="workout-name">Workout Name</Label>
                    <Input
                      id="workout-name"
                      placeholder="e.g., Upper Body Strength"
                      value={customWorkout.name}
                      onChange={(e) => setCustomWorkout({ ...customWorkout, name: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="workout-focus">Focus Area</Label>
                    <Input
                      id="workout-focus"
                      placeholder="e.g., Strength, Endurance, HIIT"
                      value={customWorkout.focus}
                      onChange={(e) => setCustomWorkout({ ...customWorkout, focus: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Exercises</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddExercise}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Exercise
                      </Button>
                    </div>

                    {customWorkout.exercises.map((exercise, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-3">
                              <Input
                                placeholder="Exercise name"
                                value={exercise.name}
                                onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)}
                              />
                              <div className="grid grid-cols-3 gap-2">
                                <Input
                                  placeholder="Sets"
                                  value={exercise.sets}
                                  onChange={(e) => handleUpdateExercise(index, 'sets', e.target.value)}
                                />
                                <Input
                                  placeholder="Reps"
                                  value={exercise.reps}
                                  onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)}
                                />
                                <Input
                                  placeholder="Rest"
                                  value={exercise.rest}
                                  onChange={(e) => handleUpdateExercise(index, 'rest', e.target.value)}
                                />
                              </div>
                              <Textarea
                                placeholder="Description (optional)"
                                value={exercise.description}
                                onChange={(e) => handleUpdateExercise(index, 'description', e.target.value)}
                                rows={2}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExercise(index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {customWorkout.exercises.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No exercises added yet. Click "Add Exercise" to get started.
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
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
                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Sets:</span> {exercise.sets}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reps:</span> {exercise.reps}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rest:</span> {exercise.rest}
                          </div>
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
