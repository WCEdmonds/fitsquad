'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dumbbell, 
  Plus, 
  ChevronRight,
  Zap, 
  Weight, 
  PersonStanding, 
  Timer, 
  ArrowUp, 
  ArrowDown, 
  Mountain, 
  Backpack, 
  Flame, 
  Activity,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { CompactExerciseList } from '@/components/compact-exercise-list';
import { WorkoutSummary } from '@/components/workout-summary';
import { haptics } from '@/lib/haptics';
import { searchExercises } from '@/lib/exercisedb';

// Workout template interface matching CompactExerciseList expectations
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
  description: string;
  focus: string;
  icon: any;
  exercises: Exercise[];
}

// Common exercises for autofill suggestions
const COMMON_EXERCISES = [
  // Compound lifts
  'Barbell Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Barbell Row',
  'Romanian Deadlift', 'Front Squat', 'Sumo Deadlift', 'Incline Bench Press',
  // Upper body
  'Pull-ups', 'Chin-ups', 'Dips', 'Push-ups', 'Lat Pulldown', 'Cable Row',
  'Face Pulls', 'Tricep Pushdowns', 'Bicep Curls', 'Hammer Curls',
  'Lateral Raises', 'Front Raises', 'Rear Delt Flyes',
  // Lower body
  'Leg Press', 'Leg Curl', 'Leg Extension', 'Calf Raises', 'Walking Lunges',
  'Bulgarian Split Squat', 'Glute Bridge', 'Hip Thrust',
  // Core
  'Plank', 'Hanging Leg Raises', 'Russian Twists', 'Ab Wheel Rollouts',
  'Cable Crunches', 'Dead Bug', 'Bird Dog',
  // Cardio/HIIT
  'Burpees', 'Mountain Climbers', 'Jump Squats', 'Box Jumps', 'High Knees',
  'Battle Ropes', 'Kettlebell Swings', 'Jump Rope',
  // Running
  'Easy Run', 'Tempo Run', 'Interval Sprints', 'Long Run', 'Hill Sprints',
  // Other
  'Ruck March', 'Farmer Carries', 'Sled Push', 'Rowing', 'Swimming',
];

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'full-body',
    name: 'Full Body Strength',
    description: 'Complete strength training',
    focus: 'Strength',
    icon: Weight,
    exercises: [
      { name: 'Barbell Squat', sets: '4', reps: '8', rest: '90s' },
      { name: 'Bench Press', sets: '4', reps: '8', rest: '90s' },
      { name: 'Deadlift', sets: '3', reps: '6', rest: '120s' },
      { name: 'Overhead Press', sets: '3', reps: '10', rest: '60s' },
      { name: 'Barbell Row', sets: '3', reps: '10', rest: '60s' },
    ],
  },
  {
    id: 'upper-push',
    name: 'Upper Body Push',
    description: 'Chest, shoulders, triceps',
    focus: 'Push',
    icon: ArrowUp,
    exercises: [
      { name: 'Bench Press', sets: '4', reps: '8', rest: '90s' },
      { name: 'Incline Dumbbell Press', sets: '3', reps: '10', rest: '60s' },
      { name: 'Overhead Press', sets: '4', reps: '8', rest: '90s' },
      { name: 'Dips', sets: '3', reps: '12', rest: '60s' },
      { name: 'Lateral Raises', sets: '3', reps: '15', rest: '45s' },
    ],
  },
  {
    id: 'upper-pull',
    name: 'Upper Body Pull',
    description: 'Back and biceps',
    focus: 'Pull',
    icon: ArrowDown,
    exercises: [
      { name: 'Pull-ups', sets: '4', reps: '8', rest: '90s' },
      { name: 'Barbell Row', sets: '4', reps: '8', rest: '90s' },
      { name: 'Lat Pulldown', sets: '3', reps: '10', rest: '60s' },
      { name: 'Dumbbell Row', sets: '3', reps: '10', rest: '60s' },
      { name: 'Barbell Curl', sets: '3', reps: '12', rest: '45s' },
    ],
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    description: 'Lower body focus',
    focus: 'Legs',
    icon: Mountain,
    exercises: [
      { name: 'Barbell Squat', sets: '5', reps: '6', rest: '120s' },
      { name: 'Romanian Deadlift', sets: '4', reps: '8', rest: '90s' },
      { name: 'Leg Press', sets: '4', reps: '12', rest: '60s' },
      { name: 'Walking Lunges', sets: '3', reps: '20', rest: '60s' },
      { name: 'Calf Raises', sets: '4', reps: '15', rest: '45s' },
    ],
  },
  {
    id: 'bodyweight',
    name: 'Bodyweight',
    description: 'No equipment needed',
    focus: 'Calisthenics',
    icon: PersonStanding,
    exercises: [
      { name: 'Push-ups', sets: '4', reps: '15', rest: '60s' },
      { name: 'Pull-ups', sets: '4', reps: '8', rest: '60s' },
      { name: 'Air Squats', sets: '4', reps: '20', rest: '45s' },
      { name: 'Plank', sets: '3', reps: '60s', rest: '30s' },
      { name: 'Burpees', sets: '3', reps: '15', rest: '60s' },
    ],
  },
  {
    id: 'hiit',
    name: 'HIIT Circuit',
    description: 'High-intensity intervals',
    focus: 'Cardio',
    icon: Zap,
    exercises: [
      { name: 'Jump Squats', sets: '4', reps: '15', rest: '30s' },
      { name: 'Mountain Climbers', sets: '4', reps: '20', rest: '30s' },
      { name: 'Burpees', sets: '4', reps: '12', rest: '30s' },
      { name: 'High Knees', sets: '4', reps: '30s', rest: '30s' },
      { name: 'Box Jumps', sets: '4', reps: '12', rest: '30s' },
    ],
  },
  {
    id: 'easy-run',
    name: 'Easy Run',
    description: 'Recovery cardio',
    focus: 'Run',
    icon: Timer,
    exercises: [
      { name: 'Warm-up Walk', sets: '1', reps: '5 min', rest: '-' },
      { name: 'Easy Run', sets: '1', reps: '30 min', rest: '-' },
      { name: 'Cool-down Walk', sets: '1', reps: '5 min', rest: '-' },
    ],
  },
  {
    id: 'core',
    name: 'Core & Abs',
    description: 'Core strengthening',
    focus: 'Core',
    icon: Activity,
    exercises: [
      { name: 'Plank', sets: '4', reps: '60s', rest: '30s' },
      { name: 'Russian Twists', sets: '4', reps: '30', rest: '30s' },
      { name: 'Hanging Leg Raises', sets: '4', reps: '12', rest: '45s' },
      { name: 'Ab Wheel Rollouts', sets: '3', reps: '15', rest: '45s' },
    ],
  },
  {
    id: 'ruck',
    name: 'Ruck March',
    description: 'Load-bearing endurance',
    focus: 'Endurance',
    icon: Backpack,
    exercises: [
      { name: 'Ruck March', sets: '1', reps: '60 min', rest: '-', description: '35-45 lbs' },
      { name: 'Farmer Carries', sets: '3', reps: '100m', rest: '2 min' },
      { name: 'Cool-down Walk', sets: '1', reps: '10 min', rest: '-' },
    ],
  },
];

