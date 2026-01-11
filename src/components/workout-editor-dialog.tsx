"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { Trash2, Plus, Minus, Save, Copy, Bookmark, Dumbbell } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ExerciseBrowser } from '@/components/exercise-browser';
import { ExerciseWorkoutBuilder } from '@/components/exercise-workout-builder';
import type { Exercise as ExerciseDBExercise } from '@/lib/exercisedb';
import { useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { collection, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

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
  imageUrl?: string; // ExerciseDB GIF URL for visual reference
}

interface Workout {
  name: string;
  focus: string;
  exercises: Exercise[];
}

interface WorkoutTemplate {
  id: string;
  name: string;
  focus: string;
  description?: string;
  exercises: Exercise[];
  isCustom?: boolean;
  createdBy?: string;
  createdAt?: any;
}

interface WorkoutEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workout: Workout | null) => void;
  onDelete: () => void;
  workout: Workout | null;
  dayName: string;
  canEdit: boolean;
  teamId?: string;
  userId?: string;
  weekDays?: Array<{ weekIndex: number; dayIndex: number; dayName: string; hasWorkout: boolean }>;
  onCopyToDay?: (targetDays: Array<{ weekIndex: number; dayIndex: number }>, workout: Workout) => void;
}

export function WorkoutEditorDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  workout,
  dayName,
  canEdit,
  teamId,
  userId,
  weekDays,
  onCopyToDay,
}: WorkoutEditorDialogProps) {
  // Helper function to clean instruction text
  const cleanInstruction = (instruction: string): string => {
    return instruction.replace(/^Step:\d+\s*/i, '').trim();
  };

  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('custom');
  const [customWorkout, setCustomWorkout] = useState<Workout>({
    name: '',
    focus: '',
    exercises: [],
  });
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showCopyToDayDialog, setShowCopyToDayDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTargetDays, setSelectedTargetDays] = useState<Array<{ weekIndex: number; dayIndex: number }>>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  // Fetch custom templates from Firestore
  const customTemplatesRef = useMemoFirebase(() => {
    if (!teamId) return null;
    return collection(firestore, 'teams', teamId, 'customTemplates');
  }, [firestore, teamId]);

  const { data: customTemplates, isLoading: isLoadingTemplates, error: templatesError } = useCollection<Omit<WorkoutTemplate, 'id'>>(customTemplatesRef);

  // Log template loading errors but don't crash the app
  useEffect(() => {
    if (templatesError) {
      console.warn('⚠️ Could not load custom templates:', templatesError);
      // Don't show toast here to avoid annoying the user on every dialog open
      // Custom templates will simply not appear, built-in templates still work
    }
  }, [templatesError]);

  useEffect(() => {
    if (workout) {
      setCustomWorkout(workout);
    } else {
      setCustomWorkout({
        name: '',
        focus: '',
        exercises: [],
      });
    }
    // Always default to custom tab
    setActiveTab('custom');
  }, [workout, isOpen]);

  function handleSelectTemplate(template: WorkoutTemplate) {
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
      description: exercise.instructions?.map(cleanInstruction).join('. ') || exercise.targetMuscles.join(', '),
      imageUrl: exercise.gifUrl, // Store the exercise GIF for reference
    };

    // Add to custom workout
    setCustomWorkout({
      ...customWorkout,
      exercises: [...customWorkout.exercises, newExercise],
    });

    // Switch to custom tab to show the added exercise
    setActiveTab('custom');
  }

  async function handleSaveAsTemplate() {
    if (!teamId || !userId || customWorkout.exercises.length === 0) return;

    if (!templateName.trim()) {
      toast({
        title: "Template Name Required",
        description: "Please enter a name for the template.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTemplate(true);
    try {
      const templateData = {
        name: templateName.trim(),
        focus: customWorkout.focus || 'Custom',
        description: templateDescription.trim() || `Custom template: ${templateName}`,
        exercises: customWorkout.exercises,
        isCustom: true,
        createdBy: userId,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'teams', teamId, 'customTemplates'), templateData);

      toast({
        title: "Template Saved",
        description: `"${templateName}" has been saved to your template library.`,
      });

      // Reset and close dialog
      setTemplateName('');
      setTemplateDescription('');
      setShowSaveTemplateDialog(false);
    } catch (error: any) {
      console.error('❌ Error saving template:', error);
      toast({
        title: "Error Saving Template",
        description: error.message || "Could not save the template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  }

  function handleOpenCopyDialog() {
    if (!customWorkout || customWorkout.exercises.length === 0) return;
    setSelectedTargetDays([]);
    setShowCopyToDayDialog(true);
  }

  function handleToggleDaySelection(weekIndex: number, dayIndex: number) {
    const isDaySelected = selectedTargetDays.some(
      (d) => d.weekIndex === weekIndex && d.dayIndex === dayIndex
    );

    if (isDaySelected) {
      setSelectedTargetDays(selectedTargetDays.filter(
        (d) => !(d.weekIndex === weekIndex && d.dayIndex === dayIndex)
      ));
    } else {
      setSelectedTargetDays([...selectedTargetDays, { weekIndex, dayIndex }]);
    }
  }

  function handleCopyToSelectedDays() {
    if (!onCopyToDay || selectedTargetDays.length === 0) return;

    const workoutToCopy: Workout = {
      name: customWorkout.name || `${dayName} Workout`,
      focus: customWorkout.focus || 'Custom',
      exercises: customWorkout.exercises,
    };

    onCopyToDay(selectedTargetDays, workoutToCopy);

    toast({
      title: "Workout Copied",
      description: `Workout copied to ${selectedTargetDays.length} day(s).`,
    });

    setSelectedTargetDays([]);
    setShowCopyToDayDialog(false);
  }

  // Combine built-in and custom templates
  const allTemplates: WorkoutTemplate[] = useMemo(() => {
    const builtIn = WORKOUT_TEMPLATES.map(t => ({ ...t, isCustom: false }));
    // Only include custom templates if they loaded successfully
    const custom = (!templatesError && customTemplates)
      ? customTemplates.map(t => ({ ...t, isCustom: true }))
      : [];
    return [...builtIn, ...custom];
  }, [customTemplates, templatesError]);

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
                {isLoadingTemplates ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading templates...
                  </div>
                ) : (
                  <>
                    {templatesError && (
                      <div className="mb-3 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 p-2 rounded">
                        ⚠️ Custom templates could not be loaded. Built-in templates are still available.
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {allTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            {template.isCustom && (
                              <Badge variant="secondary" className="text-xs">
                                <Bookmark className="h-3 w-3 mr-1" />
                                Custom
                              </Badge>
                            )}
                          </div>
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
                  </>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <div className="h-[400px] sm:h-[500px] overflow-hidden">
                <ExerciseWorkoutBuilder
                  exercises={customWorkout.exercises}
                  onUpdateExercises={(newExercises) => setCustomWorkout({ ...customWorkout, exercises: newExercises })}
                />
              </div>
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
                        <div className="flex gap-4">
                          {/* Exercise Image */}
                          {exercise.imageUrl ? (
                            <div className="flex-shrink-0">
                              <img
                                src={exercise.imageUrl}
                                alt={exercise.name}
                                className="w-24 h-24 rounded-md object-cover border bg-muted"
                                loading="lazy"
                                onError={(e) => {
                                  console.error('Failed to load image:', exercise.imageUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-24 h-24 rounded-md border bg-muted flex items-center justify-center">
                              <Dumbbell className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}

                          {/* Exercise Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold capitalize">{exercise.name}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
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
                          </div>
                        </div>
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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {canEdit && (
            <>
              {workout && (
                <Button variant="destructive" onClick={onDelete} size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Workout
                </Button>
              )}
              <Button variant="outline" onClick={handleSetRestDay} size="sm">
                Set as Rest Day
              </Button>
              {activeTab === 'custom' && customWorkout.exercises.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveTemplateDialog(true)}
                    size="sm"
                    disabled={!teamId || !userId}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Template
                  </Button>
                  {weekDays && weekDays.length > 0 && onCopyToDay && (
                    <Button
                      variant="outline"
                      onClick={handleOpenCopyDialog}
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Day
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveCustom}
                    disabled={customWorkout.exercises.length === 0}
                    size="sm"
                  >
                    Save Workout
                  </Button>
                </>
              )}
            </>
          )}
          <Button variant="secondary" onClick={onClose} size="sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Save as Template Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this workout as a reusable template for your team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                placeholder="e.g., My Custom Upper Body"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description (Optional)</Label>
              <Textarea
                id="template-description"
                placeholder="Brief description of this template..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              This template will include {customWorkout.exercises.length} exercise{customWorkout.exercises.length !== 1 ? 's' : ''}.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={isSavingTemplate || !templateName.trim()}>
              {isSavingTemplate ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy to Day Dialog */}
      <Dialog open={showCopyToDayDialog} onOpenChange={setShowCopyToDayDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Copy Workout to Other Days</DialogTitle>
            <DialogDescription>
              Select the days you want to copy this workout to.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4 py-4">
              {weekDays && weekDays.length > 0 ? (
                <>
                  {/* Group days by week */}
                  {Array.from(new Set(weekDays.map(d => d.weekIndex))).map((weekIndex) => {
                    const daysInWeek = weekDays.filter(d => d.weekIndex === weekIndex);
                    return (
                      <div key={weekIndex} className="space-y-2">
                        <h4 className="font-semibold text-sm">Week {weekIndex + 1}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {daysInWeek.map(({ weekIndex, dayIndex, dayName, hasWorkout }) => {
                            const isSelected = selectedTargetDays.some(
                              (d) => d.weekIndex === weekIndex && d.dayIndex === dayIndex
                            );
                            return (
                              <Button
                                key={`${weekIndex}-${dayIndex}`}
                                variant={isSelected ? "default" : "outline"}
                                className="justify-start"
                                onClick={() => handleToggleDaySelection(weekIndex, dayIndex)}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{dayName}</span>
                                  {hasWorkout && (
                                    <Badge variant="secondary" className="text-xs">
                                      Has workout
                                    </Badge>
                                  )}
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No days available to copy to.
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyToDayDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCopyToSelectedDays}
              disabled={selectedTargetDays.length === 0}
            >
              Copy to {selectedTargetDays.length} Day{selectedTargetDays.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
