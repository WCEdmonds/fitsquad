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
import { Dumbbell, Plus, X, Check, Search, Loader2 } from 'lucide-react';
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
  isCardio: boolean;
  duration?: string; // For cardio: e.g., "30 min"
  distance?: string; // For cardio: e.g., "5 miles"
}

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

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '', notes: '', isCardio: false }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | boolean) => {
    const updated = [...exercises];
    updated[index][field] = value as any;
    setExercises(updated);
  };

  const handleSelectExercise = (index: number, dbExercise: DBExercise) => {
    const updated = [...exercises];
    updated[index].name = dbExercise.name;

    // Auto-suggest fields based on exercise type
    const isCardio = dbExercise.bodyParts.includes('cardio');
    updated[index].isCardio = isCardio;

    if (isCardio) {
      // For cardio, set duration and distance defaults
      updated[index].duration = '30';
      updated[index].distance = '3';
      updated[index].sets = '';
      updated[index].reps = '';
      updated[index].weight = '';
    } else {
      // For strength, set sets/reps/weight defaults
      updated[index].sets = '3';
      updated[index].reps = '10';
      updated[index].weight = '';
      updated[index].duration = undefined;
      updated[index].distance = undefined;
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
          isCardio: ex.isCardio,
          ...(ex.isCardio ? {
            duration: ex.duration || 'N/A',
            distance: ex.distance || 'N/A',
          } : {
            sets: ex.sets || 'N/A',
            reps: ex.reps || 'N/A',
            weight: ex.weight || 'N/A',
          }),
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
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6" />
            <CardTitle>Quick Workout Builder</CardTitle>
          </div>
          <CardDescription>
            Create and log your own workout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id={`exercise-cardio-${index}`}
                        checked={exercise.isCardio}
                        onChange={(e) => handleExerciseChange(index, 'isCardio', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`exercise-cardio-${index}`} className="text-sm font-normal cursor-pointer">
                        This is a cardio exercise
                      </Label>
                    </div>
                  </div>

                  {exercise.isCardio ? (
                    // Cardio fields: Duration and Distance
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-duration-${index}`}>Duration (min)</Label>
                        <Input
                          id={`exercise-duration-${index}`}
                          placeholder="30"
                          value={exercise.duration || ''}
                          onChange={(e) => handleExerciseChange(index, 'duration', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-distance-${index}`}>Distance (mi)</Label>
                        <Input
                          id={`exercise-distance-${index}`}
                          placeholder="3"
                          value={exercise.distance || ''}
                          onChange={(e) => handleExerciseChange(index, 'distance', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    // Strength fields: Sets, Reps, Weight
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
                        <Label htmlFor={`exercise-reps-${index}`}>Reps</Label>
                        <Input
                          id={`exercise-reps-${index}`}
                          placeholder="10"
                          value={exercise.reps}
                          onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-weight-${index}`}>Weight (lbs)</Label>
                        <Input
                          id={`exercise-weight-${index}`}
                          placeholder="135"
                          value={exercise.weight}
                          onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

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
        </CardContent>
      </Card>
    </div>
  );
}
