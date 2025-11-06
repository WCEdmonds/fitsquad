'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sword } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function generateTeamCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export default function CreateTeamPage() {
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

   const userAccountRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);
  const { data: userAccount } = useDoc(userAccountRef);


  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) {
      setError('Team name is required.');
      return;
    }
    if (!user || !userAccount) {
      setError('You must be logged in to create a team.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const batch = writeBatch(firestore);
      
      // 1. Create the new team document
      const newTeamRef = doc(collection(firestore, 'teams'));
      const newTeamData = {
        id: newTeamRef.id,
        name: teamName,
        description: teamDescription,
        createdBy: user.uid,
        teamCode: generateTeamCode(),
      };
      batch.set(newTeamRef, newTeamData);

      // 2. Add the current user as the first member of the team
      const teamMemberRef = doc(firestore, 'teams', newTeamRef.id, 'members', user.uid);
      const memberData = {
        role: userAccount.accountType,
        uid: user.uid,
        email: user.email,
      };
      batch.set(teamMemberRef, memberData);

      // 3. Update the user's account to link to the new team
      const userAccountDocRef = doc(firestore, 'accounts', user.uid);
      batch.update(userAccountDocRef, { teamId: newTeamRef.id });

      // 4. If the user is a commander, add this team to their managed teams
      if (userAccount.accountType === 'Commander') {
          const managedTeamRef = doc(firestore, 'accounts', user.uid, 'managedTeams', newTeamRef.id);
          batch.set(managedTeamRef, {
              id: newTeamRef.id,
              name: teamName,
              teamCode: newTeamData.teamCode,
              createdAt: new Date().toISOString(),
          });
      }
      
      await batch.commit();

       toast({
        title: 'Team Created!',
        description: `Your new team "${teamName}" has been successfully created.`,
      });

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast({
          title: 'Error Creating Team',
          description: err.message,
          variant: 'destructive',
      })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground p-3 rounded-lg mb-4">
            <Sword className="size-8" />
          </div>
          <CardTitle className="text-2xl">Create a New Team</CardTitle>
          <CardDescription>
            Assemble your squad and start planning your fitness strategy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g., Alpha Company, 1st Platoon"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description (Optional)</Label>
              <Textarea
                id="team-description"
                placeholder="A brief description of your team's purpose or focus."
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Team...' : 'Create Team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
