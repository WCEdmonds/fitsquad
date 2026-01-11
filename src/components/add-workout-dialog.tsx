'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dumbbell, Users, User, Plus, ChevronRight, Zap, Timer, Weight, Mountain, Activity, Flame, ArrowUp, ArrowDown, Waves, Backpack } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  perceivedExertion?: string;
  description?: string;
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
  description: string;
  icon: any;
  exercises: Exercise[];
}

interface AddWorkoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToTeam?: (workout: Workout) => void;
  onAddToPersonal: (workout: Workout) => void;
  isSupervisor: boolean;
  dayOfWeek: string;
  selectedDate: Date;
}

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'upper-strength',
    name: 'Upper Body Strength',
    focus: 'Strength - Upper',
    description: 'Build upper body power',
    icon: ArrowUp,
    exercises: [
      { name: 'Bench Press', sets: '4', reps: '8', rest: '90s', perceivedExertion: '8' },
      { name: 'Overhead Press', sets: '4', reps: '8', rest: '90s', perceivedExertion: '8' },
      { name: 'Barbell Row', sets: '4', reps: '10', rest: '60s', perceivedExertion: '7' },
      { name: 'Pull-ups', sets: '3', reps: '8', rest: '60s', perceivedExertion: '7' },
      { name: 'Dips', sets: '3', reps: '12', rest: '60s', perceivedExertion: '6' },
    ],
  },
  {
    id: 'lower-strength',
    name: 'Lower Body Strength',
    focus: 'Strength - Lower',
    description: 'Build leg power',
    icon: ArrowDown,
    exercises: [
      { name: 'Barbell Squat', sets: '5', reps: '5', rest: '120s', perceivedExertion: '9' },
      { name: 'Romanian Deadlift', sets: '4', reps: '8', rest: '90s', perceivedExertion: '8' },
      { name: 'Leg Press', sets: '4', reps: '12', rest: '60s', perceivedExertion: '7' },
      { name: 'Walking Lunges', sets: '3', reps: '20', rest: '60s', perceivedExertion: '7' },
      { name: 'Calf Raises', sets: '4', reps: '15', rest: '45s', perceivedExertion: '6' },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body Strength',
    focus: 'Strength - Full',
    description: 'Total body workout',
    icon: Weight,
    exercises: [
      { name: 'Deadlift', sets: '4', reps: '6', rest: '120s', perceivedExertion: '9' },
      { name: 'Barbell Squat', sets: '4', reps: '8', rest: '90s', perceivedExertion: '8' },
      { name: 'Bench Press', sets: '4', reps: '8', rest: '90s', perceivedExertion: '8' },
      { name: 'Barbell Row', sets: '3', reps: '10', rest: '60s', perceivedExertion: '7' },
      { name: 'Plank', sets: '3', reps: '60s', rest: '45s', perceivedExertion: '6' },
    ],
  },
  {
    id: 'hiit',
    name: 'HIIT Circuit',
    focus: 'Cardio - HIIT',
    description: 'High intensity intervals',
    icon: Zap,
    exercises: [
      { name: 'Burpees', sets: '4', reps: '15', rest: '30s', perceivedExertion: '9' },
      { name: 'Jump Squats', sets: '4', reps: '20', rest: '30s', perceivedExertion: '8' },
      { name: 'Mountain Climbers', sets: '4', reps: '30', rest: '30s', perceivedExertion: '8' },
      { name: 'High Knees', sets: '4', reps: '30s', rest: '30s', perceivedExertion: '8' },
      { name: 'Box Jumps', sets: '4', reps: '12', rest: '30s', perceivedExertion: '8' },
    ],
  },
  {
    id: 'easy-run',
    name: 'Easy Run',
    focus: 'Cardio - Run',
    description: 'Low intensity cardio',
    icon: Timer,
    exercises: [
      { name: 'Warm-up Walk', sets: '1', reps: '5 min', rest: '-', perceivedExertion: '3' },
      { name: 'Easy Run', sets: '1', reps: '30 min', rest: '-', perceivedExertion: '5' },
      { name: 'Cool-down Walk', sets: '1', reps: '5 min', rest: '-', perceivedExertion: '3' },
      { name: 'Stretching', sets: '1', reps: '10 min', rest: '-', perceivedExertion: '2' },
    ],
  },
  {
    id: 'tempo-run',
    name: 'Tempo Run',
    focus: 'Cardio - Run',
    description: 'Threshold pace training',
    icon: Flame,
    exercises: [
      { name: 'Warm-up Jog', sets: '1', reps: '10 min', rest: '-', perceivedExertion: '4' },
      { name: 'Tempo Run', sets: '1', reps: '20 min', rest: '-', perceivedExertion: '7' },
      { name: 'Cool-down Jog', sets: '1', reps: '10 min', rest: '-', perceivedExertion: '4' },
    ],
  },
  {
    id: 'core',
    name: 'Core Workout',
    focus: 'Core',
    description: 'Ab and core focus',
    icon: Activity,
    exercises: [
      { name: 'Plank', sets: '4', reps: '60s', rest: '30s', perceivedExertion: '7' },
      { name: 'Russian Twists', sets: '4', reps: '30', rest: '30s', perceivedExertion: '6' },
      { name: 'Hanging Leg Raises', sets: '4', reps: '12', rest: '45s', perceivedExertion: '8' },
      { name: 'Ab Wheel Rollouts', sets: '3', reps: '15', rest: '45s', perceivedExertion: '7' },
      { name: 'Side Plank', sets: '3', reps: '45s', rest: '30s', perceivedExertion: '6' },
    ],
  },
  {
    id: 'ruck',
    name: 'Ruck March',
    focus: 'Endurance',
    description: 'Load bearing endurance',
    icon: Backpack,
    exercises: [
      { name: 'Ruck March', sets: '1', reps: '60 min', rest: '-', perceivedExertion: '7', description: '35-45 lbs' },
      { name: 'Farmer Carries', sets: '3', reps: '100m', rest: '2 min', perceivedExertion: '7' },
      { name: 'Cool-down Walk', sets: '1', reps: '10 min', rest: '-', perceivedExertion: '3' },
    ],
  },
  {
    id: 'swim',
    name: 'Swim Workout',
    focus: 'Cardio - Swim',
    description: 'Low impact cardio',
    icon: Waves,
    exercises: [
      { name: 'Warm-up Swim', sets: '1', reps: '200m', rest: '-', perceivedExertion: '4' },
      { name: 'Freestyle Intervals', sets: '8', reps: '50m', rest: '30s', perceivedExertion: '7' },
      { name: 'Kickboard Drills', sets: '4', reps: '100m', rest: '30s', perceivedExertion: '6' },
      { name: 'Cool-down Swim', sets: '1', reps: '200m', rest: '-', perceivedExertion: '4' },
    ],
  },
];

