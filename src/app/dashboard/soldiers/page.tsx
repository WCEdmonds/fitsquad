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
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { AddSoldierDialog } from '@/components/add-soldier-dialog';
import { useToast } from '@/hooks/use-toast';

const RUN_TIME_THRESHOLD_SECONDS = 1260; // 21:00 in seconds
const HRP_THRESHOLD = 10; // reps

export default function SoldiersPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);


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
    
    const [allSoldiers, setAllSoldiers] = useState<Soldier[]>([]);
    
    useEffect(() => {
        if (teamMembers && firestore) {
            const fetchSoldierData = async () => {
                const soldierPromises = teamMembers.map(async (member) => {
                    const soldierDataColRef = collection(firestore, 'accounts', member.id, 'soldierData');
                    const soldierDataList = await getCollectionNonBlocking<any>(soldierDataColRef);
                    const sData = soldierDataList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                    
                    const accountRef = doc(firestore, 'accounts', member.id);
                    const accData = await getDocNonBlocking<any>(accountRef);

                    const defaultSoldier: Soldier = {
                        id: member.id,
                        name: accData?.email || 'Unknown',
                        rank: accData?.accountType || 'Soldier',
                        mdl: 0,
                        hrp: 0,
                        sdc: 0,
                        plk: 0,
                        twoMileRun: 0,
                        gender: accData?.gender || 'Other',
                        weight: accData?.weight || 0,
                        height: accData?.height || 0,
                        healthNotes: 'No data',
                        avatar: `https://picsum.photos/seed/${member.id}/100/100`,
                    };

                    if (sData && accData) {
                        return {
                            ...defaultSoldier,
                            healthNotes: sData.healthInfo,
                            mdl: sData.mdl,
                            hrp: sData.hrp,
                            sdc: sData.sdc,
                            plk: sData.plk,
                            twoMileRun: sData.twoMileRun
                        };
                    }
                    if(accData){
                         return defaultSoldier;
                    }
                    return null;
                });

                const soldiers = (await Promise.all(soldierPromises)).filter(s => s !== null) as Soldier[];
                setAllSoldiers(soldiers);
            };

            fetchSoldierData();
        }
    }, [teamMembers, firestore]);

    const handleAddSoldier = async (email: string) => {
    if (!firestore || !user || !userAccount?.teamId) {
      toast({ title: 'Error', description: 'Could not add soldier. User or team not found.', variant: 'destructive' });
      return;
    }

    try {
      const usersRef = collection(firestore, 'accounts');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: 'Error', description: 'No user found with that email address.', variant: 'destructive' });
        return;
      }

      const soldierUser = querySnapshot.docs[0];
      const soldierId = soldierUser.id;
      const soldierData = soldierUser.data();

      if (teamMembers?.some(member => member.id === soldierId)) {
        toast({ title: 'User already in team', description: 'This soldier is already a member of your team.', variant: 'destructive' });
        return;
      }

      const batch = writeBatch(firestore);

      const teamMemberRef = doc(firestore, 'teams', userAccount.teamId, 'members', soldierId);
      batch.set(teamMemberRef, {
        uid: soldierId,
        email: soldierData.email,
        role: soldierData.accountType,
      });

      const soldierAccountRef = doc(firestore, 'accounts', soldierId);
      batch.update(soldierAccountRef, { teamId: userAccount.teamId });

      await batch.commit();

      toast({ title: 'Success', description: 'Soldier has been added to the team.' });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding soldier: ', error);
      toast({ title: 'Error', description: `Failed to add soldier: ${error.message}`, variant: 'destructive' });
    }
  };


    const runningFocusGroup: Soldier[] = allSoldiers.filter(s => s.twoMileRun > RUN_TIME_THRESHOLD_SECONDS);
    const strengthFocusGroup: Soldier[] = allSoldiers.filter(s => s.hrp < HRP_THRESHOLD);


  return (
    <>
    <AddSoldierDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddSoldier={handleAddSoldier}
      />
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Soldier Roster</CardTitle>
          <CardDescription>
            Manage and track individual soldier performance.
          </CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
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
            <SoldierTable soldiers={allSoldiers} isLoading={teamMembersLoading} />
          </TabsContent>
          <TabsContent value="running" className="mt-4">
            <SoldierTable soldiers={runningFocusGroup} isLoading={teamMembersLoading} />
          </TabsContent>
          <TabsContent value="strength" className="mt-4">
            <SoldierTable soldiers={strengthFocusGroup} isLoading={teamMembersLoading} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </>
  );
}
