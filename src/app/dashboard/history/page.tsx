'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Clock, Dumbbell, Calendar, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function HistoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [workouts, setWorkouts] = useState<any[]>([]);

  // Fetch user's completed workouts
  // Using a query to get them ordered by date descending
  // Assuming 'users/{uid}/workouts' is the collection
  // Fetch user's completed workouts
  // Using a query to get them ordered by date descending
  // Assuming 'users/{uid}/workouts' is the collection
  const workoutsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, 'users', user.uid, 'workouts'),
        orderBy('date', 'desc'),
        limit(50) // Limit to 50 for now
      );
  }, [user, firestore]);

  const { data: workoutsData, isLoading, error } = useCollection(workoutsQuery);

  useEffect(() => {
    if (workoutsData) {
        // Normalize date objects if needed (Firestore Timestamp vs Date)
        const normalized = workoutsData.map(w => ({
            ...w,
            date: w.date?.toDate ? w.date.toDate() : new Date(w.date || Date.now())
        }));
        setWorkouts(normalized);
    }
  }, [workoutsData]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <h3 className="font-bold">Error Loading History</h3>
            <p>{error.message}</p>
            {/* If it's an index error, the message usually contains a link */}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <div className="flex items-center gap-3 mb-8">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Workout History</h1>
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Workout History</h1>
      </div>

      {!workouts || workouts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">No completed workouts found yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Finish a workout from your Plan to see it here!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workouts.map((workout) => (
                <Card key={workout.id} className="hover:shadow-md transition-shadow cursor-default">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    {workout.workoutName || "Workout"}
                                </CardTitle> 
                                <CardDescription className="flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(workout.date, 'MMM d, yyyy')}
                                </CardDescription>
                             </div>
                             {workout.duration && (
                                 <Badge variant="secondary" className="flex items-center gap-1">
                                     <Clock className="h-3 w-3" />
                                     {Math.floor(workout.duration / 60)}m
                                 </Badge>
                             )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                             <div className="flex flex-col">
                                 <span className="text-muted-foreground text-xs uppercase font-medium">Volume</span>
                                 <span className="font-semibold">{workout.volume ? `${workout.volume.toLocaleString()} lbs` : '--'}</span>
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-muted-foreground text-xs uppercase font-medium">Sets</span>
                                 <span className="font-semibold">{workout.sets || '--'}</span>
                             </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
