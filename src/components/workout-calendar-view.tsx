'use client';

import { GenerateTailoredWorkoutPlanOutput } from '@/ai/flows/generate-tailored-workout-plan';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Target, Activity } from 'lucide-react';

interface WorkoutCalendarViewProps {
  plan: GenerateTailoredWorkoutPlanOutput;
}

export function WorkoutCalendarView({ plan }: WorkoutCalendarViewProps) {
  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2" /> Common Weaknesses
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2" /> Focus Group Modifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {plan.focus_groups.map((group, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{group.name}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                    <p className="text-sm">{group.modifications}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center"><Activity className="mr-2" /> Weekly Schedule</h2>
        <div className="grid grid-cols-1 gap-4">
          {plan.weekly_plan.map((dailyWorkout) => (
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
                          <TableCell className="font-medium">{exercise.name}</TableCell>
                          <TableCell>{exercise.sets}</TableCell>
                          <TableCell>{exercise.reps}</TableCell>
                          <TableCell>{exercise.rest}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-1">Cool-down</h4>
                  <p className="text-sm text-muted-foreground">{dailyWorkout.cooldown}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
