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
import { generateTailoredWorkoutPlan } from '@/ai/flows/generate-tailored-workout-plan';
import { Bot, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

export default function PlannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  // 1. Get current user's account to find their teamId
  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount } = useDoc(userAccountRef);

  // 2. Get all members of the team
  const teamMembersRef = useMemoFirebase(() => {
    if (!userAccount?.teamId) return null;
    return collection(firestore, 'teams', userAccount.teamId, 'members');
  }, [firestore, userAccount]);
  const { data: teamMembers } = useCollection(teamMembersRef);

  // 3. For each member, get their soldierData. This is a bit complex.
  // We will fetch them individually for now. This could be optimized in the future.
  const [allSoldierData, setAllSoldierData] = useState<any[]>([]);
  useEffect(() => {
    if (teamMembers) {
      const fetchData = async () => {
        const dataPromises = teamMembers.map(member => {
            const soldierDataRef = collection(firestore, 'accounts', member.uid, 'soldierData');
            // This is a simplified fetch, ideally we'd get the latest document
            return getDocs(soldierDataRef).then(snap => 
              snap.docs.map(d => ({...d.data(), memberEmail: member.email}))
            );
        });
        const results = await Promise.all(dataPromises);
        setAllSoldierData(results.flat());
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

    setIsLoading(true);
    setWorkoutPlan(null);

    const fitnessData = allSoldierData.map(s => (
      `Soldier (${s.memberEmail}): AFT Score ${s.aftScore}, Run Time ${s.runTime} mins. Notes: ${s.healthInfo}`
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
              Use AI to create a tailored workout plan for your unit based on their latest data.
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Generated Plan</CardTitle>
                  <CardDescription>
                    Your AI-generated workout plan will appear here.
                  </CardDescription>
                </div>
                {workoutPlan && (
                  <Button variant="outline" disabled>
                    <FileText className="mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
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
