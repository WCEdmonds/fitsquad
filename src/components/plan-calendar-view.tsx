"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkoutEditorDialog } from '@/components/workout-editor-dialog';

interface PlanCalendarViewProps {
  plan: {
    weeks: Array<{
      weekNumber: number;
      days: Array<{
        dayOfWeek: string;
        workout: any | null;
      }>;
    }>;
  };
  onUpdateWorkout: (weekIndex: number, dayIndex: number, workout: any) => void;
  canEdit: boolean;
}

export function PlanCalendarView({ plan, onUpdateWorkout, canEdit }: PlanCalendarViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(0); // Show 2 weeks at a time
  const [selectedDay, setSelectedDay] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const weeksToShow = 2; // Show 2 weeks at a time
  const displayedWeeks = plan.weeks.slice(currentWeekStart, currentWeekStart + weeksToShow);

  function handleDayClick(weekIndex: number, dayIndex: number) {
    setSelectedDay({ weekIndex: currentWeekStart + weekIndex, dayIndex });
    setIsDialogOpen(true);
  }

  function handleSaveWorkout(workout: any) {
    if (selectedDay) {
      onUpdateWorkout(selectedDay.weekIndex, selectedDay.dayIndex, workout);
    }
    setIsDialogOpen(false);
    setSelectedDay(null);
  }

  function handleDeleteWorkout() {
    if (selectedDay) {
      onUpdateWorkout(selectedDay.weekIndex, selectedDay.dayIndex, null);
    }
    setIsDialogOpen(false);
    setSelectedDay(null);
  }

  const currentWorkout = selectedDay
    ? plan.weeks[selectedDay.weekIndex]?.days[selectedDay.dayIndex]?.workout
    : null;

  const currentDayName = selectedDay
    ? plan.weeks[selectedDay.weekIndex]?.days[selectedDay.dayIndex]?.dayOfWeek
    : null;

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeekStart(Math.max(0, currentWeekStart - weeksToShow))}
          disabled={currentWeekStart === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="text-sm font-medium">
          Weeks {currentWeekStart + 1} - {Math.min(currentWeekStart + weeksToShow, plan.weeks.length)}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeekStart(Math.min(plan.weeks.length - weeksToShow, currentWeekStart + weeksToShow))}
          disabled={currentWeekStart + weeksToShow >= plan.weeks.length}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="space-y-6">
        {displayedWeeks.map((week, weekIdx) => (
          <div key={week.weekNumber}>
            <h3 className="text-lg font-semibold mb-3">Week {week.weekNumber}</h3>
            <div className="grid grid-cols-7 gap-2">
              {week.days.map((day, dayIdx) => (
                <Card
                  key={`${week.weekNumber}-${day.dayOfWeek}`}
                  className={cn(
                    "p-3 cursor-pointer transition-all hover:shadow-md min-h-[120px]",
                    canEdit && "hover:border-primary",
                    !canEdit && "cursor-default"
                  )}
                  onClick={() => handleDayClick(weekIdx, dayIdx)}
                >
                  <div className="space-y-2">
                    <div className="font-medium text-sm">{day.dayOfWeek}</div>

                    {day.workout ? (
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-primary">
                          {day.workout.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {day.workout.focus}
                        </div>
                        {day.workout.exercises && (
                          <div className="text-xs text-muted-foreground">
                            {day.workout.exercises.length} exercise{day.workout.exercises.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-16 text-muted-foreground">
                        {canEdit ? (
                          <div className="text-center">
                            <Plus className="h-6 w-6 mx-auto mb-1" />
                            <div className="text-xs">Add workout</div>
                          </div>
                        ) : (
                          <div className="text-xs">Rest day</div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Workout editor dialog */}
      {selectedDay && (
        <WorkoutEditorDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedDay(null);
          }}
          onSave={handleSaveWorkout}
          onDelete={handleDeleteWorkout}
          workout={currentWorkout}
          dayName={currentDayName || ''}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
