'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns';

interface WeekSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

export function WeekSelector({
  selectedDate,
  onDateChange,
  className,
}: WeekSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(selectedDate, { weekStartsOn: 1 })
  );

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

  // Format month and year for header (e.g., "DEC '25")
  const monthYear = format(currentWeekStart, "MMM ''yy").toUpperCase();

  return (
    <div className={cn('bg-background', className)}>
      {/* Header row with month/year and TODAY button */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevWeek}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <ChevronDown className="h-4 w-4 rotate-90 text-muted-foreground" />
          </button>
          <button
            onClick={handleNextWeek}
            className="flex items-center gap-1 text-lg font-semibold"
          >
            {monthYear}
            <ChevronDown className="h-4 w-4" />
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
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Week day selector */}
      <div
        ref={scrollRef}
        className="flex items-center justify-around px-2 pb-3"
      >
        {weekDays.map((day) => {
          const dayNumber = format(day, 'd');
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={cn(
                'flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all',
                isSelected
                  ? 'bg-primary text-primary-foreground font-bold'
                  : isTodayDate
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <span className="text-base">{dayNumber}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
