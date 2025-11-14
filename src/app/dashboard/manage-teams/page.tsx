'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  getDocs,
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
import { ShieldCheck, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function ManageTeamsPage() {
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const managedTeamsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'accounts', user.uid, 'managedTeams');
  }, [firestore, user]);

  const { data: managedTeams, isLoading: managedTeamsLoading } = useCollection(managedTeamsRef);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode) {
      setError('Team Code is required.');
      return;
    }
     if (!user) {
      setError('You must be logged in to manage teams.');
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

      // Add team to commander's managed teams subcollection
      const managedTeamRef = doc(firestore, 'accounts', user.uid, 'managedTeams', teamId);
      setDocumentNonBlocking(managedTeamRef, {
          id: teamId,
          name: teamData.name,
          teamCode: teamData.teamCode,
          createdAt: new Date().toISOString(),
      }, {});

      toast({
        title: 'Team Added',
        description: `You are now managing ${teamData.name}.`,
      });
      setTeamCode('');
    } catch (err: any) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
      if(!user) return;

      try {
        const batch = writeBatch(firestore);
        const teamRef = doc(firestore, 'accounts', user.uid, 'managedTeams', teamId);
        batch.delete(teamRef);
        await batch.commit();
        toast({
            title: "Team Removed",
            description: "You are no longer managing this team.",
        });
      } catch (err: any) {
          console.error(err);
          toast({
            title: "Error",
            description: "Could not remove the team. Please try again.",
            variant: "destructive"
          });
      }
  }

  return (
    <div className="grid gap-6 pb-24 md:pb-4">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck />
                    Manage Subordinate Teams
                </CardTitle>
                <CardDescription>
                    Add or remove teams you command by entering their unique 8-digit team code.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddTeam} className="flex gap-4 items-end">
                    <div className="space-y-2 flex-grow">
                    <Label htmlFor="team-code">Team Code</Label>
                    <Input
                        id="team-code"
                        placeholder="e.g., 12345678"
                        required
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value)}
                    />
                    </div>
                    <Button type="submit" disabled={isLoading} className="h-10">
                        {isLoading ? 'Adding...' : <><PlusCircle className="mr-2"/> Add Team</>}
                    </Button>
                </form>
                 {error && (
                    <p className="text-sm text-destructive mt-2">{error}</p>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Your Managed Teams</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Team Name</TableHead>
                            <TableHead>Team Code</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {managedTeamsLoading && <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>}
                        {!managedTeamsLoading && managedTeams?.length === 0 && (
                            <TableRow><TableCell colSpan={3} className="text-center">You are not managing any teams yet.</TableCell></TableRow>
                        )}
                        {managedTeams?.map((team) => (
                            <TableRow key={team.id}>
                                <TableCell>{team.name}</TableCell>
                                <TableCell>{team.teamCode}</TableCell>
                                <TableCell className="text-right">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm"><Trash2 className="mr-2"/> Remove</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will remove this team from your management list. You will no longer see their data.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleRemoveTeam(team.id)}>Confirm</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
