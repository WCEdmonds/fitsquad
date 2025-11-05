"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlannerForm, type PlannerFormValues } from '@/components/planner-form';
import { useToast } from "@/hooks/use-toast";
import { generateTailoredWorkoutPlan, type GenerateTailoredWorkoutPlanOutput } from '@/ai/flows/generate-tailored-workout-plan';
import { Calendar, FileText, Loader2, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser, getCollectionNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { WorkoutCalendarView } from '@/components/workout-calendar-view';
import { getISOWeek, startOfWeek } from 'date-fns';

export default function PlannerPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<GenerateTailoredWorkoutPlanOutput | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount } = useDoc(userAccountRef);

  const teamMembersRef = useMemoFirebase(() => {
    if (!userAccount?.teamId) return null;
    return collection(firestore, 'teams', userAccount.teamId, 'members');
  }, [firestore, userAccount]);
  const { data: teamMembers } = useCollection(teamMembersRef);

  const [allSoldierData, setAllSoldierData] = useState<any[]>([]);
  useEffect(() => {
    if (teamMembers && firestore) {
      const fetchData = async () => {
        const dataPromises = teamMembers.map(async (member) => {
            const soldierDataRef = collection(firestore, 'accounts', member.id, 'soldierData');
            const data = await getCollectionNonBlocking<any>(soldierDataRef);
            // Get the most recent data entry
            const latestData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            return latestData ? { ...latestData, memberEmail: member.email } : null;
        });
        const results = await Promise.all(dataPromises);
        setAllSoldierData(results.filter(r => r !== null));
      };
      fetchData();
    }
  }, [teamMembers, firestore]);

  async function handleFormSubmit(values: PlannerFormValues) {
    if (!allSoldierData || allSoldierData.length === 0) {
      toast({
        title: "No Soldier Data",
        description: "Cannot generate a plan without soldier fitness data.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setWorkoutPlan(null);

    const fitnessData = allSoldierData.map(s => (
      `Soldier (${s.memberEmail}): MDL score ${s.mdl}, HRP score ${s.hrp}, SDC score ${s.sdc}, PLK score ${s.plk}, 2MR score ${s.twoMileRun}. Notes: ${s.healthInfo}`
    )).join('\n');

    try {
      const result = await generateTailoredWorkoutPlan({
        ...values,
        fitnessData,
      });
      setWorkoutPlan(result);
    } catch (error) {
      console.error('Workout plan generation failed:', error);
      toast({
        title: "Error",
        description: "Failed to generate workout plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const handleSavePlan = async () => {
    if (!workoutPlan || !userAccount?.teamId) {
       toast({ title: "Error", description: "No plan to save or team not found.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const workoutPlansRef = collection(firestore, 'teams', userAccount.teamId, 'workoutPlans');
      
      const today = new Date();
      const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const year = startDate.getFullYear();
      const week = getISOWeek(startDate);

      await addDocumentNonBlocking(workoutPlansRef, {
        teamId: userAccount.teamId,
        name: workoutPlan.title,
        description: `Week ${week}, ${year} workout plan`,
        startDate: startDate.toISOString(),
        planData: JSON.stringify(workoutPlan),
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Success", description: "Workout plan saved!" });
    } catch(err) {
      console.error(err);
      toast({ title: "Error", description: "Could not save the workout plan.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  const handleDownloadPdf = () => {
    window.print();
  }

  return (
    <div className="grid h-full gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 print:hidden">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Fitness Plan Generator</CardTitle>
            <CardDescription>
              Create a tailored workout plan for your unit based on their latest data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlannerForm onSubmit={handleFormSubmit} isLoading={isGenerating} />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="h-full min-h-[600px]">
          <CardHeader className="print:hidden">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{workoutPlan?.title ?? 'Generated Plan'}</CardTitle>
                  <CardDescription>
                    {workoutPlan ? 'Review the weekly plan below.' : 'Your generated workout plan will appear here.'}
                  </CardDescription>
                </div>
                {workoutPlan && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSavePlan} disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                      Save Plan
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPdf}>
                      <FileText className="mr-2" />
                      Download PDF
                    </Button>
                  </div>
                )}
              </div>
          </CardHeader>
          <CardContent>
            {isGenerating && (
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
            {!isGenerating && !workoutPlan && (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[400px]">
                <Calendar className="w-16 h-16 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold">Ready to build your plan?</h3>
                <p className="text-muted-foreground">Fill out the form on the left to get started.</p>
              </div>
            )}
            {workoutPlan && <WorkoutCalendarView plan={workoutPlan} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
