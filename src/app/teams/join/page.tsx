'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useUser } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  getDoc,
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
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function JoinTeamPage() {
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) {
      setError('Team Code is required.');
      return;
    }
     if (!user) {
      setError('You must be logged in to join a team.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const teamRef = doc(firestore, 'teams', teamId);
      const teamSnapshot = await getDoc(teamRef);

      if (!teamSnapshot.exists()) {
        setError('Team not found. Please check the code and try again.');
        setIsLoading(false);
        return;
      }

      const userAccountRef = doc(firestore, 'accounts', user.uid);
      const userAccountSnap = await getDoc(userAccountRef);

      if(!userAccountSnap.exists()) {
         setError('User account not found.');
         setIsLoading(false);
         return;
      }

      const accountData = userAccountSnap.data();
      const currentTeamId = accountData.teamId;
      
      const batch = writeBatch(firestore);

      // If user is already in a team, remove them from the old team's member list
      if (currentTeamId) {
        const oldTeamMemberRef = doc(firestore, 'teams', currentTeamId, 'members', user.uid);
        batch.delete(oldTeamMemberRef);
      }

      // Add user to the new team's members subcollection
      const newTeamMemberRef = doc(firestore, 'teams', teamId, 'members', user.uid);
      batch.set(newTeamMemberRef, {
        uid: user.uid,
        email: user.email,
        role: accountData.accountType, // Role from their account
      });

      // Update the user's account to link to the new team
      batch.update(userAccountRef, { teamId: teamId });
      
      await batch.commit();

      toast({
        title: 'Successfully Joined Team!',
        description: `You are now a member of ${teamSnapshot.data().name}.`,
      });

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
           <div className="mx-auto bg-primary text-primary-foreground p-3 rounded-lg mb-4">
            <Shield className="size-8" />
          </div>
          <CardTitle className="text-2xl">Join a Team</CardTitle>
          <CardDescription>
            Enter the Team Code provided by your supervisor or commander to join or switch teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-id">Team Code</Label>
              <Input
                id="team-id"
                placeholder="Enter Team Code"
                required
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join Team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
