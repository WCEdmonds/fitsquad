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
import { SneakerMove, PersonSimpleRun, Timer, Heart, Ruler, Percent, Scales } from '@phosphor-icons/react';
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

const StatDisplay = ({ icon: Icon, label, value, unit }: { icon: React.ElementType, label: string, value: string | number | undefined, unit?: string }) => (
    <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50">
        <Icon weight="bold" className="w-5 h-5 text-muted-foreground" />
        <span className="font-medium">{label}:</span>
        <span className="text-muted-foreground">{value ?? 'N/A'}{unit && value ? ` ${unit}` : ''}</span>
    </div>
);


export function SoldierTable({ soldiers, isLoading = false, accountType, onRemoveSoldier, onDeleteUser }: SoldierTableProps) {
  const [isLogDataOpen, setIsLogDataOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSoldier, setSelectedSoldier] = useState<Soldier | null>(null);

  const openLogDataDialog = (soldier: Soldier) => {
    setSelectedSoldier(soldier);
    setIsLogDataOpen(true);
  };
  
  const openDetailDialog = (soldier: Soldier) => {
    setSelectedSoldier(soldier);
    setIsDetailOpen(true);
  }

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
            <TableHead className="hidden md:table-cell">Team</TableHead>
            <TableHead className="hidden md:table-cell">MDL</TableHead>
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
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
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
      
       <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                 <Avatar className="h-10 w-10">
                  <AvatarFallback>{selectedSoldier?.firstName?.charAt(0)}{selectedSoldier?.lastName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                 {selectedSoldier?.firstName} {selectedSoldier?.lastName}
                 <p className="text-sm text-muted-foreground font-normal">{selectedSoldier?.rank} - {selectedSoldier?.teamName}</p>
                </div>
            </DialogTitle>
          </DialogHeader>
          {selectedSoldier && (
            <div className="py-4 space-y-4">
                 <div>
                    <h4 className="font-semibold mb-2 text-sm">Vitals</h4>
                     <div className="grid grid-cols-2 gap-2">
                        <StatDisplay icon={Scales} label="Weight" value={selectedSoldier.weight} unit="lbs" />
                        <StatDisplay icon={Ruler} label="Height" value={selectedSoldier.height} unit="in" />
                        <StatDisplay icon={Percent} label="Body Fat" value={selectedSoldier.bodyFatPercentage} unit="%" />
                        <StatDisplay icon={Heart} label="Resting HR" value={selectedSoldier.restingHeartRate} unit="bpm" />
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2 text-sm">AFT Scores</h4>
                     <div className="grid grid-cols-2 gap-2">
                        <StatDisplay icon={Dumbbell} label="MDL" value={selectedSoldier.mdl} />
                        <StatDisplay icon={Dumbbell} label="HRP" value={selectedSoldier.hrp} />
                        <StatDisplay icon={PersonSimpleRun} label="SDC" value={selectedSoldier.sdc} />
                        <StatDisplay icon={Timer} label="PLK" value={selectedSoldier.plk} />
                        <StatDisplay icon={SneakerMove} label="2MR" value={selectedSoldier.twoMileRun} />
                    </div>
                </div>
                 {selectedSoldier.healthNotes && (
                    <div>
                        <h4 className="font-semibold mb-2 text-sm">Health Notes</h4>
                        <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">{selectedSoldier.healthNotes}</p>
                    </div>
                 )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Team</TableHead>
            <TableHead className="hidden md:table-cell">MDL</TableHead>
            <TableHead className="hidden md:table-cell">HRP</TableHead>
            <TableHead className="hidden md:table-cell">SDC</TableHead>
            <TableHead className="hidden md:table-cell">PLK</TableHead>
            <TableHead className="hidden md:table-cell">2MR</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {soldiers.map((soldier) => {
            const focus = getFocusGroup(soldier);
            return (
            <TableRow key={soldier.id} onClick={() => openDetailDialog(soldier)} className="cursor-pointer">
              <TableCell>
                 <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 hidden sm:flex">
                        <AvatarFallback>{soldier.firstName?.charAt(0)}{soldier.lastName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{soldier.firstName} {soldier.lastName}</div>
                         <div className="text-sm text-muted-foreground md:hidden">
                            {soldier.teamName || 'N/A'}
                        </div>
                        <div className="flex md:hidden mt-1">
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
                    </div>
                 </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{soldier.teamName || 'N/A'}</TableCell>
              <TableCell className="hidden md:table-cell">{soldier.mdl || 'N/A'}</TableCell>
              <TableCell className="hidden md:table-cell">{soldier.hrp || 'N/A'}</TableCell>
              <TableCell className="hidden md:table-cell">{soldier.sdc || 'N/A'}</TableCell>
              <TableCell className="hidden md:table-cell">{soldier.plk || 'N/A'}</TableCell>
              <TableCell className="hidden md:table-cell">{soldier.twoMileRun || 'N/A'}</TableCell>
              <TableCell className="text-right">
                {(accountType === 'Admin' || accountType === 'Supervisor' || accountType === 'Commander') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openLogDataDialog(soldier)}>
                        <BookOpenCheck className="mr-2 h-4 w-4" />
                        Log AFT
                      </DropdownMenuItem>
                       {(accountType === 'Admin' || accountType === 'Supervisor' || accountType === 'Commander') && onRemoveSoldier && (
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
