'use client';
import { useState, useEffect } from 'react';
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
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase, getCollectionNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { AnalyticsChart } from '@/components/analytics-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Users } from 'lucide-react';

export default function AnalyticsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const [selectedSoldierId, setSelectedSoldierId] = useState<string | null>(null);
    const [progressData, setProgressData] = useState<any[]>([]);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);

    const userAccountRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'accounts', user.uid);
    }, [firestore, user]);
    const { data: userAccount } = useDoc(userAccountRef);

    const teamMembersRef = useMemoFirebase(() => {
        if (!userAccount?.teamId) return null;
        return collection(firestore, 'teams', userAccount.teamId, 'members');
    }, [firestore, userAccount]);
    const { data: teamMembers, isLoading: teamMembersLoading } = useCollection(teamMembersRef);

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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Soldier Analytics</CardTitle>
                <CardDescription>
                    Track individual soldier progress over time. Select a soldier to view their data.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Select
                        onValueChange={setSelectedSoldierId}
                        disabled={teamMembersLoading}
                    >
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder="Select a soldier..." />
                        </SelectTrigger>
                        <SelectContent>
                            {teamMembersLoading ? (
                                <SelectItem value="loading" disabled>Loading...</SelectItem>
                            ) : (
                                teamMembers?.map(member => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.email}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {isLoadingProgress && (
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                )}
                
                {!isLoadingProgress && selectedSoldierId && progressData.length > 0 && (
                    <AnalyticsChart data={progressData} />
                )}

                {!isLoadingProgress && selectedSoldierId && progressData.length === 0 && (
                     <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[400px]">
                        <LineChart className="w-16 h-16 text-muted-foreground mb-4"/>
                        <h3 className="text-xl font-semibold">No Progress Data Found</h3>
                        <p className="text-muted-foreground">This soldier has not logged any fitness data yet.</p>
                    </div>
                )}

                 {!selectedSoldierId && (
                     <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[400px]">
                        <Users className="w-16 h-16 text-muted-foreground mb-4"/>
                        <h3 className="text-xl font-semibold">Select a Soldier</h3>
                        <p className="text-muted-foreground">Choose a soldier from the dropdown to see their progress.</p>
                    </div>
                 )}


            </CardContent>
        </Card>
    );
}
