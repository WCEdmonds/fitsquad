'use client';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  perceivedExertion?: string;
  description?: string;
  duration?: string;
  distance?: string;
}

interface Workout {
  name: string;
  focus: string;
  exercises: Exercise[];
}

interface PlanPrintViewProps {
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
  viewMode: 'weekly' | 'daily';
  selectedDate?: Date;
}

export function PlanPrintView({ plan, viewMode, selectedDate }: PlanPrintViewProps) {
  const formatDate = (weekIndex: number, dayIndex: number): string => {
    if (!plan.cycleStartDate) return '';

    const cycleStart = new Date(plan.cycleStartDate);
    const startMonday = new Date(cycleStart);
    startMonday.setDate(cycleStart.getDate() - cycleStart.getDay() + 1);

    const targetDate = new Date(startMonday);
    targetDate.setDate(startMonday.getDate() + (weekIndex * 7) + dayIndex);

    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (viewMode === 'daily' && selectedDate) {
    // Print single day view
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Find which week this date falls in
    const cycleStart = plan.cycleStartDate ? new Date(plan.cycleStartDate) : new Date();
    const startMonday = new Date(cycleStart);
    startMonday.setDate(cycleStart.getDate() - cycleStart.getDay() + (cycleStart.getDay() === 0 ? -6 : 1));

    const diffTime = selectedDate.getTime() - startMonday.getTime();
    const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
    const weeksSinceStart = Math.floor(diffDays / 7);
    const currentWeekInCycle = Math.max(0, weeksSinceStart % 8);

    const todaysWorkout = plan.weeks[currentWeekInCycle]?.days.find(
      day => day.dayOfWeek === dayOfWeek
    )?.workout;

    return (
      <div className="p-8 space-y-6">
        <div className="text-center border-b pb-4">
          <h1 className="text-3xl font-bold">Daily Workout Plan</h1>
          <p className="text-lg text-muted-foreground mt-2">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {todaysWorkout ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{todaysWorkout.name}</h2>
              <p className="text-lg text-muted-foreground">Focus: {todaysWorkout.focus}</p>
            </div>

            <div className="space-y-6">
              {todaysWorkout.exercises.map((exercise, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3">{exercise.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div><strong>Sets:</strong> {exercise.sets}</div>
                    <div><strong>Reps:</strong> {exercise.reps}</div>
                    <div><strong>Rest:</strong> {exercise.rest}</div>
                    {exercise.perceivedExertion && (
                      <div><strong>RPE:</strong> {exercise.perceivedExertion}/10</div>
                    )}
                    {exercise.duration && (
                      <div><strong>Duration:</strong> {exercise.duration}</div>
                    )}
                    {exercise.distance && (
                      <div><strong>Distance:</strong> {exercise.distance}</div>
                    )}
                  </div>
                  {exercise.description && (
                    <p className="text-sm text-muted-foreground mt-2">{exercise.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">Rest Day - No workout scheduled</p>
          </div>
        )}
      </div>
    );
  }

  // Print weekly/full plan view
  return (
    <div className="p-8 space-y-8">
      <div className="text-center border-b pb-4">
        <h1 className="text-3xl font-bold">8-Week Workout Plan</h1>
        {plan.cycleStartDate && (
          <p className="text-lg text-muted-foreground mt-2">
            Starting: {new Date(plan.cycleStartDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      {plan.weeks.map((week, weekIdx) => (
        <div key={week.weekNumber} className="break-inside-avoid">
          <h2 className="text-2xl font-bold mb-4 flex items-baseline gap-3">
            Week {week.weekNumber}
            {plan.cycleStartDate && (
              <span className="text-sm text-muted-foreground font-normal">
                {formatDate(weekIdx, 0)} - {formatDate(weekIdx, 6)}
              </span>
            )}
          </h2>

          <div className="grid grid-cols-7 gap-2">
            {week.days.map((day, dayIdx) => (
              <div key={day.dayOfWeek} className="border rounded p-2">
                <div className="font-semibold text-sm mb-1">{day.dayOfWeek.slice(0, 3)}</div>
                {plan.cycleStartDate && (
                  <div className="text-xs text-muted-foreground mb-2">
                    {formatDate(weekIdx, dayIdx)}
                  </div>
                )}
                {day.workout ? (
                  <div className="text-xs space-y-1">
                    <div className="font-medium">{day.workout.name}</div>
                    <div className="text-muted-foreground text-[10px]">{day.workout.focus}</div>
                    <ul className="list-disc list-inside text-[10px] mt-1">
                      {day.workout.exercises.slice(0, 3).map((ex, exIdx) => (
                        <li key={exIdx} className="truncate">{ex.name}</li>
                      ))}
                      {day.workout.exercises.length > 3 && (
                        <li>+{day.workout.exercises.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Rest</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
