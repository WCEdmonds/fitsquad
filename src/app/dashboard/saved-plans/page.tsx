'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Archive } from 'lucide-react';

export default function SavedPlansPage() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Workout Plans</CardTitle>
        <CardDescription>
          Review and manage your previously generated workout plans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[300px]">
          <Archive className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Saved Plans Yet</h3>
          <p className="text-muted-foreground">
            Once you save a plan from the Fitness Planner, it will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
