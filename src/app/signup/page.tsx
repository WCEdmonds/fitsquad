'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, initiateEmailSignUp } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dumbbell, UserCheck, Shield, Award } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


const roleFeatures = [
    { feature: "View Own Data", soldier: true, supervisor: true, commander: true },
    { feature: "Log Own Progress", soldier: true, supervisor: true, commander: true },
    { feature: "Generate Personal Plan", soldier: true, supervisor: true, commander: true },
    { feature: "View Team Roster & Data", soldier: false, supervisor: true, commander: true },
    { feature: "Generate Unit Plan", soldier: false, supervisor: true, commander: true },
    { feature: "Manage Team Members", soldier: false, supervisor: true, commander: true },
    { feature: "Manage Subordinate Units", soldier: false, supervisor: false, commander: true },
];

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountType, setAccountType] = useState('');
  const [gender, setGender] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    if (!accountType) {
        setError('Please select an account type.');
        return;
    }
     if (!gender) {
        setError('Please select a gender.');
        return;
    }
    if (!firstName || !lastName) {
      setError('Please enter your first and last name.');
      return;
    }

    if (accountType === 'Commander' && passcode !== 'thunder') {
      setError('Invalid Commander passcode.');
      return;
    }

    if (accountType === 'Admin' && passcode !== 'scientiaestpotestas') {
      setError('Invalid Admin passcode.');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await initiateEmailSignUp(auth, email, password);
      
      const user = auth.currentUser;

      if (user) {
        const accountData = {
          id: user.uid,
          email: user.email,
          firstName,
          lastName,
          accountType: accountType,
          teamId: null, // User will create or join a team later
          gender,
        };
        
        const accountRef = doc(firestore, 'accounts', user.uid);
        setDocumentNonBlocking(accountRef, accountData, { merge: true });

        router.push('/dashboard');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground p-3 rounded-lg mb-4">
            <Dumbbell className="size-8" />
          </div>
          <CardTitle className="text-2xl">Create your FitSquad Account</CardTitle>
          <CardDescription>
            Join the squad and start tracking your fitness journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select onValueChange={setGender} value={gender}>
                        <SelectTrigger id="gender">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select onValueChange={setAccountType} value={accountType}>
                        <SelectTrigger id="accountType">
                            <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Soldier">Soldier</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="Commander">Commander</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             {accountType && (
                 <div className="pt-2">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Feature</TableHead>
                            <TableHead className="text-center"><UserCheck className="mx-auto h-5 w-5"/></TableHead>
                            <TableHead className="text-center"><Shield className="mx-auto h-5 w-5"/></TableHead>
                            <TableHead className="text-center"><Award className="mx-auto h-5 w-5"/></TableHead>
                        </TableRow>
                         <TableRow>
                            <TableHead></TableHead>
                            <TableHead className="text-center text-xs text-muted-foreground">Soldier</TableHead>
                            <TableHead className="text-center text-xs text-muted-foreground">Supervisor</TableHead>
                            <TableHead className="text-center text-xs text-muted-foreground">Commander</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roleFeatures.map(({ feature, soldier, supervisor, commander }) => (
                            <TableRow key={feature}>
                                <TableCell className="font-medium text-sm">{feature}</TableCell>
                                <TableCell className="text-center">{soldier ? '✅' : '❌'}</TableCell>
                                <TableCell className="text-center">{supervisor ? '✅' : '❌'}</TableCell>
                                <TableCell className="text-center">{commander ? '✅' : '❌'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
                 </div>
            )}

            {accountType === 'Commander' && (
                <div className="space-y-2">
                    <Label htmlFor="passcode">Commander Passcode</Label>
                    <Input
                        id="passcode"
                        type="password"
                        required
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                    />
                </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
