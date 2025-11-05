"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlannerForm, type PlannerFormValues } from '@/components/planner-form';
import { useToast } from "@/hooks/use-toast";
import { generateTailoredWorkoutPlan } from '@/ai/flows/generate-tailored-workout-plan';
import { soldiers } from '@/lib/data';
import { Bot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleFormSubmit(values: PlannerFormValues) {
    setIsLoading(true);
    setWorkoutPlan(null);

    const fitnessData = soldiers.map(s => (
      `Soldier ${s.id} (${s.rank}): AFT Score ${s.aftScore}, Run ${Math.floor(s.runTime / 60)}:${(s.runTime % 60).toString().padStart(2, '0')}, Pushups ${s.pushups}, Situps ${s.situps}. Notes: ${s.healthNotes}`
    )).join('\n');

    try {
      const result = await generateTailoredWorkoutPlan({
        ...values,
        fitnessData,
      });
      setWorkoutPlan(result.workoutPlan);
    } catch (error) {
      console.error('AI workout plan generation failed:', error);
      toast({
        title: "Error",
        description: "Failed to generate workout plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid h-full gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Workout Plan Generator</CardTitle>
            <CardDescription>
              Use AI to create a tailored workout plan for your unit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlannerForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Generated Plan</CardTitle>
            <CardDescription>
              Your AI-generated workout plan will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <br />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
            {!isLoading && !workoutPlan && (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[400px]">
                <Bot className="w-16 h-16 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold">Ready to build your plan?</h3>
                <p className="text-muted-foreground">Fill out the form on the left to get started.</p>
              </div>
            )}
            {workoutPlan && (
              <div className="text-sm rounded-lg bg-muted p-4 whitespace-pre-wrap font-sans">
                {workoutPlan}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
