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
import { Calendar, FileText, Loader2, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser, getCollectionNonBlocking } from '@/firebase';
import { collection, doc, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { WorkoutCalendarView } from '@/components/workout-calendar-view';
import { getISOWeek, startOfWeek } from 'date-fns';
import { WorkoutPrintView } from '@/components/workout-print-view';
import {
  callGeneratePlan,
  type GenerateTailoredWorkoutPlanOutput,
} from '@/lib/cloudFunctions';

export default function PlannerPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<GenerateTailoredWorkoutPlanOutput | null>(null);
  const [generatedPlanId, setGeneratedPlanId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount, isLoading: isAccountLoading, error: accountError } = useDoc(userAccountRef);

  const teamMembersRef = useMemoFirebase(() => {
    if (!userAccount?.teamId) return null;
    return collection(firestore, 'teams', userAccount.teamId, 'members');
  }, [firestore, userAccount]);
  const { data: teamMembers, isLoading: isMembersLoading, error: membersError } = useCollection(teamMembersRef);

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
    console.log('🚀 Form submitted with values:', values);

    if (!user || !userAccount) {
      console.error('❌ No user or account:', { user: !!user, userAccount: !!userAccount });
      return;
    }

    let fitnessData;
    let isUnitPlan = false;
    let isIndividualPlan = false;

    if (userAccount.accountType === 'Soldier') {
        const soldierData = allSoldierData.find(s => s.accountId === user.uid);
        if (!soldierData) {
            console.error('❌ No soldier data found for user');
            toast({
                title: "No Fitness Data",
                description: "You must log your benchmark fitness data before generating a plan.",
                variant: "destructive",
            });
            return;
        }
        fitnessData = `Soldier: MDL score ${soldierData.mdl}, HRP score ${soldierData.hrp}, SDC score ${soldierData.sdc}, PLK score ${soldierData.plk}, 2MR score ${soldierData.twoMileRun}. Notes: ${soldierData.healthInfo}`;
        isIndividualPlan = true;
    } else {
        if (!allSoldierData || allSoldierData.length === 0) {
            console.error('❌ No soldier data available for unit');
            toast({
                title: "No Soldier Data",
                description: "Cannot generate a plan without soldier fitness data in your unit.",
                variant: "destructive",
            });
            return;
        }
        fitnessData = allSoldierData.map(s => (
            `Soldier (${s.memberEmail}): MDL score ${s.mdl}, HRP score ${s.hrp}, SDC score ${s.sdc}, PLK score ${s.plk}, 2MR score ${s.twoMileRun}. Notes: ${s.healthInfo}`
        )).join('\n');
        isUnitPlan = true;
    }

    console.log('📊 Fitness data prepared:', { isUnitPlan, isIndividualPlan, dataLength: fitnessData.length });

    setIsGenerating(true);
    setWorkoutPlan(null);
    setGeneratedPlanId(null);

    try {
      // Get Firebase ID token for authentication
      if (!user) {
        throw new Error('You must be logged in to generate a workout plan');
      }

      console.log('🔑 Getting ID token...');
      const idToken = await user.getIdToken();
      console.log('✅ ID token obtained');

      console.log('📡 Calling generatePlan API...');
      const result = await callGeneratePlan({
        fitnessData,
        trainingGoals: values.trainingGoals,
        additionalContext: values.additionalContext,
        days: values.days,
        equipmentAccess: values.equipmentAccess ?? undefined,
        isUnitPlan,
        isIndividualPlan,
      }, idToken);

      console.log('✅ Plan generated successfully:', result);
      setWorkoutPlan(result);
      setGeneratedPlanId(`temp-${Date.now()}`);

      toast({
        title: "Success!",
        description: "Workout plan generated successfully.",
      });

    } catch (error: any) {
      console.error('❌ Workout plan generation failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        title: "Error",
        description: error.message || "Failed to generate workout plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Generation complete, setting isGenerating to false');
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

      const docRef = await addDoc(workoutPlansRef, {
        teamId: userAccount.teamId,
        name: workoutPlan.title,
        description: `Week ${week}, ${year} workout plan`,
        startDate: startDate.toISOString(),
        planData: JSON.stringify(workoutPlan),
        createdAt: new Date().toISOString(),
      });

      setGeneratedPlanId(docRef.id); // Update with the real ID from Firestore
      console.log('✅ Workout plan saved successfully', docRef.id);
      toast({ title: "Success", description: "Workout plan saved!" });
    } catch(err: any) {
      console.error('❌ Error saving workout plan:', err);

      let errorMessage = `Could not save the workout plan: ${err.message}`;

      if (err.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check your account permissions and ensure you're part of a team.";
        console.error('Save permission details:', {
          userAccountType: userAccount?.accountType,
          teamId: userAccount?.teamId,
          errorCode: err.code,
        });
      }

      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  const handleDownloadPdf = () => {
    window.print();
  }

  // Show loading state while user account or team data is loading
  if (isAccountLoading || (userAccount?.teamId && isMembersLoading)) {
    return (
      <div className="grid h-full gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden print-only">
        {workoutPlan && <WorkoutPrintView plan={workoutPlan} />}
      </div>
      <div className="grid h-full gap-6 lg:grid-cols-3 no-print">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Smart Planner</CardTitle>
              <CardDescription>
                {userAccount?.accountType === 'Soldier'
                  ? "AI-powered workout plans tailored to your personal goals and fitness data."
                  : "AI-powered workout plans for your unit based on their latest fitness data."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlannerForm
                  onSubmit={handleFormSubmit}
                  isLoading={isGenerating}
                  accountType={userAccount?.accountType}
              />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full min-h-[600px]">
            <CardHeader>
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
              {workoutPlan && generatedPlanId && <WorkoutCalendarView plan={workoutPlan} planId={generatedPlanId} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}