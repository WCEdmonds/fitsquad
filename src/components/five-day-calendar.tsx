'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Dumbbell, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  addDays,
  isToday,
} from 'date-fns';
import { DailyWorkoutView } from './daily-workout-view';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
}

interface Workout {
  name: string;
  focus: string;
  exercises: Exercise[];
}

interface MultiDayCalendarProps {
  plan: {
    weeks: Array<{
      weekNumber: number;
      days: Array<{
        dayOfWeek: string;
        workout: Workout | null;
      }>;
    }>;
    cycleStartDate?: string;
  };
  userId: string;
  teamId: string;
  daysToShow?: number;
}

export function FiveDayCalendar({ plan, userId, teamId, daysToShow = 5 }: MultiDayCalendarProps) {
  const [centerDate, setCenterDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const getWeekInCycle = (date: Date) => {
    if (!plan.cycleStartDate) {
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const weekOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weekOfYear % 8;
    }

    const cycleStart = new Date(plan.cycleStartDate);
    const startMonday = new Date(cycleStart);
    startMonday.setDate(cycleStart.getDate() - cycleStart.getDay() + (cycleStart.getDay() === 0 ? -6 : 1));
    const diffTime = date.getTime() - startMonday.getTime();
    const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
    const weeksSinceStart = Math.floor(diffDays / 7);
    return Math.max(0, weeksSinceStart % 8);
  };

  const getWorkoutForDate = (date: Date): Workout | null => {
    const weekInCycle = getWeekInCycle(date);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    return plan.weeks?.[weekInCycle]?.days?.find(
      (day) => day.dayOfWeek === dayOfWeek
    )?.workout || null;
  };

  const getDays = () => {
    const days: Date[] = [];
    const startOffset = 0; // Start from centerDate (which acts as startDate now)
    
    for (let i = 0; i < daysToShow; i++) {
        days.push(addDays(centerDate, startOffset + i));
    }
    return days;
  };

  const handlePrevDays = () => setCenterDate(prev => addDays(prev, -daysToShow));
  const handleNextDays = () => setCenterDate(prev => addDays(prev, daysToShow));
  const handleTodayClick = () => setCenterDate(new Date());
  const handleDayClick = (date: Date) => setSelectedDay(date);

  const days = getDays();

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Training Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(days[0], 'MMM d')} - {format(days[days.length - 1], 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleTodayClick}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevDays}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextDays}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid - Dynamic Cols */}
        <div className={cn("flex-1 grid gap-4 min-h-0", daysToShow > 5 ? "grid-cols-5 grid-rows-2" : "grid-cols-5")}>
          {days.map((day) => {
            const workout = getWorkoutForDate(day);
            const isTodayDate = isToday(day);
            
            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  'cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg flex flex-col overflow-hidden',
                  isTodayDate && 'ring-2 ring-primary'
                )}
                onClick={() => handleDayClick(day)}
              >
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground uppercase">
                      {format(day, 'EEEE')}
                    </span>
                    {isTodayDate && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Today</span>
                    )}
                  </div>
                  <CardTitle className="text-4xl font-bold">{format(day, 'd')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 overflow-y-auto">
                  {workout ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-semibold">{workout.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{workout.focus}</p>
                      <div className="text-sm font-medium text-primary">
                        {workout.exercises.length} exercises
                      </div>
                      
                      {/* All exercises */}
                      <div className="space-y-2 border-t border-border/50 pt-3">
                        {workout.exercises.map((ex, i) => (
                          <div key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary font-medium">{i + 1}.</span>
                            <span>{ex.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Calendar className="h-12 w-12 mb-2 opacity-30" />
                      <span className="text-lg font-medium">Rest Day</span>
                      <span className="text-sm">Recovery time</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <DailyWorkoutView
              plan={plan}
              userId={userId}
              teamId={teamId}
              selectedDate={selectedDay}
              onDateChange={() => {}}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
