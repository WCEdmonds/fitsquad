'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase, getCollectionNonBlocking, getDocNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, getDoc, DocumentData, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { AnalyticsChart } from '@/components/analytics-chart';
import { ExerciseStrengthChart } from '@/components/exercise-strength-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Users, AreaChart, User, History, Pencil, Trash2, Activity } from 'lucide-react';
import { Barbell, SneakerMove, PersonSimpleRun, Timer } from '@phosphor-icons/react';
import { PerformanceChart } from '@/components/performance-chart';
import { RecentActivity } from '@/components/recent-activity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FitnessDataDialog } from '@/components/fitness-data-dialog';
import { useToast } from '@/hooks/use-toast';

interface SoldierSelectItem {
    id: string;
    name: string;
    teamName: string;
}

interface FitnessLog {
    id: string;
    mdl: number;
    hrp: number;
    sdc: number;
    plk: number;
    twoMileRun: number;
    weight?: number;
    height?: number;
    healthInfo?: string;
    gender?: 'Male' | 'Female' | 'Other';
    restingHeartRate?: number;
    bodyFatPercentage?: number;
    createdAt: string;
}


export default function AnalyticsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [account, setAccount] = useState<DocumentData | null | undefined>(null);
    const [selectedSoldierId, setSelectedSoldierId] = useState<string | null>(null);
    const [progressData, setProgressData] = useState<any[]>([]);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);
    const [allSoldiers, setAllSoldiers] = useState<SoldierSelectItem[]>([]);
    const [isLoadingAllSoldiers, setIsLoadingAllSoldiers] = useState(false);
    const [viewAllLogsOpen, setViewAllLogsOpen] = useState(false);
    const [fitnessLogs, setFitnessLogs] = useState<FitnessLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<FitnessLog | null>(null);
    
    const userAccountRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'accounts', user.uid);
    }, [firestore, user]);
    const { data: userAccount, isLoading: isAccountLoading } = useDoc(userAccountRef);

    useEffect(() => {
        setAccount(userAccount);
    }, [userAccount]);

    // For Commanders: Fetch all managed teams first
    const managedTeamsRef = useMemoFirebase(() => {
        if (account?.accountType !== 'Commander') return null;
        return collection(firestore, 'accounts', account.id, 'managedTeams');
    }, [firestore, account]);
    const { data: managedTeams, isLoading: managedTeamsLoading } = useCollection(managedTeamsRef);

    // For Supervisors/Soldiers: Use their direct teamId
    const teamMembersRef = useMemoFirebase(() => {
        if (!account?.teamId || account?.accountType === 'Commander') return null;
        return collection(firestore, 'teams', account.teamId, 'members');
    }, [firestore, account]);
    const { data: teamMembers, isLoading: teamMembersLoading } = useCollection(teamMembersRef);


    // State for dashboard metrics
    const [avgMdl, setAvgMdl] = useState<number | string>('--');
    const [avgSdc, setAvgSdc] = useState<number | string>('--');
    const [avgPlk, setAvgPlk] = useState<number | string>('--');
    const [avgHrp, setAvgHrp] = useState<number | string>('--');
    const [avgRunTime, setAvgRunTime] = useState<string>('--');
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

    const acftEventDescriptions: Record<string, { title: string; description: string }> = {
        MDL: {
          title: "Maximum Deadlift (MDL)",
          description: "The 3-Repetition Maximum Deadlift measures lower body muscular strength, power, and balance. Soldiers perform three deadlifts using a hex bar with progressively heavier weights, starting at 140 lbs for males and 120 lbs for females. The maximum weight successfully lifted three times is your score."
        },
        HRP: {
          title: "Hand Release Push-up (HRP)",
          description: "The Hand Release Push-up – Arm Extension measures upper body muscular endurance. From the prone position, perform as many correct push-ups as possible in two minutes. At the bottom of each rep, lift your hands completely off the ground before pushing back up. This tests chest, shoulder, and tricep endurance."
        },
        SDC: {
          title: "Sprint-Drag-Carry (SDC)",
          description: "The Sprint-Drag-Carry measures anaerobic capacity and muscular strength/endurance. Complete five 50-meter shuttles: sprint, sled drag (90 lbs), lateral shuffle, kettlebell carry (40 lbs each hand), and sprint. This event simulates critical combat tasks like moving under fire and carrying casualties."
        },
        PLK: {
          title: "Plank (PLK)",
          description: "The Plank measures core muscular endurance in seconds. Maintain a proper forearm plank position for as long as possible, up to 4 minutes and 20 seconds. Your body should form a straight line from head to heels, with weight on forearms and toes. This tests the core strength needed for all military tasks."
        },
        "2MR": {
          title: "2-Mile Run (2MR)",
          description: "The 2-Mile Run measures aerobic endurance and cardiovascular fitness. Complete two miles on a measured course as fast as possible. This event tests your aerobic capacity - the foundation of military readiness and the ability to sustain operations over extended periods."
        }
      };

    useEffect(() => {
        if (account?.accountType === 'Commander' && managedTeams) {
            const fetchAllSoldiers = async () => {
                setIsLoadingAllSoldiers(true);
                const soldierList: SoldierSelectItem[] = [];
                // Temp array for stats calculation
                const fullSoldierData: any[] = [];

                for (const team of managedTeams) {
                    const membersRef = collection(firestore, 'teams', team.id, 'members');
                    const membersSnap = await getCollectionNonBlocking(membersRef);
                    
                    for (const member of membersSnap) {
                         const accountSnapDoc = await getDocNonBlocking(doc(firestore, 'accounts', member.id));
                         // Need full soldier data for aggregations
                         const soldierDataColRef = collection(firestore, 'accounts', member.id, 'soldierData');
                         const soldierDataList = await getCollectionNonBlocking<any>(soldierDataColRef);
                         const sData = soldierDataList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                         
                         if (accountSnapDoc) {
                             const accountSnap = accountSnapDoc as any; // Type assertion

                             soldierList.push({
                                 id: member.id,
                                 name: `${accountSnap.firstName} ${accountSnap.lastName}`,
                                 teamName: team.name,
                             });

                             // Construct soldier object for stats
                             const defaultSoldier = {
                                id: member.id,
                                email: accountSnap.email || 'Unknown',
                                firstName: accountSnap.firstName || 'Unknown',
                                lastName: accountSnap.lastName || 'Soldier',
                                rank: accountSnap.accountType || 'Soldier',
                                mdl: 0,
                                hrp: 0,
                                sdc: 0,
                                plk: 0,
                                twoMileRun: 0,
                                gender: accountSnap.gender || 'Other',
                            };

                            if (sData) {
                                fullSoldierData.push({
                                    ...defaultSoldier,
                                    mdl: sData.mdl || 0,
                                    hrp: sData.hrp || 0,
                                    sdc: sData.sdc || 0,
                                    plk: sData.plk || 0,
                                    twoMileRun: sData.twoMileRun || 0,
                                });
                            } else {
                                fullSoldierData.push(defaultSoldier);
                            }
                         }
                    }
                }
                setAllSoldiers(soldierList);
                calculateStats(fullSoldierData);
                setIsLoadingAllSoldiers(false);
            };
            fetchAllSoldiers();
        } else if (teamMembers) {
             const fetchSoldiers = async () => {
                setIsLoadingAllSoldiers(true);
                const fullSoldierData: any[] = [];
                
                 const soldierList = await Promise.all(teamMembers.map(async member => {
                     const accountSnapDoc = await getDocNonBlocking(doc(firestore, 'accounts', member.id));
                     const accountSnap = accountSnapDoc as any;

                     // Fetch recent data for stats
                     const soldierDataColRef = collection(firestore, 'accounts', member.id, 'soldierData');
                     const soldierDataList = await getCollectionNonBlocking<any>(soldierDataColRef);
                     const sData = soldierDataList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                     
                     if (accountSnap) {
                        const defaultSoldier = {
                            id: member.id,
                            email: accountSnap.email || 'Unknown',
                            firstName: accountSnap.firstName || 'Unknown',
                            lastName: accountSnap.lastName || 'Soldier',
                            rank: accountSnap.accountType || 'Soldier',
                            mdl: 0,
                            hrp: 0,
                            sdc: 0,
                            plk: 0,
                            twoMileRun: 0,
                            gender: accountSnap.gender || 'Other',
                        };

                        if (sData) {
                            fullSoldierData.push({
                                ...defaultSoldier,
                                mdl: sData.mdl || 0,
                                hrp: sData.hrp || 0,
                                sdc: sData.sdc || 0,
                                plk: sData.plk || 0,
                                twoMileRun: sData.twoMileRun || 0,
                            });
                        } else {
                            fullSoldierData.push(defaultSoldier);
                        }
                     }

                     return {
                         id: member.id,
                         name: `${accountSnap?.firstName} ${accountSnap?.lastName}`,
                         teamName: ''
                     };
                 }));
                 setAllSoldiers(soldierList);
                 calculateStats(fullSoldierData);
                 setIsLoadingAllSoldiers(false);
            };
            fetchSoldiers();
        }

    }, [account, managedTeams, teamMembers, firestore]);

    const calculateStats = (soldiers: any[]) => {
        const soldiersWithData = soldiers.filter(s => s.mdl > 0 || s.hrp > 0 || s.sdc > 0 || s.plk > 0 || s.twoMileRun > 0);
        
        // Pass complete data to PerformanceChart via prop if possible, but local state management is tricky without full refactor.
        // For now, I'll store the full soldier list in a new state variable to pass to charts
        setFullSoldierList(soldiers);

        if (soldiersWithData.length > 0) {
          const totalMdl = soldiersWithData.reduce((acc, s) => acc + s.mdl, 0);
          setAvgMdl(Math.round(totalMdl / soldiersWithData.length));

          const totalHrp = soldiersWithData.reduce((acc, s) => acc + s.hrp, 0);
          setAvgHrp(Math.round(totalHrp / soldiersWithData.length));

          const totalSdc = soldiersWithData.reduce((acc, s) => acc + s.sdc, 0);
          setAvgSdc(Math.round(totalSdc / soldiersWithData.length));

          const totalPlk = soldiersWithData.reduce((acc, s) => acc + s.plk, 0);
          setAvgPlk(Math.round(totalPlk / soldiersWithData.length));

          const totalRunTime = soldiersWithData.reduce((acc, s) => acc + s.twoMileRun, 0);
          setAvgRunTime(`${Math.round(totalRunTime / soldiersWithData.length)}`);
        } else {
            setAvgMdl('--');
            setAvgHrp('--');
            setAvgSdc('--');
            setAvgPlk('--');
            setAvgRunTime('--');
        }
    }
    
    const [fullSoldierList, setFullSoldierList] = useState<any[]>([]);
    
    // Effect to fetch progress data for the selected soldier
    useEffect(() => {
        if (selectedSoldierId) {
            const fetchProgressData = async () => {
                setIsLoadingProgress(true);
                const soldierDataRef = collection(firestore, 'accounts', selectedSoldierId, 'soldierData');
                const q = query(soldierDataRef, orderBy('createdAt', 'asc'));
                const data = await getCollectionNonBlocking<any>(q);
                setProgressData(data);
                setIsLoadingProgress(false);
            };
            fetchProgressData();
        } else {
            setProgressData([]);
        }
    }, [selectedSoldierId, firestore]);

     // Effect to set default soldier for individual view
    useEffect(() => {
        if (account?.accountType === 'Soldier' && user) {
            setSelectedSoldierId(user.uid);
        }
    }, [account, user]);

    // Fetch fitness logs when view all dialog opens
    const fetchFitnessLogs = async () => {
        if (!selectedSoldierId) return;

        setIsLoadingLogs(true);
        try {
            const logsRef = collection(firestore, 'accounts', selectedSoldierId, 'soldierData');
            const q = query(logsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const fetchedLogs: FitnessLog[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as FitnessLog));

            setFitnessLogs(fetchedLogs);
        } catch (error: any) {
            console.error('Error fetching fitness logs:', error);
            toast({
                title: 'Error',
                description: 'Failed to load fitness logs.',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleViewAllLogs = () => {
        setViewAllLogsOpen(true);
        fetchFitnessLogs();
    };

    const handleEditLog = (log: FitnessLog) => {
        setSelectedLog(log);
        setEditDialogOpen(true);
    };

    const handleDeleteLog = (log: FitnessLog) => {
        setSelectedLog(log);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteLog = async () => {
        if (!selectedLog || !selectedSoldierId) return;

        try {
            const logRef = doc(firestore, 'accounts', selectedSoldierId, 'soldierData', selectedLog.id);
            await deleteDoc(logRef);

            toast({
                title: 'Success',
                description: 'Fitness log deleted successfully.',
            });

            setFitnessLogs(fitnessLogs.filter(log => log.id !== selectedLog.id));
            setDeleteDialogOpen(false);
            setSelectedLog(null);

            // Refresh progress data
            const soldierDataRef = collection(firestore, 'accounts', selectedSoldierId, 'soldierData');
            const q = query(soldierDataRef, orderBy('createdAt', 'asc'));
            const data = await getCollectionNonBlocking<any>(q);
            setProgressData(data);
        } catch (error: any) {
            console.error('Error deleting log:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete fitness log.',
                variant: 'destructive',
            });
        }
    };

    const handleUpdateLog = async (updatedData: Partial<FitnessLog>) => {
        if (!selectedLog || !selectedSoldierId) return;

        try {
            const logRef = doc(firestore, 'accounts', selectedSoldierId, 'soldierData', selectedLog.id);
            await updateDoc(logRef, updatedData);

            toast({
                title: 'Success',
                description: 'Fitness log updated successfully.',
            });

            // Refresh logs
            await fetchFitnessLogs();
            setEditDialogOpen(false);
            setSelectedLog(null);

            // Refresh progress data
            const soldierDataRef = collection(firestore, 'accounts', selectedSoldierId, 'soldierData');
            const q = query(soldierDataRef, orderBy('createdAt', 'asc'));
            const data = await getCollectionNonBlocking<any>(q);
            setProgressData(data);
        } catch (error: any) {
            console.error('Error updating log:', error);
            toast({
                title: 'Error',
                description: 'Failed to update fitness log.',
                variant: 'destructive',
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };


    const renderIndividualTab = () => (
        <>
            {account?.accountType !== 'Soldier' && (
                 <div className="mb-6">
                    <Select
                        onValueChange={setSelectedSoldierId}
                        disabled={isLoadingAllSoldiers}
                    >
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder="Select a soldier..." />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoadingAllSoldiers ? (
                                <SelectItem value="loading" disabled>Loading soldiers...</SelectItem>
                            ) : (
                                allSoldiers?.map(soldier => (
                                    <SelectItem key={soldier.id} value={soldier.id}>
                                        {soldier.name} {account?.accountType === 'Commander' && `(${soldier.teamName})`}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}
           
            {isLoadingProgress && (
                <div className="space-y-4 pt-4">
                    <Skeleton className="h-[400px] w-full" />
                </div>
            )}
            
            {!isLoadingProgress && selectedSoldierId && (
                <div className="space-y-8">
                    {/* AFT Progress */}
                    {progressData.length > 0 ? (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Fitness Test Progress</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleViewAllLogs}
                                    className="flex items-center gap-2"
                                >
                                    <History className="h-4 w-4" />
                                    View All Records
                                </Button>
                            </div>
                            <AnalyticsChart data={progressData} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[300px]">
                            <LineChart className="w-16 h-16 text-muted-foreground mb-4"/>
                            <h3 className="text-xl font-semibold">No Fitness Test Data Found</h3>
                            <p className="text-muted-foreground">This soldier has not logged any fitness test data yet.</p>
                        </div>
                    )}

                    {/* Exercise Strength Progression */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Exercise Strength Progression</h3>
                        <ExerciseStrengthChart userId={selectedSoldierId} />
                    </div>
                </div>
            )}

             {!selectedSoldierId && account?.accountType !== 'Soldier' && (
                 <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[400px]">
                    <Users className="w-16 h-16 text-muted-foreground mb-4"/>
                    <h3 className="text-xl font-semibold">Select a Soldier</h3>
                    <p className="text-muted-foreground">Choose a soldier from the dropdown to see their progress.</p>
                </div>
             )}
        </>
    );

    const renderTabs = () => {
        if (isAccountLoading) {
            return <Skeleton className="h-10 w-full" />;
        }

        switch (account?.accountType) {
            case 'Commander':
                return (
                    <Tabs defaultValue="individual">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="unit" disabled><AreaChart className="mr-2"/>Unit</TabsTrigger>
                            <TabsTrigger value="section" disabled><Users className="mr-2"/>Section</TabsTrigger>
                            <TabsTrigger value="individual"><User className="mr-2"/>Individual</TabsTrigger>
                        </TabsList>
                        <TabsContent value="unit" className="mt-4"></TabsContent>
                        <TabsContent value="section" className="mt-4"></TabsContent>
                        <TabsContent value="individual" className="mt-4">
                            {renderIndividualTab()}
                        </TabsContent>
                    </Tabs>
                )
            case 'Supervisor':
                 return (
                    <Tabs defaultValue="individual">
                        <TabsList className="grid w-full grid-cols-2">
                             <TabsTrigger value="section" disabled><Users className="mr-2"/>Section</TabsTrigger>
                            <TabsTrigger value="individual"><User className="mr-2"/>Individual</TabsTrigger>
                        </TabsList>
                         <TabsContent value="section" className="mt-4"></TabsContent>
                        <TabsContent value="individual" className="mt-4">
                            {renderIndividualTab()}
                        </TabsContent>
                    </Tabs>
                )
            case 'Soldier':
            default:
                return renderIndividualTab();
        }
    }


    return (
        <div className="flex flex-col h-full">
          {/* Fixed Header */}
          <div className="shrink-0 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-4 pb-3 bg-card/80 border-b border-border/50 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] px-4 pt-4 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Dashboard Overview Section (Only for Commander/Supervisor/Admin?) - checking accountType for now */}
            {/* Actually, user said migrate dashboard content. The original dashboard showed this for everyone, but data depends on permissions. */}
            {(account?.accountType === 'Commander' || account?.accountType === 'Supervisor' || account?.accountType === 'Admin') && (
            <>
              <div className="grid gap-2 grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
                <Card className="aspect-square flex flex-col bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 md:px-4 md:pt-4 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-semibold">Total</CardTitle>
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-center px-2 pb-2 md:px-4 md:pb-4">
                    <div className="text-xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">{allSoldiers?.length ?? 0}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">soldiers</p>
                  </CardContent>
                </Card>
                <Card
                  onClick={() => setSelectedEvent('MDL')}
                  className="aspect-square flex flex-col bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform cursor-pointer"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 md:px-4 md:pt-4 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-semibold">MDL</CardTitle>
                    <Barbell weight="bold" className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-center px-2 pb-2 md:px-4 md:pb-4">
                    <div className="text-xl md:text-3xl font-bold text-purple-700 dark:text-purple-300">{avgMdl}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">avg score</p>
                  </CardContent>
                </Card>
                <Card
                  onClick={() => setSelectedEvent('HRP')}
                  className="aspect-square flex flex-col bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:scale-105 transition-transform cursor-pointer"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 md:px-4 md:pt-4 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-semibold">HRP</CardTitle>
                    <Activity className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-center px-2 pb-2 md:px-4 md:pb-4">
                    <div className="text-xl md:text-3xl font-bold text-orange-700 dark:text-orange-300">{avgHrp}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">avg score</p>
                  </CardContent>
                </Card>
                <Card
                  onClick={() => setSelectedEvent('SDC')}
                  className="aspect-square flex flex-col bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:scale-105 transition-transform cursor-pointer"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 md:px-4 md:pt-4 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-semibold">SDC</CardTitle>
                    <PersonSimpleRun weight="bold" className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-center px-2 pb-2 md:px-4 md:pb-4">
                    <div className="text-xl md:text-3xl font-bold text-green-700 dark:text-green-300">{avgSdc}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">avg score</p>
                  </CardContent>
                </Card>
                <Card
                  onClick={() => setSelectedEvent('PLK')}
                  className="aspect-square flex flex-col bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800 hover:scale-105 transition-transform cursor-pointer"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 md:px-4 md:pt-4 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-semibold">PLK</CardTitle>
                    <Timer weight="bold" className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400" />
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-center px-2 pb-2 md:px-4 md:pb-4">
                    <div className="text-xl md:text-3xl font-bold text-yellow-700 dark:text-yellow-300">{avgPlk}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">avg score</p>
                  </CardContent>
                </Card>
                <Card
                  onClick={() => setSelectedEvent('2MR')}
                  className="aspect-square flex flex-col bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800 hover:scale-105 transition-transform cursor-pointer"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 md:px-4 md:pt-4 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-semibold">2MR</CardTitle>
                    <SneakerMove weight="bold" className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-center px-2 pb-2 md:px-4 md:pb-4">
                    <div className="text-xl md:text-3xl font-bold text-red-700 dark:text-red-300">{avgRunTime}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">avg score</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Performance Distribution</CardTitle>
                    <CardDescription>
                      Event breakdown across the unit.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <PerformanceChart data={fullSoldierList} />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Updates on soldier performance and logs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentActivity data={fullSoldierList} />
                  </CardContent>
                </Card>
              </div>
            </>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Soldier Analytics</CardTitle>
                    <CardDescription>
                        Track fitness progress over time. Use the tabs to switch between different views.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderTabs()}
                </CardContent>
            </Card>

            {/* View All Fitness Logs Dialog */}
            <Dialog open={viewAllLogsOpen} onOpenChange={setViewAllLogsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Fitness Test Records
                        </DialogTitle>
                        <DialogDescription>
                            View, edit, and manage all fitness test results for the selected individual.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {isLoadingLogs ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : fitnessLogs.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No fitness logs found.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border max-h-[60vh] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>MDL</TableHead>
                                            <TableHead>HRP</TableHead>
                                            <TableHead>SDC</TableHead>
                                            <TableHead>PLK</TableHead>
                                            <TableHead>2MR</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fitnessLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">
                                                    {formatDate(log.createdAt)}
                                                </TableCell>
                                                <TableCell>{log.mdl}</TableCell>
                                                <TableCell>{log.hrp}</TableCell>
                                                <TableCell>{log.sdc}</TableCell>
                                                <TableCell>{log.plk}</TableCell>
                                                <TableCell>{log.twoMileRun}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditLog(log)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteLog(log)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

             {/* ACFT Event Description Dialog - Added from Dashboard */}
             <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedEvent && acftEventDescriptions[selectedEvent]?.title}</DialogTitle>
                    <DialogDescription className="pt-4 text-base leading-relaxed">
                    {selectedEvent && acftEventDescriptions[selectedEvent]?.description}
                    </DialogDescription>
                </DialogHeader>
                </DialogContent>
            </Dialog>

            {/* Edit Fitness Log Dialog */}
            <FitnessDataDialog
                isOpen={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSave={(data) => handleUpdateLog(data as Partial<FitnessLog>)}
                initialData={selectedLog || undefined}
                isEditing={true}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this fitness log entry. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteLog}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
    );
}

    