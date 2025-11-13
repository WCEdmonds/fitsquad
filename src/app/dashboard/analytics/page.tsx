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
import { collection, doc, query, orderBy, getDoc, DocumentData } from 'firebase/firestore';
import { AnalyticsChart } from '@/components/analytics-chart';
import { ExerciseStrengthChart } from '@/components/exercise-strength-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Users, AreaChart, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SoldierSelectItem {
    id: string;
    name: string;
    teamName: string;
}


export default function AnalyticsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const [account, setAccount] = useState<DocumentData | null | undefined>(null);
    const [selectedSoldierId, setSelectedSoldierId] = useState<string | null>(null);
    const [progressData, setProgressData] = useState<any[]>([]);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);
    const [allSoldiers, setAllSoldiers] = useState<SoldierSelectItem[]>([]);
    const [isLoadingAllSoldiers, setIsLoadingAllSoldiers] = useState(false);
    
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
                            <h3 className="text-lg font-semibold mb-4">Fitness Test Progress</h3>
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
    );
}

    