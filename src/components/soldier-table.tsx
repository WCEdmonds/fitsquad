import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Soldier } from '@/lib/types';
import { MoreHorizontal, Activity, Dumbbell, BookOpenCheck, Trash2, UserX } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SoldierDataForm } from './soldier-data-form';

interface SoldierTableProps {
  soldiers: Soldier[];
  isLoading?: boolean;
  accountType?: string;
  onRemoveSoldier?: (soldierId: string, teamId: string | null | undefined) => void;
  onDeleteUser?: (soldierId: string, teamId: string | null | undefined) => void;
}

export function SoldierTable({ soldiers, isLoading = false, accountType, onRemoveSoldier, onDeleteUser }: SoldierTableProps) {
  const [isLogDataOpen, setIsLogDataOpen] = useState(false);
  const [selectedSoldier, setSelectedSoldier] = useState<Soldier | null>(null);

  const openLogDataDialog = (soldier: Soldier) => {
    setSelectedSoldier(soldier);
    setIsLogDataOpen(true);
  };

  const hasBenchmark = (soldier: Soldier) => {
    return soldier.mdl > 0 || soldier.hrp > 0 || soldier.twoMileRun > 0;
  }

  const getFocusGroup = (soldier: Soldier): {type: 'running' | 'strength' | null, text: string | null} => {
    if (!hasBenchmark(soldier)) {
      return { type: null, text: null };
    }

    if (soldier.twoMileRun <= soldier.hrp) {
        return { type: 'running', text: 'Running Focus'};
    } else {
        return { type: 'strength', text: 'Strength Focus'};
    }
  }

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-[100px] sm:table-cell">
              <span className="sr-only">Avatar</span>
            </TableHead>
            <TableHead>Name</TableHead>
            {(accountType === 'Admin' || accountType === 'Commander') && <TableHead>Team</TableHead>}
            <TableHead>MDL</TableHead>
            <TableHead className="hidden md:table-cell">HRP</TableHead>
            <TableHead className="hidden md:table-cell">SDC</TableHead>
            <TableHead className="hidden md:table-cell">PLK</TableHead>
            <TableHead className="hidden md:table-cell">2MR</TableHead>
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
              {(accountType === 'Admin' || accountType === 'Commander') && <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>}
              <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[50px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[50px]" /></TableCell>
               <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[50px]" /></TableCell>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Log Fitness Data for {selectedSoldier?.firstName} {selectedSoldier?.lastName}</DialogTitle>
            <DialogDescription>
              Enter the latest fitness metrics for this soldier. This will be added to their progress history.
            </DialogDescription>
          </DialogHeader>
          {selectedSoldier && (
            <SoldierDataForm 
              soldierId={selectedSoldier.id}
              onSave={() => setIsLogDataOpen(false)}
              defaultValues={{
                  gender: selectedSoldier.gender,
                  weight: selectedSoldier.weight,
                  height: selectedSoldier.height,
              }}
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
            {(accountType === 'Admin' || accountType === 'Commander') && <TableHead>Team</TableHead>}
            <TableHead>MDL</TableHead>
            <TableHead>HRP</TableHead>
            <TableHead className="hidden lg:table-cell">SDC</TableHead>
            <TableHead className="hidden lg:table-cell">PLK</TableHead>
            <TableHead>2MR</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {soldiers.map((soldier) => {
            const focus = getFocusGroup(soldier);
            return (
            <TableRow key={soldier.id}>
              <TableCell className="hidden sm:table-cell">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{soldier.firstName?.charAt(0)}{soldier.lastName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">
                 <div className="flex items-center gap-2">
                    <div className="font-medium">{soldier.firstName} {soldier.lastName}</div>
                    {focus.type === 'running' && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        <Activity className="mr-1 h-3 w-3" /> {focus.text}
                      </Badge>
                    )}
                    {focus.type === 'strength' && (
                       <Badge variant="outline" className="text-red-600 border-red-600">
                        <Dumbbell className="mr-1 h-3 w-3" /> {focus.text}
                      </Badge>
                    )}
                 </div>
                <div className="hidden text-sm text-muted-foreground md:inline">
                  {soldier.rank}
                </div>
              </TableCell>
              {(accountType === 'Admin' || accountType === 'Commander') && <TableCell>{soldier.teamName || 'N/A'}</TableCell>}
              <TableCell>{soldier.mdl || 'N/A'}</TableCell>
              <TableCell>{soldier.hrp || 'N/A'}</TableCell>
              <TableCell className="hidden lg:table-cell">{soldier.sdc || 'N/A'}</TableCell>
              <TableCell className="hidden lg:table-cell">{soldier.plk || 'N/A'}</TableCell>
              <TableCell>{soldier.twoMileRun || 'N/A'}</TableCell>
              <TableCell>
                {(accountType === 'Admin' || accountType === 'Supervisor' || accountType === 'Commander') && (
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
                        <BookOpenCheck className="mr-2 h-4 w-4" />
                        Log AFT
                      </DropdownMenuItem>
                       {(accountType === 'Admin' || accountType === 'Supervisor') && onRemoveSoldier && (
                        <>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                 <Trash2 className="mr-2 h-4 w-4" />
                                 Remove from Team
                               </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will remove the soldier from their current team. It will not delete their account.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onRemoveSoldier(soldier.id, soldier.teamId)}>
                                    Confirm Removal
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                       )}
                       {accountType === 'Admin' && onDeleteUser && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                 <UserX className="mr-2 h-4 w-4" />
                                 Delete User
                               </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Permanently Delete User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action is irreversible. It will permanently delete the user's account data from Firestore. It will not remove the user from Firebase Authentication.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteUser(soldier.id, soldier.teamId)} className="bg-destructive hover:bg-destructive/90">
                                    Confirm Deletion
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                       )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </>
  );
}

    