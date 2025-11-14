'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dumbbell, Plus, X, Check, Search, Loader2, Zap, Weight, PersonStanding, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { searchExercises, type Exercise as DBExercise } from '@/lib/exercisedb/api';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  exercises: Exercise[];
}

const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'gym-strength',
    name: 'Gym Strength',
    description: 'Full body strength training with weights',
    icon: Weight,
    exercises: [
      { name: 'Barbell Squat', sets: '4', reps: '8', weight: '185', notes: '' },
      { name: 'Bench Press', sets: '4', reps: '8', weight: '135', notes: '' },
      { name: 'Deadlift', sets: '3', reps: '6', weight: '225', notes: '' },
      { name: 'Overhead Press', sets: '3', reps: '10', weight: '95', notes: '' },
      { name: 'Barbell Row', sets: '3', reps: '10', weight: '115', notes: '' },
    ],
  },
  {
    id: 'bodyweight',
    name: 'Bodyweight',
    description: 'No equipment needed, anywhere workout',
    icon: PersonStanding,
    exercises: [
      { name: 'Push-ups', sets: '4', reps: '15', weight: '', notes: '' },
      { name: 'Pull-ups', sets: '4', reps: '8', weight: '', notes: '' },
      { name: 'Air Squats', sets: '4', reps: '20', weight: '', notes: '' },
      { name: 'Plank', sets: '3', reps: '60 sec', weight: '', notes: '' },
      { name: 'Burpees', sets: '3', reps: '15', weight: '', notes: '' },
    ],
  },
  {
    id: 'cardio-run',
    name: 'Cardio Run',
    description: 'Running-focused cardio workout',
    icon: Timer,
    exercises: [
      { name: 'Warm-up Jog', sets: '1', reps: '5 min', weight: '', notes: 'Easy pace' },
      { name: 'Interval Sprints', sets: '8', reps: '30 sec', weight: '', notes: '90 sec rest between' },
      { name: 'Steady Run', sets: '1', reps: '20 min', weight: '', notes: 'Moderate pace' },
      { name: 'Cool-down Walk', sets: '1', reps: '5 min', weight: '', notes: 'Slow pace' },
    ],
  },
  {
    id: 'hiit',
    name: 'HIIT Circuit',
    description: 'High-intensity interval training',
    icon: Zap,
    exercises: [
      { name: 'Jump Squats', sets: '4', reps: '15', weight: '', notes: '30 sec rest' },
      { name: 'Mountain Climbers', sets: '4', reps: '20', weight: '', notes: '30 sec rest' },
      { name: 'Burpees', sets: '4', reps: '12', weight: '', notes: '30 sec rest' },
      { name: 'High Knees', sets: '4', reps: '30 sec', weight: '', notes: '30 sec rest' },
      { name: 'Jump Rope', sets: '4', reps: '1 min', weight: '', notes: '30 sec rest' },
    ],
  },
];

