"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, getDoc, addDoc, setDoc, collection, query, orderBy, limit, arrayUnion } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlanPrintView } from '@/components/plan-print-view';
import { WeekSelector } from '@/components/week-selector';
import { CompactExerciseList } from '@/components/compact-exercise-list';
import { FiveDayCalendar } from '@/components/five-day-calendar';
import { WorkoutSummary } from '@/components/workout-summary';
import { WorkoutOverview } from '@/components/workout-overview';
import { AddWorkoutDialog } from '@/components/add-workout-dialog';
import { cn } from '@/lib/utils';

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings, ShieldCheck, Sword, Calendar as CalendarIcon, History } from 'lucide-react';
import Link from 'next/link';
import { haptics } from '@/lib/haptics';

export default function PlanPage() {
  const [teamPlan, setTeamPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isNative, setIsNative] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hasChanges, setHasChanges] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [workoutStats, setWorkoutStats] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [userInitials, setUserInitials] = useState('');
  const [isWorkoutInProgress, setIsWorkoutInProgress] = useState(false);
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  const [personalWorkouts, setPersonalWorkouts] = useState<Record<string, any>>({});

  // Initialize persistence
  useEffect(() => {
    const persisted = localStorage.getItem('isWorkoutInProgress');
    if (persisted === 'true') {
        setIsWorkoutInProgress(true);
    }
  }, []);

  const handleStartWorkout = () => {
    setIsWorkoutInProgress(true);
    localStorage.setItem('isWorkoutInProgress', 'true');
  };

  const handleCancelWorkout = () => {
     if (confirm("Are you sure you want to cancel this workout? Progress will be lost.")) {
        setIsWorkoutInProgress(false);
        localStorage.removeItem('isWorkoutInProgress');
     }
  };

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount, isLoading: isAccountLoading } = useDoc(userAccountRef);

  // Fetch completed workouts for calendar indicators
  const workoutsRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'workouts'),
      orderBy('date', 'desc'),
      limit(50)
    );
  }, [firestore, user]);
  
  const { data: recentWorkouts } = useCollection(workoutsRef);
  
  const completedDates = useMemo(() => {
    const dates = new Set<string>();
    if (recentWorkouts) {
      recentWorkouts.forEach(w => {
        if (w.date) {
            const d = w.date.toDate ? w.date.toDate() : new Date(w.date);
            dates.add(d.toISOString().split('T')[0]);
        }
      });
    }
    return dates;
  }, [recentWorkouts]);

  // Load the team plan
  useEffect(() => {
    async function loadTeamPlan() {
      if (!userAccount?.teamId || !firestore) return;

      setIsLoading(true);
      try {
        const planRef = doc(firestore, 'teams', userAccount.teamId, 'mainPlan', 'current');
        const planSnap = await getDoc(planRef);

        if (planSnap.exists()) {
          setTeamPlan(planSnap.data());
        } else {
          setTeamPlan(null);
        }
      } catch (error: any) {
        console.error('❌ Error loading team plan:', error);
        toast({
          title: "Error Loading Plan",
          description: "Could not load the team plan.",
          variant: "destructive",
        });
        setTeamPlan(null);
      } finally {
        setIsLoading(false);
      }
    }


    if (userAccount) {
      loadTeamPlan();
      const firstInitial = userAccount.firstName?.charAt(0) ?? '';
      const lastInitial = userAccount.lastName?.charAt(0) ?? '';
      const emailInitial = user?.email?.charAt(0) ?? '';
      setUserInitials((firstInitial + lastInitial).toUpperCase() || emailInitial.toUpperCase());
    }
  }, [userAccount, firestore, toast, user]);

  // Load personal workout overrides
  useEffect(() => {
    async function loadPersonalWorkouts() {
      if (!user || !firestore) return;

      try {
        const { getDocs } = await import('firebase/firestore');
        const personalPlanRef = collection(firestore, 'users', user.uid, 'personalPlan');
        const snapshot = await getDocs(personalPlanRef);
        
        const workouts: Record<string, any> = {};
        snapshot.forEach(doc => {
          workouts[doc.id] = doc.data();
        });
        setPersonalWorkouts(workouts);
      } catch (e) {
        console.error("Error loading personal workouts", e);
      }
    }

    loadPersonalWorkouts();
  }, [user, firestore]);

  // Check for plan changes
  useEffect(() => {
    if (!teamPlan) return;

    // Logic: Compare plan's last updated timestamp with local storage
    const lastViewed = localStorage.getItem('lastViewedPlan');
    // Using updatedAt from plan or default to now if missing (mocking behavior if field doesn't exist yet)
    const planUpdated = teamPlan.updatedAt?.toDate()?.toISOString() || new Date().toISOString(); 
    
    // If no last viewed, or plan is newer
    if (!lastViewed || new Date(planUpdated) > new Date(lastViewed)) {
      setHasChanges(true); // Lighting up the bell
    }
  }, [teamPlan]);

  // Handle acknowledging changes
  const handleAcknowledgeChanges = () => {
    setHasChanges(false);
    localStorage.setItem('lastViewedPlan', new Date().toISOString());
    toast({
      title: "Changes Acknowledged",
      description: "You're up to date with the latest schedule.",
    });
  };

  const handleFinishWorkout = async (stats: any) => {
    setWorkoutStats(stats);
    setShowSummary(true);
    setIsWorkoutInProgress(false);
    localStorage.removeItem('isWorkoutInProgress');

    if (user && firestore) {
      try {
        await addDoc(collection(firestore, 'users', user.uid, 'workouts'), {
          ...stats,
          planId: teamPlan?.id || 'unknown',
          teamId: userAccount?.teamId || 'unknown',
          date: new Date(),
          workoutName: todaysWorkout?.name || 'Quick Workout'
        });
      } catch (e) {
        console.error("Error saving workout log", e);
      }
    }
  };

  // Add workout to personal calendar
  const handleAddWorkoutToPersonal = async (workout: any) => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    
    // Save to local state immediately
    setPersonalWorkouts(prev => ({
      ...prev,
      [dateKey]: workout
    }));

    // Persist to Firestore
    if (user && firestore) {
      try {
        await setDoc(
          doc(firestore, 'users', user.uid, 'personalPlan', dateKey),
          {
            ...workout,
            date: dateKey,
            addedAt: new Date().toISOString(),
          }
        );
        toast({
          title: "Workout Added",
          description: `${workout.name} added to your calendar.`,
        });
      } catch (e) {
        console.error("Error saving personal workout", e);
        toast({
          title: "Error",
          description: "Failed to save workout.",
          variant: "destructive",
        });
      }
    }
    setIsAddWorkoutOpen(false);
  };

  // Add workout to team plan (Supervisors only)
  const handleAddWorkoutToTeam = async (workout: any) => {
    if (!userAccount?.teamId || !firestore) return;
    
    // For team plans, we need to update the specific day in the plan
    // This is more complex as it requires modifying the plan structure
    toast({
      title: "Coming Soon",
      description: "Team plan editing will be available in the plan editor.",
    });
    setIsAddWorkoutOpen(false);
  };

  // Register for Push Notifications
  useEffect(() => {
    if (!isNative) return;

    const registerPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('User denied push notifications');
          return;
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          // Save token to user account in Firestore
          if (user) {
            try {
              await setDoc(doc(firestore, 'accounts', user.uid), {
                fcmTokens: arrayUnion(token.value),
                lastActive: new Date().toISOString()
              }, { merge: true });
            } catch (e) {
              console.error("Error saving FCM token:", e);
            }
          }
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.log('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
          console.log('Push received: ' + JSON.stringify(notification));
          // If notification payload indicates a schedule update, show indicator
          if (notification.data.type === 'schedule_update') {
            setHasChanges(true);
            haptics.success();
          }
        });

      } catch (e) {
        console.error('Error registering push notifications', e);
      }
    };

    registerPush();
    
    // Cleanup listeners
    return () => {
      if (isNative) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [isNative, toast]);

  // Calculate current week in cycle for selected date
  const getCurrentWeekInCycle = () => {
    if (!teamPlan?.cycleStartDate) {
      const startOfYear = new Date(selectedDate.getFullYear(), 0, 1);
      const weekOfYear = Math.floor((selectedDate.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weekOfYear % 8;
    }

    const cycleStart = new Date(teamPlan.cycleStartDate);
    const startMonday = new Date(cycleStart);
    startMonday.setDate(cycleStart.getDate() - cycleStart.getDay() + (cycleStart.getDay() === 0 ? -6 : 1));
    const diffTime = selectedDate.getTime() - startMonday.getTime();
    const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
    const weeksSinceStart = Math.floor(diffDays / 7);
    return Math.max(0, weeksSinceStart % 8);
  };

  const currentWeekInCycle = getCurrentWeekInCycle();
  const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

  const todaysWorkout = teamPlan?.weeks?.[currentWeekInCycle]?.days?.find(
    (day: any) => day.dayOfWeek === dayOfWeek
  )?.workout || null;

  if (isAccountLoading || isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!userAccount) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please log in to access the team plan.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const effectiveWorkout = todaysWorkout || personalWorkouts[selectedDate.toISOString().split('T')[0]];
  const shouldShowTracking = isWorkoutInProgress && effectiveWorkout;

  // NATIVE LAYOUT: Compact calendar-first view
  if (isNative) {
    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        {/* Print only view */}
        <div className="hidden print-only">
          {teamPlan && <PlanPrintView plan={teamPlan} viewMode="daily" selectedDate={selectedDate} />}
        </div>

        {/* Fixed Header with Title - Hidden during workout */}
        {!shouldShowTracking && (
          <div className="shrink-0 bg-card/80 border-b border-border/50 shadow-sm">
            <div className="pt-[calc(env(safe-area-inset-top)+0.75rem)] px-4 pb-2">
              <h1 className="text-2xl font-bold tracking-tight">Training Calendar</h1>
            </div>
            <div className="px-4 pb-2">
                <WeekSelector
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    className="flex-shrink-0 bg-transparent"
                    isNative={true}
                    hasChanges={hasChanges}
                    onAcknowledgeChanges={handleAcknowledgeChanges}
                    completedDates={completedDates}
                />
            </div>
          </div>
        )}

          {/* Scrollable Content - Full height during workout */}
          <div 
            className={cn(
              "flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))]",
              shouldShowTracking ? "pt-[calc(env(safe-area-inset-top)+0.5rem)]" : "px-4 pt-4"
            )} 
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
          {/* Conditional Rendering: Overview vs Tracking */}
          {!shouldShowTracking ? (
            <WorkoutOverview 
                workout={effectiveWorkout} 
                dayOfWeek={dayOfWeek} 
                onStart={handleStartWorkout}
                onAddWorkout={() => setIsAddWorkoutOpen(true)}
            />
          ) : (
            <CompactExerciseList
                workout={effectiveWorkout}
                dayOfWeek={dayOfWeek}
                weekNumber={currentWeekInCycle + 1}
                onFinishWorkout={handleFinishWorkout}
                onCancel={handleCancelWorkout}
            />
          )}
          </div>

        {showSummary && workoutStats && (
          <WorkoutSummary
            duration={workoutStats.duration}
            volume={workoutStats.volume}
            sets={workoutStats.sets}
            onClose={() => setShowSummary(false)}
          />
        )}

        {/* Add Workout Dialog */}
        <AddWorkoutDialog
          isOpen={isAddWorkoutOpen}
          onClose={() => setIsAddWorkoutOpen(false)}
          onAddToPersonal={handleAddWorkoutToPersonal}
          onAddToTeam={handleAddWorkoutToTeam}
          isSupervisor={userAccount?.accountType === 'Supervisor' || userAccount?.accountType === 'Commander'}
          dayOfWeek={dayOfWeek}
          selectedDate={selectedDate}
        />
      </div>
    );
  }

  // WEB LAYOUT: 5-Day Calendar
  return (
    <>
      <div className="hidden print-only">
        {teamPlan && <PlanPrintView plan={teamPlan} viewMode="daily" selectedDate={selectedDate} />}
      </div>
      <div className="pb-24 md:pb-4">
        {teamPlan ? (
          <Card>
            <FiveDayCalendar
              plan={teamPlan}
              userId={user?.uid || ''}
              teamId={userAccount?.teamId || ''}
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Workout Plan Yet</h3>
              <p className="text-muted-foreground text-center">
                Your team's workout plan hasn't been created yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
