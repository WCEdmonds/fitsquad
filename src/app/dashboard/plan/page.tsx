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
            haptics.notification();
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

  // NATIVE LAYOUT: Compact calendar-first view
  if (isNative) {
    return (
      <>
        <div className="hidden print-only">
          {teamPlan && <PlanPrintView plan={teamPlan} viewMode="daily" selectedDate={selectedDate} />}
        </div>

        <div className="flex flex-col h-full bg-background">
          {/* Native Header with WeekSelector and Profile */}
          <div className="flex items-center justify-between border-b border-border/40 bg-background sticky top-0 z-10">
             <div className="flex-1 overflow-hidden">
                <WeekSelector
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    className="flex-shrink-0"
                    isNative={true}
                    hasChanges={hasChanges}
                    onAcknowledgeChanges={handleAcknowledgeChanges}
                    completedDates={completedDates}
                />
             </div>
             <div className="pr-2 pl-1 flex-shrink-0 self-center">
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center cursor-pointer">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                        </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{userAccount?.firstName} {userAccount?.lastName}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/history">
                        <History className="mr-2 h-4 w-4" />
                        Completed Workouts
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/teams/create">
                        <Sword className="mr-2 h-4 w-4" />
                        Create New Team
                      </Link>
                    </DropdownMenuItem>
                    {userAccount?.accountType === 'Commander' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/manage-teams">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Manage Teams
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => {
                        // Handle logout if needed, passed from props or context?
                        // For now just redirect to login if auth context available, but we are inside component.
                        // Ideally pass a handler. Using simple href for now or just standard signout.
                         import('@/firebase').then(({ auth }) => {
                             auth.signOut();
                             // Router replace is handled by auth listener usually, or we can force it
                             window.location.href = '/login';
                         });
                    }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>

          {/* Compact Exercise List */}
          <CompactExerciseList
            workout={todaysWorkout}
            dayOfWeek={dayOfWeek}
            weekNumber={currentWeekInCycle + 1}
            onFinishWorkout={handleFinishWorkout}
          />
        </div>

        {showSummary && workoutStats && (
          <WorkoutSummary
            duration={workoutStats.duration}
            volume={workoutStats.volume}
            sets={workoutStats.sets}
            onClose={() => setShowSummary(false)}
          />
        )}
      </>
    );
  }

  // WEB LAYOUT: 5-Day Calendar
  return (
    <>
      <div className="hidden print-only">
        {teamPlan && <PlanPrintView plan={teamPlan} viewMode="daily" selectedDate={selectedDate} />}
      </div>

      <div className="container mx-auto p-6 no-print pb-24 md:pb-4">
        {teamPlan ? (
          <FiveDayCalendar
            plan={teamPlan}
            userId={user?.uid || ''}
            teamId={userAccount?.teamId || ''}
            daysToShow={10}
          />
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
