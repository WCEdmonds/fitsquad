'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface LogProgressDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  exercise: { id: string; name: string };
  workoutPlanId: string;
}

export function LogProgressDialog({ isOpen, onOpenChange, exercise, workoutPlanId }: LogProgressDialogProps) {
  const [completedReps, setCompletedReps] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const progressRef = collection(firestore, 'accounts', user.uid, 'exercisesProgress');
      await addDoc(progressRef, {
        accountId: user.uid,
        exerciseId: exercise.id,
        workoutPlanId: workoutPlanId,
        exerciseName: exercise.name,
        completedReps: Number(completedReps),
        weight: Number(weight),
        notes: notes,
        date: new Date().toISOString(),
      });
      toast({ title: 'Success!', description: 'Your progress has been logged.' });
      onOpenChange(false);
      setCompletedReps('');
      setWeight('');
      setNotes('');
    } catch (error) {
      console.error("Error logging progress: ", error);
      toast({ title: 'Error', description: 'Failed to log progress.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log Progress for {exercise.name}</DialogTitle>
            <DialogDescription>
              Record your performance for this exercise.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reps">Completed Reps / Time (in seconds)</Label>
              <Input
                id="reps"
                type="number"
                value={completedReps}
                onChange={(e) => setCompletedReps(e.target.value)}
                required
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="weight">Weight Used (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Felt strong, focus on form."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 animate-spin"/> Saving...</> : 'Save Progress'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
