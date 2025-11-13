'use client';

import { useState } from 'react';
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
import { Dumbbell, Plus, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
}

export default function QuickWorkoutPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: '', reps: '', weight: '', notes: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

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
                    <Input
                      id={`exercise-name-${index}`}
                      placeholder="e.g., Bench Press, Squats"
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
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
                      <Label htmlFor={`exercise-reps-${index}`}>Reps</Label>
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
        </CardContent>
      </Card>
    </div>
  );
}