export function AddWorkoutDialog({
  isOpen,
  onClose,
  onAddToTeam,
  onAddToPersonal,
  isSupervisor,
  dayOfWeek,
  selectedDate,
}: AddWorkoutDialogProps) {
  const [step, setStep] = useState<'choose' | 'templates' | 'custom'>('choose');
  const [targetPlan, setTargetPlan] = useState<'team' | 'personal'>('personal');
  const [customWorkout, setCustomWorkout] = useState<Workout>({
    name: '',
    focus: '',
    exercises: [{ name: '', sets: '3', reps: '10', rest: '60s' }],
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset state on close
      setTimeout(() => {
        setStep(isSupervisor ? 'choose' : 'templates');
        setTargetPlan('personal');
      }, 200);
    }
  };

  const handleChooseTarget = (target: 'team' | 'personal') => {
    haptics.light();
    setTargetPlan(target);
    setStep('templates');
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    haptics.medium();
    const workout: Workout = {
      name: template.name,
      focus: template.focus,
      exercises: template.exercises,
    };

    if (targetPlan === 'team' && onAddToTeam) {
      onAddToTeam(workout);
    } else {
      onAddToPersonal(workout);
    }
    onClose();
  };

  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  // Initial step depends on role
  const initialStep = isSupervisor ? 'choose' : 'templates';

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <SheetHeader className="pb-4 shrink-0">
          <SheetTitle>Add Workout</SheetTitle>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Choose target (Supervisor only) */}
          {step === 'choose' && isSupervisor && (
            <div className="space-y-4 px-1">
              <p className="text-sm text-muted-foreground">
                Where would you like to add this workout?
              </p>
              
              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleChooseTarget('team')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Add to Team Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      All team members will see this workout
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleChooseTarget('personal')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-secondary text-secondary-foreground">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Add to My Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      Only visible on your calendar
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Choose template */}
          {(step === 'templates' || (!isSupervisor && step === 'choose')) && (
            <div className="space-y-3 px-1">
              {isSupervisor && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStep('choose')}
                  className="-ml-2 mb-2"
                >
                  ← Back
                </Button>
              )}
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Adding to:</span>
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  targetPlan === 'team' ? "bg-primary/10 text-primary" : "bg-secondary"
                )}>
                  {targetPlan === 'team' ? 'Team Plan' : 'My Plan'}
                </span>
              </div>

              <h3 className="font-semibold mb-2">Choose a Template</h3>
              
              <div className="grid grid-cols-1 gap-2">
                {WORKOUT_TEMPLATES.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{template.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {template.description} • {template.exercises.length} exercises
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
