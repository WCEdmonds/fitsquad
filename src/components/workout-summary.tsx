'use client';

import { CheckCircle2, Trophy, Clock, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from '@/components/ui/confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkoutSummaryProps {
  duration: string;
  volume: number;
  sets: number;
  onClose: () => void;
}

export function WorkoutSummary({ duration, volume, sets, onClose }: WorkoutSummaryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-6 animate-in fade-in zoom-in duration-300">
      <Confetti />
      <Card className="w-full max-w-sm shadow-xl border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Workout Complete!</CardTitle>
          <p className="text-muted-foreground">Great job crushing your goals today.</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <Clock className="w-5 h-5 mx-auto text-amber-500" />
              <div className="text-xl font-bold">{duration}</div>
              <div className="text-xs text-muted-foreground uppercase">Duration</div>
            </div>
            <div className="space-y-1">
              <Dumbbell className="w-5 h-5 mx-auto text-blue-500" />
              <div className="text-xl font-bold">{volume.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground uppercase">Lbs Moved</div>
            </div>
            <div className="space-y-1">
              <Trophy className="w-5 h-5 mx-auto text-yellow-500" />
              <div className="text-xl font-bold">{sets}</div>
              <div className="text-xs text-muted-foreground uppercase">Sets Done</div>
            </div>
          </div>

          <Button onClick={onClose} className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20">
            Done
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
