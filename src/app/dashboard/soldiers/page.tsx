'use client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SoldierTable } from '@/components/soldier-table';
import type { Soldier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser, getDocNonBlocking, getCollectionNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const RUN_TIME_THRESHOLD = 15; // 15:00 in minutes
const STRENGTH_THRESHOLD = 50; // pushups or situps

export default function SoldiersPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userAccountRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'accounts', user.uid);
    }, [firestore, user]);
    const { data: userAccount } = useDoc(userAccountRef);

    const teamMembersRef = useMemoFirebase(() => {
        if (!userAccount?.teamId) return null;
        return collection(firestore, 'teams', userAccount.teamId, 'members');
    }, [firestore, userAccount]);
    const { data: teamMembers } = useCollection(teamMembersRef);
    
    const [allSoldiers, setAllSoldiers] = useState<Soldier[]>([]);
    
    useEffect(() => {
        if (teamMembers && firestore) {
            const fetchSoldierData = async () => {
                const soldierPromises = teamMembers.map(async (member) => {
                    const soldierDataColRef = collection(firestore, 'accounts', member.uid, 'soldierData');
                    const soldierDataList = await getCollectionNonBlocking<any>(soldierDataColRef);
                    const sData = soldierDataList[0];
                    
                    const accountRef = doc(firestore, 'accounts', member.uid);
                    const accData = await getDocNonBlocking<any>(accountRef);

                    if (sData && accData) {
                        return {
                            id: member.uid,
                            name: accData.email, // Or a 'name' field if you add it
                            rank: accData.accountType, // Or a more specific rank
                            aftScore: sData.aftScore,
                            runTime: sData.runTime * 60, // converting minutes to seconds
                            pushups: 50, // Placeholder, add to your data model
                            situps: 50, // Placeholder, add to your data model
                            healthNotes: sData.healthInfo,
                            avatar: `https://picsum.photos/seed/${member.uid}/100/100`,
                        };
                    }
                    return null;
                });

                const soldiers = (await Promise.all(soldierPromises)).filter(s => s !== null) as Soldier[];
                setAllSoldiers(soldiers);
            };

            fetchSoldierData();
        }
    }, [teamMembers, firestore]);

    const runningFocusGroup: Soldier[] = allSoldiers.filter(s => (s.runTime/60) > RUN_TIME_THRESHOLD);
    const strengthFocusGroup: Soldier[] = allSoldiers.filter(s => s.pushups < STRENGTH_THRESHOLD || s.situps < STRENGTH_THRESHOLD);


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Soldier Roster</CardTitle>
          <CardDescription>
            Manage and track individual soldier performance.
          </CardDescription>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Add Soldier
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Soldiers</TabsTrigger>
            <TabsTrigger value="running">Running Focus</TabsTrigger>
            <TabsTrigger value="strength">Strength Focus</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <SoldierTable soldiers={allSoldiers} />
          </TabsContent>
          <TabsContent value="running" className="mt-4">
            <SoldierTable soldiers={runningFocusGroup} />
          </TabsContent>
          <TabsContent value="strength" className="mt-4">
            <SoldierTable soldiers={strengthFocusGroup} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
