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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from './ui/skeleton';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SoldierDataForm } from './soldier-data-form';

interface SoldierTableProps {
  soldiers: Soldier[];
  isLoading?: boolean;
}

function formatTime(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    return '0:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SoldierTable({ soldiers, isLoading = false }: SoldierTableProps) {
  const [isLogDataOpen, setIsLogDataOpen] = useState(false);
  const [selectedSoldier, setSelectedSoldier] = useState<Soldier | null>(null);
  
  const openLogDataDialog = (soldier: Soldier) => {
    setSelectedSoldier(soldier);
    setIsLogDataOpen(true);
  };

  if (isLoading) {
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
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-10 w-10 rounded-full" />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-[50px]" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-6 w-[50px] rounded-full" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[50px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (soldiers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No soldiers in this group yet.
      </div>
    )
  }

  return (
    <>
      <Dialog open={isLogDataOpen} onOpenChange={setIsLogDataOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Fitness Data for {selectedSoldier?.name.split('@')[0]}</DialogTitle>
            <DialogDescription>
              Enter the latest fitness metrics for this soldier. This will be added to their progress history.
            </DialogDescription>
          </DialogHeader>
          {selectedSoldier && (
            <SoldierDataForm 
              soldierId={selectedSoldier.id}
              onSave={() => setIsLogDataOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
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
                <Badge variant={soldier.aftScore === 0 ? 'outline' : soldier.aftScore >= 270 ? 'default' : soldier.aftScore < 230 ? 'destructive' : 'secondary'}>
                  {soldier.aftScore === 0 ? 'N/A' : soldier.aftScore}
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
                    <DropdownMenuItem onClick={() => openLogDataDialog(soldier)}>
                      {soldier.aftScore === 0 ? 'Log Benchmark' : 'Log Progress'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Suggest Alternatives</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
