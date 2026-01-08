'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Copy, Clipboard, GripVertical } from 'lucide-react';
import { WorkoutEditorDialog } from '@/components/workout-editor-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  addDays
} from 'date-fns';

interface PlanMonthViewProps {
  plan: {
    weeks: Array<{
      weekNumber: number;
      days: Array<{
        dayOfWeek: string;
        workout: any | null;
      }>;
    }>;
    cycleStartDate?: string;
  };
  onUpdateWorkout: (weekIndex: number, dayIndex: number, workout: any) => void;
  canEdit: boolean;
  teamId?: string;
  userId?: string;
}

export function PlanMonthView({ plan, onUpdateWorkout, canEdit, teamId, userId }: PlanMonthViewProps) {
  const { toast } = useToast();
  
  // State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedWorkout, setCopiedWorkout] = useState<any | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<{ weekIndex: number; dayIndex: number } | null>(null);

  // Helper: Map a calendar date to plan indices
  const getPlanIndices = (date: Date): { weekIndex: number; dayIndex: number } | null => {
    if (!plan.cycleStartDate) return null;
    
    const cycleStart = new Date(plan.cycleStartDate);
    const startMonday = startOfWeek(cycleStart, { weekStartsOn: 1 }); // Normalize to Monday
    
    // Normalize comparison date to start of day to avoid time discrepancies
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const baseDate = new Date(startMonday);
    baseDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
    
    if (diffDays < 0) return null; 
    
    const weekIndex = Math.floor(diffDays / 7);
    const dayIndex = diffDays % 7; 
    
    if (weekIndex >= plan.weeks.length) return null;

    return { weekIndex, dayIndex };
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); 
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Handlers
  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const handleDayClick = (date: Date) => {
    const indices = getPlanIndices(date);
    if (indices) {
      setSelectedDay(indices);
      setIsDialogOpen(true);
    }
  };

  const handleSaveWorkout = (workout: any) => {
    if (selectedDay) {
      onUpdateWorkout(selectedDay.weekIndex, selectedDay.dayIndex, workout);
    }
    setIsDialogOpen(false);
    setSelectedDay(null);
  };

  const handleDeleteWorkout = () => {
    if (selectedDay) {
      onUpdateWorkout(selectedDay.weekIndex, selectedDay.dayIndex, null);
    }
    setIsDialogOpen(false);
    setSelectedDay(null);
  };

  // Drag & Drop
  const handleDragStart = (indices: { weekIndex: number; dayIndex: number }, e: React.DragEvent) => {
    if (!canEdit) return;
    setDraggedFrom(indices);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); 
  };

  const handleDrop = (targetIndices: { weekIndex: number; dayIndex: number }, e: React.DragEvent) => {
    e.preventDefault();
    if (!canEdit || !draggedFrom) return;

    const sourceWorkout = plan.weeks[draggedFrom.weekIndex]?.days[draggedFrom.dayIndex]?.workout;
    const targetWorkout = plan.weeks[targetIndices.weekIndex]?.days[targetIndices.dayIndex]?.workout;

    // Swap
    onUpdateWorkout(targetIndices.weekIndex, targetIndices.dayIndex, sourceWorkout);
    onUpdateWorkout(draggedFrom.weekIndex, draggedFrom.dayIndex, targetWorkout);

    setDraggedFrom(null);
    toast({
      title: "Workout Moved",
      description: "Workout moved successfully."
    });
  };

  // Copy/Paste
  const handleCopy = (workout: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setCopiedWorkout(JSON.parse(JSON.stringify(workout)));
    toast({ title: "Copied", description: "Workout copied to clipboard." });
  };

  const handlePaste = (indices: { weekIndex: number; dayIndex: number }, e: React.MouseEvent) => {
    e.stopPropagation();
    if (copiedWorkout) {
      onUpdateWorkout(indices.weekIndex, indices.dayIndex, copiedWorkout);
      toast({ title: "Pasted", description: "Workout pasted." });
    }
  };

  // Helpers for dialog
  const currentWorkout = selectedDay 
    ? plan.weeks[selectedDay.weekIndex]?.days[selectedDay.dayIndex]?.workout 
    : null;
    
  // Use the actual clicked date calculation for the dialog title to avoid index mapping errors
  const currentDayName = useMemo(() => {
    if (!selectedDay || !plan.cycleStartDate) return '';
    const cycleStart = new Date(plan.cycleStartDate);
    const startMonday = startOfWeek(cycleStart, { weekStartsOn: 1 });
    return format(addDays(startMonday, (selectedDay.weekIndex * 7) + selectedDay.dayIndex), 'EEEE, MMM d');
  }, [selectedDay, plan.cycleStartDate]);

  // Calculate generic weekDays list for copy dialog (flattened)
  const weekDaysForCopy = useMemo(() => {
    if (!plan.cycleStartDate) return [];
    return plan.weeks.flatMap((week, wIdx) => 
      week.days.map((d, dIdx) => ({
        weekIndex: wIdx,
        dayIndex: dIdx,
        dayName: `Week ${week.weekNumber} - ${d.dayOfWeek}`,
        hasWorkout: !!d.workout
      }))
    );
  }, [plan]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <h2 className="text-xl font-bold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button variant="outline" onClick={handleNextMonth}>
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden shadow-sm">
        {/* Day Names */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="bg-muted/50 p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Calendar Cells */}
        {calendarDays.map((date, idx) => {
          const indices = getPlanIndices(date);
          const isOutsideMonth = !isSameMonth(date, currentMonth);
          const isTodayDate = isToday(date);
          
          let content = null;
          let hasWorkout = false;
          let workout = null;
          let isDragging = false;
          
          if (indices) {
            const dayData = plan.weeks[indices.weekIndex]?.days[indices.dayIndex];
            workout = dayData?.workout;
            hasWorkout = !!workout;
            isDragging = draggedFrom?.weekIndex === indices.weekIndex && draggedFrom?.dayIndex === indices.dayIndex;
            
            if (workout) {
              const displayName = workout.name || 'Custom';
              
              content = (
                <div className="space-y-1 overflow-hidden">
                  <div className="text-xs font-semibold text-primary truncate">
                    {displayName}
                  </div>
                   {/* Always show exercises to give context */}
                  {workout.exercises && workout.exercises.length > 0 ? (
                     <div className="text-[10px] text-muted-foreground space-y-0.5">
                       {workout.exercises.slice(0, 2).map((ex: any, i: number) => (
                         <div key={i} className="truncate capitalize">• {ex.name}</div>
                       ))}
                       {workout.exercises.length > 2 && <div className="italic">+{workout.exercises.length - 2} more</div>}
                     </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {workout.focus}
                    </div>
                  )}

                  {/* Copy Button (Hover) */}
                  {canEdit && (
                    <div className="absolute top-1 right-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-5 w-5 bg-background/80 hover:bg-background" onClick={(e) => handleCopy(workout, e)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            } else if (canEdit && !workout) {
               // Empty slot placeholder or paste button
               content = (
                 <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedWorkout ? (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1" onClick={(e) => handlePaste(indices, e)}>
                        <Clipboard className="h-3 w-3 mr-1" /> Paste
                      </Button>
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground/50" />
                    )}
                 </div>
               );
            }
          }

          return (
            <div 
              key={date.toISOString()}
              className={cn(
                "min-h-[100px] bg-background p-2 relative group md:min-h-[120px]",
                isOutsideMonth && "bg-muted/20 text-muted-foreground",
                indices && canEdit && "cursor-pointer hover:bg-muted/10",
                !indices && "bg-muted/10 cursor-not-allowed",
                isTodayDate && "ring-1 ring-inset ring-primary",
                isDragging && "opacity-50 border-2 border-dashed border-primary"
              )}
              onClick={() => handleDayClick(date)}
              onDragOver={(e) => {
                if (indices && canEdit) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={(e) => {
                if (indices && canEdit) handleDrop(indices, e);
              }}
              draggable={canEdit && hasWorkout}
              onDragStart={(e) => {
                if (indices && hasWorkout) handleDragStart(indices, e);
              }}
            >
              {/* Date Number */}
              <div className={cn(
                "text-xs font-medium mb-1", 
                isTodayDate ? "text-primary" : "text-muted-foreground"
              )}>
                {format(date, 'd')}
              </div>
              
              {/* Content */}
              {content}

              {!indices && (
                <div className="text-[10px] text-muted-foreground/30 italic mt-2">
                  No Plan
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Editor Dialog */}
      {selectedDay && currentWorkout !== undefined && (
        <WorkoutEditorDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedDay(null);
          }}
          onSave={handleSaveWorkout}
          onDelete={handleDeleteWorkout}
          workout={currentWorkout}
          dayName={currentDayName}
          canEdit={canEdit}
          teamId={teamId}
          userId={userId}
          weekDays={weekDaysForCopy}
          onCopyToDay={(targets, w) => {
             targets.forEach(t => onUpdateWorkout(t.weekIndex, t.dayIndex, w));
          }}
        />
      )}
    </div>
  );
}
