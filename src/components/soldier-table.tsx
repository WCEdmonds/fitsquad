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
import { MoreHorizontal, Activity, Dumbbell, Loader2 } from 'lucide-react';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { SoldierDataForm } from './soldier-data-form';
import { suggestAlternativeExercises, SuggestAlternativeExercisesOutput } from '@/ai/flows/provide-workout-suggestions-based-on-performance';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface SoldierTableProps {
  soldiers: Soldier[];
  isLoading?: boolean;
}

export function SoldierTable({ soldiers, isLoading = false }: SoldierTableProps) {
  const [isLogDataOpen, setIsLogDataOpen] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [selectedSoldier, setSelectedSoldier] = useState<Soldier | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestAlternativeExercisesOutput | null>(null);

  const openLogDataDialog = (soldier: Soldier) => {
    setSelectedSoldier(soldier);
    setIsLogDataOpen(true);
  };
  
  const handleSuggestAlternatives = async (soldier: Soldier) => {
    setSelectedSoldier(soldier);
    setIsSuggestionOpen(true);
    setIsGeneratingSuggestion(true);
    setSuggestion(null);

    const performanceData = `MDL: ${soldier.mdl}, HRP: ${soldier.hrp}, SDC: ${soldier.sdc}, PLK: ${soldier.plk}, 2MR: ${soldier.twoMileRun}`;
    
    try {
        const result = await suggestAlternativeExercises({
            soldierPerformanceData: performanceData,
            personalLimitations: soldier.healthNotes || "None provided.",
            exerciseGoal: "Overall fitness improvement, focusing on weak areas."
        });
        setSuggestion(result);
    } catch(e) {
        console.error("Failed to get suggestions", e);
        // You could set an error state here to show in the dialog
    } finally {
        setIsGeneratingSuggestion(false);
    }
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
            />
          )}
        </DialogContent>
      </Dialog>
      
       <Dialog open={isSuggestionOpen} onOpenChange={setIsSuggestionOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Exercise Suggestions for {selectedSoldier?.firstName}</DialogTitle>
            <DialogDescription>
             Based on their latest performance and limitations, here are some suggested exercises.
            </DialogDescription>
          </DialogHeader>
            {isGeneratingSuggestion && (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                    <span>Generating suggestions...</span>
                </div>
            )}
            {suggestion && (
                <Alert>
                  <AlertTitle>Suggested Exercises</AlertTitle>
                  <AlertDescription>
                    <p className="mb-4 whitespace-pre-wrap">{suggestion.suggestedExercises}</p>
                    <h4 className="font-semibold mt-4">Explanation</h4>
                    <p className="whitespace-pre-wrap">{suggestion.explanation}</p>
                  </AlertDescription>
                </Alert>
            )}
           <DialogFooter>
                <Button variant="outline" onClick={() => setIsSuggestionOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-[100px] sm:table-cell">
              <span className="sr-only">Avatar</span>
            </TableHead>
            <TableHead>Name</TableHead>
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
                  <AvatarImage
                    src={soldier.avatar}
                    alt={soldier.name}
                    data-ai-hint="person portrait"
                  />
                  <AvatarFallback>{soldier.lastName?.charAt(0) ?? soldier.name.charAt(0)}</AvatarFallback>
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
              <TableCell>{soldier.mdl || 'N/A'}</TableCell>
              <TableCell>{soldier.hrp || 'N/A'}</TableCell>
              <TableCell className="hidden lg:table-cell">{soldier.sdc || 'N/A'}</TableCell>
              <TableCell className="hidden lg:table-cell">{soldier.plk || 'N/A'}</TableCell>
              <TableCell>{soldier.twoMileRun || 'N/A'}</TableCell>
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
                      {hasBenchmark(soldier) ? 'Log Progress' : 'Log Benchmark'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSuggestAlternatives(soldier)}>
                        Suggest Alternatives
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </>
  );
}
