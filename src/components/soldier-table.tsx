import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Soldier } from '@/lib/types';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SoldierTableProps {
  soldiers: Soldier[];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SoldierTable({ soldiers }: SoldierTableProps) {

  if (soldiers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No soldiers in this group yet.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">
            <span className="sr-only">Avatar</span>
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>AFT Score</TableHead>
          <TableHead className="hidden md:table-cell">Run Time</TableHead>
          <TableHead className="hidden md:table-cell">Push-ups</TableHead>
          <TableHead className="hidden md:table-cell">Sit-ups</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {soldiers.map((soldier) => (
          <TableRow key={soldier.id}>
            <TableCell className="hidden sm:table-cell">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={soldier.avatar}
                  alt={soldier.name}
                  data-ai-hint="person portrait"
                />
                <AvatarFallback>{soldier.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
            </TableCell>
            <TableCell className="font-medium">
              <div className="font-medium">{soldier.name.split('@')[0]}</div>
              <div className="hidden text-sm text-muted-foreground md:inline">
                {soldier.rank}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={soldier.aftScore >= 270 ? 'default' : soldier.aftScore < 230 ? 'destructive' : 'secondary'}>
                {soldier.aftScore}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">{formatTime(soldier.runTime)}</TableCell>
            <TableCell className="hidden md:table-cell">{soldier.pushups}</TableCell>
            <TableCell className="hidden md:table-cell">{soldier.situps}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>Log Progress</DropdownMenuItem>
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Suggest Alternatives</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
