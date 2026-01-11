import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Dumbbell, Timer, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
}

interface Workout {
  name: string;
  focus: string;
  exercises: Exercise[];
}

interface WorkoutOverviewProps {
  workout: Workout | null;
  onStart: () => void;
  onAddWorkout?: () => void;
  dayOfWeek: string;
}

export function WorkoutOverview({ workout, onStart, onAddWorkout, dayOfWeek }: WorkoutOverviewProps) {
  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <Dumbbell className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Rest Day</h3>
        <p className="text-muted-foreground mb-6">No workout scheduled for {dayOfWeek}.</p>
        {onAddWorkout && (
          <Button onClick={onAddWorkout} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Workout
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
       <div className="flex-1 overflow-y-auto px-4">
        {/* Header */}
        <div className="my-6">
            <h2 className="text-2xl font-bold">{workout.name || "Today's Workout"}</h2>
            <p className="text-muted-foreground uppercase text-xs font-bold tracking-wider mt-1">{workout.focus}</p>
        </div>

        <div className="space-y-3 pb-4">
          {workout.exercises.map((exercise, i) => (
            <Card key={i} className="border-border/50 bg-secondary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                   <h4 className="font-semibold text-lg capitalize">{exercise.name}</h4>
                   <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                          <span className="font-mono text-foreground font-medium">{exercise.sets}</span> Sets
                      </span>
                      <span className="flex items-center gap-1">
                          <span className="font-mono text-foreground font-medium">{exercise.reps}</span> Reps
                      </span>
                      {exercise.rest && (
                        <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" /> {exercise.rest}
                        </span>
                      )}
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Start Button */}
      <div className="shrink-0 px-4 py-3 border-t border-border/50 bg-card/80">
        <Button 
            className="w-full h-12 text-lg font-bold shadow-[0_0_20px_rgba(75,83,32,0.4)]" 
            size="lg"
            onClick={onStart}
        >
          Start Workout <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
