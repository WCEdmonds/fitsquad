'use client';
import { GenerateTailoredWorkoutPlanOutput } from '@/ai/flows/generate-tailored-workout-plan';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dumbbell, Zap, User } from 'lucide-react';

interface WorkoutPrintViewProps {
  plan: GenerateTailoredWorkoutPlanOutput;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const PrintPlan = ({ title, workouts }: { title: string, workouts: any[] | undefined }) => {
    
    const workoutMap = new Map(workouts?.map(w => [w.day, w]));

    return (
        <div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                {title === 'Individual Plan' ? <User /> : (title.includes('Strength') ? <Dumbbell/> : <Zap />)}
                {title}
            </h2>
            <Table className="border">
                <TableHeader>
                    <TableRow>
                        {daysOfWeek.map(day => (
                            <TableHead key={day} className="border text-center">{day}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        {daysOfWeek.map(day => {
                            const workout = workoutMap.get(day);
                            return (
                                <TableCell key={day} className="h-32 border align-top p-2">
                                    {workout && (
                                        <div className="text-xs">
                                            <Badge variant="secondary" className="mb-1">{workout.focus}</Badge>
                                            <ul className="list-disc list-inside">
                                                 {workout.main_workout.slice(0, 3).map((ex: any) => (
                                                    <li key={ex.name}>{ex.name}</li>
                                                 ))}
                                                 {workout.main_workout.length > 3 && (
                                                     <li>...and more</li>
                                                 )}
                                            </ul>
                                        </div>
                                    )}
                                </TableCell>
                            )
                        })}
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}

export function WorkoutPrintView({ plan }: WorkoutPrintViewProps) {
  const isIndividualPlan = !!plan.individual_plan;

  return (
    <div className="p-4 space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold">{plan.title}</h1>
            <p className="text-muted-foreground">
                Weekly Workout Schedule
            </p>
        </div>
        
      {isIndividualPlan ? (
          <PrintPlan title="Individual Plan" workouts={plan.individual_plan} />
      ) : (
          <div className="space-y-8">
            <PrintPlan title="Strength Focus Plan" workouts={plan.strength_focus_plan} />
            <PrintPlan title="Running Focus Plan" workouts={plan.running_focus_plan} />
          </div>
      )}

      <div className="pt-4">
          <h3 className="text-lg font-semibold">Common Weaknesses Identified</h3>
           <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {plan.common_weaknesses.map((weakness, index) => (
                <li key={index}>{weakness}</li>
              ))}
            </ul>
      </div>

    </div>
  );
}
