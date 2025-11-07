'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Shield, UserPlus, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function JoinTeamForm() {
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const codeFromQuery = searchParams.get('code');
    if (codeFromQuery) {
      setTeamCode(codeFromQuery);
    }
  }, [searchParams]);

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode) {
      setError('Team Code is required.');
      return;
    }
    if (!user) {
      // This shouldn't happen anymore since we show auth options
      setError('You must be logged in to join a team.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const teamsRef = collection(firestore, 'teams');
      const q = query(teamsRef, where('teamCode', '==', teamCode));
      const querySnapshot = await getDocs(q);


      if (querySnapshot.empty) {
        setError('Team not found. Please check the code and try again.');
        setIsLoading(false);
        return;
      }
      
      const teamDoc = querySnapshot.docs[0];
      const teamId = teamDoc.id;
      const teamData = teamDoc.data();

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
        description: `You are now a member of ${teamData.name}.`,
      });

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Build redirect URL with the current team code
  const redirectUrl = teamCode
    ? `/teams/join?code=${encodeURIComponent(teamCode)}`
    : '/teams/join';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
           <div className="mx-auto bg-primary text-primary-foreground p-3 rounded-lg mb-4">
            <Shield className="size-8" />
          </div>
          <CardTitle className="text-2xl">Join a Team</CardTitle>
          <CardDescription>
            {!user
              ? 'Please sign in or create an account to join a team'
              : 'Enter the 8-digit Team Code provided by your supervisor or commander to join or switch teams.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!user ? (
            // Show authentication options if user is not logged in
            <div className="space-y-4">
              {teamCode && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Team Code:</p>
                  <p className="text-lg font-mono font-semibold">{teamCode}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center">
                You need to be signed in to join a team. Please create an account or sign in to continue.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link href={`/signup?redirect=${encodeURIComponent(redirectUrl)}`}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            // Show join form if user is logged in
            <form onSubmit={handleJoinTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-code">Team Code</Label>
                <Input
                  id="team-code"
                  placeholder="e.g., 12345678"
                  required
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Joining...' : 'Join Team'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
