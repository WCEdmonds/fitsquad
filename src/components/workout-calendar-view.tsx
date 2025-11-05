'use client';

import { GenerateTailoredWorkoutPlanOutput } from '@/ai/flows/generate-tailored-workout-plan';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Target, Activity, Dumbbell, Zap } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface WorkoutCalendarViewProps {
  plan: GenerateTailoredWorkoutPlanOutput;
}

const DailyWorkoutDisplay = ({ dailyWorkouts }: { dailyWorkouts: GenerateTailoredWorkoutPlanOutput['strength_focus_plan']}) => {
  return (
     <div className="grid grid-cols-1 gap-4">
      {dailyWorkouts.map((dailyWorkout) => (
        <Card key={dailyWorkout.day}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{dailyWorkout.day}</span>
              <Badge variant="secondary">{dailyWorkout.focus}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">Warm-up</h4>
              <p className="text-sm text-muted-foreground">{dailyWorkout.warmup}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Main Workout</h4>
              <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercise</TableHead>
                    <TableHead>Sets</TableHead>
                    <TableHead>Reps / Duration</TableHead>
                    <TableHead>Rest</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyWorkout.main_workout.map((exercise, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                         <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">{exercise.name}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{exercise.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{exercise.sets}</TableCell>
                      <TableCell>{exercise.reps}</TableCell>
                      <TableCell>{exercise.rest}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </TooltipProvider>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-1">Cool-down</h4>
              <p className="text-sm text-muted-foreground">{dailyWorkout.cooldown}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


export function WorkoutCalendarView({ plan }: WorkoutCalendarViewProps) {
  return (
    <div className="space-y-6">
      
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2" /> Common Unit Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {plan.common_weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm">{weakness}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center"><Activity className="mr-2" /> Weekly Schedule</h2>
        <Tabs defaultValue="strength">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="strength">
              <Dumbbell className="mr-2" /> Strength Plan
            </TabsTrigger>
            <TabsTrigger value="running">
              <Zap className="mr-2" /> Running Plan
            </TabsTrigger>
          </TabsList>
          <TabsContent value="strength" className="mt-4">
             <DailyWorkoutDisplay dailyWorkouts={plan.strength_focus_plan} />
          </TabsContent>
          <TabsContent value="running" className="mt-4">
            <DailyWorkoutDisplay dailyWorkouts={plan.running_focus_plan} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
