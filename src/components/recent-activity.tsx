import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Soldier } from '@/lib/types';

interface RecentActivityProps {
  data: Soldier[];
}

export function RecentActivity({ data }: RecentActivityProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No recent activity.
      </div>
    );
  }

  // Show most recently updated soldiers first
  const recentSoldiers = data.slice(0, 5);

  return (
    <div className="space-y-8">
      {recentSoldiers.map((soldier) => (
        <div key={soldier.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={soldier.avatar} alt="Avatar" data-ai-hint="person portrait" />
            <AvatarFallback>{soldier.lastName?.charAt(0) ?? soldier.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{soldier.firstName} {soldier.lastName}</p>
            <p className="text-sm text-muted-foreground">
              Logged new fitness data.
            </p>
          </div>
          <div className="ml-auto font-medium text-primary">{new Date().toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );
}
