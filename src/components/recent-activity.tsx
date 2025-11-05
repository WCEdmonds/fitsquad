import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { soldiers } from '@/lib/data';

export function RecentActivity() {
  const recentSoldiers = soldiers.slice(0, 5);

  return (
    <div className="space-y-8">
      {recentSoldiers.map((soldier) => (
        <div key={soldier.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={soldier.avatar} alt="Avatar" data-ai-hint="person portrait" />
            <AvatarFallback>{soldier.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{soldier.name}</p>
            <p className="text-sm text-muted-foreground">
              Run time improved to {Math.floor(soldier.runTime / 60)}:{(soldier.runTime % 60).toString().padStart(2, '0')}.
            </p>
          </div>
          <div className="ml-auto font-medium text-primary">+{Math.floor(Math.random() * 5 + 1)} pts</div>
        </div>
      ))}
    </div>
  );
}
