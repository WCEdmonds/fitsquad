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
import { Dumbbell, Plus, X, Check, Search, Loader2, Zap, Weight, PersonStanding, Timer, ArrowUp, ArrowDown, Mountain, Waves, Backpack, Flame, Activity } from 'lucide-react';
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
  isCardio?: boolean;
  gifUrl?: string;
  instructions?: string[];
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
    name: 'Full Body Strength',
    description: 'Complete strength training with compound lifts',
    icon: Weight,
    exercises: [
      { name: 'Barbell Squat', sets: '4', reps: '8', weight: '185', notes: '', isCardio: false },
      { name: 'Bench Press', sets: '4', reps: '8', weight: '135', notes: '', isCardio: false },
      { name: 'Deadlift', sets: '3', reps: '6', weight: '225', notes: '', isCardio: false },
      { name: 'Overhead Press', sets: '3', reps: '10', weight: '95', notes: '', isCardio: false },
      { name: 'Barbell Row', sets: '3', reps: '10', weight: '115', notes: '', isCardio: false },
    ],
  },
  {
    id: 'upper-push',
    name: 'Upper Body Push',
    description: 'Chest, shoulders, and triceps workout',
    icon: ArrowUp,
    exercises: [
      { name: 'Bench Press', sets: '4', reps: '8', weight: '135', notes: '', isCardio: false },
      { name: 'Incline Dumbbell Press', sets: '3', reps: '10', weight: '60', notes: 'Per dumbbell', isCardio: false },
      { name: 'Overhead Press', sets: '4', reps: '8', weight: '95', notes: '', isCardio: false },
      { name: 'Dips', sets: '3', reps: '12', weight: '', notes: 'Bodyweight or weighted', isCardio: false },
      { name: 'Lateral Raises', sets: '3', reps: '15', weight: '20', notes: '', isCardio: false },
      { name: 'Tricep Pushdowns', sets: '3', reps: '12', weight: '60', notes: '', isCardio: false },
    ],
  },
  {
    id: 'upper-pull',
    name: 'Upper Body Pull',
    description: 'Back and biceps focused workout',
    icon: ArrowDown,
    exercises: [
      { name: 'Pull-ups', sets: '4', reps: '8', weight: '', notes: 'Add weight if needed', isCardio: false },
      { name: 'Barbell Row', sets: '4', reps: '8', weight: '135', notes: '', isCardio: false },
      { name: 'Lat Pulldown', sets: '3', reps: '10', weight: '120', notes: '', isCardio: false },
      { name: 'Dumbbell Row', sets: '3', reps: '10', weight: '60', notes: 'Per arm', isCardio: false },
      { name: 'Face Pulls', sets: '3', reps: '15', weight: '50', notes: '', isCardio: false },
      { name: 'Barbell Curl', sets: '3', reps: '12', weight: '65', notes: '', isCardio: false },
    ],
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    description: 'Complete lower body workout',
    icon: Mountain,
    exercises: [
      { name: 'Barbell Squat', sets: '5', reps: '6', weight: '225', notes: '', isCardio: false },
      { name: 'Romanian Deadlift', sets: '4', reps: '8', weight: '185', notes: '', isCardio: false },
      { name: 'Leg Press', sets: '4', reps: '12', weight: '360', notes: '', isCardio: false },
      { name: 'Walking Lunges', sets: '3', reps: '20', weight: '40', notes: 'Per leg', isCardio: false },
      { name: 'Leg Curl', sets: '3', reps: '12', weight: '90', notes: '', isCardio: false },
      { name: 'Calf Raises', sets: '4', reps: '15', weight: '135', notes: '', isCardio: false },
    ],
  },
  {
    id: 'bodyweight',
    name: 'Bodyweight',
    description: 'No equipment needed, anywhere workout',
    icon: PersonStanding,
    exercises: [
      { name: 'Push-ups', sets: '4', reps: '15', weight: '', notes: '', isCardio: false },
      { name: 'Pull-ups', sets: '4', reps: '8', weight: '', notes: '', isCardio: false },
      { name: 'Air Squats', sets: '4', reps: '20', weight: '', notes: '', isCardio: false },
      { name: 'Plank', sets: '3', reps: '60 sec', weight: '', notes: '', isCardio: false },
      { name: 'Burpees', sets: '3', reps: '15', weight: '', notes: '', isCardio: true },
    ],
  },
  {
    id: 'core-abs',
    name: 'Core & Abs',
    description: 'Targeted core strengthening workout',
    icon: Activity,
    exercises: [
      { name: 'Plank', sets: '4', reps: '60 sec', weight: '', notes: '', isCardio: false },
      { name: 'Russian Twists', sets: '4', reps: '30', weight: '25', notes: 'With plate or dumbbell', isCardio: false },
      { name: 'Hanging Leg Raises', sets: '4', reps: '12', weight: '', notes: '', isCardio: false },
      { name: 'Ab Wheel Rollouts', sets: '3', reps: '15', weight: '', notes: '', isCardio: false },
      { name: 'Side Plank', sets: '3', reps: '45 sec', weight: '', notes: 'Each side', isCardio: false },
      { name: 'Mountain Climbers', sets: '3', reps: '30', weight: '', notes: '', isCardio: true },
    ],
  },
  {
    id: 'hiit',
    name: 'HIIT Circuit',
    description: 'High-intensity interval training',
    icon: Zap,
    exercises: [
      { name: 'Jump Squats', sets: '4', reps: '15', weight: '', notes: '30 sec rest', isCardio: true },
      { name: 'Mountain Climbers', sets: '4', reps: '20', weight: '', notes: '30 sec rest', isCardio: true },
      { name: 'Burpees', sets: '4', reps: '12', weight: '', notes: '30 sec rest', isCardio: true },
      { name: 'High Knees', sets: '4', reps: '30 sec', weight: '', notes: '30 sec rest', isCardio: true },
      { name: 'Jump Rope', sets: '4', reps: '1 min', weight: '', notes: '30 sec rest', isCardio: true },
    ],
  },
  {
    id: 'easy-run',
    name: 'Easy Recovery Run',
    description: 'Low-intensity aerobic base building',
    icon: Timer,
    exercises: [
      { name: 'Warm-up Walk', sets: '1', reps: '5 min', weight: '', notes: 'Easy pace', isCardio: true },
      { name: 'Easy Run', sets: '1', reps: '30 min', weight: '', notes: 'Conversational pace, Zone 2', isCardio: true },
      { name: 'Cool-down Walk', sets: '1', reps: '5 min', weight: '', notes: 'Slow pace', isCardio: true },
      { name: 'Stretching', sets: '1', reps: '10 min', weight: '', notes: 'Focus on legs', isCardio: false },
    ],
  },
  {
    id: 'tempo-run',
    name: 'Tempo Run',
    description: 'Sustained threshold pace training',
    icon: Flame,
    exercises: [
      { name: 'Warm-up Jog', sets: '1', reps: '10 min', weight: '', notes: 'Easy pace', isCardio: true },
      { name: 'Tempo Run', sets: '1', reps: '20 min', weight: '', notes: 'Comfortably hard, 80-85% effort', isCardio: true },
      { name: 'Cool-down Jog', sets: '1', reps: '10 min', weight: '', notes: 'Easy pace', isCardio: true },
      { name: 'Dynamic Stretching', sets: '1', reps: '5 min', weight: '', notes: '', isCardio: false },
    ],
  },
  {
    id: 'interval-run',
    name: 'Interval Sprints',
    description: 'Speed and power development',
    icon: Zap,
    exercises: [
      { name: 'Warm-up Jog', sets: '1', reps: '10 min', weight: '', notes: 'Easy pace', isCardio: true },
      { name: '400m Intervals', sets: '6', reps: '400m', weight: '', notes: '90-95% effort, 2 min rest', isCardio: true },
      { name: 'Cool-down Jog', sets: '1', reps: '10 min', weight: '', notes: 'Easy pace', isCardio: true },
      { name: 'Walking', sets: '1', reps: '5 min', weight: '', notes: 'Recovery', isCardio: true },
    ],
  },
  {
    id: 'long-run',
    name: 'Long Distance Run',
    description: 'Endurance building for 2-mile test prep',
    icon: Timer,
    exercises: [
      { name: 'Warm-up Jog', sets: '1', reps: '5 min', weight: '', notes: 'Easy pace', isCardio: true },
      { name: 'Long Run', sets: '1', reps: '60 min', weight: '', notes: 'Steady, sustainable pace', isCardio: true },
      { name: 'Cool-down Walk', sets: '1', reps: '5 min', weight: '', notes: 'Slow pace', isCardio: true },
      { name: 'Stretching & Foam Rolling', sets: '1', reps: '15 min', weight: '', notes: 'Full body recovery', isCardio: false },
    ],
  },
  {
    id: 'ruck-march',
    name: 'Ruck March',
    description: 'Military load-bearing conditioning',
    icon: Backpack,
    exercises: [
      { name: 'Ruck March', sets: '1', reps: '60 min', weight: '35', notes: '35-45 lbs, maintain 15 min/mile pace', isCardio: true },
      { name: 'Farmer Carries', sets: '3', reps: '100m', weight: '50', notes: '2-3 min rest', isCardio: false },
      { name: 'Overhead Ruck Hold', sets: '3', reps: '30 sec', weight: '35', notes: 'Ruck overhead', isCardio: false },
      { name: 'Cool-down Walk', sets: '1', reps: '10 min', weight: '', notes: 'No ruck', isCardio: true },
    ],
  },
  {
    id: 'swim',
    name: 'Swim Workout',
    description: 'Low-impact cardio and conditioning',
    icon: Waves,
    exercises: [
      { name: 'Warm-up Swim', sets: '1', reps: '200m', weight: '', notes: 'Easy freestyle', isCardio: true },
      { name: 'Freestyle Intervals', sets: '8', reps: '50m', weight: '', notes: '30 sec rest between', isCardio: true },
      { name: 'Kickboard Drills', sets: '4', reps: '100m', weight: '', notes: 'Flutter kick', isCardio: true },
      { name: 'Cool-down Swim', sets: '1', reps: '200m', weight: '', notes: 'Easy pace', isCardio: true },
    ],
  },
  {
    id: 'crossfit-wod',
    name: 'CrossFit Style WOD',
    description: 'Varied functional fitness workout',
    icon: Flame,
    exercises: [
      { name: 'Thrusters', sets: '21-15-9', reps: '', weight: '95', notes: 'For time', isCardio: false },
      { name: 'Pull-ups', sets: '21-15-9', reps: '', weight: '', notes: 'For time with thrusters', isCardio: false },
      { name: 'Box Jumps', sets: '3', reps: '20', weight: '', notes: '24" box, 1 min rest', isCardio: true },
      { name: 'Kettlebell Swings', sets: '3', reps: '25', weight: '53', notes: 'American style', isCardio: true },
      { name: 'Burpees', sets: '3', reps: '15', weight: '', notes: '1 min rest', isCardio: true },
    ],
  },
  {
    id: 'mobility',
    name: 'Mobility & Recovery',
    description: 'Flexibility and injury prevention',
    icon: Activity,
    exercises: [
      { name: 'Foam Rolling', sets: '1', reps: '10 min', weight: '', notes: 'Full body', isCardio: false },
      { name: 'Leg Swings', sets: '2', reps: '20', weight: '', notes: 'Front/back and side to side', isCardio: false },
      { name: 'Hip 90/90 Stretch', sets: '3', reps: '60 sec', weight: '', notes: 'Each side', isCardio: false },
      { name: 'Shoulder Dislocations', sets: '3', reps: '15', weight: '', notes: 'With band or PVC', isCardio: false },
      { name: 'Cat-Cow Stretch', sets: '3', reps: '15', weight: '', notes: '', isCardio: false },
      { name: 'Deep Squat Hold', sets: '3', reps: '90 sec', weight: '', notes: '', isCardio: false },
    ],
  },
];

