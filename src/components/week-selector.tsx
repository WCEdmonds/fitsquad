'use client';

import { useState, useRef } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday,
  setMonth,
  setYear,
  getYear,
  getMonth,
} from 'date-fns';

interface WeekSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
  isNative?: boolean;
  hasChanges?: boolean;
  onAcknowledgeChanges?: () => void;
  completedDates?: Set<string>;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function WeekSelector({
  selectedDate,
  onDateChange,
  className,
  isNative = false,
  hasChanges = false,
  onAcknowledgeChanges,
  completedDates = new Set(),
}: WeekSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(selectedDate, { weekStartsOn: 1 })
  );
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => getYear(selectedDate));

  // Generate days of the current week (Monday to Sunday)
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  const handleDayClick = (date: Date) => {
    haptics.light();
    onDateChange(date);
  };

  const handleTodayClick = () => {
    haptics.light();
    const today = new Date();
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    onDateChange(today);
  };

  const handlePrevWeek = () => {
    haptics.light();
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    haptics.light();
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX; // Initialize end to start position
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum distance to trigger swipe

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left -> next week
        handleNextWeek();
      } else {
        // Swiped right -> previous week
        handlePrevWeek();
      }
    }
    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Month picker handlers
  const handleMonthSelect = (monthIndex: number) => {
    haptics.light();
    const newDate = setYear(setMonth(new Date(), monthIndex), pickerYear);
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
    setCurrentWeekStart(newWeekStart);
    onDateChange(newDate);
    setIsMonthPickerOpen(false);
  };

  const handlePickerYearChange = (delta: number) => {
    haptics.light();
    setPickerYear((prev) => prev + delta);
  };

  const openMonthPicker = () => {
    if (!isNative) return; // Only open on native
    haptics.light();
    setPickerYear(getYear(currentWeekStart));
    setIsMonthPickerOpen(true);
  };

  // Format month and year for header (e.g., "DEC '25")
  const monthYear = format(currentWeekStart, "MMM ''yy").toUpperCase();
  const currentMonthIndex = getMonth(currentWeekStart);

  return (
    <>
      <div
        ref={containerRef}
        className={cn('bg-background', className)}
      >
        {/* Header row with month/year and TODAY button */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={openMonthPicker}
              className="flex items-center gap-1 text-lg font-semibold hover:bg-muted rounded px-2 py-1 transition-colors"
              aria-label="Select month"
            >
              {monthYear}
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTodayClick}
              className="text-xs font-medium h-7 px-3 bg-transparent border-border"
            >
              TODAY
            </Button>
            <button
              onClick={() => {
                if (hasChanges && onAcknowledgeChanges) {
                  haptics.light();
                  handleTodayClick(); // Jump to Today/latest
                  onAcknowledgeChanges();
                }
              }}
              className="relative p-1"
            >
              <Bell className={cn(
                "h-5 w-5 transition-colors",
                hasChanges ? "text-yellow-500 fill-yellow-500 animate-pulse" : "text-muted-foreground"
              )} />
              {hasChanges && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
              )}
            </button>
          </div>
        </div>

        {/* Week day selector - swipeable area */}
        <div 
          className="flex items-center justify-around px-2 pb-3"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {weekDays.map((day) => {
            const dayNumber = format(day, 'd');
            const dayString = format(day, 'yyyy-MM-dd');
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const isCompleted = completedDates.has(dayString);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all relative',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold'
                    : isTodayDate
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <span className="text-base">{dayNumber}</span>
                {/* Completion Indicator */}
                {isCompleted && (
                  <div className={cn(
                    "absolute -bottom-1 w-1 h-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-green-500"
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Picker Bottom Sheet */}
      <Sheet open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePickerYearChange(-1)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Previous year"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <SheetTitle className="text-xl font-bold">{pickerYear}</SheetTitle>
              <button
                onClick={() => handlePickerYearChange(1)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Next year"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </SheetHeader>
          
          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2 pb-6">
            {MONTHS.map((month, index) => {
              const isCurrentMonth = index === currentMonthIndex && pickerYear === getYear(currentWeekStart);
              return (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(index)}
                  className={cn(
                    'py-3 px-4 rounded-lg text-sm font-medium transition-colors',
                    isCurrentMonth
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  {month.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