type PageState = 'choose' | 'templates' | 'custom-setup' | 'tracking' | 'summary';

export default function QuickWorkoutPage() {
  const [pageState, setPageState] = useState<PageState>('choose');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([
    { name: '', sets: '3', reps: '10', rest: '60s' }
  ]);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutStats, setWorkoutStats] = useState<any>(null);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<string[]>([]);
  const [focusedInputIndex, setFocusedInputIndex] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount } = useDoc(userAccountRef);

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    haptics.light();
    setSelectedWorkout({
      name: template.name,
      focus: template.focus,
      exercises: template.exercises,
    });
    setPageState('tracking');
  };

  const handleStartCustom = () => {
    haptics.light();
    setPageState('custom-setup');
  };

  const handleAddExercise = () => {
    setCustomExercises([...customExercises, { name: '', sets: '3', reps: '10', rest: '60s' }]);
  };

  const handleUpdateExercise = (index: number, field: keyof Exercise, value: string) => {
    const updated = [...customExercises];
    updated[index] = { ...updated[index], [field]: value };
    setCustomExercises(updated);

    // Trigger search when exercise name changes
    if (field === 'name' && value.length >= 2) {
      setFocusedInputIndex(index);
      
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Debounced search
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchExercises({ q: value, limit: 8 });
          setExerciseSuggestions(results.map(ex => ex.name));
        } catch (e) {
          console.error('Exercise search failed:', e);
          // Fall back to static list filtering
          const filtered = COMMON_EXERCISES.filter(ex => 
            ex.toLowerCase().includes(value.toLowerCase())
          ).slice(0, 8);
          setExerciseSuggestions(filtered);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else if (field === 'name' && value.length < 2) {
      setExerciseSuggestions([]);
    }
  };

  const handleSelectSuggestion = (index: number, exerciseName: string) => {
    const updated = [...customExercises];
    updated[index] = { ...updated[index], name: exerciseName };
    setCustomExercises(updated);
    setExerciseSuggestions([]);
    setFocusedInputIndex(null);
    haptics.light();
  };

  const handleRemoveExercise = (index: number) => {
    if (customExercises.length > 1) {
      setCustomExercises(customExercises.filter((_, i) => i !== index));
    }
  };

  const handleStartCustomWorkout = () => {
    const validExercises = customExercises.filter(e => e.name.trim());
    if (validExercises.length === 0) {
      toast({ title: "Add at least one exercise", variant: "destructive" });
      return;
    }
    haptics.medium();
    setSelectedWorkout({
      name: workoutName || 'Custom Workout',
      focus: 'Custom',
      exercises: validExercises,
    });
    setPageState('tracking');
  };

  const handleFinishWorkout = async (stats: any) => {
    haptics.success();
    setWorkoutStats(stats);
    setPageState('summary');

    // Save to Firestore
    if (user && firestore) {
      try {
        await addDoc(collection(firestore, 'users', user.uid, 'workouts'), {
          ...stats,
          workoutName: selectedWorkout?.name || 'Quick Workout',
          focus: selectedWorkout?.focus || 'General',
          teamId: userAccount?.teamId || null,
          date: new Date(),
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Error saving workout", e);
      }
    }
  };

  const handleCancelWorkout = () => {
    haptics.light();
    setSelectedWorkout(null);
    setPageState('choose');
  };

  const handleCloseSummary = () => {
    setWorkoutStats(null);
    setSelectedWorkout(null);
    setPageState('choose');
  };

  const handleBack = () => {
    haptics.light();
    setPageState('choose');
  };

  // Summary view
  if (pageState === 'summary' && workoutStats) {
    return (
      <div className="flex flex-col h-full bg-background">
        <WorkoutSummary
          duration={workoutStats.duration}
          volume={workoutStats.volume}
          sets={workoutStats.sets}
          onClose={handleCloseSummary}
        />
      </div>
    );
  }

  // Tracking view (uses CompactExerciseList)
  if (pageState === 'tracking' && selectedWorkout) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="shrink-0 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-4 pb-3 bg-card/80 border-b border-border/50 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">{selectedWorkout.name}</h1>
          <p className="text-sm text-muted-foreground">{selectedWorkout.focus}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))]">
          <CompactExerciseList
            workout={selectedWorkout}
            dayOfWeek="Today"
            weekNumber={1}
            onFinishWorkout={handleFinishWorkout}
            onCancel={handleCancelWorkout}
          />
        </div>
      </div>
    );
  }

  // Custom workout setup
  if (pageState === 'custom-setup') {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="shrink-0 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-4 pb-3 bg-card/80 border-b border-border/50 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Build Workout</h1>
            <p className="text-sm text-muted-foreground">Add your exercises</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleBack}>Cancel</Button>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-32 px-4 pt-4 space-y-4">
          {/* Workout Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Workout Name (optional)</label>
            <Input
              placeholder="e.g., Morning Lift"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
            />
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Exercises</label>
            {customExercises.map((exercise, index) => (
              <Card key={index} className="p-3">
                <div className="space-y-3">
                  {/* Exercise name with autocomplete */}
                  <div className="relative">
                    <Input
                      placeholder="Exercise name (type to search)"
                      value={exercise.name}
                      onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)}
                      onFocus={() => setFocusedInputIndex(index)}
                      onBlur={() => {
                        // Delay to allow click on suggestion
                        setTimeout(() => setFocusedInputIndex(null), 200);
                      }}
                      autoComplete="off"
                    />
                    {/* Suggestion dropdown */}
                    {focusedInputIndex === index && exerciseSuggestions.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {isSearching && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
                        )}
                        {exerciseSuggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent capitalize transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSuggestion(index, suggestion);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Sets</label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={exercise.sets}
                        onChange={(e) => handleUpdateExercise(index, 'sets', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Reps</label>
                      <Input
                        type="text"
                        value={exercise.reps}
                        onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Rest</label>
                      <Input
                        type="text"
                        value={exercise.rest}
                        onChange={(e) => handleUpdateExercise(index, 'rest', e.target.value)}
                      />
                    </div>
                  </div>
                  {customExercises.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => handleRemoveExercise(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </Card>
            ))}

            <Button variant="outline" className="w-full" onClick={handleAddExercise}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </div>

        {/* Start Button */}
        <div className="shrink-0 px-4 py-3 border-t border-border/50 bg-card/80 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <Button className="w-full h-12 text-lg font-bold" onClick={handleStartCustomWorkout}>
            Start Workout
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Exercise suggestions datalist for autofill */}
        <datalist id="exercise-suggestions">
          {COMMON_EXERCISES.map((exercise) => (
            <option key={exercise} value={exercise} />
          ))}
        </datalist>
      </div>
    );
  }

  // Templates view
  if (pageState === 'templates') {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="shrink-0 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-4 pb-3 bg-card/80 border-b border-border/50 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Choose Template</h1>
            <p className="text-sm text-muted-foreground">Pick a workout to start</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleBack}>Back</Button>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] px-4 pt-4 space-y-2">
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
    );
  }

  // Initial choice view
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="shrink-0 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-4 pb-3 bg-card/80 border-b border-border/50 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Quick Workout</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] px-4 pt-8 space-y-4">
        <p className="text-center text-muted-foreground mb-6">
          How would you like to start?
        </p>
        
        {/* Follow Template */}
        <Card 
          className="cursor-pointer hover:border-primary transition-colors" 
          onClick={() => setPageState('templates')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Follow a Template</h3>
              <p className="text-sm text-muted-foreground">
                Choose from pre-built workout routines
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Build Your Own */}
        <Card 
          className="cursor-pointer hover:border-primary transition-colors" 
          onClick={handleStartCustom}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-full bg-secondary text-secondary-foreground">
              <Plus className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Build Your Own</h3>
              <p className="text-sm text-muted-foreground">
                Create a custom workout from scratch
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