export default function QuickWorkoutPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: '', reps: '', weight: '', notes: '', isCardio: false }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [dbExercises, setDbExercises] = useState<DBExercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

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

  const handleLoadTemplate = async (template: WorkoutTemplate) => {
    setIsLoadingTemplate(true);
    setWorkoutName(template.name);

    try {
      // Try to match template exercises with ExerciseDB entries
      const enrichedExercises = await Promise.all(
        template.exercises.map(async (exercise) => {
          try {
            // Search for the exercise in the database
            const results = await searchExercises({ q: exercise.name, limit: 1 });

            if (results && results.length > 0) {
              const dbExercise = results[0];
              // Check if it's a good match (similar name)
              const nameLower = exercise.name.toLowerCase();
              const dbNameLower = dbExercise.name.toLowerCase();

              if (dbNameLower.includes(nameLower) || nameLower.includes(dbNameLower)) {
                return {
                  ...exercise,
                  gifUrl: dbExercise.gifUrl,
                  instructions: dbExercise.instructions,
                };
              }
            }
          } catch (error) {
            console.log(`Could not find exercise data for: ${exercise.name}`);
          }

          // Return original exercise if no match found
          return exercise;
        })
      );

      setExercises(enrichedExercises);
      setShowTemplates(false);
      toast({
        title: "Template Loaded!",
        description: `${template.name} workout loaded. Customize as needed.`,
      });
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleStartCustom = () => {
    setShowTemplates(false);
  };

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '', notes: '', isCardio: false }]);
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
    updated[index].gifUrl = dbExercise.gifUrl;
    updated[index].instructions = dbExercise.instructions;

    // Auto-suggest sets/reps based on exercise type
    const isCardio = dbExercise.bodyParts.includes('cardio');
    if (isCardio) {
      updated[index].sets = '1';
      updated[index].reps = '20 min';
      updated[index].weight = '';
      updated[index].isCardio = true;
    } else {
      updated[index].sets = '3';
      updated[index].reps = '10';
      updated[index].isCardio = false;
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
      setExercises([{ name: '', sets: '', reps: '', weight: '', notes: '', isCardio: false }]);
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
    <div className="space-y-4 pb-[calc(4rem+env(safe-area-inset-bottom))]">
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
                  setExercises([{ name: '', sets: '', reps: '', weight: '', notes: '', isCardio: false }]);
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
                {isLoadingTemplate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading exercise data...</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workoutTemplates.map((template) => {
                    const IconComponent = template.icon;
                    return (
                      <Card
                        key={template.id}
                        className={cn(
                          "cursor-pointer hover:border-primary transition-colors",
                          isLoadingTemplate && "opacity-50 pointer-events-none"
                        )}
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
                disabled={isLoadingTemplate}
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

                  {/* Exercise GIF and Instructions */}
                  {exercise.gifUrl && (
                    <div className="space-y-2">
                      <img
                        src={exercise.gifUrl}
                        alt={exercise.name}
                        className="w-full max-w-xs mx-auto rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {exercise.instructions && exercise.instructions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">How to perform:</Label>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        {exercise.instructions.map((instruction, idx) => (
                          <li key={idx} className="leading-relaxed">{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  )}

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
