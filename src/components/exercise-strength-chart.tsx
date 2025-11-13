"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Dumbbell } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Badge } from '@/components/ui/badge';

interface ExerciseStrengthChartProps {
  userId: string;
}

interface WorkoutLog {
  id: string;
  date: string;
  workoutName: string;
  exercises: Array<{
    exerciseName: string;
    completedSets: number;
    actualReps: string[];
    weight: string;
    notes: string;
  }>;
}

interface StrengthDataPoint {
  date: string;
  volume: number;
  maxWeight: number;
  totalReps: number;
  formattedDate: string;
}

export function ExerciseStrengthChart({ userId }: ExerciseStrengthChartProps) {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  // Fetch workout logs
  useEffect(() => {
    async function fetchWorkoutLogs() {
      if (!userId) return;

      setIsLoading(true);
      try {
        const logsRef = collection(firestore, 'users', userId, 'workoutLogs');
        const q = query(logsRef, orderBy('date', 'asc'));
        const snapshot = await getDocs(q);

        const logs: WorkoutLog[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() } as WorkoutLog);
        });

        setWorkoutLogs(logs);

        // Auto-select first exercise if available
        if (logs.length > 0 && logs[0].exercises.length > 0) {
          setSelectedExercise(logs[0].exercises[0].exerciseName);
        }
      } catch (error) {
        console.error('Error fetching workout logs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkoutLogs();
  }, [userId, firestore]);

  // Extract unique exercises
  const availableExercises = useMemo(() => {
    const exerciseSet = new Set<string>();
    workoutLogs.forEach((log) => {
      log.exercises.forEach((exercise) => {
        exerciseSet.add(exercise.exerciseName);
      });
    });
    return Array.from(exerciseSet).sort();
  }, [workoutLogs]);

  // Calculate strength metrics for selected exercise
  const strengthData = useMemo(() => {
    if (!selectedExercise) return [];

    const data: StrengthDataPoint[] = [];

    workoutLogs.forEach((log) => {
      const exercise = log.exercises.find((e) => e.exerciseName === selectedExercise);
      if (!exercise) return;

      // Parse weight (extract number from string like "135 lbs" or "60kg")
      const weightMatch = exercise.weight.match(/(\d+\.?\d*)/);
      const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;

      // Calculate metrics
      let totalReps = 0;
      let volume = 0;

      exercise.actualReps.forEach((repsStr) => {
        const reps = parseInt(repsStr) || 0;
        totalReps += reps;
        volume += weight * reps; // Volume = weight × reps
      });

      if (volume > 0 || totalReps > 0) {
        data.push({
          date: log.date,
          volume,
          maxWeight: weight,
          totalReps,
          formattedDate: new Date(log.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        });
      }
    });

    return data;
  }, [workoutLogs, selectedExercise]);

  // Calculate trend
  const trend = useMemo(() => {
    if (strengthData.length < 2) return 'neutral';

    const firstHalf = strengthData.slice(0, Math.ceil(strengthData.length / 2));
    const secondHalf = strengthData.slice(Math.ceil(strengthData.length / 2));

    const avgFirst = firstHalf.reduce((sum, d) => sum + d.volume, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, d) => sum + d.volume, 0) / secondHalf.length;

    const percentChange = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (percentChange > 5) return 'up';
    if (percentChange < -5) return 'down';
    return 'neutral';
  }, [strengthData]);

  const latestData = strengthData[strengthData.length - 1];
  const previousData = strengthData[strengthData.length - 2];
  const recentChange = latestData && previousData
    ? ((latestData.volume - previousData.volume) / previousData.volume) * 100
    : 0;

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (workoutLogs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Dumbbell className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Workout Logs Yet</h3>
          <p className="text-muted-foreground text-center">
            Complete workouts in the Plan page to track your strength progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Exercise Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Select an exercise..." />
            </SelectTrigger>
            <SelectContent>
              {availableExercises.map((exercise) => (
                <SelectItem key={exercise} value={exercise}>
                  {exercise}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trend Indicator */}
        {selectedExercise && strengthData.length > 0 && (
          <div className="flex items-center gap-2">
            {trend === 'up' && (
              <Badge className="bg-green-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Improving
              </Badge>
            )}
            {trend === 'down' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Declining
              </Badge>
            )}
            {trend === 'neutral' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Minus className="h-3 w-3" />
                Stable
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      {selectedExercise && strengthData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{selectedExercise} - Strength Progression</CardTitle>
            <CardDescription>
              Volume (weight × reps) over time
              {latestData && (
                <span className="block mt-1">
                  Latest: {latestData.volume.toLocaleString()} total volume
                  {recentChange !== 0 && (
                    <span className={recentChange > 0 ? 'text-green-600' : 'text-red-600'}>
                      {' '}({recentChange > 0 ? '+' : ''}{recentChange.toFixed(1)}% from last session)
                    </span>
                  )}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={strengthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  yAxisId="left"
                  label={{ value: 'Volume (lbs × reps)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Weight (lbs)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-semibold">{data.formattedDate}</p>
                          <p className="text-sm text-blue-600">
                            Volume: {data.volume.toLocaleString()}
                          </p>
                          <p className="text-sm text-orange-600">
                            Weight: {data.maxWeight} lbs
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total Reps: {data.totalReps}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="volume"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Volume"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="maxWeight"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Weight"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{strengthData.length}</div>
                <div className="text-xs text-muted-foreground">Sessions Logged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {latestData ? latestData.maxWeight : 0}
                </div>
                <div className="text-xs text-muted-foreground">Latest Weight (lbs)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {latestData ? latestData.totalReps : 0}
                </div>
                <div className="text-xs text-muted-foreground">Latest Total Reps</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        selectedExercise && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data for {selectedExercise}</h3>
              <p className="text-muted-foreground text-center">
                You haven't logged this exercise yet.
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
