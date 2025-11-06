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
import { Mail, UserPlus } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser, getDocNonBlocking, getCollectionNonBlocking } from '@/firebase';
import { collection, doc, getDocs, query, where, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { AddSoldierDialog } from '@/components/add-soldier-dialog';
import { useToast } from '@/hooks/use-toast';
import { InviteDialog } from '@/components/invite-dialog';

const hasBenchmark = (soldier: Soldier) => {
    return soldier.mdl > 0 || soldier.hrp > 0 || soldier.twoMileRun > 0;
};

export default function SoldiersPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);


    const userAccountRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'accounts', user.uid);
    }, [firestore, user]);
    const { data: userAccount } = useDoc(userAccountRef);

    const teamMembersRef = useMemoFirebase(() => {
        if (!userAccount || userAccount.accountType === 'Admin') return null;
        if (!userAccount?.teamId) return null;
        return collection(firestore, 'teams', userAccount.teamId, 'members');
    }, [firestore, userAccount]);
    
    // Admin: Fetch all users instead of team members
    const allUsersRef = useMemoFirebase(() => {
        if (userAccount?.accountType !== 'Admin') return null;
        return collection(firestore, 'accounts');
    }, [firestore, userAccount]);

    const teamDocRef = useMemoFirebase(() => {
        if (!userAccount?.teamId) return null;
        return doc(firestore, 'teams', userAccount.teamId);
    }, [userAccount, firestore]);
    const { data: teamData } = useDoc(teamDocRef);


    const { data: teamMembers, isLoading: teamMembersLoading } = useCollection(teamMembersRef);
    const { data: allUsers, isLoading: allUsersLoading } = useCollection(allUsersRef);
    
    const [allSoldiers, setAllSoldiers] = useState<Soldier[]>([]);
    
    useEffect(() => {
        const memberList = userAccount?.accountType === 'Admin' ? allUsers : teamMembers;

        if (memberList && firestore) {
            const fetchSoldierData = async () => {
                const soldierPromises = memberList.map(async (member) => {
                    const memberId = member.id; // Works for both full account docs and member refs
                    
                    // In admin view, 'member' is the full account doc, otherwise we need to fetch it
                    const accData = userAccount?.accountType === 'Admin' 
                        ? member 
                        : await getDocNonBlocking<any>(doc(firestore, 'accounts', memberId));

                    if (!accData) return null; // Skip if account data can't be fetched

                    let teamName = "N/A";
                    if (accData.teamId) {
                        const teamDoc = await getDocNonBlocking<any>(doc(firestore, 'teams', accData.teamId));
                        if(teamDoc) {
                           teamName = teamDoc.name;
                        }
                    }

                    const soldierDataColRef = collection(firestore, 'accounts', memberId, 'soldierData');
                    const soldierDataList = await getCollectionNonBlocking<any>(soldierDataColRef);
                    // Get the most recent data entry
                    const sData = soldierDataList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

                    const soldier: Soldier = {
                        id: memberId,
                        email: accData.email || 'Unknown',
                        firstName: accData.firstName || '',
                        lastName: accData.lastName || '',
                        rank: accData.accountType || 'Soldier',
                        teamId: accData.teamId,
                        teamName: teamName,
                        mdl: sData?.mdl || 0,
                        hrp: sData?.hrp || 0,
                        sdc: sData?.sdc || 0,
                        plk: sData?.plk || 0,
                        twoMileRun: sData?.twoMileRun || 0,
                        gender: accData.gender || 'Other',
                        weight: sData?.weight || 0,
                        height: sData?.height || 0,
                        healthNotes: sData?.healthInfo || 'No data',
                        restingHeartRate: sData?.restingHeartRate,
                        bodyFatPercentage: sData?.bodyFatPercentage,
                    };
                    
                    return soldier;
                });

                const soldiers = (await Promise.all(soldierPromises)).filter(s => s !== null) as Soldier[];
                setAllSoldiers(soldiers);
            };

            fetchSoldierData();
        }
    }, [teamMembers, allUsers, userAccount, firestore]);

    const handleAddSoldier = async (email: string, teamCode?: string) => {
        if (!firestore || !user ) {
          toast({ title: 'Error', description: 'Could not add soldier. User or team not found.', variant: 'destructive' });
          return;
        }

        const effectiveTeamId = userAccount?.teamId;

        // Admin flow
        if (userAccount?.accountType === 'Admin') {
            if (!teamCode) {
                 toast({ title: 'Error', description: 'Admin must provide a team code.', variant: 'destructive' });
                return;
            }
             try {
                const usersRef = collection(firestore, 'accounts');
                const userQuery = query(usersRef, where('email', '==', email));
                const userSnapshot = await getDocs(userQuery);

                if (userSnapshot.empty) {
                    toast({ title: 'Error', description: 'No user found with that email address.', variant: 'destructive' });
                    return;
                }
                const soldierUser = userSnapshot.docs[0];
                const soldierId = soldierUser.id;

                const teamsRef = collection(firestore, 'teams');
                const teamQuery = query(teamsRef, where('teamCode', '==', teamCode));
                const teamSnapshot = await getDocs(teamQuery);

                if (teamSnapshot.empty) {
                    toast({ title: 'Error', description: 'Team with that code not found.', variant: 'destructive' });
                    return;
                }
                const teamDoc = teamSnapshot.docs[0];
                const teamId = teamDoc.id;

                const batch = writeBatch(firestore);
                const teamMemberRef = doc(firestore, 'teams', teamId, 'members', soldierId);
                batch.set(teamMemberRef, { uid: soldierId, email: soldierUser.data().email, role: soldierUser.data().accountType });
                
                const soldierAccountRef = doc(firestore, 'accounts', soldierId);
                batch.update(soldierAccountRef, { teamId: teamId });
                
                await batch.commit();
                toast({ title: 'Success', description: `Soldier added to team ${teamDoc.data().name}.` });
                setIsAddDialogOpen(false);
            } catch (error: any) {
                 console.error('Error adding soldier (Admin): ', error);
                 toast({ title: 'Error', description: `Failed to add soldier: ${error.message}`, variant: 'destructive' });
            }
            return;
        }

        // Regular user flow
        if (!effectiveTeamId) {
            toast({ title: 'Error', description: 'You are not part of a team.', variant: 'destructive' });
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

          const teamMemberRef = doc(firestore, 'teams', effectiveTeamId, 'members', soldierId);
          batch.set(teamMemberRef, {
            uid: soldierId,
            email: soldierData.email,
            role: soldierData.accountType,
          });

          const soldierAccountRef = doc(firestore, 'accounts', soldierId);
          batch.update(soldierAccountRef, { teamId: effectiveTeamId });

          await batch.commit();

          toast({ title: 'Success', description: 'Soldier has been added to the team.' });
          setIsAddDialogOpen(false);
        } catch (error: any) {
          console.error('Error adding soldier: ', error);
          toast({ title: 'Error', description: `Failed to add soldier: ${error.message}`, variant: 'destructive' });
        }
    };

    const handleRemoveSoldier = async (soldierId: string, teamId: string | null | undefined) => {
        if (!firestore) return;
        if (!teamId) {
             toast({ title: 'Error', description: 'Cannot remove soldier. Team ID is missing.', variant: 'destructive' });
            return;
        }

        try {
            const batch = writeBatch(firestore);
            
            // 1. Remove user from the team's members subcollection
            const teamMemberRef = doc(firestore, 'teams', teamId, 'members', soldierId);
            batch.delete(teamMemberRef);
            
            // 2. Unset the teamId on the user's account
            const soldierAccountRef = doc(firestore, 'accounts', soldierId);
            batch.update(soldierAccountRef, { teamId: null });

            await batch.commit();
            toast({ title: 'Soldier Removed', description: 'The soldier has been removed from the team.' });

        } catch (error: any) {
            console.error("Error removing soldier: ", error);
             toast({ title: 'Error', description: 'Could not remove soldier from the team.', variant: 'destructive' });
        }
    }
    
    const handleDeleteUser = async (soldierId: string, teamId: string | null | undefined) => {
        if (!firestore || userAccount?.accountType !== 'Admin') {
            toast({ title: 'Error', description: 'You do not have permission to delete users.', variant: 'destructive'});
            return;
        };

        try {
            const batch = writeBatch(firestore);

            // 1. Delete the user's account document
            const accountRef = doc(firestore, 'accounts', soldierId);
            batch.delete(accountRef);

            // 2. If they are in a team, remove them from the team's members subcollection
            if (teamId) {
                const teamMemberRef = doc(firestore, 'teams', teamId, 'members', soldierId);
                batch.delete(teamMemberRef);
            }

            // Note: This does not delete subcollections under the user's account or the user from Firebase Auth.
            // A Firebase Function would be required for a full cleanup.

            await batch.commit();
            toast({ title: 'User Deleted', description: 'The user account has been permanently deleted from Firestore.' });

        } catch (error: any) {
             console.error("Error deleting user: ", error);
             toast({ title: 'Error', description: 'Could not delete the user.', variant: 'destructive' });
        }
    }

    const handleSendInvite = async (email: string) => {
        if (!teamData) {
            toast({ title: "Cannot send invite", description: "Team information is not available.", variant: "destructive" });
            return;
        }
        const subject = `You're invited to join ${teamData.name} on FitSquad!`;
        const joinUrl = `https://mysquad.fit/teams/join?code=${teamData.teamCode}`;
        const body = `<p>Hello,</p>
<p>You have been invited to join the team "<strong>${teamData.name}</strong>" on FitSquad.</p>
<p>Use the following code to join: <strong>${teamData.teamCode}</strong></p>
<p>Or click this link: <a href="${joinUrl}">${joinUrl}</a></p>
<br>
<p>Thank you,<br>The FitSquad Team</p>`;

try {
          const response = await fetch('/api/send-invite', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to: email, subject, body }),
          });

          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to send invite');
          }
          
          toast({ title: "Invite Sent!", description: `An invitation email has been sent to ${email}.` });
        
        } catch (error: any) {
          toast({ title: "Error", description: `Failed to send invite: ${error.message}`, variant: "destructive" });
        }
        setIsInviteDialogOpen(false);
    }

    const isLoading = userAccount?.accountType === 'Admin' ? allUsersLoading : teamMembersLoading;
    const runningFocusGroup: Soldier[] = allSoldiers.filter(s => hasBenchmark(s) && s.twoMileRun <= s.hrp);
    const strengthFocusGroup: Soldier[] = allSoldiers.filter(s => hasBenchmark(s) && s.hrp < s.twoMileRun);


  return (
    <>
    <AddSoldierDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddSoldier={handleAddSoldier}
        isAdmin={userAccount?.accountType === 'Admin'}
      />
    <InviteDialog
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSendInvite={handleSendInvite}
    />
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>Soldier Roster</CardTitle>
          <CardDescription>
            {userAccount?.accountType === 'Admin' ? 'View all users in the system and manage team assignments.' : 'Manage and track individual soldier performance.'}
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)} className="w-full sm:w-auto">
              <Mail className="mr-2 h-4 w-4" /> Invite Members
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" /> Add to Team
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">{userAccount?.accountType === 'Admin' ? 'All Users' : 'All Soldiers'}</TabsTrigger>
            <TabsTrigger value="running">Running Focus</TabsTrigger>
            <TabsTrigger value="strength">Strength Focus</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <SoldierTable 
                soldiers={allSoldiers} 
                isLoading={isLoading} 
                accountType={userAccount?.accountType}
                onRemoveSoldier={handleRemoveSoldier}
                onDeleteUser={handleDeleteUser}
            />
          </TabsContent>
          <TabsContent value="running" className="mt-4">
             <SoldierTable 
                soldiers={runningFocusGroup} 
                isLoading={isLoading} 
                accountType={userAccount?.accountType}
                onRemoveSoldier={handleRemoveSoldier}
                onDeleteUser={handleDeleteUser}
            />
          </TabsContent>
          <TabsContent value="strength" className="mt-4">
             <SoldierTable 
                soldiers={strengthFocusGroup} 
                isLoading={isLoading} 
                accountType={userAccount?.accountType}
                onRemoveSoldier={handleRemoveSoldier}
                onDeleteUser={handleDeleteUser}
             />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </>
  );
}
