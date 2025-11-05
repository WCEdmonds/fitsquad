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

export default function JoinTeamPage() {
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const firestore = useFirestore();
  const { user, ...rest } = useUser();
  const router = useRouter();

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
      // 1. Check if the team exists
      const teamRef = doc(firestore, 'teams', teamId);
      const teamSnapshot = await getDocs(query(collection(firestore, 'teams'), where('id', '==', teamId)));

      if (teamSnapshot.empty) {
        setError('Team not found. Please check the code and try again.');
        setIsLoading(false);
        return;
      }
      
      // We assume the user has an account document from signup
      const userAccountRef = doc(firestore, 'accounts', user.uid);
      const userAccountSnap = await getDocs(query(collection(firestore, 'accounts'), where('id', '==', user.uid)));

      if(userAccountSnap.empty) {
         setError('User account not found.');
         setIsLoading(false);
         return;
      }

      const accountData = userAccountSnap.docs[0].data();

      // 2. Add user to the team's members subcollection
      const teamMemberRef = doc(firestore, 'teams', teamId, 'members', user.uid);

      const batch = writeBatch(firestore);
      batch.set(teamMemberRef, {
        uid: user.uid,
        email: user.email,
        role: accountData.accountType, // Role from their account
      });

      // 3. Update the user's account to link to the team
      batch.update(userAccountRef, { teamId: teamId });
      
      await batch.commit();

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
          <CardTitle className="text-2xl">Join an Existing Team</CardTitle>
          <CardDescription>
            Enter the Team Code provided by your supervisor or commander.
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
              {isLoading ? 'Joining Team...' : 'Join Team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
