'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { Button } from '@/components/ui/button';

interface RestTimerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSeconds?: number;
}

export function RestTimer({ isOpen, onClose, defaultSeconds = 60 }: RestTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);

  // Reset timer when opened
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(defaultSeconds);
      setIsRunning(true);
    }
  }, [isOpen, defaultSeconds]);

  // Countdown logic
  useEffect(() => {
    if (!isRunning || !isOpen) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          haptics.success();
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isOpen, onClose]);

  const handleAddTime = useCallback((seconds: number) => {
    haptics.light();
    setSecondsRemaining((prev) => prev + seconds);
  }, []);

  const handleSkip = useCallback(() => {
    haptics.light();
    onClose();
  }, [onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress for circular indicator (0 to 1)
  const progress = secondsRemaining / defaultSeconds;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-background rounded-2xl p-6 w-[280px] flex flex-col items-center">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-6">Rest Timer</h3>

        {/* Circular timer */}
        <div className="relative w-32 h-32 mb-6">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-primary transition-all duration-1000 ease-linear"
            />
          </svg>
          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold tabular-nums">
              {formatTime(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Add time buttons */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddTime(15)}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            15s
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddTime(30)}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            30s
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddTime(60)}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            1m
          </Button>
        </div>

        {/* Skip button */}
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="w-full text-muted-foreground"
        >
          Skip Rest
        </Button>
      </div>
    </div>
  );
}
