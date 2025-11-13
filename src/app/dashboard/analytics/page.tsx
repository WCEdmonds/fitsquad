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
import { LineChart, Users, AreaChart, User, History, Pencil, Trash2 } from 'lucide-react';
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


    // Effect to aggregate all soldiers for a commander
    useEffect(() => {
        if (account?.accountType === 'Commander' && managedTeams) {
            const fetchAllSoldiers = async () => {
                setIsLoadingAllSoldiers(true);
                const soldierList: SoldierSelectItem[] = [];
                for (const team of managedTeams) {
                    const membersRef = collection(firestore, 'teams', team.id, 'members');
                    const membersSnap = await getCollectionNonBlocking(membersRef);
                    
                    for (const member of membersSnap) {
                         const accountSnap = await getDocNonBlocking(doc(firestore, 'accounts', member.id));
                         if (accountSnap) {
                             soldierList.push({
                                 id: member.id,
                                 name: `${accountSnap.firstName} ${accountSnap.lastName}`,
                                 teamName: team.name,
                             });
                         }
                    }
                }
                setAllSoldiers(soldierList);
                setIsLoadingAllSoldiers(false);
            };
            fetchAllSoldiers();
        } else if (teamMembers) {
             const fetchSoldiers = async () => {
                setIsLoadingAllSoldiers(true);
                 const soldierList = await Promise.all(teamMembers.map(async member => {
                     const accountSnap = await getDocNonBlocking(doc(firestore, 'accounts', member.id));
                     return {
                         id: member.id,
                         name: `${accountSnap?.firstName} ${accountSnap?.lastName}`,
                         teamName: ''
                     };
                 }));
                 setAllSoldiers(soldierList);
                 setIsLoadingAllSoldiers(false);
            };
            fetchSoldiers();
        }

    }, [account, managedTeams, teamMembers, firestore]);
    
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
        <>
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
        </>
    );
}

    