export default function QuickWorkoutPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: '', reps: '', weight: '', notes: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [dbExercises, setDbExercises] = useState<DBExercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setDbExercises([]);
      return;
    }

    setIsLoadingExercises(true);
    try {
      const results = await searchExercises({ q: query, limit: 50 });
      setDbExercises(results);
    } catch (error) {
      console.error('Error searching exercises:', error);
      setDbExercises([]);
    } finally {
      setIsLoadingExercises(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleLoadTemplate = (template: WorkoutTemplate) => {
    setWorkoutName(template.name);
    setExercises([...template.exercises]);
    setShowTemplates(false);
    toast({
      title: "Template Loaded!",
      description: `${template.name} workout loaded. Customize as needed.`,
    });
  };

  const handleStartCustom = () => {
    setShowTemplates(false);
  };

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '', notes: '' }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleSelectExercise = (index: number, dbExercise: DBExercise) => {
    const updated = [...exercises];
    updated[index].name = dbExercise.name;

    // Auto-suggest sets/reps based on exercise type
    const isCardio = dbExercise.bodyParts.includes('cardio');
    if (isCardio) {
      updated[index].sets = '1';
      updated[index].reps = '20 min';
      updated[index].weight = '';
    } else {
      updated[index].sets = '3';
      updated[index].reps = '10';
    }

    setExercises(updated);
    setOpenComboboxIndex(null);
    setSearchQuery('');
    setDbExercises([]);
  };

  const handlePopoverChange = (open: boolean, index: number) => {
    setOpenComboboxIndex(open ? index : null);
    if (!open) {
      setSearchQuery('');
      setDbExercises([]);
    }
  };

  const handleSaveWorkout = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a workout.",
        variant: "destructive",
      });
      return;
    }

    // Validate
    const validExercises = exercises.filter(ex => ex.name.trim() !== '');
    if (validExercises.length === 0) {
      toast({
        title: "No Exercises",
        description: "Please add at least one exercise with a name.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const workoutLog = {
        workoutName: workoutName || 'Custom Workout',
        exercises: validExercises.map(ex => ({
          exerciseName: ex.name,
          sets: ex.sets || 'N/A',
          reps: ex.reps || 'N/A',
          weight: ex.weight || 'N/A',
          notes: ex.notes || '',
        })),
        completedAt: serverTimestamp(),
        userId: user.uid,
      };

      const logsRef = collection(firestore, 'users', user.uid, 'workoutLogs');
      await addDoc(logsRef, workoutLog);

      toast({
        title: "Workout Saved!",
        description: "Your custom workout has been logged.",
      });

      // Reset form
      setWorkoutName('');
      setExercises([{ name: '', sets: '', reps: '', weight: '', notes: '' }]);
      setShowTemplates(true);

    } catch (error: any) {
      console.error('Error saving workout:', error);
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-6 w-6" />
                <CardTitle>Quick Workout</CardTitle>
              </div>
              <CardDescription>
                {showTemplates ? 'Choose a template or build your own' : 'Create and log your workout'}
              </CardDescription>
            </div>
            {!showTemplates && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTemplates(true);
                  setWorkoutName('');
                  setExercises([{ name: '', sets: '', reps: '', weight: '', notes: '' }]);
                }}
              >
                ← Templates
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showTemplates ? (
            <>
              {/* Template Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold">Choose a Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workoutTemplates.map((template) => {
                    const IconComponent = template.icon;
                    return (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleLoadTemplate(template)}
                      >
                        <CardContent className="pt-6 pb-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <IconComponent className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{template.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {template.exercises.length} exercises
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Or Build Custom */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleStartCustom}
              >
                <Plus className="h-4 w-4 mr-2" />
                Build Custom Workout
              </Button>
            </>
          ) : (
            <>
          {/* Workout Name */}
          <div className="space-y-2">
            <Label htmlFor="workout-name">Workout Name (optional)</Label>
            <Input
              id="workout-name"
              placeholder="e.g., Morning Routine, Leg Day"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
            />
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Exercises</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddExercise}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Exercise
              </Button>
            </div>

            {exercises.map((exercise, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-6 space-y-3">
                  {exercises.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => handleRemoveExercise(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`exercise-name-${index}`}>Exercise Name *</Label>
                    <Popover
                      open={openComboboxIndex === index}
                      onOpenChange={(open) => handlePopoverChange(open, index)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openComboboxIndex === index}
                          className="w-full justify-between"
                        >
                          {exercise.name || "Select exercise..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search exercises (type at least 2 characters)..."
                            className="h-9"
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            {searchQuery.length < 2 ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Type at least 2 characters to search
                              </div>
                            ) : isLoadingExercises ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                              </div>
                            ) : dbExercises.length === 0 ? (
                              <CommandEmpty>
                                <div className="py-6 text-center text-sm">No exercises found. Try different keywords or type manually below.</div>
                              </CommandEmpty>
                            ) : (
                              <CommandGroup className="max-h-80 overflow-auto">
                                {dbExercises.map((dbExercise) => (
                                  <CommandItem
                                    key={dbExercise.exerciseId}
                                    value={dbExercise.name}
                                    onSelect={() => handleSelectExercise(index, dbExercise)}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span>{dbExercise.name}</span>
                                      {dbExercise.bodyParts.includes('cardio') && (
                                        <span className="ml-2 text-xs text-muted-foreground">(cardio)</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input
                      id={`exercise-name-${index}`}
                      placeholder="Or type manually..."
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor={`exercise-sets-${index}`}>Sets</Label>
                      <Input
                        id={`exercise-sets-${index}`}
                        placeholder="3"
                        value={exercise.sets}
                        onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`exercise-reps-${index}`}>Reps/Time</Label>
                      <Input
                        id={`exercise-reps-${index}`}
                        placeholder="10"
                        value={exercise.reps}
                        onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`exercise-weight-${index}`}>Weight</Label>
                      <Input
                        id={`exercise-weight-${index}`}
                        placeholder="135"
                        value={exercise.weight}
                        onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`exercise-notes-${index}`}>Notes</Label>
                    <Textarea
                      id={`exercise-notes-${index}`}
                      placeholder="Any notes about this exercise..."
                      value={exercise.notes}
                      onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                      className="h-20"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleSaveWorkout}
            disabled={isSaving}
          >
            <Check className="h-5 w-5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Workout'}
          </Button>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
