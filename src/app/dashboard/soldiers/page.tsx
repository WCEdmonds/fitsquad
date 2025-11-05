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

const RUN_TIME_THRESHOLD = 15; // 15:00 in minutes
const STRENGTH_THRESHOLD = 50; // pushups or situps

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
                    const sData = soldierDataList[0];
                    
                    const accountRef = doc(firestore, 'accounts', member.id);
                    const accData = await getDocNonBlocking<any>(accountRef);

                    if (sData && accData) {
                        return {
                            id: member.id,
                            name: accData.email, // Or a 'name' field if you add it
                            rank: accData.accountType, // Or a more specific rank
                            aftScore: sData.aftScore,
                            runTime: sData.runTime * 60, // converting minutes to seconds
                            pushups: 50, // Placeholder, add to your data model
                            situps: 50, // Placeholder, add to your data model
                            healthNotes: sData.healthInfo,
                            avatar: `https://picsum.photos/seed/${member.id}/100/100`,
                        };
                    }
                    // if user has account but no soldier data yet.
                    if(accData){
                         return {
                            id: member.id,
                            name: accData.email,
                            rank: accData.accountType,
                            aftScore: 0,
                            runTime: 0,
                            pushups: 0,
                            situps: 0,
                            healthNotes: 'No data',
                            avatar: `https://picsum.photos/seed/${member.id}/100/100`,
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

    const handleAddSoldier = async (email: string) => {
    if (!firestore || !user || !userAccount?.teamId) {
      toast({ title: 'Error', description: 'Could not add soldier. User or team not found.', variant: 'destructive' });
      return;
    }

    try {
      // Find user by email
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

      // Check if user is already in the team
      if (teamMembers?.some(member => member.id === soldierId)) {
        toast({ title: 'User already in team', description: 'This soldier is already a member of your team.', variant: 'destructive' });
        return;
      }

      // Add soldier to team and update their account
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


    const runningFocusGroup: Soldier[] = allSoldiers.filter(s => (s.runTime/60) > RUN_TIME_THRESHOLD);
    const strengthFocusGroup: Soldier[] = allSoldiers.filter(s => s.pushups < STRENGTH_THRESHOLD || s.situps < STRENGTH_THRESHOLD);


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
