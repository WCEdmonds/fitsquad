"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Plus, ChevronLeft, ChevronRight, Copy, Clipboard, GripVertical } from 'lucide-react';
import { WorkoutEditorDialog } from '@/components/workout-editor-dialog';
import { useToast } from '@/hooks/use-toast';

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
  teamId?: string;
  userId?: string;
}

export function PlanCalendarView({ plan, onUpdateWorkout, canEdit, teamId, userId }: PlanCalendarViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(0); // Show 2 weeks at a time
  const [selectedDay, setSelectedDay] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedWorkout, setCopiedWorkout] = useState<any | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const { toast } = useToast();

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

  // Copy/Paste functionality
  function handleCopyWorkout(weekIndex: number, dayIndex: number, e: React.MouseEvent) {
    e.stopPropagation();
    const workout = plan.weeks[weekIndex]?.days[dayIndex]?.workout;
    if (workout) {
      setCopiedWorkout(JSON.parse(JSON.stringify(workout))); // Deep copy
      toast({
        title: "Workout Copied",
        description: `${workout.name} copied. Click any day to paste.`,
      });
    }
  }

  function handlePasteWorkout(weekIndex: number, dayIndex: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (copiedWorkout) {
      onUpdateWorkout(weekIndex, dayIndex, copiedWorkout);
      toast({
        title: "Workout Pasted",
        description: `${copiedWorkout.name} added to ${plan.weeks[weekIndex]?.days[dayIndex]?.dayOfWeek}.`,
      });
    }
  }

  // Drag and drop functionality
  function handleDragStart(weekIndex: number, dayIndex: number, e: React.DragEvent) {
    if (!canEdit) return;
    setDraggedFrom({ weekIndex, dayIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox
  }

  function handleDragOver(e: React.DragEvent) {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(weekIndex: number, dayIndex: number, e: React.DragEvent) {
    e.preventDefault();
    if (!canEdit || !draggedFrom) return;

    const sourceWorkout = plan.weeks[draggedFrom.weekIndex]?.days[draggedFrom.dayIndex]?.workout;
    const targetWorkout = plan.weeks[weekIndex]?.days[dayIndex]?.workout;

    // Swap workouts
    onUpdateWorkout(weekIndex, dayIndex, sourceWorkout);
    onUpdateWorkout(draggedFrom.weekIndex, draggedFrom.dayIndex, targetWorkout);

    setDraggedFrom(null);
    toast({
      title: "Workout Moved",
      description: sourceWorkout
        ? `${sourceWorkout.name} moved to ${plan.weeks[weekIndex]?.days[dayIndex]?.dayOfWeek}.`
        : "Workout moved successfully.",
    });
  }

  function handleDragEnd() {
    setDraggedFrom(null);
  }

  function handleCopyToDay(targetDays: Array<{ weekIndex: number; dayIndex: number }>, workout: any) {
    targetDays.forEach(({ weekIndex, dayIndex }) => {
      onUpdateWorkout(weekIndex, dayIndex, workout);
    });
  }

  const currentWorkout = selectedDay
    ? plan.weeks[selectedDay.weekIndex]?.days[selectedDay.dayIndex]?.workout
    : null;

  const currentDayName = selectedDay
    ? plan.weeks[selectedDay.weekIndex]?.days[selectedDay.dayIndex]?.dayOfWeek
    : null;

  // Generate list of all days (excluding current selected day) for copy dialog
  const weekDaysForCopy = selectedDay
    ? plan.weeks.flatMap((week, weekIdx) =>
        week.days.map((day, dayIdx) => ({
          weekIndex: weekIdx,
          dayIndex: dayIdx,
          dayName: `Week ${week.weekNumber} - ${day.dayOfWeek}`,
          hasWorkout: !!day.workout,
        }))
      ).filter(
        (day) => !(day.weekIndex === selectedDay.weekIndex && day.dayIndex === selectedDay.dayIndex)
      )
    : [];

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

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">
            Weeks {currentWeekStart + 1} - {Math.min(currentWeekStart + weeksToShow, plan.weeks.length)}
          </div>
          {copiedWorkout && (
            <div className="flex items-center gap-2 text-xs bg-primary/10 px-3 py-1 rounded-full">
              <Clipboard className="h-3 w-3" />
              <span>{copiedWorkout.name} copied</span>
            </div>
          )}
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
              {week.days.map((day, dayIdx) => {
                const absoluteWeekIdx = currentWeekStart + weekIdx;
                const isDragging = draggedFrom?.weekIndex === absoluteWeekIdx && draggedFrom?.dayIndex === dayIdx;

                return (
                  <Card
                    key={`${week.weekNumber}-${day.dayOfWeek}`}
                    draggable={canEdit && day.workout !== null}
                    onDragStart={(e) => handleDragStart(absoluteWeekIdx, dayIdx, e)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(absoluteWeekIdx, dayIdx, e)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "p-3 transition-all hover:shadow-md min-h-[120px] relative",
                      canEdit && "cursor-pointer hover:border-primary",
                      !canEdit && "cursor-default",
                      isDragging && "opacity-50 border-dashed border-2",
                      draggedFrom && !isDragging && "border-green-300"
                    )}
                    onClick={() => handleDayClick(weekIdx, dayIdx)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{day.dayOfWeek}</div>
                        {canEdit && day.workout && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleCopyWorkout(absoluteWeekIdx, dayIdx, e)}
                              title="Copy workout"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {day.workout && (
                              <div className="cursor-move" title="Drag to move">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

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
                        <div className="flex flex-col items-center justify-center h-16 text-muted-foreground">
                          {canEdit ? (
                            <>
                              <Plus className="h-6 w-6 mb-1" />
                              <div className="text-xs">Add workout</div>
                              {copiedWorkout && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1 h-6 text-xs"
                                  onClick={(e) => handlePasteWorkout(absoluteWeekIdx, dayIdx, e)}
                                >
                                  <Clipboard className="h-3 w-3 mr-1" />
                                  Paste
                                </Button>
                              )}
                            </>
                          ) : (
                            <div className="text-xs">Rest day</div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
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
          teamId={teamId}
          userId={userId}
          weekDays={weekDaysForCopy}
          onCopyToDay={handleCopyToDay}
        />
      )}
    </div>
  );
}
